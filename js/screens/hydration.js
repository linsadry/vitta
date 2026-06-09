/**
 * screens/hydration.js
 * Salva água, recalcula score e atualiza hábito de água automaticamente.
 */

const ScreenHydration = (() => {
  let currentMl = 0;
  const CIRC = 2 * Math.PI * 66; // circunferência do anel (r=66)

  function getGoal() {
    return Storage.prefs.get('goal_water_ml', DefaultData.user.waterGoalMl);
  }

  function recalcScore(ml) {
    const goal     = getGoal();
    const waterPct = Utils.pct(ml, goal);
    const habits   = Storage.habits.getToday();

    // Atualizar hábito água automaticamente
    const shouldBeOn = waterPct >= 80;
    if (habits.water !== shouldBeOn) {
      habits.water = shouldBeOn;
      Storage.habits.setToday(habits);
    }

    // Recalcular e salvar score
    const score = Utils.calcScore(habits, waterPct);
    Storage.score.save(Utils.dateKey(), score);

    // Atualizar score hero no dashboard se estiver visível
    const hero = document.getElementById('scoreHero');
    if (hero && Router.current === 'hydro') {
      // será atualizado quando voltar para o dashboard
    }
  }

  function updateUI() {
    const goal = getGoal();
    const pct  = Utils.clamp(currentMl / goal, 0, 1);
    const off  = CIRC * (1 - pct);

    const ring = document.getElementById('hydroRingCircle');
    const val  = document.getElementById('hydroBigVal');
    const bar  = document.getElementById('hydroBar');
    const txt  = document.getElementById('hydroPctTxt');

    if (ring) ring.style.strokeDashoffset = off.toFixed(2);
    if (val)  val.textContent = (currentMl / 1000).toFixed(2);
    if (bar)  bar.style.width = (pct * 100).toFixed(1) + '%';
    if (txt)  txt.textContent =
      `${Math.round(pct * 100)}% · faltam ${Math.max(0, goal - currentMl)}ml`;
  }

  function addWater(ml) {
    currentMl = Math.min(currentMl + ml, 4000);
    Storage.water.saveToday(currentMl);
    recalcScore(currentMl);
    updateUI();
  }

  function render() {
    const goal = getGoal();

    // Atualizar label de meta no cabeçalho da tela
    const lbl = document.getElementById('waterGoalLabel');
    if (lbl) lbl.textContent = (goal / 1000).toFixed(1) + 'L';

    const el = document.getElementById('hydroContent');
    if (!el) return;

    el.innerHTML = `
      <!-- ANEL GRANDE -->
      <div style="display:flex;justify-content:center;margin-bottom:24px">
        <div class="cring">
          <svg width="160" height="160" viewBox="0 0 160 160"
               style="transform:rotate(-90deg)">
            <circle cx="80" cy="80" r="66"
              fill="none" stroke="#E8E0D0" stroke-width="10"/>
            <circle cx="80" cy="80" r="66"
              fill="none" stroke="#8D9298" stroke-width="10"
              stroke-dasharray="${CIRC.toFixed(2)}"
              stroke-dashoffset="${CIRC.toFixed(2)}"
              id="hydroRingCircle"
              stroke-linecap="round"
              style="transition:stroke-dashoffset .4s ease"/>
          </svg>
          <div class="cring-inner">
            <span id="hydroBigVal"
              style="font-family:'Playfair Display',serif;font-size:34px;font-weight:700;color:#2C2B28">
              0.00
            </span>
            <span style="font-size:13px;color:#7A7570">litros</span>
          </div>
        </div>
      </div>

      <!-- BARRA -->
      <div class="pbar" style="height:7px;margin-bottom:6px">
        <div class="pfill" id="hydroBar"
             style="width:0%;background:#8D9298"></div>
      </div>
      <p id="hydroPctTxt"
         style="font-size:11px;color:#7A7570;text-align:center;margin-bottom:24px">
        0% · faltam ${goal}ml
      </p>

      <!-- BOTÕES -->
      <div class="wbgrid" id="hydroBtns">
        <button class="wbtn" data-ml="250">
          <span class="wbtn-icon">💧</span>+250ml
        </button>
        <button class="wbtn" data-ml="500">
          <span class="wbtn-icon">💧</span>+500ml
        </button>
        <button class="wbtn" data-ml="750">
          <span class="wbtn-icon">💧</span>+750ml
        </button>
        <button class="wbtn" data-ml="1000">
          <span class="wbtn-icon">💧</span>+1000ml
        </button>
      </div>

      <!-- HISTÓRICO SEMANAL -->
      <div class="card">
        <p class="caps">Esta semana</p>
        <div id="waterWeekChart" style="height:64px"></div>
        <div style="display:flex;justify-content:space-between;margin-top:12px">
          <div>
            <p style="font-size:10px;color:#7A7570;margin-bottom:2px">Média</p>
            <p id="waterAvgLabel"
               style="font-size:16px;font-weight:700;color:#2C2B28">—</p>
          </div>
          <div>
            <p style="font-size:10px;color:#7A7570;margin-bottom:2px">Melhor dia</p>
            <p id="waterBestLabel"
               style="font-size:16px;font-weight:700;color:#2C2B28">—</p>
          </div>
        </div>
      </div>`;

    // Eventos dos botões
    document.getElementById('hydroBtns').addEventListener('click', e => {
      const btn = e.target.closest('[data-ml]');
      if (btn) addWater(parseInt(btn.dataset.ml, 10));
    });

    // Carregar valor salvo de hoje, depois atualizar UI
    Storage.water.getToday().then(entry => {
      currentMl = entry.ml;
      updateUI();
      recalcScore(currentMl);
    });

    // Histórico semanal
    Storage.water.getWeek().then(week => {
      const vals = week.map(d => d.ml);
      const lbls = week.map(d => Utils.dayShort(d.date));

      Charts.barChart('waterWeekChart', vals,
        { labels: lbls, color: '#8D9298', height: 64 });

      const nonZero = vals.filter(v => v > 0);
      if (nonZero.length) {
        const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
        const best = document.getElementById('waterBestLabel');
        const avgEl = document.getElementById('waterAvgLabel');
        if (avgEl)  avgEl.textContent  = `${(avg / 1000).toFixed(1)}L`;
        if (best) best.textContent = `${(Math.max(...nonZero) / 1000).toFixed(1)}L`;
      }
    });
  }

  return { render };
})();
