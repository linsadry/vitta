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

  // ── LIMPAR DADOS (mantém login/PIN, apaga registros do app) ────
  async function clearAll() {
    await Promise.all([
      sb.from('fitness_meals').delete().eq('user_id', userId),
      sb.from('fitness_workouts').delete().eq('user_id', userId),
      sb.from('daily_tracking').delete().eq('user_id', userId),
      sb.from('physical_metrics').delete().eq('user_id', userId),
    ]);
    cache.daily = {};
    cache.physical = [];
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
    clearAll,
  };
})();
