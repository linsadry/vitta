/**
 * screens/nutrition.js
 * ScreenWorkout e ScreenProgress também estão neste arquivo.
 */

// ─────────────────────────────────────────────────────────────
// Banco de estimativas nutricionais por palavras-chave
// Usado para estimar macros a partir de descrição livre
// ─────────────────────────────────────────────────────────────
const NutritionDB = {
  // [kcal_por_100g, prot, carb, gord]
  'ovo':            [155, 13, 1, 11],
  'ovos':           [155, 13, 1, 11],
  'frango':         [165, 31, 0, 3.6],
  'peito de frango':[165, 31, 0, 3.6],
  'carne':          [250, 26, 0, 17],
  'patinho':        [219, 27, 0, 12],
  'alcatra':        [200, 28, 0, 10],
  'salmão':         [208, 20, 0, 13],
  'atum':           [130, 28, 0, 1],
  'tilápia':        [96,  20, 0, 2],
  'arroz':          [130, 2.7,28, 0.3],
  'feijão':         [127, 8.7,23, 0.5],
  'lentilha':       [116, 9,  20, 0.4],
  'batata':         [87,  2,  20, 0.1],
  'batata doce':    [86,  1.6,20, 0.1],
  'macarrão':       [157, 5,  31, 0.9],
  'massa':          [157, 5,  31, 0.9],
  'pão':            [265, 9,  50, 3],
  'pão integral':   [247, 10, 44, 3.4],
  'pão de milho':   [228, 5,  44, 3],
  'tapioca':        [340, 0.2,84, 0.3],
  'aveia':          [389, 17, 66, 7],
  'granola':        [471, 10, 64, 20],
  'iogurte':        [59,  10, 3.6,0.4],
  'iogurte grego':  [97,  10, 3.6,5],
  'leite':          [61,  3.2,4.8,3.3],
  'queijo':         [402, 25, 1.3,33],
  'requeijão':      [245, 9,  3,  22],
  'whey':           [400, 80, 10, 5],
  'brócolis':       [34,  2.8,7,  0.4],
  'espinafre':      [23,  2.9,3.6,0.4],
  'cenoura':        [41,  0.9,10, 0.2],
  'abobrinha':      [17,  1.2,3.1,0.3],
  'tomate':         [18,  0.9,3.9,0.2],
  'alface':         [15,  1.4,2.9,0.2],
  'abacate':        [160, 2,  9,  15],
  'banana':         [89,  1.1,23, 0.3],
  'maçã':           [52,  0.3,14, 0.2],
  'manga':          [60,  0.8,15, 0.4],
  'morango':        [33,  0.7,8,  0.3],
  'laranja':        [47,  0.9,12, 0.1],
  'azeite':         [884, 0,  0,  100],
  'manteiga':       [717, 0.9,0.1,81],
  'peito de peru':  [109, 18, 2,  3.5],
  'presunto':       [145, 18, 1.5,7],
  'peru':           [109, 18, 2,  3.5],
  'castanha':       [656, 14, 12, 66],
  'amendoim':       [567, 26, 16, 49],
  'pasta de amendoim':[588,25,20, 50],
  'café':           [2,   0.3,0,  0],
  'suco':           [45,  0.4,11, 0.1],
  'chocolate':      [546, 5,  60, 31],
};

// Porções padrão em gramas por palavra-chave de quantidade
const PortionHints = {
  'fatia':   40,
  'fatias':  40,
  'colher':  15,
  'xícara':  200,
  'copo':    250,
  'prato':   300,
  'porção':  150,
  'pedaço':  100,
  'unidade': 100,
  'inteiro': 150,
};

/**
 * Estima macros a partir de uma string de descrição livre.
 * Retorna { kcal, p, c, f, breakdown[] }
 */
function estimateNutrition(description) {
  const text     = description.toLowerCase();
  const tokens   = text.split(/[\s,;·•\-\/]+/);
  const breakdown = [];
  let total = { kcal: 0, p: 0, c: 0, f: 0 };

  // Tentar casar frases de 3, 2 e 1 palavra
  const matched = new Set();
  const dbKeys  = Object.keys(NutritionDB).sort((a,b) => b.length - a.length);

  for (const key of dbKeys) {
    if (text.includes(key) && !matched.has(key)) {
      matched.add(key);

      // Estimar porção: procurar número próximo ao ingrediente
      let grams = 100; // padrão 100g
      const idx = text.indexOf(key);

      // Buscar número antes da palavra (ex: "150g frango", "2 ovos")
      const before = text.slice(Math.max(0, idx - 20), idx);
      const numMatch = before.match(/(\d+\.?\d*)\s*g?\s*$/);
      if (numMatch) {
        const n = parseFloat(numMatch[1]);
        if (n <= 10) grams = n * 100; // "2 ovos" → 200g
        else         grams = n;        // "150g frango" → 150g
      }

      // Ajustar para porções menores em contexto de refeição típica
      if (grams === 100) {
        if (key.includes('azeite') || key.includes('manteiga') || key.includes('café')) grams = 10;
        else if (key === 'ovo' || key === 'ovos') grams = 120;
        else if (key.includes('arroz') || key.includes('feijão')) grams = 150;
        else if (key.includes('frango') || key.includes('carne') || key.includes('peixe')
              || key.includes('salmão') || key.includes('atum') || key.includes('tilápia')) grams = 150;
        else if (key.includes('pão')) grams = 50;
        else if (key.includes('iogurte')) grams = 170;
        else if (key.includes('whey')) grams = 35;
        else grams = 100;
      }

      const [kcalPer100, pPer100, cPer100, fPer100] = NutritionDB[key];
      const factor = grams / 100;
      const item = {
        name: key, grams,
        kcal: Math.round(kcalPer100 * factor),
        p:    Math.round(pPer100    * factor * 10) / 10,
        c:    Math.round(cPer100    * factor * 10) / 10,
        f:    Math.round(fPer100    * factor * 10) / 10,
      };
      breakdown.push(item);
      total.kcal += item.kcal;
      total.p    += item.p;
      total.c    += item.c;
      total.f    += item.f;
    }
  }

  return {
    kcal:      Math.round(total.kcal),
    p:         Math.round(total.p  * 10) / 10,
    c:         Math.round(total.c  * 10) / 10,
    f:         Math.round(total.f  * 10) / 10,
    breakdown,
    found:     breakdown.length > 0,
  };
}

// ─────────────────────────────────────────────────────────────
const ScreenNutrition = (() => {
  let aiState    = 'initial'; // initial | typing | result
  let aiEstimate = null;

  function renderMealItem(m) {
    const foods = Array.isArray(m.foods) ? m.foods.join(', ') : (m.foods || '');
    return `
      <div class="mitem">
        <div style="flex:1;min-width:0">
          <p class="mname">${m.name}</p>
          ${foods ? `<p class="msub">${m.time || ''} · ${foods}</p>` : `<p class="msub">${m.time || ''}</p>`}
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
      <p style="font-size:12px;color:#7A7570;margin-bottom:12px;line-height:1.5">
        Descreva o que comeu e a IA estima os macros automaticamente.
      </p>
      <textarea id="aiDescInput"
        style="width:100%;background:#FAF8F4;border:1.5px solid #E8E0D0;border-radius:12px;
               padding:12px;font-family:'DM Sans',sans-serif;font-size:13px;color:#2C2B28;
               outline:none;resize:none;height:80px;-webkit-appearance:none"
        placeholder="Ex: 150g de frango grelhado, arroz integral, brócolis refogado com azeite"></textarea>
      <button class="mainbtn" id="aiEstimateBtn" style="background:#7A836A;margin-top:10px">
        ✦ Estimar macros
      </button>`;

    if (aiState === 'typing') return `
      <div style="text-align:center;padding:20px 0">
        <div class="spinner"></div>
        <p style="font-size:13px;color:#7A7570">Calculando estimativa...</p>
      </div>`;

    if (aiState === 'result' && aiEstimate) {
      const e = aiEstimate;
      const breakdownHtml = e.breakdown.length
        ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #F4F1EC">
            ${e.breakdown.map(b =>
              `<div style="display:flex;justify-content:space-between;font-size:11px;color:#7A7570;margin-bottom:3px">
                <span style="text-transform:capitalize">${b.name} (${b.grams}g)</span>
                <span>${b.kcal} kcal · P${b.p}g C${b.c}g G${b.f}g</span>
              </div>`
            ).join('')}
           </div>`
        : '';

      return `
        <div class="aibox">
          <p class="aititle">Estimativa calculada</p>
          <div style="display:flex;gap:10px;margin-bottom:8px">
            <div style="flex:1;text-align:center">
              <p style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#C9845A">${e.kcal}</p>
              <p style="font-size:10px;color:#7A7570">kcal</p>
            </div>
            <div style="flex:1;text-align:center">
              <p style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#C9845A">${e.p}g</p>
              <p style="font-size:10px;color:#7A7570">prot</p>
            </div>
            <div style="flex:1;text-align:center">
              <p style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#7A836A">${e.c}g</p>
              <p style="font-size:10px;color:#7A7570">carbs</p>
            </div>
            <div style="flex:1;text-align:center">
              <p style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#D4956E">${e.f}g</p>
              <p style="font-size:10px;color:#7A7570">gord</p>
            </div>
          </div>
          ${breakdownHtml}
          ${!e.found ? `<p style="font-size:11px;color:#A5AA94;margin-top:6px">⚠ Nenhum alimento reconhecido. Tente ser mais específico ou ajuste manualmente.</p>` : ''}
        </div>
        <div class="aibrow">
          <button class="btn-ok"  id="aiSaveBtn">Salvar refeição</button>
          <button class="btn-adj" id="aiRetryBtn">Tentar de novo</button>
        </div>`;
    }
    return '';
  }

  function bindAI(descriptionUsed) {
    const estimateBtn = document.getElementById('aiEstimateBtn');
    if (estimateBtn) {
      estimateBtn.addEventListener('click', () => {
        const desc = document.getElementById('aiDescInput')?.value.trim();
        if (!desc) return;
        aiState = 'typing';
        refreshAIBox(desc);
        setTimeout(() => {
          aiEstimate         = estimateNutrition(desc);
          aiEstimate.rawDesc = desc;
          aiState            = 'result';
          refreshAIBox(desc);
        }, 900);
      });
    }

    const saveBtn = document.getElementById('aiSaveBtn');
    if (saveBtn && aiEstimate) {
      saveBtn.addEventListener('click', async () => {
        const name = prompt('Nome da refeição:', 'Refeição') || 'Refeição';
        await Storage.meals.add({
          name,
          foods: aiEstimate.rawDesc ? [aiEstimate.rawDesc] : [],
          cal:   aiEstimate.kcal,
          p:     aiEstimate.p,
          c:     aiEstimate.c,
          f:     aiEstimate.f,
          time:  new Date().toTimeString().slice(0, 5),
        });
        aiState    = 'initial';
        aiEstimate = null;
        render();
      });
    }

    const retryBtn = document.getElementById('aiRetryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        aiState    = 'initial';
        aiEstimate = null;
        refreshAIBox();
      });
    }
  }

  function refreshAIBox(desc) {
    const box = document.getElementById('aiAnalysisBox');
    if (box) {
      box.innerHTML = renderAIBox();
      bindAI(desc);
    }
  }

  async function render() {
    document.getElementById('nutriDate').textContent = Utils.formatDate();

    const today = await Storage.meals.getByDate(Utils.dateKey());
    const total = today.reduce((acc, m) => ({
      cal: acc.cal+(m.cal||0), p: acc.p+(m.p||0),
      c:   acc.c  +(m.c ||0), f: acc.f+(m.f||0),
    }), { cal:0, p:0, c:0, f:0 });

    const goal    = Storage.prefs.get('goal_kcal',      DefaultData.user.kcalGoal);
    const goalP   = Storage.prefs.get('goal_protein_g', DefaultData.user.proteinGoalG);
    const kcalPct = Utils.pct(total.cal, goal);
    const status  = kcalPct > 110
      ? '<span style="color:#C9845A">Acima da meta</span>'
      : kcalPct >= 70
        ? '<span style="color:#7A836A">Dentro do alvo ✓</span>'
        : '<span style="color:#8D9298">Abaixo da meta</span>';

    document.getElementById('nutriContent').innerHTML = `
      <!-- TOTAIS -->
      <div class="nhero">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
          <div>
            <p class="caps" style="margin-bottom:4px">Total do dia</p>
            <p class="nkcal">${total.cal}<span> kcal</span></p>
          </div>
          <div style="text-align:right">
            <p style="font-size:11px;color:#7A7570;margin-bottom:3px">Meta: ${goal} kcal</p>
            <p style="font-size:13px;font-weight:600">${status}</p>
          </div>
        </div>
        <div style="display:flex;gap:10px">
          <div style="flex:1;background:#FAF8F4;border-radius:10px;padding:10px 12px">
            <p style="font-size:10px;color:#7A7570;margin-bottom:3px">Proteína</p>
            <p style="font-size:17px;font-family:'Playfair Display',serif;font-weight:700;color:#C9845A">${total.p}g</p>
            <div class="pbar" style="margin-top:4px"><div class="pfill" style="width:${Utils.pct(total.p,goalP)}%;background:#C9845A"></div></div>
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

      <!-- ESTIMATIVA IA -->
      <div class="card" style="margin-bottom:14px">
        <p class="caps">✦ Estimar macros por descrição</p>
        <div id="aiAnalysisBox">${renderAIBox()}</div>
      </div>

      <!-- ADICIONAR MANUAL -->
      <div class="card" id="addMealCard" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <p class="caps" style="margin:0">Adicionar manualmente</p>
          <button id="toggleAddMeal" style="background:none;border:none;font-size:18px;color:#7A836A;cursor:pointer;line-height:1">+</button>
        </div>
        <div id="addMealForm" style="display:none;margin-top:12px">
          <div style="display:flex;flex-direction:column;gap:8px">
            <input class="form-input" id="mealName"  placeholder="Nome (ex: Almoço)" maxlength="40">
            <input class="form-input" id="mealFoods" placeholder="Alimentos (ex: Frango, Arroz, Brócolis)" maxlength="120">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input class="form-input" id="mealCal" placeholder="kcal"       type="number" min="0" max="5000">
              <input class="form-input" id="mealP"   placeholder="Proteína g" type="number" min="0" max="500">
              <input class="form-input" id="mealC"   placeholder="Carbs g"    type="number" min="0" max="500">
              <input class="form-input" id="mealF"   placeholder="Gordura g"  type="number" min="0" max="500">
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn-ok"  id="saveMealBtn">Salvar</button>
              <button class="btn-adj" id="cancelMealBtn">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- LISTA DE REFEIÇÕES -->
      <p class="caps">Refeições do dia</p>
      ${today.length
        ? today.map(renderMealItem).join('')
        : `<div style="text-align:center;padding:24px 0;color:#A5AA94;font-size:13px">
             Nenhuma refeição registrada hoje.<br>
             <span style="font-size:11px">Use a estimativa por IA ou adicione manualmente.</span>
           </div>`}`;

    // Bind IA
    bindAI();

    // Toggle formulário manual
    document.getElementById('toggleAddMeal').addEventListener('click', () => {
      const form = document.getElementById('addMealForm');
      const btn  = document.getElementById('toggleAddMeal');
      const open = form.style.display === 'none';
      form.style.display = open ? 'block' : 'none';
      btn.textContent    = open ? '−' : '+';
    });

    // Salvar refeição manual
    document.getElementById('saveMealBtn').addEventListener('click', async () => {
      const name  = document.getElementById('mealName').value.trim();
      if (!name) return;
      await Storage.meals.add({
        name,
        foods: document.getElementById('mealFoods').value.trim()
          ? document.getElementById('mealFoods').value.split(',').map(s => s.trim())
          : [],
        cal:  parseInt(document.getElementById('mealCal').value)  || 0,
        p:    parseInt(document.getElementById('mealP').value)    || 0,
        c:    parseInt(document.getElementById('mealC').value)    || 0,
        f:    parseInt(document.getElementById('mealF').value)    || 0,
        time: new Date().toTimeString().slice(0, 5),
      });
      render();
    });

    document.getElementById('cancelMealBtn').addEventListener('click', () => {
      document.getElementById('addMealForm').style.display = 'none';
      document.getElementById('toggleAddMeal').textContent = '+';
    });
  }

  return { render };
})();


// ─────────────────────────────────────────────────────────────
// WORKOUT — igual à versão anterior, sem alterações
// ─────────────────────────────────────────────────────────────
const ScreenWorkout = (() => {
  let activeTab = 'musc';

  const TABS = [
    { id: 'musc', label: '🏋️ Musculação' },
    { id: 'corr', label: '🏃 Corrida' },
    { id: 'yoga', label: '🧘 Yoga' },
    { id: 'outr', label: '✦ Outros' },
  ];

  function renderTabs() {
    return `<div class="tabs" id="workTabs">
      ${TABS.map(t => `<button class="chip ${t.id === activeTab ? 'chip-on' : 'chip-off'}" data-tab="${t.id}">${t.label}</button>`).join('')}
    </div>`;
  }

  function renderExList(exercises) {
    if (!exercises.length) return `<p style="font-size:13px;color:#A5AA94;text-align:center;padding:16px 0">Nenhum exercício registrado hoje</p>`;
    return exercises.map(e => `
      <div class="exrow">
        <span class="exname">${e.name}</span>
        <div class="extags">
          ${e.sets ? `<span class="etag">${e.sets}×${e.reps||'—'}</span>` : ''}
          ${e.load ? `<span class="etag">${e.load}</span>` : ''}
        </div>
      </div>`).join('');
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
    const today    = Utils.dateKey();
    const allToday = await Storage.workouts.getByDate(today);
    const weekData = await Storage.workouts.getWeek();
    const weekDone = weekData.filter(d => d.workouts.length > 0).length;

    document.getElementById('workSub').textContent = `${weekDone} treino${weekDone !== 1 ? 's' : ''} esta semana`;

    const byType = { musc: [], corr: [], yoga: [], outr: [] };
    allToday.forEach(w => { const t = w.tabType || 'musc'; if (byType[t]) byType[t].push(w); });
    const muscEx = byType.musc.flatMap(w => w.exercises || []);

    document.getElementById('workContent').innerHTML = `
      ${renderTabs()}

      <div id="tab-musc" class="tab-content on">
        <div class="card" style="margin-bottom:12px">
          <p style="font-size:13px;font-weight:600;color:#2C2B28;margin-bottom:10px">Musculação · Hoje</p>
          ${renderExList(muscEx)}
        </div>
        <div class="card" id="addMuscCard">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <p class="caps" style="margin:0">Novo exercício</p>
            <button id="toggleMusc" style="background:none;border:none;font-size:18px;color:#7A836A;cursor:pointer">+</button>
          </div>
          <div id="muscForm" style="display:none;margin-top:12px">
            <div style="display:flex;flex-direction:column;gap:8px">
              <input class="form-input" id="exName" placeholder="Exercício (ex: Agachamento)">
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
                <input class="form-input" id="exSets" placeholder="Séries" type="number" min="1">
                <input class="form-input" id="exReps" placeholder="Reps">
                <input class="form-input" id="exLoad" placeholder="Carga">
              </div>
              <input class="form-input" id="exNotes" placeholder="Obs (opcional)">
              <div style="display:flex;gap:8px">
                <button class="btn-ok" id="saveExBtn">Salvar</button>
                <button class="btn-adj" id="cancelExBtn">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="tab-corr" class="tab-content">
        ${byType.corr.length ? byType.corr.map(w => `
          <div class="card">
            <div class="g2" style="margin:0">
              <div class="smini"><p class="sml">Distância</p><p class="smv">${w.distance||'—'} km</p></div>
              <div class="smini"><p class="sml">Tempo</p><p class="smv">${w.duration||'—'} min</p></div>
            </div>
          </div>`).join('') : `<div class="empty"><div class="eico">🏃</div><p class="etxt">Nenhuma corrida hoje</p></div>`}
        <div class="card" style="margin-top:12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <p class="caps" style="margin:0">Registrar corrida</p>
            <button id="toggleCorr" style="background:none;border:none;font-size:18px;color:#7A836A;cursor:pointer">+</button>
          </div>
          <div id="corrForm" style="display:none;margin-top:12px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input class="form-input" id="corrDist" placeholder="Distância (km)" type="number" step="0.1">
              <input class="form-input" id="corrTime" placeholder="Tempo (min)" type="number">
            </div>
            <input class="form-input" id="corrNotes" placeholder="Obs" style="margin-top:8px">
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn-ok" id="saveCorrBtn">Salvar</button>
              <button class="btn-adj" id="cancelCorrBtn">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <div id="tab-yoga" class="tab-content">
        ${byType.yoga.length ? byType.yoga.map(w => `
          <div class="card">
            <p style="font-size:14px;font-weight:600;color:#2C2B28">${w.yogaType||'Yoga'}</p>
            <p style="font-size:12px;color:#7A7570">${w.duration||'—'} minutos</p>
          </div>`).join('') : `<div class="empty"><div class="eico">🧘</div><p class="etxt">Nenhuma prática hoje</p></div>`}
        <div class="card" style="margin-top:12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <p class="caps" style="margin:0">Registrar prática</p>
            <button id="toggleYoga" style="background:none;border:none;font-size:18px;color:#7A836A;cursor:pointer">+</button>
          </div>
          <div id="yogaForm" style="display:none;margin-top:12px">
            <input class="form-input" id="yogaType" placeholder="Tipo (ex: Vinyasa, Yin)" style="margin-bottom:8px">
            <input class="form-input" id="yogaDuration" placeholder="Duração (min)" type="number">
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn-ok" id="saveYogaBtn">Salvar</button>
              <button class="btn-adj" id="cancelYogaBtn">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <div id="tab-outr" class="tab-content">
        <div class="empty"><div class="eico">✦</div><p class="etxt">Em breve mais modalidades</p></div>
      </div>`;

    // Tab switching
    document.getElementById('workTabs').addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (btn) switchTab(btn.dataset.tab);
    });

    // Toggle + save helpers
    function bindToggle(toggleId, formId, saveId, cancelId, saveFn) {
      document.getElementById(toggleId)?.addEventListener('click', () => {
        const f = document.getElementById(formId);
        const b = document.getElementById(toggleId);
        const open = f.style.display === 'none';
        f.style.display = open ? 'block' : 'none';
        b.textContent   = open ? '−' : '+';
      });
      document.getElementById(saveId)?.addEventListener('click', saveFn);
      document.getElementById(cancelId)?.addEventListener('click', () => {
        document.getElementById(formId).style.display = 'none';
        document.getElementById(toggleId).textContent = '+';
      });
    }

    bindToggle('toggleMusc', 'muscForm', 'saveExBtn', 'cancelExBtn', async () => {
      const name = document.getElementById('exName')?.value.trim();
      if (!name) return;
      const ex = {
        name,
        sets:  document.getElementById('exSets')?.value || '',
        reps:  document.getElementById('exReps')?.value || '',
        load:  document.getElementById('exLoad')?.value || '',
        notes: document.getElementById('exNotes')?.value || '',
      };
      const existing = await Storage.workouts.getByDate(today);
      const entry    = existing.find(w => w.tabType === 'musc') || { tabType:'musc', type:'Musculação', exercises:[] };
      entry.exercises = [...(entry.exercises||[]), ex];
      await Storage.workouts.add(entry);
      render();
    });

    bindToggle('toggleCorr', 'corrForm', 'saveCorrBtn', 'cancelCorrBtn', async () => {
      const dist = parseFloat(document.getElementById('corrDist')?.value);
      const time = parseFloat(document.getElementById('corrTime')?.value);
      await Storage.workouts.add({
        tabType: 'corr', type: 'Corrida',
        distance: dist || 0, duration: time || 0,
        notes: document.getElementById('corrNotes')?.value || '',
      });
      render();
    });

    bindToggle('toggleYoga', 'yogaForm', 'saveYogaBtn', 'cancelYogaBtn', async () => {
      const type = document.getElementById('yogaType')?.value.trim() || 'Yoga';
      const dur  = parseFloat(document.getElementById('yogaDuration')?.value);
      await Storage.workouts.add({ tabType:'yoga', type:'Yoga', yogaType: type, duration: dur||0 });
      render();
    });
  }

  return { render };
})();


// ─────────────────────────────────────────────────────────────
// PROGRESS — igual à versão anterior
// ─────────────────────────────────────────────────────────────
const ScreenProgress = (() => {
  async function render() {
    const [weightHistory, latest] = await Promise.all([
      Promise.resolve(Storage.weight.getHistory()),
      Storage.measurements.getLatest(),
    ]);

    const todayScore = Storage.score.get(Utils.dateKey()) || 0;
    const weekScores = Storage.score.getWeek().filter(d => d.score !== null);
    const weekAvg    = weekScores.length
      ? Math.round(weekScores.reduce((a,d) => a+d.score, 0) / weekScores.length)
      : 0;

    const latestKg = weightHistory.length ? weightHistory[weightHistory.length-1].kg : null;
    const firstKg  = weightHistory.length > 1 ? weightHistory[0].kg : null;
    const wDelta   = (latestKg && firstKg) ? (latestKg - firstKg).toFixed(1) : null;

    document.getElementById('progContent').innerHTML = `
      <div class="card" style="margin-bottom:4px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:${weightHistory.length?'14px':'8px'}">
          <div>
            <p class="caps" style="margin-bottom:4px">Peso</p>
            <p style="font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#2C2B28;line-height:1">
              ${latestKg ? Utils.formatKg(latestKg) + ' kg' : '— kg'}
            </p>
            ${wDelta ? `<p style="font-size:10px;color:${parseFloat(wDelta)<=0?'#7A836A':'#C9845A'};margin-top:4px">${parseFloat(wDelta)>0?'+':''}${wDelta}kg desde o início</p>` : ''}
          </div>
          <button id="addWeightBtn" style="background:none;border:none;font-size:12px;color:#7A836A;font-weight:600;cursor:pointer;padding-top:4px">+ Registrar</button>
        </div>
        ${weightHistory.length > 1 ? `<div id="weightChartProg" style="height:72px"></div>` : `<p style="font-size:13px;color:#A5AA94;text-align:center;padding:8px 0">Registre seu peso para ver a evolução</p>`}
      </div>

      <div class="card" id="addWeightCard" style="display:none;margin-bottom:12px">
        <div style="display:flex;gap:8px;align-items:center">
          <input class="form-input" id="weightInput" placeholder="Ex: 63.4" type="number" step="0.1" min="30" max="250" style="flex:1">
          <span style="font-size:13px;color:#7A7570">kg</span>
          <button class="btn-ok" id="saveWeightBtn">Salvar</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px">
        <p class="caps">Score de Consistência</p>
        <div class="strio">
          <div class="strioi"><p class="striol">Hoje</p><p class="striov" style="color:#C9845A">${todayScore}</p></div>
          <div class="strioi"><p class="striol">Semana</p><p class="striov" style="color:#7A836A">${weekAvg}</p></div>
          <div class="strioi"><p class="striol">Mês</p><p class="striov" style="color:#A5AA94">—</p></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:4px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${latest?'0':'8px'}">
          <p class="caps" style="margin:0">Medidas corporais</p>
          <button id="addMeasBtn" style="background:none;border:none;font-size:12px;color:#7A836A;font-weight:600;cursor:pointer">+ Registrar</button>
        </div>
        ${latest ? `
          ${[['Cintura',latest.waist],['Quadril',latest.hip],['Abdômen',latest.abdomen],['Braço',latest.arm],['Coxa',latest.thigh]]
            .filter(([,v])=>v).map(([n,v]) => `
              <div class="measrow"><span class="measname">${n}</span><span class="measval">${v}cm</span></div>`).join('')}
          <p style="font-size:10px;color:#A5AA94;margin-top:8px">Última medição: ${latest.date || 'hoje'}</p>
        ` : `<p style="font-size:13px;color:#A5AA94;text-align:center;padding:8px 0">Nenhuma medição registrada</p>`}
      </div>

      <div class="card" id="addMeasCard" style="display:none;margin-bottom:12px">
        <p class="caps">Nova medida</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div><label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">Cintura (cm)</label><input class="form-input" id="mWaist" type="number"></div>
          <div><label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">Quadril (cm)</label><input class="form-input" id="mHip" type="number"></div>
          <div><label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">Abdômen (cm)</label><input class="form-input" id="mAbdomen" type="number"></div>
          <div><label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">Braço (cm)</label><input class="form-input" id="mArm" type="number"></div>
          <div><label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">Coxa (cm)</label><input class="form-input" id="mThigh" type="number"></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn-ok" id="saveMeasBtn">Salvar</button>
          <button class="btn-adj" id="cancelMeasBtn">Cancelar</button>
        </div>
      </div>

      <div class="card">
        <p class="caps">Fotos de Progresso · ${Utils.formatMonth()}</p>
        <div class="pslots">
          ${['Frente','Lado','Costas'].map(l => `
            <div class="pslot">
              <div class="pbox"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A5AA94" stroke-width="1.5" stroke-linecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
              <span class="pbox-lbl">${l}</span>
            </div>`).join('')}
        </div>
        <p style="font-size:11px;color:#7A7570;text-align:center;margin-top:10px">Armazenadas no dispositivo · nunca enviadas</p>
      </div>`;

    if (weightHistory.length > 1) {
      const MN = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      Charts.barChart('weightChartProg',
        weightHistory.map(w => w.kg),
        { labels: weightHistory.map(w => MN[new Date(w.date+'T12:00:00').getMonth()]), color:'#C9845A', height:72 }
      );
    }

    document.getElementById('addWeightBtn').addEventListener('click', () => {
      const c = document.getElementById('addWeightCard');
      c.style.display = c.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('saveWeightBtn').addEventListener('click', () => {
      const kg = parseFloat(document.getElementById('weightInput').value);
      if (!kg || kg < 30 || kg > 250) return;
      Storage.weight.addEntry(kg);
      render();
    });

    document.getElementById('addMeasBtn').addEventListener('click', () => {
      const c = document.getElementById('addMeasCard');
      c.style.display = c.style.display === 'none' ? 'block' : 'none';
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
      document.getElementById('addMeasCard').style.display = 'none';
    });
  }

  return { render };
})();
