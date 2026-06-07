/**
 * screens/dashboard.js — Tela inicial
 * Lê 100% do Storage. Sem dados de demonstração.
 */

const ScreenDashboard = (() => {

  // ── HELPERS DE RENDERIZAÇÃO ─────────────────────────────────

  function renderScoreHero(score, weekScore, monthScore) {
    const ring = Utils.progressRing(score, 80, 7, 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.22)');
    return `
      <div style="flex:1">
        <p class="score-hero-lbl">Score de Consistência</p>
        <div style="display:flex;align-items:baseline">
          <span class="score-hero-num">${score}</span>
          <span class="score-hero-unit">/100</span>
        </div>
        <p class="score-hero-foot">Semana: ${weekScore} &nbsp;·&nbsp; Mês: ${monthScore}</p>
      </div>
      <div class="score-ring-wrap">
        ${ring}
        <div class="score-ring-inner">${score}%</div>
      </div>`;
  }

  function habitIcon(type, on) {
    const c = on ? '#F4F1EC' : '#A5AA94';
    const icons = {
      sleep:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
      water:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`,
      workout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><rect x="1" y="7" width="4" height="10" rx="1"/><rect x="19" y="7" width="4" height="10" rx="1"/><line x1="5" y1="10" x2="19" y2="10"/><line x1="5" y1="14" x2="19" y2="14"/></svg>`,
      protein: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M7 3v4a1 1 0 001 1h8a1 1 0 001-1V3M12 8v13M5 21h14"/></svg>`,
      meals:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
    };
    return icons[type] || '';
  }

  function renderHabits(habits) {
    const items = [
      { key: 'sleep',   label: 'Sono' },
      { key: 'water',   label: 'Água' },
      { key: 'workout', label: 'Treino' },
      { key: 'protein', label: 'Proteína' },
      { key: 'meals',   label: 'Registro' },
    ];
    return `
      <p class="caps">Hábitos de hoje</p>
      <div class="habits">
        ${items.map(({ key, label }) => {
          const on = !!habits[key];
          return `
            <div class="hitem" data-habit="${key}" style="cursor:pointer">
              <div class="hdot ${on ? 'hdot-on' : 'hdot-off'}">${habitIcon(key, on)}</div>
              <span class="hlbl ${on ? 'hlbl-on' : ''}">${label}</span>
            </div>`;
        }).join('')}
      </div>`;
  }

  function bindHabits(habitsCard) {
    habitsCard.querySelectorAll('[data-habit]').forEach(el => {
      el.addEventListener('click', () => {
        const h = Storage.habits.toggle(el.dataset.habit);
        habitsCard.innerHTML = renderHabits(h);
        bindHabits(habitsCard);
        // Recalcular score
        Storage.water.getToday().then(w => {
          const waterPct = Utils.pct(w.ml, DefaultData.user.waterGoalMl);
          const score    = Utils.calcScore(h, waterPct);
          Storage.score.save(Utils.dateKey(), score);
          Utils.el('scoreHero').innerHTML = renderScoreHero(score, score, score);
        });
      });
    });
  }

  function renderWaterCard(ml) {
    const pct  = Utils.pct(ml, DefaultData.user.waterGoalMl);
    const ring = Utils.progressRing(pct, 72, 6, '#8D9298', '#E8E0D0');
    return `
      <div class="card" style="margin-bottom:0">
        <p class="caps">Água</p>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <div class="cring">
            ${ring}
            <div class="cring-inner">
              <span class="cring-val">${Utils.formatL(ml)}L</span>
            </div>
          </div>
          <p style="font-size:10px;color:#7A7570">Meta: ${DefaultData.user.waterGoalMl/1000}L</p>
        </div>
      </div>`;
  }

  function renderWeightCard(weightHistory) {
    const latest = weightHistory.length ? weightHistory[weightHistory.length - 1].kg : null;
    const first  = weightHistory.length > 1 ? weightHistory[0].kg : null;
    const delta  = (latest && first) ? (latest - first).toFixed(1) : null;
    const vals   = weightHistory.map(w => w.kg);

    if (!latest) {
      return `
        <div class="card" style="margin-bottom:0">
          <p class="caps">Peso</p>
          <p style="font-size:13px;color:#7A7570;margin-top:8px">Nenhum registro</p>
          <p style="font-size:11px;color:#A5AA94;margin-top:4px">Use o botão + para registrar</p>
        </div>`;
    }

    const deltaStr = delta
      ? `<p style="font-size:10px;color:${parseFloat(delta) <= 0 ? '#7A836A' : '#C9845A'};margin-top:4px">${parseFloat(delta) > 0 ? '+' : ''}${delta}kg desde o início</p>`
      : '';

    return `
      <div class="card" style="margin-bottom:0">
        <p class="caps">Peso</p>
        <p style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#2C2B28;margin-bottom:6px">
          ${Utils.formatKg(latest)} <span style="font-size:13px;color:#7A7570">kg</span>
        </p>
        ${vals.length > 1 ? Charts.sparkline(vals, { color: '#C9845A' }) : ''}
        ${deltaStr}
      </div>`;
  }

  function renderNutriSummary(meals) {
    if (!meals.length) {
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <p class="caps" style="margin:0">Nutrição hoje</p>
          <span style="font-size:11px;color:#A5AA94">0 kcal</span>
        </div>
        <p style="font-size:13px;color:#7A7570;text-align:center;padding:8px 0">
          Nenhuma refeição registrada hoje
        </p>`;
    }

    const total = meals.reduce((acc, m) => ({
      cal: acc.cal + (m.cal||0), p: acc.p + (m.p||0),
      c:   acc.c   + (m.c||0),  f: acc.f + (m.f||0),
    }), { cal: 0, p: 0, c: 0, f: 0 });

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <p class="caps" style="margin:0">Nutrição hoje</p>
        <span style="font-size:11px;color:#C9845A;font-weight:600">${total.cal} kcal</span>
      </div>
      <div class="macrow">
        <div class="macitem">
          <div class="pbar" style="margin-bottom:6px">
            <div class="pfill" style="width:${Utils.pct(total.p, DefaultData.user.proteinGoalG)}%;background:#C9845A"></div>
          </div>
          <p class="macval" style="color:#C9845A">${total.p}g</p>
          <p class="macname">Proteína</p>
        </div>
        <div class="macitem">
          <div class="pbar" style="margin-bottom:6px">
            <div class="pfill" style="width:${Utils.pct(total.c, 180)}%;background:#7A836A"></div>
          </div>
          <p class="macval" style="color:#7A836A">${total.c}g</p>
          <p class="macname">Carbos</p>
        </div>
        <div class="macitem">
          <div class="pbar" style="margin-bottom:6px">
            <div class="pfill" style="width:${Utils.pct(total.f, 80)}%;background:#D4956E"></div>
          </div>
          <p class="macval" style="color:#D4956E">${total.f}g</p>
          <p class="macname">Gordura</p>
        </div>
      </div>`;
  }

  function renderWeekWorkouts(weekData) {
    const DN = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const last = weekData.filter(d => d.workouts.length > 0).at(-1);

    return `
      <p class="caps">Treinos da semana</p>
      <div class="wrow">
        ${weekData.map(d => {
          const done = d.workouts.length > 0;
          const day  = new Date(d.date + 'T12:00:00');
          return `
            <div class="wcol">
              <div class="wdot ${done ? 'wdot-on' : 'wdot-off'}">
                ${done ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
              </div>
              <span class="wlbl">${DN[day.getDay()]}</span>
            </div>`;
        }).join('')}
      </div>
      ${last ? `<p style="font-size:11px;color:#7A7570;margin-top:10px">
        Último: <strong style="color:#2C2B28;font-weight:600">${last.workouts[0]?.type || 'Treino'}</strong>
      </p>` : '<p style="font-size:11px;color:#A5AA94;margin-top:10px">Nenhum treino registrado esta semana</p>'}`;
  }

  // ── RENDER PRINCIPAL (async) ────────────────────────────────

  async function render() {
    // Header
    Utils.el('dateLine').textContent  = Utils.formatDate();
    Utils.el('greetLine').textContent = `${Utils.greeting()}, ${DefaultData.user.name}`;

    // Carregar todos os dados em paralelo
    const [waterEntry, habits, weightHistory, meals, weekWorkouts] = await Promise.all([
      Storage.water.getToday(),
      Promise.resolve(Storage.habits.getToday()),
      Promise.resolve(Storage.weight.getHistory()),
      Storage.meals.getByDate(Utils.dateKey()),
      Storage.workouts.getWeek(),
    ]);

    const waterPct   = Utils.pct(waterEntry.ml, DefaultData.user.waterGoalMl);
    const todayScore = Utils.calcScore(habits, waterPct);
    const weekScores = Storage.score.getWeek().map(d => d.score).filter(Boolean);
    const weekAvg    = weekScores.length ? Math.round(weekScores.reduce((a,b)=>a+b,0)/weekScores.length) : todayScore;

    Storage.score.save(Utils.dateKey(), todayScore);

    // Score hero
    Utils.el('scoreHero').innerHTML = renderScoreHero(todayScore, weekAvg, weekAvg);

    // Habits
    const habitsCard = Utils.el('habitsCard');
    habitsCard.innerHTML = renderHabits(habits);
    bindHabits(habitsCard);

    // Stats grid (água + sono + passos + peso)
    Utils.el('statsGrid').innerHTML = `
      ${renderWaterCard(waterEntry.ml)}

      <div class="card" style="margin-bottom:0">
        <p class="caps">Sono</p>
        <p style="font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#2C2B28;margin-bottom:6px">
          ${Storage.prefs.get('sleep_hours_today', '—')}h
        </p>
        <p style="font-size:10px;color:#7A7570">
          ${Storage.prefs.get('sleep_bedtime', '') || 'Registre via Health'}
          ${Storage.prefs.get('sleep_wakeup',  '') ? ' → ' + Storage.prefs.get('sleep_wakeup', '') : ''}
        </p>
      </div>

      <div class="card" style="margin-bottom:0">
        <p class="caps">Passos</p>
        <p style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#2C2B28;margin-bottom:8px">
          ${(Storage.prefs.get('steps_today', 0)).toLocaleString('pt-BR')}
        </p>
        <div class="pbar">
          <div class="pfill" style="width:${Utils.pct(Storage.prefs.get('steps_today', 0), DefaultData.user.stepsGoal)}%;background:#D4956E"></div>
        </div>
        <p style="font-size:10px;color:#7A7570;margin-top:4px">Meta: ${DefaultData.user.stepsGoal.toLocaleString('pt-BR')}</p>
      </div>

      ${renderWeightCard(weightHistory)}`;

    // Nutrição
    Utils.el('nutriSummary').innerHTML = renderNutriSummary(meals);

    // Treinos da semana
    Utils.el('weekWorkouts').innerHTML = renderWeekWorkouts(weekWorkouts);
  }

  return { render };
})();
