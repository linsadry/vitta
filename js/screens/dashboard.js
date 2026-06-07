/**
 * screens/dashboard.js — Tela inicial
 */

const ScreenDashboard = (() => {

  function renderScoreHero(score, weekScore, monthScore) {
    const pct  = score;
    const ring = Utils.progressRing(pct, 80, 7, 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.22)');

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
        <div class="score-ring-inner">${pct}%</div>
      </div>`;
  }

  function renderHabits(habits) {
    const items = [
      { key: 'sleep',   icon: habitIcon('sleep'),   label: 'Sono' },
      { key: 'water',   icon: habitIcon('water'),   label: 'Água' },
      { key: 'workout', icon: habitIcon('workout'), label: 'Treino' },
      { key: 'protein', icon: habitIcon('protein'), label: 'Proteína' },
      { key: 'meals',   icon: habitIcon('meals'),   label: 'Registro' },
    ];

    return `
      <p class="caps">Hábitos de hoje</p>
      <div class="habits">
        ${items.map(({ key, icon, label }) => {
          const on = habits[key];
          return `
            <div class="hitem" data-habit="${key}" style="cursor:pointer">
              <div class="hdot ${on ? 'hdot-on' : 'hdot-off'}">
                ${icon(on)}
              </div>
              <span class="hlbl ${on ? 'hlbl-on' : ''}">${label}</span>
            </div>`;
        }).join('')}
      </div>`;
  }

  function habitIcon(type) {
    const icons = {
      sleep:   (on) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${on ? '#F4F1EC' : '#A5AA94'}" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
      water:   (on) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${on ? '#F4F1EC' : '#A5AA94'}" stroke-width="2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`,
      workout: (on) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${on ? '#F4F1EC' : '#A5AA94'}" stroke-width="2" stroke-linecap="round"><rect x="1" y="7" width="4" height="10" rx="1"/><rect x="19" y="7" width="4" height="10" rx="1"/><line x1="5" y1="10" x2="19" y2="10"/><line x1="5" y1="14" x2="19" y2="14"/></svg>`,
      protein: (on) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${on ? '#F4F1EC' : '#A5AA94'}" stroke-width="2" stroke-linecap="round"><path d="M7 3v4a1 1 0 001 1h8a1 1 0 001-1V3M12 8v13M5 21h14"/></svg>`,
      meals:   (on) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${on ? '#F4F1EC' : '#A5AA94'}" stroke-width="2" stroke-linecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
    };
    return icons[type] || (() => '');
  }

  function renderStatsGrid(data) {
    const waterPct = Utils.pct(data.water.ml, DefaultData.user.waterGoalMl);
    const waterRing = Utils.progressRing(waterPct, 72, 6, '#8D9298', '#E8E0D0');

    return `
      <!-- ÁGUA -->
      <div class="card" style="margin-bottom:0">
        <p class="caps">Água</p>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <div class="cring">
            ${waterRing}
            <div class="cring-inner">
              <span class="cring-val">${Utils.formatL(data.water.ml)}L</span>
            </div>
          </div>
          <p style="font-size:10px;color:#7A7570">Meta: ${DefaultData.user.waterGoalMl/1000}L</p>
        </div>
      </div>

      <!-- SONO -->
      <div class="card" style="margin-bottom:0">
        <p class="caps">Sono</p>
        <p style="font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#2C2B28;margin-bottom:6px">${data.sleep.hours}h</p>
        ${Charts.sparkline(data.sleepWeek, { color: '#A5AA94' })}
        <p style="font-size:10px;color:#7A7570;margin-top:4px">${data.sleep.bedtime} → ${data.sleep.wakeup}</p>
      </div>

      <!-- PASSOS -->
      <div class="card" style="margin-bottom:0">
        <p class="caps">Passos</p>
        <p style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#2C2B28;margin-bottom:8px">${data.steps.today.toLocaleString('pt-BR')}</p>
        <div class="pbar"><div class="pfill" style="width:${Utils.pct(data.steps.today, DefaultData.user.stepsGoal)}%;background:#D4956E"></div></div>
        <p style="font-size:10px;color:#7A7570;margin-top:4px">Meta: ${DefaultData.user.stepsGoal.toLocaleString('pt-BR')}</p>
      </div>

      <!-- PESO -->
      <div class="card" style="margin-bottom:0">
        <p class="caps">Peso</p>
        <p style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#2C2B28;margin-bottom:6px">
          ${Utils.formatKg(data.weight.current)} <span style="font-size:13px;color:#7A7570">kg</span>
        </p>
        ${Charts.sparkline(data.weightHistory.map(w => w.v), { color: '#C9845A' })}
        <p style="font-size:10px;color:#7A836A;margin-top:4px">−0.8kg este mês</p>
      </div>`;
  }

  function renderNutriSummary(meals) {
    const total = meals.reduce((acc, m) => ({
      cal: acc.cal + m.cal,
      p:   acc.p   + m.p,
      c:   acc.c   + m.c,
      f:   acc.f   + m.f,
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

  function renderWeekWorkouts(workouts) {
    const lastDone = workouts.filter(w => w.done).at(-1);

    return `
      <p class="caps">Treinos da semana</p>
      <div class="wrow">
        ${workouts.map(w => `
          <div class="wcol">
            <div class="wdot ${w.done ? 'wdot-on' : 'wdot-off'}">
              ${w.done ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
            </div>
            <span class="wlbl">${w.day}</span>
          </div>`).join('')}
      </div>
      ${lastDone ? `<p style="font-size:11px;color:#7A7570;margin-top:10px">
        Último: <strong style="color:#2C2B28;font-weight:600">${lastDone.type}</strong> · hoje, 07h15
      </p>` : ''}`;
  }

  function render() {
    const d = DefaultData.demo;

    // Header
    Utils.el('dateLine').textContent = Utils.formatDate();
    Utils.el('greetLine').textContent = `${Utils.greeting()}, ${DefaultData.user.name}`;

    // Score hero
    Utils.el('scoreHero').innerHTML = renderScoreHero(
      d.score.day, d.score.week, d.score.month
    );

    // Habits
    const habitsCard = Utils.el('habitsCard');
    habitsCard.innerHTML = renderHabits(d.habits);

    // Habit toggle
    habitsCard.querySelectorAll('[data-habit]').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.habit;
        const h   = Storage.habits.toggle(key);
        habitsCard.innerHTML = renderHabits(h);
        // re-bind after re-render
        habitsCard.querySelectorAll('[data-habit]').forEach(el2 => {
          el2.addEventListener('click', () => {
            const k2 = el2.dataset.habit;
            const h2 = Storage.habits.toggle(k2);
            habitsCard.innerHTML = renderHabits(h2);
          });
        });
      });
    });

    // Stats grid
    Utils.el('statsGrid').innerHTML = renderStatsGrid({
      water:        d.water,
      sleep:        d.sleep,
      sleepWeek:    d.sleepWeek,
      steps:        d.steps,
      weight:       d.weight,
      weightHistory:d.weightHistory,
    });

    // Nutri summary
    Utils.el('nutriSummary').innerHTML = renderNutriSummary(d.meals);

    // Week workouts
    Utils.el('weekWorkouts').innerHTML = renderWeekWorkouts(d.workouts);
  }

  return { render };
})();
