/**
 * screens/hydration.js — Hidratação com recálculo de score
 */

const ScreenHydration = (() => {
  let currentMl = 0;

  function getGoal() {
    return Storage.prefs.get('goal_water_ml', DefaultData.user.waterGoalMl);
  }

  function getCircumference() {
    return 2 * Math.PI * 66; // raio 66px
  }

  function updateRing() {
    const goal = getGoal();
    const circ = getCircumference();
    const pct  = Utils.clamp(currentMl / goal, 0, 1);
    const off  = circ * (1 - pct);

    const ring = document.getElementById('hydroRingCircle');
    const val  = document.getElementById('hydroBigVal');
    const bar  = document.getElementById('hydroBar');
    const txt  = document.getElementById('hydroPctTxt');
    const lbl  = document.getElementById('waterGoalLabel');

    if (ring) ring.style.strokeDashoffset = off.toFixed(2);
    if (val)  val.textContent  = (currentMl / 1000).toFixed(2);
    if (bar)  bar.style.width  = (pct * 100) + '%';
    if (txt)  txt.textContent  = `${Math.round(pct * 100)}% · faltam ${Math.max(0, goal - currentMl)}ml`;
    if (lbl)  lbl.textContent  = (goal / 1000).toFixed(1) + 'L';

    // Salvar e recalcular score
    Storage.water.saveToday(currentMl).then(() => {
      const habits   = Storage.habits.getToday();
      const waterPct = Utils.pct(currentMl, goal);

      // Marcar hábito de água automaticamente se >= 80%
      if (waterPct >= 80 && !habits.water) {
        habits.water = true;
        Storage.habits.setToday(habits);
      } else if (waterPct < 80 && habits.water) {
        habits.water = false;
        Storage.habits.setToday(habits);
      }

      const score = Utils.calcScore(habits, waterPct);
      Storage.score.save(Utils.dateKey(), score);
    });
  }

  function addWater(ml) {
    currentMl = Math.min(currentMl + ml, 4000);
    updateRing();
  }

  function render() {
    const goal = getGoal();
    const circ = getCircumference();

    // Atualizar label da meta no cabeçalho
    const lbl = document.getElementById('waterGoalLabel');
    if (lbl) lbl.textContent = (goal / 1000).toFixed(1) + 'L';

    const el = document.getElementById('hydroContent');
    if (!el) return;

    el.innerHTML = `
      <div class="water-center">
        <div class="cring">
          <svg width="160" height="160" viewBox="0 0 160 160" style="transform:rotate(-90deg)">
            <circle cx="80" cy="80" r="66" fill="none" stroke="#E8E0D0" stroke-width="10"/>
            <circle cx="80" cy="80" r="66" fill="none" stroke="#8D9298" stroke-width="10"
              stroke-dasharray="${circ.toFixed(2)}" id="hydroRingCircle"
              stroke-dashoffset="${circ.toFixed(2)}"
              stroke-linecap="round" style="transition:stroke-dashoffset .5s ease"/>
          </svg>
          <div class="cring-inner">
            <span style="font-family:'Playfair Display',serif;font-size:34px;font-weight:700;color:#2C2B28"
              id="hydroBigVal">0.00</span>
            <span style="font-size:13px;color:#7A7570">litros</span>
          </div>
        </div>
      </div>

      <div class="pbar" style="height:7px;margin-bottom:6px">
        <div class="pfill" id="hydroBar" style="width:0%;background:#8D9298"></div>
      </div>
      <p id="hydroPctTxt" style="font-size:11px;color:#7A7570;text-align:center;margin-bottom:24px">
        0% · faltam ${goal}ml
      </p>

      <div class="wbgrid" id="hydroBtns">
        <button class="wbtn" data-ml="250"><span class="wbtn-icon">💧</span>+250ml</button>
        <button class="wbtn" data-ml="500"><span class="wbtn-icon">💧</span>+500ml</button>
        <button class="wbtn" data-ml="750"><span class="wbtn-icon">💧</span>+750ml</button>
        <button class="wbtn" data-ml="1000"><span class="wbtn-icon">💧</span>+1000ml</button>
      </div>

      <div class="card">
        <p class="caps">Esta semana</p>
        <div id="waterWeekChart" style="height:64px"></div>
        <div style="display:flex;justify-content:space-between;margin-top:12px">
          <div>
            <p style="font-size:10px;color:#7A7570;margin-bottom:2px">Média</p>
            <p style="font-size:16px;font-weight:700;color:#2C2B28" id="waterAvgLabel">—</p>
          </div>
          <div>
            <p style="font-size:10px;color:#7A7570;margin-bottom:2px">Melhor dia</p>
            <p style="font-size:16px;font-weight:700;color:#2C2B28" id="waterBestLabel">—</p>
          </div>
        </div>
      </div>`;

    // Eventos
    document.getElementById('hydroBtns').addEventListener('click', e => {
      const btn = e.target.closest('[data-ml]');
      if (btn) addWater(parseInt(btn.dataset.ml));
    });

    // Carregar valor de hoje
    Storage.water.getToday().then(entry => {
      currentMl = entry.ml;
      updateRing();
    });

    // Histórico semanal
    Storage.water.getWeek().then(week => {
      const vals = week.map(d => d.ml);
      const lbls = week.map(d => Utils.dayShort(d.date));
      Charts.barChart('waterWeekChart', vals, { labels: lbls, color: '#8D9298', height: 64 });
      const nonZero = vals.filter(v => v > 0);
      if (nonZero.length) {
        const avg = nonZero.reduce((a,b) => a+b, 0) / nonZero.length;
        document.getElementById('waterAvgLabel').textContent  = `${(avg/1000).toFixed(1)}L`;
        document.getElementById('waterBestLabel').textContent = `${(Math.max(...nonZero)/1000).toFixed(1)}L`;
      }
    });
  }

  return { render };
})();
