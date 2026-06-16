/**
 * screens/dashboard.js — Home Premium Wellness
 * Visual: referência Oura/Gentler Streak/wellness feminino
 * Estrutura: hero + evolução horizontal + ações 4-col + evolução + jornada
 */

const ScreenDashboard = (() => {

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function pct(v, max) { return max > 0 ? Math.min(100, Math.max(0, (v / max) * 100)) : 0; }
  function fmtDate(d) {
    if (!d) return '—';
    const [y,m,day] = d.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${day} ${months[parseInt(m)-1]}`;
  }

  // ── HERO ─────────────────────────────────────────────────────
  function updateHero(name) {
    const hour = new Date().getHours();
    const gr   = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const d    = document.getElementById('dateLine');
    const g1   = document.getElementById('greetLine1');
    const g2   = document.getElementById('greetLine2');
    if (d)  d.textContent  = Utils.formatDate();
    if (g1) g1.textContent = gr + ',';
    if (g2) g2.textContent = esc(name) + '.';
  }

  // ── EVOLUÇÃO DA SEMANA — cartões horizontais ──────────────────
  function renderWeekEvolution({ walkDays, walkGoal, strengthDays, strengthGoal, proteinDays, waterDays, sleepDays }) {
    const items = [
      { ico:'🏋️', label:'Musculação', done: strengthDays, goal: strengthGoal, color:'#D38B87' },
      { ico:'❤️',  label:'Cardio',     done: walkDays,     goal: walkGoal,     color:'#AAB38C' },
      { ico:'🌿',  label:'Proteína',   done: proteinDays,  goal: 7,            color:'#AAB38C' },
      { ico:'💧',  label:'Água',       done: waterDays,    goal: 7,            color:'#7C9AA6' },
      { ico:'🌙',  label:'Sono',       done: sleepDays,    goal: 7,            color:'#CBB7D9' },
    ];
    return `<div class="wevo-scroll">
      ${items.map(it => {
        const p       = pct(it.done, it.goal);
        const complete = it.done >= it.goal;
        const fill    = complete ? '#AAB38C' : it.color;
        return `
          <div class="wevo-item">
            <div class="wevo-item-top">
              <span class="wevo-item-icon">${it.ico}</span>
              <span class="wevo-item-label">${it.label}</span>
            </div>
            <p class="wevo-item-value" style="color:${complete ? '#AAB38C' : '#3C3530'}">${it.done} de ${it.goal}</p>
            <div class="wevo-item-bar">
              <div class="wevo-item-fill" style="width:${p}%;background:${fill}"></div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
  }

  // ── AÇÕES DE HOJE — 4 colunas ────────────────────────────────
  // Cada card: emoji grande + label + status + botão colorido
  function actionCard(ico, label, status, isDone, btnText, btnColor, action) {
    return `
      <div class="action-card ${isDone ? 'ac-done' : ''}" data-dash-action="${action}">
        <div class="action-card-ico">${ico}</div>
        <p class="action-card-label">${label}</p>
        <p class="action-card-status ${isDone ? 'action-card-status-done' : ''}">${status}</p>
        <button class="action-card-btn" style="background:${isDone ? '#AAB38C' : btnColor}">${isDone ? '✓ Feito' : btnText}</button>
      </div>`;
  }

  function renderActions(habits, todayLogs, todayCardio, plans, lastByPlan, waterToday) {
    const hasSleep    = habits.sleep || (Storage.prefs.get('sleep_hours_today', 0) > 0);
    const hasWater    = habits.water || waterToday > 0;
    const hasStrength = todayLogs.length > 0;
    const hasCardio   = todayCardio.length > 0;
    const hasProtein  = habits.protein;
    const hasDiary    = habits.meals;

    const sleepH    = Storage.prefs.get('sleep_hours_today', 0);
    const waterGoal = Storage.prefs.get('goal_water_ml', 2500);
    const waterL    = (waterToday / 1000).toFixed(1);
    const waterGl   = (waterGoal / 1000).toFixed(1);

    let planSugg = 'Iniciar';
    if (plans.length > 0) {
      const s = [...plans].sort((a, b) =>
        (lastByPlan[a.id]||'0000-00-00').localeCompare(lastByPlan[b.id]||'0000-00-00')
      )[0];
      planSugg = s?.name || 'Treino';
    }

    const cardioDur = todayCardio.reduce((s, c) => s + (c.duration_min || 0), 0);

    return `<div class="actions-grid">
      ${actionCard('🌙', 'Sono',     hasSleep ? sleepH + 'h registrado'  : 'Não registrado', hasSleep, 'Registrar', '#CBB7D9', 'sleep')}
      ${actionCard('💧', 'Água',     hasWater ? waterL + 'L de ' + waterGl + 'L' : 'Não registrado', hasWater, 'Adicionar', '#7C9AA6', 'water')}
      ${actionCard('🏋️', 'Treino',  hasStrength ? planSugg : planSugg,    hasStrength, 'Iniciar',   '#D38B87', 'workout')}
      ${actionCard('👟', 'Cardio',  hasCardio ? cardioDur + ' min'        : 'Meta: 30 min',  hasCardio,  'Registrar', '#D7B37A', 'cardio')}
      ${actionCard('🥗', 'Nutrição', hasProtein ? 'Proteína registrada'   : 'Não registrado',hasProtein, 'Registrar', '#AAB38C', 'nutrition')}
      ${actionCard('📓', 'Diário',  hasDiary   ? 'Registrado'             : 'Não registrado',hasDiary,   'Escrever',  '#D38B87', 'nutrition')}
      ${actionCard('🌸', 'Ciclo',   'Fase folicular',                      false,            'Ver ciclo', '#E8B6B1',  'health')}
      ${actionCard('📋', 'Exames',  '0 pendentes',                         false,            'Verificar', '#B0A8C4',  'health')}
    </div>`;
  }

  // ── MINHA EVOLUÇÃO — mini cards com sparkline SVG ────────────
  function sparkline(points, color) {
    if (!points.length) return `<svg class="evo-mini-spark" width="80" height="28" viewBox="0 0 80 28"></svg>`;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const w = 80, h = 24;
    const xs = points.map((_, i) => (i / (points.length - 1)) * w);
    const ys = points.map(v => h - ((v - min) / range) * h + 2);
    const d  = xs.map((x, i) => (i === 0 ? `M ${x} ${ys[i]}` : `L ${x} ${ys[i]}`)).join(' ');
    return `<svg class="evo-mini-spark" width="80" height="28" viewBox="0 0 80 28">
      <path d="${d}" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function evoMini(label, value, sub, trend, trendColor, sparkPoints, sparkColor) {
    return `
      <div class="evo-mini">
        <p class="evo-mini-label">${label}</p>
        <p class="evo-mini-value">${esc(value)}</p>
        ${trend ? `<p class="evo-mini-trend" style="color:${trendColor}">${trend}</p>` : ''}
        <p style="font-size:10px;color:#B5ADA8;margin:0 0 6px">${esc(sub)}</p>
        ${sparkline(sparkPoints, sparkColor)}
      </div>`;
  }

  function renderEvolutionStrip({ latestWeight, sleepH, strengthDays, weightHistory, waterToday, waterGoal }) {
    const wPoints = weightHistory.slice(-8).map(w => w.kg);
    const weightTrend = wPoints.length > 1
      ? (wPoints[wPoints.length - 1] - wPoints[0]).toFixed(1)
      : null;
    const wTrendStr = weightTrend
      ? (parseFloat(weightTrend) < 0 ? '↓ ' + Math.abs(weightTrend) + ' kg' : '↑ ' + weightTrend + ' kg')
      : null;
    const wTrendColor = weightTrend && parseFloat(weightTrend) < 0 ? '#AAB38C' : '#D38B87';

    const waterL  = waterToday > 0 ? (waterToday / 1000).toFixed(1) + 'L' : '—';
    const waterGl = (waterGoal / 1000).toFixed(1) + 'L';

    return [
      evoMini('Peso', latestWeight ? latestWeight.toFixed(1) + ' kg' : '—', 'atual', wTrendStr, wTrendColor, wPoints, '#D38B87'),
      evoMini('Sono médio', sleepH ? sleepH.toFixed(1) + 'h' : '—', 'hoje', null, '', [], '#CBB7D9'),
      evoMini('Treinos', String(strengthDays), 'esta semana', null, '', [], '#D7B37A'),
      evoMini('Proteína', '—', 'média diária', null, '', [], '#AAB38C'),
      evoMini('Água', waterL, 'de ' + waterGl, null, '', [], '#7C9AA6'),
    ].join('');
  }

  // ── SUA JORNADA — timeline ────────────────────────────────────
  async function getJourneyEvents() {
    const today  = Utils.dateKey();
    const past14 = Utils.lastNDays(14);
    const [strengthSet, cardioSet, cycleAll] = await Promise.all([
      Storage.training.daysInRange(past14[0], today),
      Storage.cardio.daysInRange(past14[0], today),
      Storage.cycleEntries.getAll(),
    ]);
    const events = [];
    [...strengthSet].sort().reverse().slice(0, 3).forEach(d => {
      events.push({ date: d, title: 'Treino concluído', sub: 'Registrado', ico: '🏋️', color: '#FBF0E6' });
    });
    [...cardioSet].sort().reverse().slice(0, 3).forEach(d => {
      events.push({ date: d, title: 'Cardio registrado', sub: 'Sessão concluída', ico: '👟', color: '#EBF4F7' });
    });
    Storage.weight.getHistory().slice(-3).reverse().forEach(w => {
      events.push({ date: w.date, title: 'Peso atualizado', sub: w.kg.toFixed(1) + ' kg', ico: '⚖️', color: '#F5F0EB' });
    });
    const sleepH = Storage.prefs.get('sleep_hours_today', 0);
    if (sleepH > 0) {
      events.push({ date: today, title: 'Sono registrado', sub: sleepH + 'h', ico: '🌙', color: '#F3F0F8' });
    }
    const cycleLabels = {
      menstruation_start: 'Início da menstruação',
      menstruation_end: 'Fim do ciclo',
      symptom: 'Sintoma registrado',
    };
    cycleAll.slice(0, 2).forEach(c => {
      events.push({ date: c.date, title: cycleLabels[c.type] || 'Evento de saúde', sub: c.notes || '', ico: '🌸', color: '#FBF0F0' });
    });
    const seen = new Set();
    return events
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(e => { const k = `${e.date}|${e.title}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 6);
  }

  function renderJourney(events) {
    if (!events.length) {
      return `<div class="empty"><div class="eico">🌱</div><p class="etxt">Seus registros aparecerão aqui.<br>Comece registrando sono ou treino.</p></div>`;
    }
    const today = Utils.dateKey();
    const yest  = Utils.dateKey(new Date(Date.now() - 86400000));
    function when(d) {
      if (d === today) return 'Hoje';
      if (d === yest)  return 'Ontem';
      return fmtDate(d);
    }
    return `<div class="timeline">
      ${events.map(e => `
        <div class="tl-item">
          <span class="tl-date">${when(e.date)}</span>
          <div class="tl-dot" style="background:${e.color}">${e.ico}</div>
          <div class="tl-body">
            <p class="tl-title">${esc(e.title)}</p>
            ${e.sub ? `<p class="tl-sub">${esc(e.sub)}</p>` : ''}
          </div>
          <span class="tl-chev">›</span>
        </div>`).join('')}
    </div>`;
  }

  // ── MODAIS ────────────────────────────────────────────────────
  function showModal(html) {
    const w = document.getElementById('dashModals');
    if (!w) return;
    w.innerHTML = `<div class="modal-sheet" id="modalBackdrop">
      <div class="modal-body">${html}</div>
    </div>`;
    document.getElementById('modalBackdrop').addEventListener('click', e => {
      if (e.target.id === 'modalBackdrop') closeModal();
    });
  }
  function closeModal() {
    const w = document.getElementById('dashModals'); if (w) w.innerHTML = '';
  }
  function showToast(msg, bg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);padding:11px 22px;border-radius:22px;font-size:13px;font-weight:700;z-index:250;opacity:0;transition:opacity .22s;pointer-events:none;white-space:nowrap;font-family:Nunito,sans-serif';
      document.getElementById('app').appendChild(t);
    }
    t.style.background = bg || '#3C3530'; t.style.color = '#fff';
    t.textContent = msg; t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 2400);
  }
  function mHdr(title) {
    return `<div class="modal-hdr">
      <h2 class="modal-title">${title}</h2>
      <button class="modal-close" onclick="ScreenDashboard._closeModal()">×</button>
    </div>`;
  }

  function openSleepModal() {
    const curH = Storage.prefs.get('sleep_hours_today', '');
    const curBed = Storage.prefs.get('sleep_bedtime', '');
    const curWake = Storage.prefs.get('sleep_wakeup', '');
    showModal(`${mHdr('Registrar Sono')}
      <label class="field-label">Horas dormidas</label>
      <input class="form-input" id="sleepH" type="number" step="0.5" min="0" max="24" value="${curH}" placeholder="7.5" style="font-size:22px;font-weight:700;text-align:center;margin-bottom:14px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px">
        <div><label class="field-label">Dormi às</label><input class="form-input" id="sleepBed" type="time" value="${curBed}"></div>
        <div><label class="field-label">Acordei às</label><input class="form-input" id="sleepWake" type="time" value="${curWake}"></div>
      </div>
      <button class="mainbtn" id="saveSleepBtn" style="background:#CBB7D9">Salvar sono</button>`);
    document.getElementById('saveSleepBtn').addEventListener('click', () => {
      const h = parseFloat(document.getElementById('sleepH').value);
      const b = document.getElementById('sleepBed').value;
      const w = document.getElementById('sleepWake').value;
      if (h > 0) Storage.prefs.set('sleep_hours_today', h);
      if (b) Storage.prefs.set('sleep_bedtime', b);
      if (w) Storage.prefs.set('sleep_wakeup', w);
      const hab = Storage.habits.getToday(); hab.sleep = true; Storage.habits.setToday(hab);
      closeModal(); showToast('Sono registrado ✓', '#CBB7D9'); render();
    });
  }

  function openCardioModal() {
    showModal(`${mHdr('Registrar Cardio')}
      <label class="field-label">Tipo</label>
      <select class="form-input" id="cardioType" style="margin-bottom:14px">
        ${['Caminhada','Corrida','Bicicleta','Elíptico','Natação','Outro'].map(t=>`<option>${t}</option>`).join('')}
      </select>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px">
        <div><label class="field-label">Duração (min)</label><input class="form-input" id="cardioDur" type="number" inputmode="numeric" placeholder="30"></div>
        <div><label class="field-label">Distância (km)</label><input class="form-input" id="cardioDist" type="number" step="0.1" inputmode="decimal" placeholder="—"></div>
      </div>
      <button class="mainbtn" id="saveCardioBtn" style="background:#D7B37A">Salvar cardio</button>`);
    document.getElementById('saveCardioBtn').addEventListener('click', async () => {
      const dur = parseInt(document.getElementById('cardioDur').value);
      if (!dur) { showToast('Informe a duração', '#D38B87'); return; }
      await Storage.cardio.add({
        type: document.getElementById('cardioType').value, duration_min: dur,
        distance_km: parseFloat(document.getElementById('cardioDist').value) || null,
      });
      closeModal(); showToast('Cardio registrado ✓', '#AAB38C'); render();
    });
  }

  function openWeightModal() {
    const cur = Storage.weight.getLatest();
    showModal(`${mHdr('Registrar Peso')}
      <label class="field-label">Peso atual (kg)</label>
      <input class="form-input" id="weightVal" type="number" step="0.1" inputmode="decimal" value="${cur||''}" placeholder="72.5" style="font-size:26px;font-weight:700;text-align:center;margin-bottom:24px">
      <button class="mainbtn" id="saveWeightBtn" style="background:#AAB38C">Salvar peso</button>`);
    document.getElementById('saveWeightBtn').addEventListener('click', () => {
      const kg = parseFloat(document.getElementById('weightVal').value);
      if (!kg) return;
      Storage.weight.addEntry(kg);
      closeModal(); showToast('Peso salvo ✓', '#AAB38C'); render();
    });
  }

  function bindActions() {
    document.querySelectorAll('[data-dash-action]').forEach(el => {
      el.addEventListener('click', () => {
        switch (el.dataset.dashAction) {
          case 'sleep':     openSleepModal();   break;
          case 'water':     Router.go('hydro'); break;
          case 'workout':   Router.go('work');  break;
          case 'cardio':    openCardioModal();  break;
          case 'nutrition': Router.go('nutri'); break;
          case 'health':    Router.go('health'); break;
          case 'peso':      openWeightModal();  break;
        }
      });
    });
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────────
  async function render() {
    const name = Storage.prefs.get('user_name', 'Adriana');
    updateHero(name);

    const today  = Utils.dateKey();
    const wDays  = Utils.lastNDays(7);
    const wStart = wDays[0], wEnd = wDays[wDays.length - 1];

    const strengthGoal = Storage.prefs.get('goal_strength_week', 4);
    const walkGoal     = Storage.prefs.get('goal_walk_week', 5);
    const sleepGoal    = Storage.prefs.get('goal_sleep_h', 7);
    const waterGoalMl  = Storage.prefs.get('goal_water_ml', 2500);

    const habits    = Storage.habits.getToday();
    const sleepH    = Storage.prefs.get('sleep_hours_today', 0);
    const sleepDays = sleepH >= sleepGoal ? 1 : 0;
    const proteinDays = habits.protein ? 1 : 0;
    const waterDays   = habits.water   ? 1 : 0;

    const [todayLogs, todayCardio, lastByPlan, strengthSet, cardioStats, todayMeals, todayWater, nextConsult] = await Promise.all([
      Storage.workoutLogs.getByDate(today),
      Storage.cardio.getByDate(today),
      Storage.workoutLogs.lastDateByPlan(),
      Storage.training.daysInRange(wStart, wEnd),
      Storage.cardio.getWeekStats(),
      Storage.meals.getByDate(today),
      Storage.water.getToday(),
      Storage.consultations.getNext(),
    ]);

    const plans        = Storage.workoutPlans.getAll();
    const strengthDays = strengthSet.size;
    const walkDays     = cardioStats.days.size;
    const weightHistory = Storage.weight.getHistory();
    const latestWeight  = Storage.weight.getLatest();

    // Evolução da semana
    const wevoEl = document.getElementById('weekEvolutionCard');
    if (wevoEl) wevoEl.innerHTML = renderWeekEvolution({
      walkDays, walkGoal, strengthDays, strengthGoal, proteinDays, waterDays, sleepDays,
    });

    // Ações de hoje
    const actEl = document.getElementById('actionsCard');
    if (actEl) actEl.innerHTML = renderActions(habits, todayLogs, todayCardio, plans, lastByPlan, todayWater.ml || 0);

    // Minha evolução
    const strip = document.getElementById('evolutionStrip');
    if (strip) strip.innerHTML = renderEvolutionStrip({
      latestWeight, sleepH, strengthDays, weightHistory, waterToday: todayWater.ml || 0, waterGoal: waterGoalMl,
    });

    // Jornada (assíncrona)
    const jEl = document.getElementById('journeyCard');
    if (jEl) {
      jEl.innerHTML = '<p style="font-size:12px;color:#B5ADA8;padding:8px 0;margin:0;text-align:center">Carregando…</p>';
      getJourneyEvents().then(evts => { if (jEl) jEl.innerHTML = renderJourney(evts); });
    }

    bindActions();

    // Journey "Ver tudo" link
    document.getElementById('journeyMore')?.addEventListener('click', () => Router.go('prog'));
  }

  return {
    render,
    openSleepModal,
    openCardioModal,
    openWeightModal,
    _closeModal: closeModal,
  };
})();
