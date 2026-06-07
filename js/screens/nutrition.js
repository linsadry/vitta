/**
 * screens/nutrition.js — Lê do Storage real
 */
const ScreenNutrition = (() => {
  let aiState = 'initial';

  function renderMealItem(m) {
    const foods = Array.isArray(m.foods) ? m.foods.join(', ') : (m.foods || '');
    return `
      <div class="mitem">
        <div style="flex:1;min-width:0">
          <p class="mname">${m.name}</p>
          <p class="msub">${m.time || ''} ${foods ? '· ' + foods : ''}</p>
          <div class="mmacros">
            <span style="color:#C9845A">P ${m.p||0}g</span>
            <span style="color:#7A7570">C ${m.c||0}g</span>
            <span style="color:#7A7570">G ${m.f||0}g</span>
          </div>
        </div>
        <div style="flex-shrink:0;text-align:right;margin-left:12px">
          <p class="mkcal">${m.cal||0}</p>
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
        <p class="aititle">Identificado — confirme os dados</p>
        <p class="aifoods">🍗 Frango grelhado (150g) · 🥦 Brócolis · 🍚 Arroz integral (100g)</p>
        <div class="aimacros">
          <span>~520 kcal</span><span>·</span><span>P: 42g</span><span>·</span><span>C: 38g</span><span>·</span><span>G: 12g</span>
        </div>
      </div>
      <div class="aibrow">
        <button class="btn-ok"  id="aiConfirmBtn">Confirmar e salvar</button>
        <button class="btn-adj" id="aiAdjustBtn">Ajustar</button>
      </div>`;
  }

  function bindAI() {
    const analyzeBtn = document.getElementById('aiAnalyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        aiState = 'loading';
        document.getElementById('aiAnalysisBox').innerHTML = renderAIBox();
        setTimeout(() => {
          aiState = 'result';
          document.getElementById('aiAnalysisBox').innerHTML = renderAIBox();
          bindAI();
        }, 2200);
      });
    }
    const confirmBtn = document.getElementById('aiConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        // Salvar refeição identificada pela IA
        await Storage.meals.add({
          name: 'Jantar', time: new Date().toTimeString().slice(0,5),
          cal: 520, p: 42, c: 38, f: 12,
          foods: ['Frango grelhado', 'Brócolis', 'Arroz integral'],
        });
        aiState = 'initial';
        render(); // recarregar tela
      });
    }
    const adjustBtn = document.getElementById('aiAdjustBtn');
    if (adjustBtn) adjustBtn.addEventListener('click', () => {
      aiState = 'initial';
      document.getElementById('aiAnalysisBox').innerHTML = renderAIBox();
      bindAI();
    });
  }

  function renderAddForm() {
    return `
      <div class="card" id="addMealForm" style="margin-bottom:18px;display:none">
        <p class="caps">Nova refeição</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <input class="form-input" id="mealName"  placeholder="Nome (ex: Almoço)" maxlength="40">
          <input class="form-input" id="mealFoods" placeholder="Alimentos (ex: Frango, Arroz)" maxlength="100">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <input class="form-input" id="mealCal"  placeholder="kcal" type="number" min="0" max="5000">
            <input class="form-input" id="mealP"    placeholder="Prot (g)" type="number" min="0" max="500">
            <input class="form-input" id="mealC"    placeholder="Carbs (g)" type="number" min="0" max="500">
            <input class="form-input" id="mealF"    placeholder="Gordura (g)" type="number" min="0" max="500">
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-ok" id="saveMealBtn">Salvar</button>
            <button class="btn-adj" id="cancelMealBtn">Cancelar</button>
          </div>
        </div>
      </div>`;
  }

  async function render() {
    document.getElementById('nutriDate').textContent = Utils.formatDate();

    const today = await Storage.meals.getByDate(Utils.dateKey());
    const total = today.reduce((acc, m) => ({
      cal: acc.cal+(m.cal||0), p: acc.p+(m.p||0), c: acc.c+(m.c||0), f: acc.f+(m.f||0),
    }), { cal:0, p:0, c:0, f:0 });

    const kcalPct = Utils.pct(total.cal, DefaultData.user.kcalGoal);
    const status  = kcalPct > 110
      ? '<span style="color:#C9845A">Acima da meta</span>'
      : kcalPct >= 80
        ? '<span style="color:#7A836A">Dentro do alvo ✓</span>'
        : '<span style="color:#8D9298">Abaixo da meta</span>';

    document.getElementById('nutriContent').innerHTML = `
      <div class="nhero">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
          <div>
            <p class="caps" style="margin-bottom:4px">Total do dia</p>
            <p class="nkcal">${total.cal}<span> kcal</span></p>
          </div>
          <div style="text-align:right">
            <p style="font-size:11px;color:#7A7570;margin-bottom:3px">Meta: ${DefaultData.user.kcalGoal} kcal</p>
            <p style="font-size:13px;font-weight:600">${status}</p>
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

      <div class="card" style="margin-bottom:18px">
        <p class="caps">✦ Análise por IA · Privada e local</p>
        <div id="aiAnalysisBox">${renderAIBox()}</div>
      </div>

      ${renderAddForm()}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <p class="caps" style="margin:0">Refeições registradas</p>
        <button id="showAddMealBtn" style="background:none;border:none;font-size:12px;color:#7A836A;font-weight:600;cursor:pointer">+ Adicionar</button>
      </div>

      ${today.length
        ? today.map(renderMealItem).join('')
        : `<div style="text-align:center;padding:24px 0;color:#A5AA94;font-size:13px">
             Nenhuma refeição registrada hoje.<br>
             <span style="font-size:11px">Use "+ Adicionar" ou a análise por IA.</span>
           </div>`}`;

    bindAI();

    // Botão mostrar form
    document.getElementById('showAddMealBtn').addEventListener('click', () => {
      const form = document.getElementById('addMealForm');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    // Salvar refeição manual
    document.getElementById('saveMealBtn').addEventListener('click', async () => {
      const name  = document.getElementById('mealName').value.trim();
      const foods = document.getElementById('mealFoods').value.trim();
      const cal   = parseInt(document.getElementById('mealCal').value)  || 0;
      const p     = parseInt(document.getElementById('mealP').value)    || 0;
      const c     = parseInt(document.getElementById('mealC').value)    || 0;
      const f     = parseInt(document.getElementById('mealF').value)    || 0;
      if (!name) return;
      await Storage.meals.add({
        name, foods: foods ? foods.split(',').map(s=>s.trim()) : [],
        cal, p, c, f,
        time: new Date().toTimeString().slice(0, 5),
      });
      render();
    });

    document.getElementById('cancelMealBtn').addEventListener('click', () => {
      document.getElementById('addMealForm').style.display = 'none';
    });
  }

  return { render };
})();


/**
 * screens/workout.js — Lê do Storage real
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

  function renderExerciseList(exercises) {
    if (!exercises.length) return `
      <p style="font-size:13px;color:#A5AA94;text-align:center;padding:16px 0">
        Nenhum exercício registrado hoje
      </p>`;
    return exercises.map(e => `
      <div class="exrow">
        <span class="exname">${e.name}</span>
        <div class="extags">
          ${e.sets ? `<span class="etag">${e.sets}×${e.reps}</span>` : ''}
          ${e.load ? `<span class="etag">${e.load}</span>` : ''}
        </div>
      </div>`).join('');
  }

  function renderAddExerciseForm(type) {
    const isCardio = type === 'corr';
    const isYoga   = type === 'yoga';
    return `
      <div class="card" id="addExForm" style="margin-top:12px;display:none">
        <p class="caps">Novo registro</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${!isCardio && !isYoga ? `
            <input class="form-input" id="exName"  placeholder="Exercício (ex: Agachamento)" maxlength="50">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
              <input class="form-input" id="exSets" placeholder="Séries" type="number" min="1" max="20">
              <input class="form-input" id="exReps" placeholder="Reps"   maxlength="10">
              <input class="form-input" id="exLoad" placeholder="Carga"  maxlength="10">
            </div>
          ` : ''}
          ${isCardio ? `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input class="form-input" id="exDist" placeholder="Distância (km)" type="number" step="0.1">
              <input class="form-input" id="exTime" placeholder="Tempo (min)"    type="number">
            </div>
          ` : ''}
          ${isYoga ? `
            <input class="form-input" id="exYogaType" placeholder="Tipo de prática" maxlength="50">
            <input class="form-input" id="exDuration" placeholder="Duração (min)" type="number">
          ` : ''}
          <input class="form-input" id="exNotes" placeholder="Observações (opcional)" maxlength="100">
          <div style="display:flex;gap:8px">
            <button class="btn-ok"  id="saveExBtn">Salvar</button>
            <button class="btn-adj" id="cancelExBtn">Cancelar</button>
          </div>
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

  async function render() {
    const today     = Utils.dateKey();
    const allToday  = await Storage.workouts.getByDate(today);
    const weekData  = await Storage.workouts.getWeek();
    const weekDone  = weekData.filter(d => d.workouts.length > 0).length;

    document.getElementById('workSub').textContent =
      `${weekDone} treino${weekDone !== 1 ? 's' : ''} esta semana`;

    const byType = { musc: [], corr: [], yoga: [], outr: [] };
    allToday.forEach(w => {
      const t = w.tabType || 'musc';
      if (byType[t]) byType[t].push(w);
    });

    document.getElementById('workContent').innerHTML = `
      ${renderTabs()}

      <div id="tab-musc" class="tab-content on">
        <div class="card" style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <p style="font-size:13px;font-weight:600;color:#2C2B28">Musculação · Hoje</p>
            <span style="font-size:11px;color:#7A7570">${new Date().toTimeString().slice(0,5)}</span>
          </div>
          ${renderExerciseList(byType.musc.flatMap(w => w.exercises || []))}
        </div>
        <button class="mainbtn" id="addMuscBtn" style="background:#C9845A">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo exercício
        </button>
        ${renderAddExerciseForm('musc')}
      </div>

      <div id="tab-corr" class="tab-content">
        ${byType.corr.length ? byType.corr.map(w => `
          <div class="card">
            <div class="g2" style="margin:0">
              <div class="smini"><p class="sml">Distância</p><p class="smv">${w.distance||'—'} km</p></div>
              <div class="smini"><p class="sml">Tempo</p><p class="smv">${w.duration||'—'} min</p></div>
            </div>
          </div>`).join('') : `
          <div class="empty">
            <div class="eico">🏃</div>
            <p class="etxt">Nenhuma corrida hoje</p>
          </div>`}
        <button class="mainbtn" id="addCorrBtn" style="background:#7A836A;margin-top:12px">+ Registrar corrida</button>
        ${renderAddExerciseForm('corr')}
      </div>

      <div id="tab-yoga" class="tab-content">
        ${byType.yoga.length ? byType.yoga.map(w => `
          <div class="card">
            <p style="font-size:14px;font-weight:600;color:#2C2B28">${w.yogaType||'Yoga'}</p>
            <p style="font-size:12px;color:#7A7570">${w.duration||'—'} minutos</p>
          </div>`).join('') : `
          <div class="empty">
            <div class="eico">🧘</div>
            <p class="etxt">Nenhuma prática hoje</p>
          </div>`}
        <button class="mainbtn" id="addYogaBtn" style="background:#7A836A;margin-top:12px">+ Registrar prática</button>
        ${renderAddExerciseForm('yoga')}
      </div>

      <div id="tab-outr" class="tab-content">
        <div class="empty">
          <div class="eico">✦</div>
          <p class="etxt">Nenhum registro hoje</p>
          <button class="mainbtn" style="background:#7A836A;max-width:160px;margin:0 auto">+ Registrar</button>
        </div>
      </div>`;

    // Tab switching
    document.getElementById('workTabs').addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (btn) switchTab(btn.dataset.tab);
    });

    // Botão musculação
    document.getElementById('addMuscBtn')?.addEventListener('click', () => {
      const f = document.getElementById('addExForm');
      if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
    });

    // Salvar exercício
    document.getElementById('saveExBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('exName')?.value.trim();
      if (!name) return;
      const existing = await Storage.workouts.getByDate(today);
      const todayEntry = existing.find(w => w.tabType === 'musc') || { tabType: 'musc', type: 'Musculação', exercises: [] };
      todayEntry.exercises = [...(todayEntry.exercises||[]), {
        name,
        sets: document.getElementById('exSets')?.value || '',
        reps: document.getElementById('exReps')?.value || '',
        load: document.getElementById('exLoad')?.value || '',
        notes: document.getElementById('exNotes')?.value || '',
      }];
      await Storage.workouts.add(todayEntry);
      render();
    });

    // Salvar corrida
    document.getElementById('addCorrBtn')?.addEventListener('click', () => {
      switchTab('corr');
      const f = document.getElementById('addExForm');
      if (f) f.style.display = 'block';
    });

    document.getElementById('cancelExBtn')?.addEventListener('click', () => {
      const f = document.getElementById('addExForm');
      if (f) f.style.display = 'none';
    });
  }

  return { render };
})();


/**
 * screens/progress.js — Lê do Storage real
 */
const ScreenProgress = (() => {

  function renderAddWeightForm() {
    return `
      <div class="card" id="addWeightForm" style="display:none;margin-top:-4px;margin-bottom:12px">
        <div style="display:flex;gap:8px;align-items:center">
          <input class="form-input" id="weightInput" placeholder="Ex: 63.4" type="number" step="0.1" min="30" max="250" style="flex:1">
          <span style="font-size:13px;color:#7A7570">kg</span>
          <button class="btn-ok" id="saveWeightBtn" style="flex-shrink:0">Salvar</button>
          <button class="btn-adj" id="cancelWeightBtn" style="flex-shrink:0">✕</button>
        </div>
      </div>`;
  }

  function renderAddMeasForm() {
    return `
      <div class="card" id="addMeasForm" style="display:none;margin-top:-4px;margin-bottom:12px">
        <p class="caps">Nova medida</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div><label style="font-size:10px;color:#7A7570">Cintura (cm)</label>
            <input class="form-input" id="mWaist" type="number" min="40" max="200"></div>
          <div><label style="font-size:10px;color:#7A7570">Quadril (cm)</label>
            <input class="form-input" id="mHip" type="number" min="40" max="200"></div>
          <div><label style="font-size:10px;color:#7A7570">Abdômen (cm)</label>
            <input class="form-input" id="mAbdomen" type="number" min="40" max="200"></div>
          <div><label style="font-size:10px;color:#7A7570">Braço (cm)</label>
            <input class="form-input" id="mArm" type="number" min="15" max="80"></div>
          <div><label style="font-size:10px;color:#7A7570">Coxa (cm)</label>
            <input class="form-input" id="mThigh" type="number" min="20" max="100"></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn-ok"  id="saveMeasBtn">Salvar</button>
          <button class="btn-adj" id="cancelMeasBtn">Cancelar</button>
        </div>
      </div>`;
  }

  async function render() {
    const [weightHistory, latest] = await Promise.all([
      Promise.resolve(Storage.weight.getHistory()),
      Storage.measurements.getLatest(),
    ]);

    const weekScores = Storage.score.getWeek();
    const todayScore = Storage.score.get(Utils.dateKey()) || 0;
    const weekAvg    = weekScores.filter(d=>d.score).length
      ? Math.round(weekScores.filter(d=>d.score).reduce((a,d)=>a+d.score,0)/weekScores.filter(d=>d.score).length)
      : 0;

    const latestKg = weightHistory.length ? weightHistory[weightHistory.length-1].kg : null;
    const firstKg  = weightHistory.length > 1 ? weightHistory[0].kg : null;
    const wDelta   = (latestKg && firstKg) ? (latestKg - firstKg).toFixed(1) : null;

    document.getElementById('progContent').innerHTML = `
      <!-- PESO -->
      <div class="card" style="margin-bottom:4px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:${weightHistory.length ? '14px' : '8px'}">
          <div>
            <p class="caps" style="margin-bottom:4px">Peso</p>
            <p style="font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#2C2B28;line-height:1">
              ${latestKg ? Utils.formatKg(latestKg) + ' kg' : '— kg'}
            </p>
            ${wDelta ? `<p style="font-size:10px;color:${parseFloat(wDelta)<=0?'#7A836A':'#C9845A'};margin-top:4px">${parseFloat(wDelta)>0?'+':''}${wDelta}kg desde o início</p>` : ''}
          </div>
          <button id="addWeightBtn" style="background:none;border:none;font-size:12px;color:#7A836A;font-weight:600;cursor:pointer;padding-top:4px">+ Registrar</button>
        </div>
        ${weightHistory.length > 1
          ? `<div id="weightChartProg" style="height:72px"></div>`
          : `<p style="font-size:13px;color:#A5AA94;text-align:center;padding:8px 0">Registre seu peso para ver a evolução</p>`}
      </div>

      ${renderAddWeightForm()}

      <!-- SCORE -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Score de Consistência</p>
        <div class="strio">
          <div class="strioi"><p class="striol">Hoje</p><p class="striov" style="color:#C9845A">${todayScore}</p></div>
          <div class="strioi"><p class="striol">Semana</p><p class="striov" style="color:#7A836A">${weekAvg}</p></div>
          <div class="strioi"><p class="striol">Mês</p><p class="striov" style="color:#A5AA94">—</p></div>
        </div>
      </div>

      <!-- MEDIDAS -->
      <div class="card" style="margin-bottom:4px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${latest?'0':'8px'}">
          <p class="caps" style="margin:0">Medidas corporais</p>
          <button id="addMeasBtn" style="background:none;border:none;font-size:12px;color:#7A836A;font-weight:600;cursor:pointer">+ Registrar</button>
        </div>
        ${latest ? `
          ${[['Cintura',latest.waist],['Quadril',latest.hip],['Abdômen',latest.abdomen],['Braço',latest.arm],['Coxa',latest.thigh]]
            .filter(([,v])=>v)
            .map(([n,v]) => `
              <div class="measrow">
                <span class="measname">${n}</span>
                <span class="measval">${v}cm</span>
              </div>`).join('')}
          <p style="font-size:10px;color:#A5AA94;margin-top:8px">Última medição: ${latest.date || 'hoje'}</p>
        ` : `<p style="font-size:13px;color:#A5AA94;text-align:center;padding:8px 0">Nenhuma medição registrada</p>`}
      </div>

      ${renderAddMeasForm()}

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

    // Gráfico de peso
    if (weightHistory.length > 1) {
      const MN = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      Charts.barChart('weightChartProg',
        weightHistory.map(w => w.kg),
        {
          labels: weightHistory.map(w => MN[new Date(w.date+'T12:00:00').getMonth()]),
          color: '#C9845A', height: 72,
        }
      );
    }

    // Peso: toggle form
    document.getElementById('addWeightBtn').addEventListener('click', () => {
      const f = document.getElementById('addWeightForm');
      f.style.display = f.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('saveWeightBtn').addEventListener('click', () => {
      const kg = parseFloat(document.getElementById('weightInput').value);
      if (!kg || kg < 30 || kg > 250) return;
      Storage.weight.addEntry(kg);
      render();
    });

    document.getElementById('cancelWeightBtn').addEventListener('click', () => {
      document.getElementById('addWeightForm').style.display = 'none';
    });

    // Medidas: toggle form
    document.getElementById('addMeasBtn').addEventListener('click', () => {
      const f = document.getElementById('addMeasForm');
      f.style.display = f.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('saveMeasBtn').addEventListener('click', async () => {
      const m = {
        waist:   parseFloat(document.getElementById('mWaist').value)   || null,
        hip:     parseFloat(document.getElementById('mHip').value)     || null,
        abdomen: parseFloat(document.getElementById('mAbdomen').value) || null,
        arm:     parseFloat(document.getElementById('mArm').value)     || null,
        thigh:   parseFloat(document.getElementById('mThigh').value)   || null,
      };
      if (Object.values(m).every(v => !v)) return;
      await Storage.measurements.add(m);
      render();
    });

    document.getElementById('cancelMeasBtn').addEventListener('click', () => {
      document.getElementById('addMeasForm').style.display = 'none';
    });
  }

  return { render };
})();
