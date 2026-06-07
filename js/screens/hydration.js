/**
 * screens/hydration.js — Tela de hidratação
 */

const ScreenHydration = (() => {
  let currentMl = 0;
  const GOAL    = DefaultData.user.waterGoalMl;
  const CIRC    = 2 * Math.PI * 66; // raio 66, size 160, stroke 10

  function updateRing() {
    const pct = Utils.clamp(currentMl / GOAL, 0, 1);
    const off = CIRC * (1 - pct);

    const ring = document.getElementById('hydroRingCircle');
    const val  = document.getElementById('hydroBigVal');
    const bar  = document.getElementById('hydroBar');
    const txt  = document.getElementById('hydroPctTxt');

    if (ring) ring.style.strokeDashoffset = off.toFixed(2);
    if (val)  val.textContent = (currentMl / 1000).toFixed(2);
    if (bar)  bar.style.width = (pct * 100) + '%';
    if (txt)  txt.textContent = `${Math.round(pct * 100)}% · faltam ${Math.max(0, GOAL - currentMl)}ml`;

    // salvar
    Storage.water.saveToday(currentMl);
  }

  function addWater(ml) {
    currentMl = Math.min(currentMl + ml, 4000);
    updateRing();
  }

  function render() {
    const el = document.getElementById('hydroContent');
    if (!el) return;

    el.innerHTML = `
      <!-- GRANDE ANEL -->
      <div class="water-center">
        <div class="cring">
          <svg width="160" height="160" viewBox="0 0 160 160" style="transform:rotate(-90deg)">
            <circle cx="80" cy="80" r="66" fill="none" stroke="#E8E0D0" stroke-width="10"/>
            <circle cx="80" cy="80" r="66" fill="none" stroke="#8D9298" stroke-width="10"
              stroke-dasharray="${CIRC.toFixed(2)}" id="hydroRingCircle"
              stroke-dashoffset="${(CIRC * 0.3).toFixed(2)}"
              stroke-linecap="round" style="transition:stroke-dashoffset .5s ease"/>
          </svg>
          <div class="cring-inner">
            <span style="font-family:'Playfair Display',serif;font-size:34px;font-weight:700;color:#2C2B28"
              id="hydroBigVal">0.00</span>
            <span style="font-size:13px;color:#7A7570">litros</span>
          </div>
        </div>
      </div>

      <!-- BARRA -->
      <div class="pbar" style="height:7px;margin-bottom:6px">
        <div class="pfill" id="hydroBar" style="width:0%;background:#8D9298"></div>
      </div>
      <p id="hydroPctTxt" style="font-size:11px;color:#7A7570;text-align:center;margin-bottom:24px">
        0% · faltam ${GOAL}ml
      </p>

      <!-- BOTÕES -->
      <div class="wbgrid" id="hydroBtns">
        <button class="wbtn" data-ml="250"><span class="wbtn-icon">💧</span>+250ml</button>
        <button class="wbtn" data-ml="500"><span class="wbtn-icon">💧</span>+500ml</button>
        <button class="wbtn" data-ml="750"><span class="wbtn-icon">💧</span>+750ml</button>
        <button class="wbtn" data-ml="1000"><span class="wbtn-icon">💧</span>+1000ml</button>
      </div>

      <!-- HISTÓRICO SEMANAL -->
      <div class="card">
        <p class="caps">Esta semana</p>
        <div id="waterWeekChart" style="height:64px"></div>
        <div style="display:flex;justify-content:space-between;margin-top:12px">
          <div>
            <p style="font-size:10px;color:#7A7570;margin-bottom:2px">Média</p>
            <p style="font-size:16px;font-weight:700;color:#2C2B28" id="waterAvgLabel">—</p>
          </div>
          <div>
            <p style="font-size:10px;color:#7A7570;margin-bottom:2px">Melhor</p>
            <p style="font-size:16px;font-weight:700;color:#2C2B28" id="waterBestLabel">—</p>
          </div>
        </div>
      </div>`;

    // Eventos dos botões
    document.getElementById('hydroBtns').addEventListener('click', e => {
      const btn = e.target.closest('[data-ml]');
      if (btn) addWater(parseInt(btn.dataset.ml));
    });

    // Carregar dados salvos
    Storage.water.getToday().then(entry => {
      currentMl = entry.ml;
      updateRing();
    });

    // Histórico semanal
    Storage.water.getWeek().then(week => {
      const vals  = week.map(d => d.ml);
      const lbls  = week.map(d => Utils.dayShort(d.date));

      // Fallback demo
      const display = vals.every(v => v === 0)
        ? DefaultData.demo.waterWeek
        : vals;

      Charts.barChart('waterWeekChart', display, { labels: lbls, color: '#8D9298', height: 64 });

      const nonZero = display.filter(v => v > 0);
      if (nonZero.length) {
        const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
        document.getElementById('waterAvgLabel').textContent = `${(avg/1000).toFixed(1)}L`;
        document.getElementById('waterBestLabel').textContent = `${(Math.max(...nonZero)/1000).toFixed(1)}L`;
      }
    });
  }

  return { render };
})();
