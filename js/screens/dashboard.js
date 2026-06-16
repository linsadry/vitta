/**
 * screens/dashboard.js — Tela "Hoje" (Fase 4 redesign premium)
 *
 * Layout baseado em CSS grid classes (.wevo-row, .act-row, .mini-stat)
 * definidas em components.css para garantir renderização correta.
 */

const ScreenDashboard = (() => {

  // ── ÍCONES SVG (definidos como constantes) ───────────────────
  const ICO = {
    sleep:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    water:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
    strength: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="8" width="4" height="8" rx="1"/><rect x="19" y="8" width="4" height="8" rx="1"/><line x1="5" y1="11" x2="19" y2="11"/><line x1="5" y1="13" x2="19" y2="13"/></svg>',
    cardio:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    protein:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
    diary:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    chev:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>',
  };

  // Cores por categoria de hábito
  const CAT_COLOR = {
    sleep:    { bg: '#F0EEF7', ico: '#6B6B8A' },
    water:    { bg: '#EBF4F7', ico: '#3E8098' },
    strength: { bg: '#EEF2EC', ico: '#5A7A56' },
    cardio:   { bg: '#EBF4F7', ico: '#3E6770' },
    protein:  { bg: '#FBF0EA', ico: '#C9845A' },
    diary:    { bg: '#F5F2EE', ico: '#8D9298' },
  };

  // ── HELPERS ──────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function pct(v, max) { return max > 0 ? Math.min(100, Math.max(0, (v / max) * 100)) : 0; }

  // ── HEADER ───────────────────────────────────────────────────
  function renderHeader(name) {
    return `
      <div class="dash-header">
        <div style="display:grid;grid-template-columns:1fr auto;align-items:start;gap:12px">
          <div>
            <p class="dash-date" id="dateLine"></p>
            <h1 class="dash-greeting" id="greetLine">Bom dia, ${esc(name)}</h1>
          </div>
          <img src="assets/icons/icon-192.png" alt="" style="width:40px;height:40px;border-radius:12px;margin-top:4px;flex-shrink:0">
        </div>
      </div>`;
  }

  // ── EVOLUÇÃO DA SEMANA ────────────────────────────────────────
  function renderWeekEvolution(data) {
    const { walkDays, walkGoal, strengthDays, strengthGoal, proteinDays, waterDays, sleepDays } = data;

    const rows = [
      { label: 'Cardio',     done: walkDays,     goal: walkGoal,     color: '#3E6770' },
      { label: 'Musculação', done: strengthDays, goal: strengthGoal, color: '#5A7A56' },
      { label: 'Proteína',   done: proteinDays,  goal: 7,            color: '#C9845A' },
      { label: 'Água',       done: waterDays,    goal: 7,            color: '#3E8098' },
      { label: 'Sono',       done: sleepDays,    goal: 7,            color: '#6B6B8A' },
    ];

    return `
      <div style="display:grid;grid-template-columns:1fr auto;align-items:center;margin-bottom:14px">
        <p class="capsule-label" style="margin:0">Esta semana</p>
        <span style="font-size:10px;color:#A5AA94;font-weight:500">7 dias</span>
      </div>
      ${rows.map(r => {
        const p = pct(r.done, r.goal);
        const complete = r.done >= r.goal;
        const fillColor = complete ? '#7A9B76' : r.color;
        const countColor = complete ? '#7A9B76' : '#A5AA94';
        return `<div class="wevo-row">
          <span class="wevo-dot" style="background:${fillColor}"></span>
          <span class="wevo-label">${r.label}</span>
          <div class="wevo-track"><div class="wevo-fill" style="width:${p}%;background:${fillColor}"></div></div>
          <span class="wevo-count" style="color:${countColor}">${r.done}/${r.goal}</span>
        </div>`;
      }).join('')}`;
  }

  // ── AÇÕES DE HOJE ─────────────────────────────────────────────
  function actRow(type, label, subDone, subPending, done, action) {
    const c = CAT_COLOR[type] || CAT_COLOR.diary;
    const sub = done
      ? `<p class="act-sub-done">${subDone}</p>`
      : `<p class="act-sub">${subPending}</p>`;
    return `
      <div class="act-row" data-dash-action="${action}">
        <div class="act-ico" style="background:${c.bg};color:${c.ico}">${ICO[type] || ICO.diary}</div>
        <div>
          <p class="act-name">${label}</p>
          ${sub}
        </div>
        <span class="act-chev">${ICO.chev}</span>
      </div>`;
  }

  function renderActions(habits, todayLogs, todayCardio, plans, lastByPlan) {
    const hasSleep    = habits.sleep || (Storage.prefs.get('sleep_hours_today', 0) > 0);
    const hasWater    = habits.water;
    const hasStrength = todayLogs.length > 0;
    const hasCardio   = todayCardio.length > 0;
    const hasProtein  = habits.protein;
    const hasDiary    = habits.meals;

    const sleepH = Storage.prefs.get('sleep_hours_today', 0);
    const sleepSub = hasSleep && sleepH ? `${sleepH}h registradas` : '';

    let planLabel = 'Iniciar treino';
    if (plans.length > 0) {
      const suggested = [...plans].sort((a, b) =>
        (lastByPlan[a.id] || '0000-00-00').localeCompare(lastByPlan[b.id] || '0000-00-00')
      )[0];
      planLabel = suggested?.name ? `Ir para ${suggested.name}` : 'Iniciar treino';
    }

    const cardioSub = hasCardio
      ? `${todayCardio.length} sessão${todayCardio.length > 1 ? 'ões' : ''} hoje`
      : '';

    return `<div class="act-list">
      ${actRow('sleep',    'Sono',          sleepSub || 'Registrado',  'Toque para registrar', hasSleep,    'sleep')}
      ${actRow('water',    'Hidratação',    'Adicionado',              'Registrar consumo',    hasWater,    'water')}
      ${actRow('strength', 'Musculação',    'Concluído hoje',          planLabel,              hasStrength, 'workout')}
      ${actRow('cardio',   'Cardio',        cardioSub || 'Registrado', 'Registrar sessão',     hasCardio,   'cardio')}
      ${actRow('protein',  'Proteína',      'Meta atingida',           'Registrar refeição',   hasProtein,  'nutrition')}
      ${actRow('diary',    'Refeições',     'Registrado',              'Abrir nutrição',       hasDiary,    'nutrition')}
    </div>`;
  }

  // ── MINHA EVOLUÇÃO ────────────────────────────────────────────
  function renderEvolutionStrip(data) {
    const { latestWeight, sleepAvg7d, strengthDays, lastLab, nextConsultation } = data;

    const items = [
      {
        title: 'Peso',
        value: latestWeight ? `${latestWeight.toFixed(1)}` : '—',
        sub:   latestWeight ? 'kg' : 'sem dado',
        color: '#2C2B28',
      },
      {
        title: 'Sono',
        value: sleepAvg7d ? `${sleepAvg7d.toFixed(1)}h` : '—',
        sub:   'hoje',
        color: '#6B6B8A',
      },
      {
        title: 'Treinos',
        value: String(strengthDays),
        sub:   'últimos 7d',
        color: '#5A7A56',
      },
      {
        title: 'Último Exame',
        value: lastLab ? lastLab.date.slice(5).replace('-', '/') : '—',
        sub:   lastLab?.category || 'sem dado',
        color: '#3E6770',
      },
      {
        title: 'Próx. Consulta',
        value: nextConsultation ? nextConsultation.date.slice(5).replace('-', '/') : '—',
        sub:   nextConsultation?.specialty || 'sem agendamento',
        color: '#C9845A',
      },
    ];

    return items.map(it => `
      <div class="mini-stat">
        <p class="mini-stat-title">${it.title}</p>
        <p class="mini-stat-value" style="color:${it.color}">${esc(it.value)}</p>
        <p class="mini-stat-sub">${esc(it.sub)}</p>
      </div>`).join('');
  }

  // ── NUTRIÇÃO DE HOJE ──────────────────────────────────────────
  function renderNutriSummary(meals) {
    if (!meals.length) {
      return `
        <div class="nutri-header">
          <p class="capsule-label" style="margin:0">Nutrição hoje</p>
          <button data-dash-action="nutrition" style="background:none;border:none;font-size:12px;color:var(--color-health);font-weight:600;cursor:pointer;padding:0">Registrar</button>
        </div>
        <p style="font-size:13px;color:#A5AA94;margin:0;padding:4px 0">Nenhuma refeição registrada</p>`;
    }

    const total = meals.reduce((acc, m) => ({
      cal: acc.cal + (m.cal||0), p: acc.p + (m.p||0),
      c: acc.c + (m.c||0),      f: acc.f + (m.f||0),
    }), { cal: 0, p: 0, c: 0, f: 0 });

    const proteinGoal = Storage.prefs.get('goal_protein_g', 130);

    return `
      <div class="nutri-header">
        <p class="capsule-label" style="margin:0">Nutrição hoje</p>
        <span style="font-size:13px;font-weight:700;color:#C9845A;font-family:'Playfair Display',serif">${total.cal} kcal</span>
      </div>
      <div class="nutri-macro-grid">
        <div class="nutri-macro-item">
          <p class="nutri-macro-val" style="color:#C9845A">${total.p}g</p>
          <div class="nutri-macro-bar"><div class="nutri-macro-fill" style="width:${pct(total.p, proteinGoal)}%;background:#C9845A"></div></div>
          <p class="nutri-macro-name">Proteína</p>
        </div>
        <div class="nutri-macro-item">
          <p class="nutri-macro-val" style="color:#5A7A56">${total.c}g</p>
          <div class="nutri-macro-bar"><div class="nutri-macro-fill" style="width:${pct(total.c, 180)}%;background:#5A7A56"></div></div>
          <p class="nutri-macro-name">Carboidratos</p>
        </div>
        <div class="nutri-macro-item">
          <p class="nutri-macro-val" style="color:#D4956E">${total.f}g</p>
          <div class="nutri-macro-bar"><div class="nutri-macro-fill" style="width:${pct(total.f, 80)}%;background:#D4956E"></div></div>
          <p class="nutri-macro-name">Gordura</p>
        </div>
      </div>`;
  }

  // ── MODAIS ────────────────────────────────────────────────────
  function showModal(html) {
    const wrap = document.getElementById('dashModals');
    if (!wrap) return;
    wrap.innerHTML = `
      <div id="modalBackdrop" style="position:fixed;inset:0;background:rgba(44,43,40,0.52);z-index:150;display:flex;align-items:flex-end;backdrop-filter:blur(3px)">
        <div style="width:100%;max-width:560px;margin:0 auto;background:#fff;border-radius:22px 22px 0 0;padding:22px 20px 40px;box-shadow:0 -4px 32px rgba(0,0,0,0.14)">
          ${html}
        </div>
      </div>`;
    document.getElementById('modalBackdrop').addEventListener('click', e => {
      if (e.target.id === 'modalBackdrop') closeModal();
    });
  }

  function closeModal() {
    const wrap = document.getElementById('dashModals');
    if (wrap) wrap.innerHTML = '';
  }

  function showToast(msg, color) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);padding:11px 22px;border-radius:22px;font-size:13px;font-weight:600;z-index:250;opacity:0;transition:opacity .22s;pointer-events:none;white-space:nowrap;';
      document.getElementById('app').appendChild(t);
    }
    t.style.background = color || '#2C2B28';
    t.style.color = '#F4F1EC';
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 2300);
  }

  function modalHeader(title) {
    return `
      <div style="display:grid;grid-template-columns:1fr auto;align-items:center;margin-bottom:20px">
        <p style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#2C2B28;margin:0">${title}</p>
        <button onclick="ScreenDashboard._closeModal()" style="background:none;border:none;width:30px;height:30px;font-size:20px;color:#A5AA94;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%">×</button>
      </div>`;
  }

  function openSleepModal() {
    const curH   = Storage.prefs.get('sleep_hours_today', '');
    const curBed = Storage.prefs.get('sleep_bedtime', '');
    const curWake = Storage.prefs.get('sleep_wakeup', '');
    showModal(`
      ${modalHeader('Registrar Sono')}
      <label class="field-label">Horas dormidas</label>
      <input class="form-input" id="sleepHrsInput" type="number" step="0.5" min="0" max="24" value="${curH}" placeholder="7.5" style="margin-bottom:14px;font-size:18px;font-weight:600;text-align:center">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:22px">
        <div>
          <label class="field-label">Dormi às</label>
          <input class="form-input" id="sleepBedInput" type="time" value="${curBed}">
        </div>
        <div>
          <label class="field-label">Acordei às</label>
          <input class="form-input" id="sleepWakeInput" type="time" value="${curWake}">
        </div>
      </div>
      <button class="mainbtn" id="saveSleepBtn" style="background:#3E6770">Salvar</button>`);
    document.getElementById('saveSleepBtn').addEventListener('click', () => {
      const h = parseFloat(document.getElementById('sleepHrsInput').value);
      const bed = document.getElementById('sleepBedInput').value;
      const wake = document.getElementById('sleepWakeInput').value;
      if (h > 0) Storage.prefs.set('sleep_hours_today', h);
      if (bed)   Storage.prefs.set('sleep_bedtime', bed);
      if (wake)  Storage.prefs.set('sleep_wakeup', wake);
      const h2 = Storage.habits.getToday(); h2.sleep = true;
      Storage.habits.setToday(h2);
      closeModal();
      showToast('Sono registrado ✓', '#6B6B8A');
      render();
    });
  }

  function openCardioModal() {
    showModal(`
      ${modalHeader('Registrar Cardio')}
      <label class="field-label">Tipo</label>
      <select class="form-input" id="cardioTypeInput" style="margin-bottom:14px">
        ${['Caminhada','Corrida','Bicicleta','Elíptico','Natação','Outro'].map(t => `<option value="${t}">${t}</option>`).join('')}
      </select>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div>
          <label class="field-label">Duração (min)</label>
          <input class="form-input" id="cardioDurInput" type="number" inputmode="numeric" placeholder="30">
        </div>
        <div>
          <label class="field-label">Distância (km)</label>
          <input class="form-input" id="cardioDistInput" type="number" step="0.1" inputmode="decimal" placeholder="—">
        </div>
      </div>
      <label class="field-label">Intensidade</label>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:22px">
        ${['Leve','Moderada','Alta'].map((v, i) => `
          <label style="text-align:center;padding:10px 0;border:1.5px solid ${i===1?'#3E6770':'#E8E0D0'};border-radius:12px;font-size:12px;font-weight:600;cursor:pointer;color:${i===1?'#3E6770':'#7A7570'}">
            <input type="radio" name="cardioInt" value="${v}" ${i===1?'checked':''} style="display:none">${v}
          </label>`).join('')}
      </div>
      <button class="mainbtn" id="saveCardioBtn" style="background:#3E6770">Salvar</button>`);
    document.querySelectorAll('input[name="cardioInt"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('input[name="cardioInt"]').forEach(x => {
          const l = x.closest('label');
          l.style.borderColor = x.checked ? '#3E6770' : '#E8E0D0';
          l.style.color = x.checked ? '#3E6770' : '#7A7570';
        });
      });
    });
    document.getElementById('saveCardioBtn').addEventListener('click', async () => {
      const dur = parseInt(document.getElementById('cardioDurInput').value);
      if (!dur) { showToast('Informe a duração', '#C9845A'); return; }
      await Storage.cardio.add({
        type: document.getElementById('cardioTypeInput').value,
        duration_min: dur,
        distance_km: parseFloat(document.getElementById('cardioDistInput').value) || null,
        intensity: document.querySelector('input[name="cardioInt"]:checked')?.value || null,
      });
      closeModal();
      showToast('Cardio registrado ✓', '#3E6770');
      render();
    });
  }

  function openWeightModal() {
    const cur = Storage.weight.getLatest();
    showModal(`
      ${modalHeader('Registrar Peso')}
      <label class="field-label">Peso atual (kg)</label>
      <input class="form-input" id="weightInput" type="number" step="0.1" inputmode="decimal" value="${cur || ''}" placeholder="72.5" style="margin-bottom:22px;font-size:22px;font-weight:700;text-align:center">
      <button class="mainbtn" id="saveWeightBtn" style="background:#3E6770">Salvar</button>`);
    document.getElementById('saveWeightBtn').addEventListener('click', () => {
      const kg = parseFloat(document.getElementById('weightInput').value);
      if (!kg) return;
      Storage.weight.addEntry(kg);
      closeModal();
      showToast('Peso registrado ✓', '#5A7A56');
      render();
    });
  }

  // ── BINDINGS DE AÇÕES ─────────────────────────────────────────
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
    const name   = Storage.prefs.get('user_name', 'Adriana');
    const today  = Utils.dateKey();
    const wDays  = Utils.lastNDays(7);
    const wStart = wDays[0], wEnd = wDays[wDays.length - 1];

    // Metas
    const strengthGoal = Storage.prefs.get('goal_strength_week', 4);
    const walkGoal     = Storage.prefs.get('goal_walk_week', 5);
    const sleepGoal    = Storage.prefs.get('goal_sleep_h', 7);
    const waterGoalMl  = Storage.prefs.get('goal_water_ml', 2500);

    // Hábitos de hoje (do cache)
    const todayHabits = Storage.habits.getToday();

    // Estimativas semanais do cache local
    const sleepDays   = (Storage.prefs.get('sleep_hours_today', 0) >= sleepGoal) ? 1 : 0;
    const proteinDays = todayHabits.protein ? 1 : 0;
    const waterDays   = todayHabits.water   ? 1 : 0;

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
    const sleepTodayH  = Storage.prefs.get('sleep_hours_today', 0);
    const latestWeight = Storage.weight.getLatest();

    // ── Header ───────────────────────────────────────────────
    // O header vive no HTML, só atualizar os textos
    const dateLine = document.getElementById('dateLine');
    const greetLine = document.getElementById('greetLine');
    if (dateLine)  dateLine.textContent  = Utils.formatDate();
    if (greetLine) greetLine.textContent = `${Utils.greeting()}, ${name}`;

    // ── Evolução da Semana ────────────────────────────────────
    const wevoEl = document.getElementById('weekEvolutionCard');
    if (wevoEl) wevoEl.innerHTML = renderWeekEvolution({
      walkDays, walkGoal, strengthDays, strengthGoal,
      proteinDays, waterDays, sleepDays,
    });

    // ── Ações de Hoje ─────────────────────────────────────────
    const actEl = document.getElementById('actionsCard');
    if (actEl) actEl.innerHTML = renderActions(
      todayHabits, todayLogs, todayCardio, plans, lastByPlan
    );

    // ── Minha Evolução ────────────────────────────────────────
    const strip = document.getElementById('evolutionStrip');
    if (strip) strip.innerHTML = renderEvolutionStrip({
      latestWeight,
      sleepAvg7d: sleepTodayH > 0 ? sleepTodayH : null,
      strengthDays,
      lastLab,
      nextConsultation: nextConsult,
    });

    // ── Nutrição ──────────────────────────────────────────────
    const nutriEl = document.getElementById('nutriSummary');
    if (nutriEl) nutriEl.innerHTML = renderNutriSummary(todayMeals);

    // ── Bindings ──────────────────────────────────────────────
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
