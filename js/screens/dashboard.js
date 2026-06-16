/**
 * screens/dashboard.js — Tela "Hoje"
 * Redesign premium: wellness journal, identidade editorial
 * Tipografia: Antic Didone (display) + Manrope (body)
 * Lógica: 100% preservada
 */

const ScreenDashboard = (() => {

  // ── ÍCONES (SVG inline, traço consistente 1.8px) ─────────────
  const I = {
    sleep:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    water:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
    strength: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="8" width="4" height="8" rx="1"/><rect x="19" y="8" width="4" height="8" rx="1"/><line x1="5" y1="11" x2="19" y2="11"/><line x1="5" y1="13" x2="19" y2="13"/></svg>',
    cardio:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    protein:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    diary:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  };

  // Paleta de ícones por categoria
  const C = {
    sleep:    { bg: '#F0EDF7', ico: '#7B6FA0' },
    water:    { bg: '#EAF3F6', ico: '#3E8098' },
    strength: { bg: '#EDF2EA', ico: '#5A7A56' },
    cardio:   { bg: '#EAF1F3', ico: '#3E6770' },
    protein:  { bg: '#FAF0EA', ico: '#C9845A' },
    diary:    { bg: '#F4F2EE', ico: '#8D9298' },
  };

  // ── HELPERS ──────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function pct(v, max) { return max > 0 ? Math.min(100, Math.max(0, (v / max) * 100)) : 0; }

  // ── EVOLUÇÃO DA SEMANA ────────────────────────────────────────
  function renderWeekEvolution({ walkDays, walkGoal, strengthDays, strengthGoal, proteinDays, waterDays, sleepDays }) {
    const rows = [
      { label: 'Musculação', done: strengthDays, goal: strengthGoal, color: '#5A7A56' },
      { label: 'Cardio',     done: walkDays,     goal: walkGoal,     color: '#3E6770' },
      { label: 'Proteína',   done: proteinDays,  goal: 7,            color: '#C9845A' },
      { label: 'Água',       done: waterDays,    goal: 7,            color: '#3E8098' },
      { label: 'Sono',       done: sleepDays,    goal: 7,            color: '#7B6FA0' },
    ];

    return `
      <p class="wevo-capsule">Esta semana</p>
      ${rows.map(r => {
        const complete   = r.done >= r.goal;
        const fillColor  = complete ? '#7A9B76' : r.color;
        const fracClass  = complete ? 'wevo-item-fraction wevo-item-fraction-done' : 'wevo-item-fraction';
        const p          = pct(r.done, r.goal);
        const label      = `${r.done} de ${r.goal}`;
        return `
          <div class="wevo-item">
            <div class="wevo-item-header">
              <p class="wevo-item-name">${r.label}</p>
              <p class="${fracClass}">${label}</p>
            </div>
            <div class="wevo-track">
              <div class="wevo-fill" style="width:${p}%;background:${fillColor}"></div>
            </div>
          </div>`;
      }).join('')}`;
  }

  // ── AÇÕES DE HOJE — grid 2 colunas ───────────────────────────
  // ── AÇÕES DE HOJE — cards premium com estados visuais ───────
  function actCard(type, label, doneValue, pendingValue, isDone, cta, action) {
    const c = C[type] || C.diary;
    return `
      <div class="acard ${isDone ? 'acard-done' : 'acard-pending'}" data-dash-action="${action}">
        <div class="acard-top">
          <div class="acard-ico" style="background:${c.bg};color:${c.ico}">
            ${I[type] || I.diary}
          </div>
          ${isDone ? '<span class="acard-badge">✓</span>' : ''}
        </div>
        <p class="acard-label">${label}</p>
        <p class="acard-value ${isDone ? 'acard-value-done' : 'acard-value-pending'}">
          ${isDone ? doneValue : pendingValue}
        </p>
        ${isDone
          ? '<p class="acard-status-done">Registrado</p>'
          : `<button class="acard-cta">${cta}</button>`}
      </div>`;
  }

  function renderActions(habits, todayLogs, todayCardio, plans, lastByPlan) {
    const hasSleep    = habits.sleep || (Storage.prefs.get('sleep_hours_today', 0) > 0);
    const hasWater    = habits.water;
    const hasStrength = todayLogs.length > 0;
    const hasCardio   = todayCardio.length > 0;
    const hasProtein  = habits.protein;
    const hasDiary    = habits.meals;

    const sleepH   = Storage.prefs.get('sleep_hours_today', 0);
    const cardioCnt = todayCardio.length;
    const cardioMin = todayCardio.reduce((s, c) => s + (c.duration_min || 0), 0);

    let planSugg = 'Iniciar';
    if (plans.length > 0) {
      const s = [...plans].sort((a, b) =>
        (lastByPlan[a.id] || '0000-00-00').localeCompare(lastByPlan[b.id] || '0000-00-00')
      )[0];
      planSugg = s?.name || 'Treino';
    }

    return `<div class="act-grid">
      ${actCard('sleep',    'Sono',       sleepH ? sleepH + 'h'         : 'Registrado', '—',         hasSleep,    'Registrar', 'sleep')}
      ${actCard('water',    'Água',       'Adicionado',                               '—',           hasWater,    'Adicionar', 'water')}
      ${actCard('strength', 'Musculação', planSugg + ' ✓',                            planSugg,      hasStrength, 'Iniciar',   'workout')}
      ${actCard('cardio',   'Cardio',     cardioMin ? cardioMin + ' min'  : cardioCnt + 'x', '—',    hasCardio,   'Registrar', 'cardio')}
      ${actCard('protein',  'Proteína',   'Meta atingida',                            '—',           hasProtein,  'Registrar', 'nutrition')}
      ${actCard('diary',    'Refeições',  'Registrado',                               '—',           hasDiary,    'Ver',       'nutrition')}
    </div>`;
  }

  // ── MINHA EVOLUÇÃO — strip horizontal ────────────────────────
  function renderEvolutionStrip({ latestWeight, sleepAvg7d, strengthDays, lastLab, nextConsultation }) {
    function card(title, value, sub, color, delta) {
      return `
        <div class="mini-stat">
          <p class="mini-stat-title">${title}</p>
          <p class="mini-stat-value" style="color:${color || '#2C2B28'}">${esc(value)}</p>
          ${delta ? `<p class="mini-stat-delta" style="color:${delta.startsWith('↑') ? '#7A9B76' : '#C9845A'}">${delta}</p>` : ''}
          <p class="mini-stat-sub">${esc(sub)}</p>
        </div>`;
    }

    return [
      card('Peso', latestWeight ? latestWeight.toFixed(1) + ' kg' : '—', 'atual', '#2C2B28', null),
      card('Sono', sleepAvg7d ? sleepAvg7d.toFixed(1) + 'h' : '—', 'hoje', '#7B6FA0', null),
      card('Treinos', String(strengthDays), 'últimos 7d', '#5A7A56', null),
      card('Último Exame', lastLab ? lastLab.date.slice(5).replace('-', '/') : '—', lastLab?.category || 'sem dado', '#3E6770', null),
      card('Consulta', nextConsultation ? nextConsultation.date.slice(5).replace('-', '/') : '—', nextConsultation?.specialty || 'sem agenda', '#C9845A', null),
    ].join('');
  }

  // ── NUTRIÇÃO DE HOJE ──────────────────────────────────────────
  function renderNutriSummary(meals) {
    if (!meals.length) {
      return `
        <p class="nutri-capsule">Nutrição hoje</p>
        <p style="font-size:13px;color:#A5AA94;margin:0;padding:4px 0">Nenhuma refeição registrada ainda.</p>
        <button data-dash-action="nutrition" style="background:none;border:1.5px solid #EDE8E0;border-radius:22px;padding:9px 20px;font-size:12px;font-weight:700;color:#3E6770;cursor:pointer;width:100%;margin-top:12px;font-family:'Manrope',sans-serif">Registrar refeição</button>`;
    }
    const t = meals.reduce((a, m) => ({
      cal: a.cal + (m.cal||0), p: a.p + (m.p||0), c: a.c + (m.c||0), f: a.f + (m.f||0),
    }), { cal: 0, p: 0, c: 0, f: 0 });
    const pGoal = Storage.prefs.get('goal_protein_g', 130);

    return `
      <div style="display:grid;grid-template-columns:1fr auto;align-items:baseline;margin-bottom:14px">
        <p class="nutri-capsule" style="margin:0">Nutrição hoje</p>
        <p class="nutri-total-kcal" style="font-size:22px;margin:0">${t.cal} kcal</p>
      </div>
      <div class="nutri-macro-grid">
        <div class="nutri-macro-item">
          <div class="nutri-macro-bar"><div class="nutri-macro-fill" style="width:${pct(t.p, pGoal)}%;background:#C9845A"></div></div>
          <p class="nutri-macro-val" style="color:#C9845A">${t.p}g</p>
          <p class="nutri-macro-name">Proteína</p>
        </div>
        <div class="nutri-macro-item">
          <div class="nutri-macro-bar"><div class="nutri-macro-fill" style="width:${pct(t.c, 180)}%;background:#5A7A56"></div></div>
          <p class="nutri-macro-val" style="color:#5A7A56">${t.c}g</p>
          <p class="nutri-macro-name">Carboidratos</p>
        </div>
        <div class="nutri-macro-item">
          <div class="nutri-macro-bar"><div class="nutri-macro-fill" style="width:${pct(t.f, 80)}%;background:#D4956E"></div></div>
          <p class="nutri-macro-val" style="color:#D4956E">${t.f}g</p>
          <p class="nutri-macro-name">Gordura</p>
        </div>
      </div>`;
  }

  // ── LINHA DA JORNADA ──────────────────────────────────────────
  async function getJourneyEvents() {
    const today  = Utils.dateKey();
    const past14 = Utils.lastNDays(14);
    const start  = past14[0];

    const [strengthSet, cardioSet, cycleAll] = await Promise.all([
      Storage.training.daysInRange(start, today),
      Storage.cardio.daysInRange(start, today),
      Storage.cycleEntries.getAll(),
    ]);

    const events = [];

    // Treinos
    [...strengthSet].sort().reverse().slice(0, 4).forEach(d => {
      events.push({ date: d, text: 'Treino concluído', color: '#5A7A56' });
    });

    // Cardio
    [...cardioSet].sort().reverse().slice(0, 3).forEach(d => {
      events.push({ date: d, text: 'Cardio registrado', color: '#3E6770' });
    });

    // Peso
    Storage.weight.getHistory().slice(-4).reverse().forEach(w => {
      events.push({ date: w.date, text: `Peso: ${w.kg.toFixed(1)} kg`, color: '#C9845A' });
    });

    // Sono hoje
    const sleepH = Storage.prefs.get('sleep_hours_today', 0);
    if (sleepH > 0) {
      events.push({ date: today, text: `Sono: ${sleepH}h`, color: '#7B6FA0' });
    }

    // Ciclo
    const cycleLabels = {
      menstruation_start: 'Início do ciclo',
      menstruation_end: 'Fim do ciclo',
      symptom: 'Sintoma registrado',
      energy: 'Energia registrada',
      mood: 'Humor registrado',
    };
    cycleAll.slice(0, 3).forEach(c => {
      events.push({ date: c.date, text: cycleLabels[c.type] || 'Evento de saúde', color: '#9B7A9B' });
    });

    // Dedup e ordenar
    const seen = new Set();
    return events
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(e => { const k = `${e.date}|${e.text}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 7);
  }

  function renderJourney(events) {
    if (!events.length) {
      return `<p style="font-size:13px;color:#A5AA94;text-align:center;padding:16px 0;margin:0;font-style:italic">Seus registros irão aparecer aqui.</p>`;
    }

    const today = Utils.dateKey();
    const yest  = Utils.dateKey(new Date(Date.now() - 86400000));

    function when(d) {
      if (d === today) return 'Hoje';
      if (d === yest)  return 'Ontem';
      return Utils.formatDateShort(d);
    }

    return `
      <p class="journey-capsule">Linha da jornada</p>
      <div class="journey">
        ${events.map((e, i) => `
          <div class="journey-item">
            <div class="journey-dot-col">
              <div class="journey-dot" style="background:${e.color}"></div>
              ${i < events.length - 1 ? '<div class="journey-connector"></div>' : ''}
            </div>
            <div class="journey-body">
              <p class="journey-when">${when(e.date)}</p>
              <p class="journey-event">${esc(e.text)}</p>
            </div>
          </div>`).join('')}
      </div>`;
  }

  // ── MODAIS ────────────────────────────────────────────────────
  function showModal(html) {
    const wrap = document.getElementById('dashModals');
    if (!wrap) return;
    wrap.innerHTML = `
      <div id="modalBackdrop" style="position:fixed;inset:0;background:rgba(44,43,40,0.5);z-index:150;display:flex;align-items:flex-end;backdrop-filter:blur(4px)">
        <div style="width:100%;max-width:560px;margin:0 auto;background:#fff;border-radius:22px 22px 0 0;padding:22px 20px 44px;box-shadow:0 -4px 32px rgba(0,0,0,0.12)">
          ${html}
        </div>
      </div>`;
    document.getElementById('modalBackdrop').addEventListener('click', e => {
      if (e.target.id === 'modalBackdrop') closeModal();
    });
  }

  function closeModal() {
    const w = document.getElementById('dashModals');
    if (w) w.innerHTML = '';
  }

  function showToast(msg, bg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);padding:11px 22px;border-radius:22px;font-size:13px;font-weight:600;z-index:250;opacity:0;transition:opacity .22s;pointer-events:none;white-space:nowrap;font-family:Manrope,sans-serif';
      document.getElementById('app').appendChild(t);
    }
    t.style.background = bg || '#2C2B28';
    t.style.color = '#F8F7F3';
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 2300);
  }

  function mHdr(title) {
    return `
      <div style="display:grid;grid-template-columns:1fr auto;align-items:center;margin-bottom:20px">
        <p style="font-family:'Antic Didone',Georgia,serif;font-size:22px;font-weight:400;color:#2C2B28;margin:0">${title}</p>
        <button onclick="ScreenDashboard._closeModal()" style="background:none;border:none;width:30px;height:30px;font-size:22px;color:#A5AA94;cursor:pointer;padding:0">×</button>
      </div>`;
  }

  function openSleepModal() {
    const curH   = Storage.prefs.get('sleep_hours_today', '');
    const curBed = Storage.prefs.get('sleep_bedtime', '');
    const curWake= Storage.prefs.get('sleep_wakeup', '');
    showModal(`
      ${mHdr('Registrar Sono')}
      <label class="field-label">Horas dormidas</label>
      <input class="form-input" id="sleepH" type="number" step="0.5" min="0" max="24" value="${curH}" placeholder="7.5" style="text-align:center;font-size:22px;font-weight:700;margin-bottom:14px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px">
        <div><label class="field-label">Dormi às</label><input class="form-input" id="sleepBed" type="time" value="${curBed}"></div>
        <div><label class="field-label">Acordei às</label><input class="form-input" id="sleepWake" type="time" value="${curWake}"></div>
      </div>
      <button class="mainbtn" id="saveSleepBtn" style="background:#7B6FA0">Salvar sono</button>`);
    document.getElementById('saveSleepBtn').addEventListener('click', () => {
      const h = parseFloat(document.getElementById('sleepH').value);
      const b = document.getElementById('sleepBed').value;
      const w = document.getElementById('sleepWake').value;
      if (h > 0) Storage.prefs.set('sleep_hours_today', h);
      if (b) Storage.prefs.set('sleep_bedtime', b);
      if (w) Storage.prefs.set('sleep_wakeup', w);
      const hab = Storage.habits.getToday(); hab.sleep = true; Storage.habits.setToday(hab);
      closeModal(); showToast('Sono registrado ✓', '#7B6FA0'); render();
    });
  }

  function openCardioModal() {
    showModal(`
      ${mHdr('Registrar Cardio')}
      <label class="field-label">Tipo</label>
      <select class="form-input" id="cardioType" style="margin-bottom:14px">
        ${['Caminhada','Corrida','Bicicleta','Elíptico','Natação','Outro'].map(t => `<option>${t}</option>`).join('')}
      </select>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div><label class="field-label">Duração (min)</label><input class="form-input" id="cardioDur" type="number" inputmode="numeric" placeholder="30"></div>
        <div><label class="field-label">Distância (km)</label><input class="form-input" id="cardioDist" type="number" step="0.1" inputmode="decimal" placeholder="—"></div>
      </div>
      <label class="field-label">Intensidade</label>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:24px">
        ${['Leve','Moderada','Alta'].map((v,i) => `<label style="text-align:center;padding:10px 0;border:1.5px solid ${i===1?'#3E6770':'#EDE8E0'};border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;color:${i===1?'#3E6770':'#A5AA94'};font-family:Manrope,sans-serif"><input type="radio" name="cardioInt" value="${v}" ${i===1?'checked':''} style="display:none">${v}</label>`).join('')}
      </div>
      <button class="mainbtn" id="saveCardioBtn" style="background:#3E6770">Salvar cardio</button>`);
    document.querySelectorAll('input[name="cardioInt"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('input[name="cardioInt"]').forEach(x => {
          const l = x.closest('label');
          l.style.borderColor = x.checked ? '#3E6770' : '#EDE8E0';
          l.style.color = x.checked ? '#3E6770' : '#A5AA94';
        });
      });
    });
    document.getElementById('saveCardioBtn').addEventListener('click', async () => {
      const dur = parseInt(document.getElementById('cardioDur').value);
      if (!dur) { showToast('Informe a duração', '#C9845A'); return; }
      await Storage.cardio.add({
        type: document.getElementById('cardioType').value,
        duration_min: dur,
        distance_km: parseFloat(document.getElementById('cardioDist').value) || null,
        intensity: document.querySelector('input[name="cardioInt"]:checked')?.value || null,
      });
      closeModal(); showToast('Cardio registrado ✓', '#3E6770'); render();
    });
  }

  function openWeightModal() {
    const cur = Storage.weight.getLatest();
    showModal(`
      ${mHdr('Registrar Peso')}
      <label class="field-label">Peso atual (kg)</label>
      <input class="form-input" id="weightVal" type="number" step="0.1" inputmode="decimal" value="${cur||''}" placeholder="72.5" style="text-align:center;font-size:26px;font-weight:700;margin-bottom:24px">
      <button class="mainbtn" id="saveWeightBtn" style="background:#3E6770">Salvar peso</button>`);
    document.getElementById('saveWeightBtn').addEventListener('click', () => {
      const kg = parseFloat(document.getElementById('weightVal').value);
      if (!kg) return;
      Storage.weight.addEntry(kg);
      closeModal(); showToast('Peso registrado ✓', '#5A7A56'); render();
    });
  }

  // ── BINDINGS ──────────────────────────────────────────────────
  function bindActions() {
    document.querySelectorAll('[data-dash-action]').forEach(el => {
      el.addEventListener('click', () => {
        switch (el.dataset.dashAction) {
          case 'sleep':     openSleepModal();   break;
          case 'water':     Router.go('hydro'); break;
          case 'workout':   Router.go('work');  break;
          case 'cardio':    openCardioModal();  break;
          case 'nutrition': Router.go('nutri'); break;
          case 'peso':      openWeightModal();  break;
        }
      });
    });
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────────
  async function render() {
    const name       = Storage.prefs.get('user_name', 'Adriana');
    const today      = Utils.dateKey();
    const wDays      = Utils.lastNDays(7);
    const wStart     = wDays[0];
    const wEnd       = wDays[wDays.length - 1];

    // Metas
    const strengthGoal = Storage.prefs.get('goal_strength_week', 4);
    const walkGoal     = Storage.prefs.get('goal_walk_week', 5);
    const sleepGoal    = Storage.prefs.get('goal_sleep_h', 7);

    // Hábitos síncronos
    const todayHabits = Storage.habits.getToday();
    const sleepH      = Storage.prefs.get('sleep_hours_today', 0);
    const sleepDays   = sleepH >= sleepGoal ? 1 : 0;
    const proteinDays = todayHabits.protein ? 1 : 0;
    const waterDays   = todayHabits.water   ? 1 : 0;

    // Header
    const dateLine  = document.getElementById('dateLine');
    const greetLine = document.getElementById('greetLine');
    if (dateLine)  dateLine.textContent = Utils.formatDate();
    if (greetLine) greetLine.innerHTML  = `${Utils.greeting()},<br>${esc(name)}.`;

    // Dados assíncronos em paralelo
    const [todayLogs, todayCardio, lastByPlan, strengthDaysSet, cardioStats, todayMeals, nextConsult] = await Promise.all([
      Storage.workoutLogs.getByDate(today),
      Storage.cardio.getByDate(today),
      Storage.workoutLogs.lastDateByPlan(),
      Storage.training.daysInRange(wStart, wEnd),
      Storage.cardio.getWeekStats(),
      Storage.meals.getByDate(today),
      Storage.consultations.getNext(),
    ]);

    const plans        = Storage.workoutPlans.getAll();
    const strengthDays = strengthDaysSet.size;
    const walkDays     = cardioStats.days.size;
    const allLabs      = Storage.labs.getAll();
    const lastLab      = allLabs.length ? allLabs[allLabs.length - 1] : null;
    const latestWeight = Storage.weight.getLatest();

    // Renderizar seções
    const wevoEl = document.getElementById('weekEvolutionCard');
    if (wevoEl) wevoEl.innerHTML = renderWeekEvolution({
      walkDays, walkGoal, strengthDays, strengthGoal, proteinDays, waterDays, sleepDays,
    });

    const actEl = document.getElementById('actionsCard');
    if (actEl) actEl.innerHTML = renderActions(todayHabits, todayLogs, todayCardio, plans, lastByPlan);

    const strip = document.getElementById('evolutionStrip');
    if (strip) strip.innerHTML = renderEvolutionStrip({
      latestWeight, sleepAvg7d: sleepH > 0 ? sleepH : null,
      strengthDays, lastLab, nextConsultation: nextConsult,
    });

    const nutriEl = document.getElementById('nutriSummary');
    if (nutriEl) nutriEl.innerHTML = renderNutriSummary(todayMeals);

    // Journey (assíncrona — não bloqueia o render principal)
    const journeyEl = document.getElementById('journeyCard');
    if (journeyEl) {
      journeyEl.innerHTML = '<p style="font-size:12px;color:#A5AA94;margin:0;padding:8px 0">Carregando…</p>';
      getJourneyEvents().then(events => {
        if (journeyEl) journeyEl.innerHTML = renderJourney(events);
      });
    }

    // Bindings
    bindActions();
  }

  return {
    render,
    openSleepModal,
    openCardioModal,
    openWeightModal,
    _closeModal: closeModal,
  };
})();
