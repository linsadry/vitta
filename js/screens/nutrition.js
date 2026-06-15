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

