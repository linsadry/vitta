/**
 * screens/nutrition.js
 */
const ScreenNutrition = (() => {
  let aiState = 'initial'; // initial | loading | result

  function renderMealItem(m) {
    return `
      <div class="mitem">
        <div>
          <p class="mname">${m.name}</p>
          <p class="msub">${m.time} · ${m.foods.join(', ')}</p>
          <div class="mmacros">
            <span style="color:#C9845A">P ${m.p}g</span>
            <span style="color:#7A7570">C ${m.c}g</span>
            <span style="color:#7A7570">G ${m.f}g</span>
          </div>
        </div>
        <div>
          <p class="mkcal">${m.cal}</p>
          <p class="munit">kcal</p>
        </div>
      </div>`;
  }

  function renderAIBox() {
    if (aiState === 'initial') return `
      <button class="mainbtn" id="aiAnalyzeBtn" style="background:#7A836A">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Analisar foto com IA
      </button>`;

    if (aiState === 'loading') return `
      <div style="text-align:center;padding:20px 0">
        <div class="spinner"></div>
        <p style="font-size:13px;color:#7A7570">Identificando alimentos...</p>
      </div>`;

    return `
      <div class="aibox">
        <p class="aititle">Identificado: Jantar</p>
        <p class="aifoods">🍗 Frango grelhado (150g) · 🥦 Brócolis · 🍚 Arroz integral (100g)</p>
        <div class="aimacros">
          <span>~520 kcal</span><span>·</span>
          <span>P: 42g</span><span>·</span>
          <span>C: 38g</span><span>·</span>
          <span>G: 12g</span>
        </div>
      </div>
      <div class="aibrow">
        <button class="btn-ok"  id="aiConfirmBtn">Confirmar</button>
        <button class="btn-adj" id="aiAdjustBtn">Ajustar</button>
      </div>`;
  }

  function bindAI() {
    const analyzeBtn = document.getElementById('aiAnalyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        aiState = 'loading';
        renderFull();
        setTimeout(() => { aiState = 'result'; renderFull(); }, 2200);
      });
    }
    const confirmBtn = document.getElementById('aiConfirmBtn');
    const adjustBtn  = document.getElementById('aiAdjustBtn');
    if (confirmBtn) confirmBtn.addEventListener('click', () => { aiState = 'initial'; renderFull(); });
    if (adjustBtn)  adjustBtn.addEventListener('click',  () => { aiState = 'initial'; renderFull(); });
  }

  function renderFull() {
    const today = DefaultData.demo.meals;
    const total = today.reduce((a, m) => ({
      cal: a.cal + m.cal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f
    }), { cal: 0, p: 0, c: 0, f: 0 });

    document.getElementById('nutriDate').textContent = Utils.formatDate();

    document.getElementById('nutriContent').innerHTML = `
      <!-- MACRO HERO -->
      <div class="nhero">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
          <div>
            <p class="caps" style="margin-bottom:4px">Total do dia</p>
            <p class="nkcal">${total.cal}<span> kcal</span></p>
          </div>
          <div style="text-align:right">
            <p style="font-size:11px;color:#7A7570;margin-bottom:3px">Meta: ${DefaultData.user.kcalGoal} kcal</p>
            <p style="font-size:13px;color:#7A836A;font-weight:600">Dentro do alvo ✓</p>
          </div>
        </div>
        <div style="display:flex;gap:10px">
          <div style="flex:1;background:#FAF8F4;border-radius:10px;padding:10px 12px">
            <p style="font-size:10px;color:#7A7570;margin-bottom:3px">Proteína</p>
            <p style="font-size:17px;font-family:'Playfair Display',serif;font-weight:700;color:#C9845A">${total.p}g</p>
          </div>
          <div style="flex:1;background:#FAF8F4;border-radius:10px;padding:10px 12px">
            <p style="font-size:10px;color:#7A7570;margin-bottom:3px">Carbos</p>
            <p style="font-size:17px;font-family:'Playfair Display',serif;font-weight:700;color:#7A836A">${total.c}g</p>
          </div>
          <div style="flex:1;background:#FAF8F4;border-radius:10px;padding:10px 12px">
            <p style="font-size:10px;color:#7A7570;margin-bottom:3px">Gordura</p>
            <p style="font-size:17px;font-family:'Playfair Display',serif;font-weight:700;color:#D4956E">${total.f}g</p>
          </div>
        </div>
      </div>

      <!-- AI ANÁLISE -->
      <div class="card" style="margin-bottom:18px">
        <p class="caps">✦ Análise por IA · Privada e local</p>
        <div id="aiAnalysisBox">${renderAIBox()}</div>
      </div>

      <!-- REFEIÇÕES -->
      <p class="caps">Refeições registradas</p>
      ${today.map(renderMealItem).join('')}`;

    bindAI();
  }

  function render() { renderFull(); }
  return { render };
})();


/**
 * screens/workout.js
 */
const ScreenWorkout = (() => {
  let activeTab = 'musc';

  const TABS = [
    { id: 'musc', label: '🏋️ Musculação' },
    { id: 'corr', label: '🏃 Corrida' },
    { id: 'yoga', label: '🧘 Yoga' },
    { id: 'outr', label: '✦ Outros' },
  ];

  function renderTabs() {
    return `
      <div class="tabs" id="workTabs">
        ${TABS.map(t => `
          <button class="chip ${t.id === activeTab ? 'chip-on' : 'chip-off'}"
            data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>`;
  }

  function renderMusc() {
    const d = DefaultData.demo.todayWorkout;
    return `
      <div id="tab-musc" class="tab-content on">
        <div class="card" style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <p style="font-size:13px;font-weight:600;color:#2C2B28">Treino de Hoje — ${d.name}</p>
            <span style="font-size:11px;color:#7A7570">${d.time}</span>
          </div>
          ${d.exercises.map(e => `
            <div class="exrow">
              <span class="exname">${e.name}</span>
              <div class="extags">
                <span class="etag">${e.sets}×${e.reps}</span>
                <span class="etag">${e.load}</span>
              </div>
            </div>`).join('')}
        </div>
        <button class="mainbtn" style="background:#C9845A">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo exercício
        </button>
      </div>`;
  }

  function renderCorr() {
    const r = DefaultData.demo.lastRun;
    return `
      <div id="tab-corr" class="tab-content">
        <div class="card">
          <p style="font-size:12px;color:#7A7570;margin-bottom:14px">Última corrida · HealthKit</p>
          <div class="g2" style="margin:0">
            <div class="smini"><p class="sml">Distância</p><p class="smv">${r.distance}</p></div>
            <div class="smini"><p class="sml">Tempo</p><p class="smv">${r.time}</p></div>
            <div class="smini"><p class="sml">Ritmo</p><p class="smv">${r.pace}</p></div>
            <div class="smini"><p class="sml">FC média</p><p class="smv">${r.hr}</p></div>
          </div>
        </div>
      </div>`;
  }

  function renderEmpty(emoji, id) {
    return `
      <div id="tab-${id}" class="tab-content">
        <div class="empty">
          <div class="eico">${emoji}</div>
          <p class="etxt">Nenhum registro ainda</p>
          <button class="mainbtn" style="background:#7A836A;max-width:160px;margin:0 auto">+ Registrar</button>
        </div>
      </div>`;
  }

  function switchTab(id) {
    activeTab = id;
    document.querySelectorAll('#workTabs .chip').forEach(b => {
      b.className = `chip ${b.dataset.tab === id ? 'chip-on' : 'chip-off'}`;
    });
    document.querySelectorAll('.tab-content').forEach(el => {
      el.classList.toggle('on', el.id === `tab-${id}`);
    });
  }

  function render() {
    const d = DefaultData.demo;
    const weekDone = d.workouts.filter(w => w.done).length;
    document.getElementById('workSub').textContent = `${weekDone} treino${weekDone !== 1 ? 's' : ''} esta semana`;

    document.getElementById('workContent').innerHTML =
      renderTabs() + renderMusc() + renderCorr() + renderEmpty('🧘', 'yoga') + renderEmpty('✦', 'outr');

    document.getElementById('workTabs').addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (btn) switchTab(btn.dataset.tab);
    });
  }

  return { render };
})();


/**
 * screens/progress.js
 */
const ScreenProgress = (() => {
  function render() {
    const d = DefaultData.demo;

    document.getElementById('progContent').innerHTML = `
      <!-- PESO -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Peso</p>
        <p style="font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#2C2B28;margin-bottom:14px">
          ${Utils.formatKg(d.weight.current)} kg
          <span style="font-size:13px;color:#7A836A">−1.8 desde Jan</span>
        </p>
        <div id="weightChartProg" style="height:72px"></div>
      </div>

      <!-- SCORE TRIO -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Score de Consistência</p>
        <div class="strio">
          <div class="strioi"><p class="striol">Hoje</p><p class="striov" style="color:#C9845A">${d.score.day}</p></div>
          <div class="strioi"><p class="striol">Semana</p><p class="striov" style="color:#7A836A">${d.score.week}</p></div>
          <div class="strioi"><p class="striol">Mês</p><p class="striov" style="color:#A5AA94">${d.score.month}</p></div>
        </div>
      </div>

      <!-- MEDIDAS -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Medidas</p>
        ${[
          ['Cintura',  d.measurements.waist,   -2],
          ['Quadril',  d.measurements.hip,     -1],
          ['Abdômen',  d.measurements.abdomen, -3],
          ['Braço',    d.measurements.arm,     +0.5],
          ['Coxa',     d.measurements.thigh,   -1],
        ].map(([n, v, delta]) => `
          <div class="measrow">
            <span class="measname">${n}</span>
            <div class="measright">
              <span class="measdelta ${delta < 0 ? 'delta-neg' : 'delta-pos'}">${delta > 0 ? '+' : ''}${delta}cm</span>
              <span class="measval">${v}cm</span>
            </div>
          </div>`).join('')}
      </div>

      <!-- FOTOS -->
      <div class="card">
        <p class="caps">Fotos de Progresso · ${Utils.formatMonth()}</p>
        <div class="pslots">
          ${['Frente','Lado','Costas'].map(l => `
            <div class="pslot">
              <div class="pbox">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A5AA94" stroke-width="1.5" stroke-linecap="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <span class="pbox-lbl">${l}</span>
            </div>`).join('')}
        </div>
        <p style="font-size:11px;color:#7A7570;text-align:center;margin-top:10px">
          Armazenadas no dispositivo · nunca enviadas
        </p>
      </div>`;

    Charts.barChart('weightChartProg',
      d.weightHistory.map(w => w.v),
      { labels: d.weightHistory.map(w => w.m), color: '#C9845A', height: 72 }
    );
  }

  return { render };
})();
