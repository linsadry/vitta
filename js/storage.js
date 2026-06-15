/**
 * storage.js — Camada de persistência (Fitness OS / Painel de Evolução)
 *
 * Backend: Supabase (projeto uxkjvbjlsbgmbalokisf), com RLS por auth.uid().
 * - Login com e-mail/senha (Supabase Auth) → sessão persiste no dispositivo.
 * - PIN local (4 dígitos) trava o acesso ao app mesmo já autenticado.
 * - Dados do dia/semana ficam em cache local (hidratado no init) para que
 *   as telas continuem lendo de forma síncrona, como antes.
 *
 * A anon key abaixo só permite acesso às linhas cujo user_id == auth.uid()
 * da sessão autenticada — protegida por RLS em todas as tabelas fitness_*,
 * daily_tracking, physical_metrics e lab_results.
 */

const SUPABASE_URL      = 'https://uxkjvbjlsbgmbalokisf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4a2p2Ympsc2JnbWJhbG9raXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDEzOTAsImV4cCI6MjA5MTc3NzM5MH0.eOtAl-n3qNSLR0BQNKhr8jiE5qXResibjKVut0fpEHQ';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const Storage = (() => {
  let userId = null;

  const cache = {
    settings: null,   // linha de fitness_settings
    daily:    {},      // dateKey -> linha de daily_tracking
    physical: [],      // linhas de physical_metrics, ordenadas por date asc
    plans:    [],      // linhas de fitness_workout_plans (com .exercises[])
    labs:     [],      // linhas de lab_results, ordenadas por date asc
  };

  const HYDRATE_DAYS = 120;

  // ── HELPERS ─────────────────────────────────────────────────
  function getDaily(date) {
    if (!cache.daily[date]) cache.daily[date] = { user_id: userId, date };
    return cache.daily[date];
  }

  function persistDaily(date) {
    const row = { ...cache.daily[date], user_id: userId, date };
    sb.from('daily_tracking')
      .upsert(row, { onConflict: 'user_id,date' })
      .select()
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) cache.daily[date] = data;
      });
  }

  function upsertPhysical(date, fields) {
    let row = cache.physical.find(p => p.date === date);
    if (row) {
      Object.assign(row, fields);
    } else {
      row = { user_id: userId, date, ...fields };
      cache.physical.push(row);
      cache.physical.sort((a, b) => a.date.localeCompare(b.date));
    }
    sb.from('physical_metrics')
      .upsert({ user_id: userId, date, ...fields }, { onConflict: 'user_id,date' })
      .select()
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return;
        const idx = cache.physical.findIndex(p => p.date === date);
        if (idx >= 0) cache.physical[idx] = data; else cache.physical.push(data);
        cache.physical.sort((a, b) => a.date.localeCompare(b.date));
      });
  }

  function timeShort(v) {
    return v ? String(v).slice(0, 5) : '';
  }

  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── HIDRATAÇÃO DO CACHE ───────────────────────────────────────
  async function hydrate() {
    // Settings (cria com defaults se ainda não existir)
    let { data: settings } = await sb.from('fitness_settings')
      .select('*').eq('user_id', userId).maybeSingle();
    if (!settings) {
      const { data: created } = await sb.from('fitness_settings')
        .insert({ user_id: userId }).select().maybeSingle();
      settings = created;
    }
    cache.settings = settings;

    // daily_tracking — últimos HYDRATE_DAYS dias
    const since = Utils.dateKey(new Date(Date.now() - HYDRATE_DAYS * 86400000));
    const { data: dailyRows } = await sb.from('daily_tracking')
      .select('*').eq('user_id', userId).gte('date', since);
    cache.daily = {};
    (dailyRows || []).forEach(r => { cache.daily[r.date] = r; });

    // physical_metrics — histórico completo (poucos dados)
    const { data: physRows } = await sb.from('physical_metrics')
      .select('*').eq('user_id', userId).order('date', { ascending: true });
    cache.physical = physRows || [];

    // fitness_workout_plans + exercícios (Fase 2 — Treinos estruturados)
    const { data: planRows } = await sb.from('fitness_workout_plans')
      .select('*, exercises:fitness_workout_exercises(*)')
      .eq('user_id', userId).eq('active', true).order('order_idx');
    cache.plans = (planRows || []).map(p => ({
      ...p,
      exercises: (p.exercises || []).slice().sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0)),
    }));

    // lab_results — histórico completo (Fase 3 — Saúde Metabólica)
    const { data: labRows } = await sb.from('lab_results')
      .select('*').eq('user_id', userId).order('date', { ascending: true });
    cache.labs = labRows || [];
  }

  // ── AUTH (Supabase Auth — sessão persiste no dispositivo) ─────
  const auth = {
    async getSession() {
      const { data } = await sb.auth.getSession();
      return data.session || null;
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.session;
    },
    async signOut() {
      sessionStorage.removeItem('pinUnlocked');
      await sb.auth.signOut();
    },
    onChange(cb) {
      sb.auth.onAuthStateChange((_event, session) => cb(session));
    },
  };

  // ── PIN local (trava de tela, separada da sessão Supabase) ────
  const pin = {
    hasPin() {
      return !!(cache.settings && cache.settings.pin_hash);
    },
    isUnlocked() {
      return sessionStorage.getItem('pinUnlocked') === '1';
    },
    lock() {
      sessionStorage.removeItem('pinUnlocked');
    },
    async setup(code) {
      const salt = crypto.randomUUID();
      const hash = await sha256Hex(salt + code);
      cache.settings.pin_hash = hash;
      cache.settings.pin_salt = salt;
      await sb.from('fitness_settings')
        .update({ pin_hash: hash, pin_salt: salt })
        .eq('user_id', userId);
      sessionStorage.setItem('pinUnlocked', '1');
    },
    async verify(code) {
      if (!cache.settings?.pin_salt) return false;
      const hash = await sha256Hex(cache.settings.pin_salt + code);
      const ok = hash === cache.settings.pin_hash;
      if (ok) sessionStorage.setItem('pinUnlocked', '1');
      return ok;
    },
  };

  // ── PREFERÊNCIAS / METAS (fitness_settings + daily_tracking) ──
  const PREF_SETTINGS_MAP = {
    user_name:      'name',
    goal_water_ml:  'water_goal_ml',
    goal_kcal:      'kcal_goal',
    goal_protein_g: 'protein_goal_g',
    goal_steps:     'steps_goal',
    goal_sleep_h:   'sleep_goal_h',
    goal_strength_week: 'strength_weekly_goal',
    goal_walk_week:     'walk_weekly_goal',
  };
  const PREF_DAILY_MAP = {
    sleep_hours_today: 'sleep_hours',
    sleep_bedtime:     'sleep_bedtime',
    sleep_wakeup:      'sleep_wake_time',
    steps_today:       'steps',
  };
  const TIME_KEYS = new Set(['sleep_bedtime', 'sleep_wakeup']);
  const NUMERIC_KEYS = new Set(['goal_sleep_h', 'sleep_hours_today']);

  const prefs = {
    get(key, fallback) {
      if (PREF_SETTINGS_MAP[key]) {
        const v = cache.settings?.[PREF_SETTINGS_MAP[key]];
        if (v === null || v === undefined) return fallback;
        return NUMERIC_KEYS.has(key) ? Number(v) : v;
      }
      if (PREF_DAILY_MAP[key]) {
        const col = PREF_DAILY_MAP[key];
        const v = getDaily(Utils.dateKey())[col];
        if (v === null || v === undefined) return fallback;
        if (TIME_KEYS.has(key)) return timeShort(v);
        return NUMERIC_KEYS.has(key) ? Number(v) : v;
      }
      return fallback;
    },
    set(key, value) {
      if (PREF_SETTINGS_MAP[key]) {
        const col = PREF_SETTINGS_MAP[key];
        cache.settings[col] = value;
        sb.from('fitness_settings').update({ [col]: value }).eq('user_id', userId).then(() => {});
        return;
      }
      if (PREF_DAILY_MAP[key]) {
        const col = PREF_DAILY_MAP[key];
        const date = Utils.dateKey();
        getDaily(date)[col] = value;
        persistDaily(date);
      }
    },
  };

  // ── ÁGUA (daily_tracking.water_ml) ─────────────────────────────
  const water = {
    getToday() {
      const d = getDaily(Utils.dateKey());
      return Promise.resolve({ date: Utils.dateKey(), ml: d.water_ml || 0 });
    },
    saveToday(ml) {
      const date = Utils.dateKey();
      getDaily(date).water_ml = ml;
      persistDaily(date);
    },
    getWeek() {
      const days = Utils.lastNDays(7);
      return Promise.resolve(days.map(d => ({ date: d, ml: cache.daily[d]?.water_ml || 0 })));
    },
  };

  // ── HÁBITOS DO DIA (daily_tracking.habits jsonb) ───────────────
  const EMPTY_HABITS = { sleep: false, water: false, workout: false, protein: false, meals: false };
  const habits = {
    getToday() {
      const d = getDaily(Utils.dateKey());
      return { ...EMPTY_HABITS, ...(d.habits || {}) };
    },
    setToday(h) {
      const date = Utils.dateKey();
      getDaily(date).habits = h;
      persistDaily(date);
    },
    toggle(key) {
      const h = habits.getToday();
      h[key] = !h[key];
      habits.setToday(h);
      return h;
    },
  };

  // ── SCORE DE CONSISTÊNCIA (daily_tracking.consistency_score) ──
  const score = {
    save(date, val) {
      getDaily(date).consistency_score = val;
      persistDaily(date);
    },
    get(date) {
      const v = cache.daily[date]?.consistency_score;
      return (v === undefined) ? null : v;
    },
    getWeek() {
      return Utils.lastNDays(7).map(d => ({ date: d, score: score.get(d) }));
    },
    getMonth() {
      const prefix = Utils.dateKey().slice(0, 7); // 'YYYY-MM'
      return Object.keys(cache.daily)
        .filter(d => d.startsWith(prefix))
        .map(d => ({ date: d, score: score.get(d) }));
    },
  };

  // ── REFEIÇÕES (fitness_meals) ──────────────────────────────────
  function rowToMeal(r) {
    return {
      id: r.id, date: r.date, name: r.name,
      foods: r.raw_text ? [r.raw_text] : [],
      cal: Number(r.kcal) || 0, p: Number(r.protein_g) || 0, c: Number(r.carbs_g) || 0, f: Number(r.fat_g) || 0,
      time: r.time, createdAt: r.created_at,
    };
  }
  const meals = {
    async getByDate(date) {
      const { data, error } = await sb.from('fitness_meals')
        .select('*').eq('user_id', userId).eq('date', date).order('created_at');
      if (error) { console.error(error); return []; }
      return (data || []).map(rowToMeal);
    },
    async add(meal) {
      const row = {
        user_id:   userId,
        date:      meal.date || Utils.dateKey(),
        name:      meal.name || 'Refeição',
        raw_text:  Array.isArray(meal.foods) ? meal.foods.join(', ') : (meal.foods || null),
        kcal:      meal.cal || 0,
        protein_g: meal.p   || 0,
        carbs_g:   meal.c   || 0,
        fat_g:     meal.f   || 0,
        time:      meal.time || null,
      };
      if (meal.id) await sb.from('fitness_meals').update(row).eq('id', meal.id);
      else         await sb.from('fitness_meals').insert(row);
    },
    async delete(id) {
      await sb.from('fitness_meals').delete().eq('id', id);
    },
  };

  // ── TREINOS livres (fitness_workouts) ──────────────────────────
  function rowToWorkout(r) {
    return { id: r.id, date: r.date, tabType: r.tab_type, ...(r.data || {}) };
  }
  const workouts = {
    async getByDate(date) {
      const { data, error } = await sb.from('fitness_workouts')
        .select('*').eq('user_id', userId).eq('date', date);
      if (error) { console.error(error); return []; }
      return (data || []).map(rowToWorkout);
    },
    async getWeek() {
      const days = Utils.lastNDays(7);
      const { data, error } = await sb.from('fitness_workouts')
        .select('*').eq('user_id', userId).gte('date', days[0]).lte('date', days[days.length - 1]);
      const rows = error ? [] : (data || []).map(rowToWorkout);
      return days.map(d => ({ date: d, workouts: rows.filter(w => w.date === d) }));
    },
    async add(workout) {
      const { id, tabType, date, createdAt, ...rest } = workout;
      const row = { user_id: userId, date: date || Utils.dateKey(), tab_type: tabType, data: rest };
      if (id) await sb.from('fitness_workouts').update(row).eq('id', id);
      else    await sb.from('fitness_workouts').insert(row);
    },
    async delete(id) {
      await sb.from('fitness_workouts').delete().eq('id', id);
    },
  };

  // ── PESO (physical_metrics.weight) ─────────────────────────────
  const weight = {
    getHistory() {
      return cache.physical
        .filter(p => p.weight !== null && p.weight !== undefined)
        .map(p => ({ date: p.date, kg: parseFloat(p.weight) }));
    },
    getLatest() {
      const h = weight.getHistory();
      return h.length ? h[h.length - 1].kg : null;
    },
    addEntry(kg) {
      upsertPhysical(Utils.dateKey(), { weight: kg });
    },
  };

  // ── MEDIDAS CORPORAIS (physical_metrics) ───────────────────────
  const MEAS_MAP = { waist: 'waist_cm', hip: 'hip_cm', abdomen: 'abdomen_cm', arm: 'arm_right_cm', thigh: 'thigh_right_cm' };
  const measurements = {
    getLatest() {
      for (let i = cache.physical.length - 1; i >= 0; i--) {
        const p = cache.physical[i];
        const out = {};
        let has = false;
        for (const [k, col] of Object.entries(MEAS_MAP)) {
          if (p[col] !== null && p[col] !== undefined) { out[k] = parseFloat(p[col]); has = true; }
        }
        if (has) { out.date = p.date; return Promise.resolve(out); }
      }
      return Promise.resolve(null);
    },
    add(m) {
      const fields = {};
      for (const [k, col] of Object.entries(MEAS_MAP)) {
        if (m[k] !== null && m[k] !== undefined) fields[col] = m[k];
      }
      if (Object.keys(fields).length) upsertPhysical(Utils.dateKey(), fields);
      return Promise.resolve();
    },
  };

  // ── PLANOS DE TREINO ESTRUTURADOS (fitness_workout_plans/exercises) ──
  // Fase 2 — Treino A/B/C/D. Cache hidratado no init; refresh() após CRUD.
  const workoutPlans = {
    getAll() {
      return cache.plans;
    },
    async refresh() {
      const { data, error } = await sb.from('fitness_workout_plans')
        .select('*, exercises:fitness_workout_exercises(*)')
        .eq('user_id', userId).eq('active', true).order('order_idx');
      if (!error) {
        cache.plans = (data || []).map(p => ({
          ...p,
          exercises: (p.exercises || []).slice().sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0)),
        }));
      }
      return cache.plans;
    },
    async add(plan) {
      const order_idx = cache.plans.length;
      await sb.from('fitness_workout_plans').insert({ user_id: userId, order_idx, active: true, ...plan });
      return workoutPlans.refresh();
    },
    async update(id, fields) {
      await sb.from('fitness_workout_plans').update(fields).eq('id', id);
      return workoutPlans.refresh();
    },
    async remove(id) {
      const plan = cache.plans.find(p => p.id === id);
      const exerciseIds = (plan?.exercises || []).map(e => e.id);
      // Preserva o histórico de séries — apenas desvincula plano/exercícios excluídos
      if (exerciseIds.length) {
        await sb.from('fitness_workout_logs').update({ exercise_id: null }).in('exercise_id', exerciseIds);
      }
      await sb.from('fitness_workout_logs').update({ plan_id: null }).eq('plan_id', id);
      await sb.from('fitness_workout_exercises').delete().eq('plan_id', id);
      await sb.from('fitness_workout_plans').delete().eq('id', id);
      return workoutPlans.refresh();
    },
    async reorder(orderedIds) {
      await Promise.all(orderedIds.map((id, i) =>
        sb.from('fitness_workout_plans').update({ order_idx: i }).eq('id', id)));
      return workoutPlans.refresh();
    },
  };

  const workoutExercises = {
    async add(planId, ex) {
      const plan = cache.plans.find(p => p.id === planId);
      const order_idx = plan ? plan.exercises.length : 0;
      await sb.from('fitness_workout_exercises').insert({
        plan_id: planId, user_id: userId, order_idx, ...ex,
      });
      return workoutPlans.refresh();
    },
    async update(id, fields) {
      await sb.from('fitness_workout_exercises').update(fields).eq('id', id);
      return workoutPlans.refresh();
    },
    async remove(id) {
      await sb.from('fitness_workout_logs').update({ exercise_id: null }).eq('exercise_id', id);
      await sb.from('fitness_workout_exercises').delete().eq('id', id);
      return workoutPlans.refresh();
    },
    async reorder(planId, orderedIds) {
      await Promise.all(orderedIds.map((id, i) =>
        sb.from('fitness_workout_exercises').update({ order_idx: i }).eq('id', id)));
      return workoutPlans.refresh();
    },
  };

  // ── SESSÕES / SÉRIES DE TREINO (fitness_workout_logs) ─────────────
  const workoutLogs = {
    async getByDate(date) {
      const { data, error } = await sb.from('fitness_workout_logs')
        .select('*').eq('user_id', userId).eq('date', date).order('created_at');
      return error ? [] : (data || []);
    },

    async logSet(entry) {
      const row = { user_id: userId, date: entry.date || Utils.dateKey(), ...entry };
      const { data } = await sb.from('fitness_workout_logs').insert(row).select().maybeSingle();
      return data;
    },

    async updateSet(id, fields) {
      await sb.from('fitness_workout_logs').update(fields).eq('id', id);
    },

    async deleteSet(id) {
      await sb.from('fitness_workout_logs').delete().eq('id', id);
    },

    /** Datas (YYYY-MM-DD) com ao menos um set registrado, dentro do range. */
    async daysInRange(start, end) {
      const { data, error } = await sb.from('fitness_workout_logs')
        .select('date').eq('user_id', userId).gte('date', start).lte('date', end);
      const set = new Set();
      if (!error) (data || []).forEach(r => set.add(r.date));
      return set;
    },

    /** Última data registrada por plan_id — usada para sugerir o próximo treino da rotação A/B/C/D. */
    async lastDateByPlan() {
      const { data, error } = await sb.from('fitness_workout_logs')
        .select('plan_id, date').eq('user_id', userId)
        .not('plan_id', 'is', null)
        .order('date', { ascending: false }).limit(500);
      const map = {};
      if (!error) (data || []).forEach(r => { if (!map[r.plan_id]) map[r.plan_id] = r.date; });
      return map;
    },

    /**
     * Histórico de séries por exercício, agrupado por data — usado no
     * gráfico de progressão de carga (ex.: Leg Press semana 1→2→3).
     * Retorna [{ date, sets:[{reps,load,set_number}], maxLoad, totalVolume }]
     * ordenado por data ascendente, limitado às últimas `limit` sessões.
     */
    async exerciseHistory(exerciseId, limit = 12) {
      const { data, error } = await sb.from('fitness_workout_logs')
        .select('date, reps, load, set_number')
        .eq('user_id', userId).eq('exercise_id', exerciseId)
        .order('date', { ascending: false }).limit(300);
      if (error || !data) return [];

      const byDate = {};
      data.forEach(r => { (byDate[r.date] ||= []).push(r); });

      return Object.entries(byDate)
        .map(([date, sets]) => ({
          date,
          sets: sets.sort((a, b) => (a.set_number || 0) - (b.set_number || 0)),
          maxLoad: Math.max(0, ...sets.map(s => Number(s.load) || 0)),
          totalVolume: sets.reduce((acc, s) => acc + (Number(s.reps) || 0) * (Number(s.load) || 0), 0),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-limit);
    },
    /** Volume total (Σ reps×carga) registrado no período (todas as sessões/exercícios). */
    async volumeInRange(start, end) {
      const { data, error } = await sb.from('fitness_workout_logs')
        .select('reps, load').eq('user_id', userId).gte('date', start).lte('date', end);
      if (error || !data) return 0;
      return data.reduce((acc, r) => acc + (Number(r.reps) || 0) * (Number(r.load) || 0), 0);
    },

    /**
     * Substitui todas as séries de um exercício numa data (remove + insere).
     * `sets`: [{ reps, load, notes? }] — apenas linhas com `reps` preenchido são gravadas.
     */
    async replaceForExercise(date, exerciseId, sets, planId, planName, exerciseName) {
      await sb.from('fitness_workout_logs').delete()
        .eq('user_id', userId).eq('date', date).eq('exercise_id', exerciseId);
      const rows = sets
        .filter(s => s.reps !== null && s.reps !== undefined && s.reps !== '')
        .map((s, i) => ({
          user_id: userId, date, plan_id: planId, plan_name: planName,
          exercise_id: exerciseId, exercise_name: exerciseName,
          set_number: i + 1, reps: s.reps, load: s.load ?? null, notes: s.notes || null,
        }));
      if (rows.length) await sb.from('fitness_workout_logs').insert(rows);
      return rows;
    },
  };
  const training = {
    async daysInRange(start, end) {
      const [freeRes, logRes] = await Promise.all([
        sb.from('fitness_workouts').select('date').eq('user_id', userId).gte('date', start).lte('date', end),
        sb.from('fitness_workout_logs').select('date').eq('user_id', userId).gte('date', start).lte('date', end),
      ]);
      const set = new Set();
      (freeRes.data || []).forEach(r => set.add(r.date));
      (logRes.data || []).forEach(r => set.add(r.date));
      return set;
    },
  };

  // ── EXAMES LABORATORIAIS (lab_results) ─────────────────────────────
  // Fase 3 — Painel de Saúde Metabólica. Cache hidratado no init.
  const labs = {
    getAll() {
      return cache.labs;
    },
    async refresh() {
      const { data, error } = await sb.from('lab_results')
        .select('*').eq('user_id', userId).order('date', { ascending: true });
      if (!error) cache.labs = data || [];
      return cache.labs;
    },

    /** { [markerKey]: {value,date} } com o valor mais recente não-nulo (inclui custom:<nome>). */
    getLatest() {
      const out = {};
      for (const row of cache.labs) {
        for (const key of Object.keys(LabCatalog.markers)) {
          const v = row[key];
          if (v !== null && v !== undefined) out[key] = { value: Number(v), date: row.date };
        }
        const customArr = Array.isArray(row.custom) ? row.custom : Object.values(row.custom || {});
        customArr.forEach(c => {
          if (c && c.name && c.value !== null && c.value !== undefined) {
            out[`custom:${c.name}`] = { value: Number(c.value), date: row.date, unit: c.unit, name: c.name };
          }
        });
      }
      return out;
    },

    /** Histórico [{date,value}] de um marcador do catálogo, ordenado por data. */
    getHistory(key) {
      return cache.labs
        .filter(r => r[key] !== null && r[key] !== undefined)
        .map(r => ({ date: r.date, value: Number(r[key]) }));
    },

    /** Histórico de um marcador personalizado (custom), por nome. */
    getCustomHistory(name) {
      const out = [];
      for (const row of cache.labs) {
        const customArr = Array.isArray(row.custom) ? row.custom : Object.values(row.custom || {});
        const found = customArr.find(c => c && c.name === name);
        if (found && found.value !== null && found.value !== undefined) {
          out.push({ date: row.date, value: Number(found.value), unit: found.unit });
        }
      }
      return out;
    },

    /** Nomes de todos os marcadores personalizados já registrados. */
    customMarkerNames() {
      const set = new Set();
      cache.labs.forEach(row => {
        const customArr = Array.isArray(row.custom) ? row.custom : Object.values(row.custom || {});
        customArr.forEach(c => { if (c && c.name) set.add(c.name); });
      });
      return [...set];
    },

    async add(row) {
      const { id, ...rest } = row;
      const payload = { user_id: userId, date: rest.date || Utils.dateKey(), category: rest.category || 'Geral', ...rest };
      if (id) await sb.from('lab_results').update(payload).eq('id', id);
      else    await sb.from('lab_results').insert(payload);
      return labs.refresh();
    },

    async remove(id) {
      await sb.from('lab_results').delete().eq('id', id);
      return labs.refresh();
    },
  };

  // ── LIMPAR DADOS (mantém login/PIN, apaga registros do app) ────
  async function clearAll() {
    await Promise.all([
      sb.from('fitness_meals').delete().eq('user_id', userId),
      sb.from('fitness_workouts').delete().eq('user_id', userId),
      sb.from('fitness_workout_logs').delete().eq('user_id', userId),
      sb.from('lab_results').delete().eq('user_id', userId),
      sb.from('daily_tracking').delete().eq('user_id', userId),
      sb.from('physical_metrics').delete().eq('user_id', userId),
    ]);
    cache.daily = {};
    cache.physical = [];
    cache.labs = [];
  }

  // ── INIT ────────────────────────────────────────────────────
  async function init() {
    const session = await auth.getSession();
    if (!session) return false;
    userId = session.user.id;
    await hydrate();
    return true;
  }

  return {
    client: sb,
    auth, pin, init,
    prefs, water, habits, score, meals, workouts, weight, measurements,
    workoutPlans, workoutExercises, workoutLogs, training, labs,
    clearAll,
  };
})();
