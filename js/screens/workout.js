/**
 * screens/workout.js — Treinos (Fase 4 redesign premium)
 *
 * Visual: cards compactos estilo Hevy/Strong
 * Modo Overview → cards com estatísticas de progressão
 * Modo Execução → inputs de série inline compactos
 * Lógica 100% preservada.
 */

const ScreenWorkout = (() => {
  let activeTab   = null;
  let mode        = 'overview';
  let expandedSet = new Set();
  let setCounts   = {};

  // ── HELPERS ───────────────────────────────────────────────────
  function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function nextPlanName(plans) {
    const used = new Set(plans.map(p => (/^Treino ([A-Z])$/.exec(p.name||'')||[])[1]).filter(Boolean));
    for (let i = 0; i < 26; i++) { const L = String.fromCharCode(65+i); if (!used.has(L)) return `Treino ${L}`; }
    return `Treino ${plans.length + 1}`;
  }
  function loadStr(v) { if (!v && v !== 0) return '—'; const n = Number(v); return `${n % 1 === 0 ? n : n.toFixed(1)}kg`; }

  // ── CABEÇALHO / INDICADORES ───────────────────────────────────
  function renderHeader(weekCount, weekGoal, monthCount) {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:16px">
        <div style="text-align:center;background:#fff;border-radius:14px;padding:12px 6px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <p style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#3E6770;margin:0;line-height:1">${weekCount}<span style="font-size:13px;color:#A5AA94">/${weekGoal}</span></p>
          <p style="font-size:9px;font-weight:700;color:#A5AA94;text-transform:uppercase;letter-spacing:.08em;margin:3px 0 0">Semana</p>
        </div>
        <div style="text-align:center;background:#fff;border-radius:14px;padding:12px 6px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <p style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#5A7A56;margin:0;line-height:1">${monthCount}</p>
          <p style="font-size:9px;font-weight:700;color:#A5AA94;text-transform:uppercase;letter-spacing:.08em;margin:3px 0 0">Mês</p>
        </div>
        <div style="text-align:center;background:#fff;border-radius:14px;padding:12px 6px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <p style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#C9845A;margin:0;line-height:1">${weekGoal}</p>
          <p style="font-size:9px;font-weight:700;color:#A5AA94;text-transform:uppercase;letter-spacing:.08em;margin:3px 0 0">Meta/sem</p>
        </div>
      </div>`;
  }

  // ── TABS ─────────────────────────────────────────────────────
  function renderTabs(plans) {
    const tabs = [
      ...plans.map(p => ({ id: p.id, label: p.name })),
      { id: 'cardio',     label: 'Cardio' },
      { id: 'mobilidade', label: 'Mobilidade' },
      { id: 'manage',     label: '⚙ Planos' },
    ];
    return `<div class="tabs" id="workTabs" style="margin-bottom:14px">
      ${tabs.map(t => `<button class="chip ${t.id === activeTab ? 'chip-on' : 'chip-off'}" data-tab="${t.id}">${esc(t.label)}</button>`).join('')}
    </div>`;
  }

  // ── OVERVIEW: card de exercício compacto ──────────────────────
  function renderExerciseOverviewCard(ex, history, todayLogs) {
    const done      = todayLogs.some(l => l.reps);
    const last      = history.length ? history[history.length - 1] : null;
    const bestLoad  = history.length ? Math.max(0, ...history.map(h => h.maxLoad)) : 0;
    const firstLoad = history.length > 1 ? history[0].maxLoad : 0;
    const evo       = (last && firstLoad && last.maxLoad > firstLoad) ? +(last.maxLoad - firstLoad).toFixed(1) : null;
    const tagStr    = [ex.target_sets && ex.target_reps ? `${ex.target_sets}×${ex.target_reps}` : '',
                       ex.target_load ? `${ex.target_load}kg` : ''].filter(Boolean).join(' · ');

    return `
      <div class="ex-card">
        <div class="ex-card-header">
          <div>
            <p class="ex-card-name">${esc(ex.name)}</p>
            ${tagStr ? `<p style="font-size:10px;color:#A5AA94;margin:3px 0 0;font-weight:500">${tagStr}</p>` : ''}
          </div>
          ${done ? `<span style="background:#EDF4EC;color:#7A9B76;font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px">✓ hoje</span>` : ''}
        </div>
        <div class="ex-stats-grid">
          <div class="ex-stat-box">
            <p class="ex-stat-label">Última</p>
            <p class="ex-stat-value">${last ? loadStr(last.maxLoad) : '—'}</p>
          </div>
          <div class="ex-stat-box" style="background:#EBF4F7">
            <p class="ex-stat-label" style="color:#3E6770">Melhor</p>
            <p class="ex-stat-value" style="color:#3E6770">${bestLoad ? loadStr(bestLoad) : '—'}</p>
          </div>
          <div class="ex-stat-box" style="background:${evo ? '#EDF4EC' : 'var(--bg-card-alt)'}">
            <p class="ex-stat-label" style="color:${evo ? '#5A7A56' : '#A5AA94'}">Evolução</p>
            <p class="ex-stat-value" style="color:${evo ? '#5A7A56' : '#A5AA94'}">${evo ? `+${evo}kg` : '—'}</p>
          </div>
        </div>
      </div>`;
  }

  // ── OVERVIEW: painel do plano ─────────────────────────────────
  async function renderPlanOverview(plan, todayLogsByEx, lastByPlan) {
    if (!plan.exercises.length) {
      return `<div class="empty" style="padding:28px"><div class="eico">🏋️</div>
        <p class="etxt">Nenhum exercício neste treino</p>
        <button class="btn-ok" data-goto-manage style="width:auto;padding:10px 20px">Adicionar exercícios</button></div>`;
    }
    const histories = await Promise.all(plan.exercises.map(ex => Storage.workoutLogs.exerciseHistory(ex.id, 10)));
    const lastDate  = lastByPlan[plan.id];
    const hasTodayLogs = plan.exercises.some(ex => (todayLogsByEx[ex.id] || []).length > 0);

    return `
      <div style="display:grid;grid-template-columns:1fr auto;align-items:center;margin-bottom:14px;padding:0 2px">
        <p style="font-size:11px;color:#A5AA94;margin:0">${lastDate ? `Última: ${Utils.formatDateShort(lastDate)}` : 'Nunca executado'} · ${plan.exercises.length} exercício${plan.exercises.length !== 1 ? 's' : ''}</p>
        <button id="startWorkoutBtn" style="background:#3E6770;color:#fff;border:none;border-radius:22px;padding:10px 18px;font-size:12px;font-weight:700;cursor:pointer">
          ${hasTodayLogs ? 'Continuar' : 'Iniciar Treino'}
        </button>
      </div>
      <div class="card" style="padding:4px 16px">
        ${plan.exercises.map((ex, i) => renderExerciseOverviewCard(ex, histories[i] || [], todayLogsByEx[ex.id] || [])).join('')}
      </div>`;
  }

  // ── EXECUÇÃO: card de exercício com inputs ────────────────────
  function renderExerciseExecuteCard(ex, todayLogs) {
    const sorted     = [...todayLogs].sort((a,b) => (a.set_number||0)-(b.set_number||0));
    const targetSets = ex.target_sets || 3;
    const done       = sorted.length >= targetSets && sorted.length > 0;
    const rowCount   = setCounts[ex.id] || Math.max(targetSets, sorted.length, 1);
    const isOpen     = expandedSet.has(ex.id);

    return `
      <details class="exdetails" data-ex="${ex.id}" ${isOpen ? 'open' : ''}>
        <summary class="exrow" style="cursor:pointer;padding:14px 0">
          <span class="exname" style="font-size:14px;font-weight:600">${esc(ex.name)}</span>
          <div class="extags">
            ${ex.target_sets ? `<span class="etag">${ex.target_sets}×${ex.target_reps||'—'}</span>` : ''}
            ${done ? `<span class="etag" style="background:#7A9B76;color:#fff">✓</span>` : ''}
          </div>
        </summary>
        <div style="padding:4px 0 12px">
          <div style="display:grid;grid-template-columns:48px 1fr 1fr;gap:6px;align-items:center;margin-bottom:6px">
            <span class="set-label">Série</span>
            <span class="set-label">Reps</span>
            <span class="set-label">Carga (kg)</span>
          </div>
          ${Array.from({length: rowCount}, (_, i) => {
            const log = sorted[i];
            return `<div class="set-row">
              <span style="font-size:11px;font-weight:600;color:#A5AA94;text-align:center">${i+1}</span>
              <input class="form-input" data-set-input data-ex="${ex.id}" data-set="${i}" data-field="reps"
                type="number" inputmode="numeric" min="0"
                placeholder="${ex.target_reps||'—'}" value="${log?.reps ?? ''}" style="padding:10px;text-align:center">
              <input class="form-input" data-set-input data-ex="${ex.id}" data-set="${i}" data-field="load"
                type="number" step="0.5" inputmode="decimal" min="0"
                placeholder="${ex.target_load ?? '—'}" value="${log?.load ?? ''}" style="padding:10px;text-align:center">
            </div>`;
          }).join('')}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
            <button class="btn-adj" data-add-set="${ex.id}" style="padding:10px">+ Série</button>
            <button class="btn-ok"  data-save-sets="${ex.id}" style="padding:10px">Salvar</button>
          </div>
        </div>
      </details>`;
  }

  function renderPlanExecute(plan, todayLogsByEx) {
    return `
      <div style="background:#EBF4F7;border-radius:16px;padding:14px 16px;margin-bottom:14px">
        <p style="font-size:9px;font-weight:700;color:#3E6770;text-transform:uppercase;letter-spacing:.1em;margin:0 0 2px">Em execução</p>
        <p style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#2C2B28;margin:0">${esc(plan.name)}</p>
      </div>
      <div class="card" style="padding:4px 16px 8px;margin-bottom:14px">
        ${plan.exercises.map(ex => renderExerciseExecuteCard(ex, todayLogsByEx[ex.id]||[])).join('')}
      </div>
      <button class="mainbtn" id="finishWorkoutBtn" style="background:#7A9B76">✓ Concluir Treino</button>`;
  }

  // ── MANAGE: editar exercícios ──────────────────────────────────
  function renderExerciseEditRow(ex) {
    return `
      <div style="display:grid;grid-template-columns:2fr 0.8fr 1fr 0.9fr auto;gap:6px;margin-bottom:6px;align-items:center">
        <input class="form-input" data-ex-id="${ex.id}" data-field="name" value="${esc(ex.name||'')}" placeholder="Exercício">
        <input class="form-input" data-ex-id="${ex.id}" data-field="target_sets" type="number" min="1" inputmode="numeric" value="${ex.target_sets??''}" placeholder="Sér">
        <input class="form-input" data-ex-id="${ex.id}" data-field="target_reps" value="${esc(ex.target_reps||'')}" placeholder="Reps">
        <input class="form-input" data-ex-id="${ex.id}" data-field="target_load" type="number" step="0.5" inputmode="decimal" value="${ex.target_load??''}" placeholder="kg">
        <button data-remove-exercise="${ex.id}" style="background:none;border:none;font-size:18px;color:#C9845A;cursor:pointer;padding:0 2px">×</button>
      </div>`;
  }

  function renderManageTab(plans) {
    return `
      ${plans.map(p => `
        <details class="card" data-plan-details="${p.id}" style="margin-bottom:10px" ${expandedSet.has('plan_'+p.id)?'open':''}>
          <summary style="cursor:pointer;display:grid;grid-template-columns:1fr auto;align-items:center">
            <span style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#2C2B28">${esc(p.name)}</span>
            <span style="font-size:11px;color:#A5AA94">${p.exercises.length} ex.</span>
          </summary>
          <div style="margin-top:14px">
            <label class="field-label">Nome do treino</label>
            <input class="form-input" data-plan-id="${p.id}" data-field="name" value="${esc(p.name)}" style="margin-bottom:14px;font-weight:600">
            <p class="capsule-label">Exercícios</p>
            ${p.exercises.map(ex => renderExerciseEditRow(ex)).join('')}
            ${!p.exercises.length ? `<p style="font-size:12px;color:#A5AA94;padding:6px 0;text-align:center">Nenhum exercício ainda</p>` : ''}
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="btn-adj" data-add-exercise="${p.id}">+ Exercício</button>
              <button class="btn-adj" data-delete-plan="${p.id}" style="color:#C9845A">Excluir</button>
            </div>
          </div>
        </details>`).join('')}
      <button class="mainbtn" id="addPlanBtn" style="background:#3E6770">+ Novo Treino</button>`;
  }

  // ── ABA CARDIO ────────────────────────────────────────────────
  async function renderCardioTab() {
    const today     = Utils.dateKey();
    const weekStats = await Storage.cardio.getWeekStats();
    const todayLogs = await Storage.cardio.getByDate(today);
    const types     = ['Caminhada','Corrida','Bicicleta','Elíptico','Natação','Outro'];

    return `
      <div class="card" style="margin-bottom:10px">
        <p class="capsule-label">Esta semana</p>
        <div class="cardio-stat-row">
          <div class="cardio-stat-item">
            <p class="cardio-stat-val">${weekStats.days.size}</p>
            <p class="cardio-stat-lbl">Sessões</p>
          </div>
          <div class="cardio-stat-item">
            <p class="cardio-stat-val">${weekStats.totalMin}</p>
            <p class="cardio-stat-lbl">Minutos</p>
          </div>
          <div class="cardio-stat-item">
            <p class="cardio-stat-val">${weekStats.totalKm.toFixed(1)}</p>
            <p class="cardio-stat-lbl">km</p>
          </div>
        </div>
      </div>
      ${todayLogs.length ? `
        <p class="capsule-label" style="margin-bottom:8px">Hoje</p>
        ${todayLogs.map(c => `
          <div class="card" style="margin-bottom:8px;padding:12px 16px">
            <div style="display:grid;grid-template-columns:1fr auto;align-items:center">
              <div>
                <p style="font-size:13px;font-weight:600;color:#2C2B28;margin:0 0 2px">${esc(c.type)}</p>
                <p style="font-size:11px;color:#A5AA94;margin:0">
                  ${[c.duration_min ? c.duration_min+'min' : '', c.distance_km ? c.distance_km+'km' : '', c.intensity||''].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button data-del-cardio="${c.id}" style="background:none;border:none;color:#D4C4B0;font-size:18px;cursor:pointer">×</button>
            </div>
          </div>`).join('')}
      ` : ''}
      <div class="card" style="margin-top:4px">
        <p class="capsule-label">Registrar</p>
        <label class="field-label">Tipo</label>
        <select class="form-input" id="cardioTypeSelect" style="margin-bottom:10px">
          ${types.map(t=>`<option>${t}</option>`).join('')}
        </select>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <label class="field-label">Duração (min)</label>
            <input class="form-input" id="cardioDurField" type="number" inputmode="numeric" placeholder="30">
          </div>
          <div>
            <label class="field-label">Distância (km)</label>
            <input class="form-input" id="cardioDistField" type="number" step="0.1" inputmode="decimal" placeholder="—">
          </div>
        </div>
        <label class="field-label">Intensidade</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:16px">
          ${['Leve','Moderada','Alta'].map((v,i) => `
            <label style="text-align:center;padding:9px 0;border:1.5px solid ${i===1?'#3E6770':'#E8E0D0'};border-radius:12px;font-size:11px;font-weight:600;cursor:pointer;color:${i===1?'#3E6770':'#7A7570'}">
              <input type="radio" name="cardioIntFld" value="${v}" ${i===1?'checked':''} style="display:none">${v}
            </label>`).join('')}
        </div>
        <button class="mainbtn" id="saveCardioFld" style="background:#3E6770">Salvar Cardio</button>
      </div>`;
  }

  // ── ABA MOBILIDADE ────────────────────────────────────────────
  async function renderMobilidadeTab() {
    const today = Utils.dateKey();
    const items = (await Storage.workouts.getByDate(today)).filter(w => w.tabType==='yoga');
    return `
      ${items.length ? items.map(w => `
        <div class="card" style="margin-bottom:8px;padding:14px 16px">
          <p style="font-size:13px;font-weight:600;color:#2C2B28;margin:0 0 2px">${esc(w.yogaType||'Mobilidade')}</p>
          <p style="font-size:11px;color:#A5AA94;margin:0">${w.duration||'—'} min</p>
        </div>`).join('') : `<div class="empty"><div class="eico">🧘</div><p class="etxt">Nenhuma prática hoje</p></div>`}
      <div class="card" style="margin-top:8px">
        <div style="display:grid;grid-template-columns:1fr auto;align-items:center;margin-bottom:0">
          <p class="capsule-label" style="margin:0">Registrar</p>
          <button id="toggleYoga" style="background:none;border:none;font-size:20px;color:#3E6770;cursor:pointer">+</button>
        </div>
        <div id="yogaForm" style="display:none;margin-top:12px">
          <input class="form-input" id="yogaType" placeholder="Tipo (ex: Mobilidade, Yin)" style="margin-bottom:8px">
          <input class="form-input" id="yogaDuration" placeholder="Duração (min)" type="number" inputmode="numeric" style="margin-bottom:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <button class="btn-ok" id="saveYogaBtn">Salvar</button>
            <button class="btn-adj" id="cancelYogaBtn">Cancelar</button>
          </div>
        </div>
      </div>`;
  }

  // ── BINDINGS ──────────────────────────────────────────────────
  function bindCardioTab() {
    document.querySelectorAll('input[name="cardioIntFld"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('input[name="cardioIntFld"]').forEach(x => {
          const l = x.closest('label');
          l.style.borderColor = x.checked ? '#3E6770' : '#E8E0D0';
          l.style.color = x.checked ? '#3E6770' : '#7A7570';
        });
      });
    });
    document.getElementById('saveCardioFld')?.addEventListener('click', async () => {
      const dur = parseInt(document.getElementById('cardioDurField').value);
      if (!dur) return;
      await Storage.cardio.add({
        type: document.getElementById('cardioTypeSelect').value,
        duration_min: dur,
        distance_km: parseFloat(document.getElementById('cardioDistField').value) || null,
        intensity: document.querySelector('input[name="cardioIntFld"]:checked')?.value || null,
      });
      render();
    });
    document.querySelectorAll('[data-del-cardio]').forEach(btn => {
      btn.addEventListener('click', async () => { await Storage.cardio.delete(btn.dataset.delCardio); render(); });
    });
  }

  function bindMobilidadeTab() {
    const toggle = document.getElementById('toggleYoga');
    const form   = document.getElementById('yogaForm');
    toggle?.addEventListener('click', () => {
      const open = form.style.display === 'none';
      form.style.display = open ? 'block' : 'none';
      toggle.textContent = open ? '−' : '+';
    });
    document.getElementById('saveYogaBtn')?.addEventListener('click', async () => {
      const type = document.getElementById('yogaType').value.trim() || 'Mobilidade';
      const dur  = parseFloat(document.getElementById('yogaDuration').value);
      if (!dur) return;
      await Storage.workouts.add({ tabType: 'yoga', type: 'Mobilidade', yogaType: type, duration: dur });
      render();
    });
    document.getElementById('cancelYogaBtn')?.addEventListener('click', () => {
      form.style.display = 'none'; toggle.textContent = '+';
    });
  }

  function bindPlanExecute(plan, todayLogsByEx) {
    document.querySelectorAll('[data-ex]').forEach(el => {
      el.addEventListener('toggle', () => {
        if (el.open) expandedSet.add(el.dataset.ex); else expandedSet.delete(el.dataset.ex);
      });
    });
    document.querySelectorAll('[data-add-set]').forEach(btn => {
      btn.addEventListener('click', () => {
        const exId = btn.dataset.addSet;
        const ex   = plan.exercises.find(e => e.id === exId);
        setCounts[exId] = (setCounts[exId] || Math.max(ex?.target_sets||1, (todayLogsByEx[exId]||[]).length, 1)) + 1;
        expandedSet.add(exId);
        render();
      });
    });
    document.querySelectorAll('[data-save-sets]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const exId = btn.dataset.saveSets;
        const ex   = plan.exercises.find(e => e.id === exId);
        const inputs = document.querySelectorAll(`[data-set-input][data-ex="${exId}"]`);
        const rowsMap = {};
        inputs.forEach(inp => { const i = Number(inp.dataset.set); rowsMap[i] = rowsMap[i] || {}; rowsMap[i][inp.dataset.field] = inp.value; });
        const sets = Object.keys(rowsMap).sort((a,b)=>a-b).map(i => ({
          reps: rowsMap[i].reps !== '' ? parseInt(rowsMap[i].reps) : null,
          load: rowsMap[i].load !== '' ? parseFloat(rowsMap[i].load) : null,
        }));
        await Storage.workoutLogs.replaceForExercise(Utils.dateKey(), exId, sets, plan.id, plan.name, ex.name);
        expandedSet.add(exId);
        render();
      });
    });
    document.getElementById('startWorkoutBtn')?.addEventListener('click', () => { mode='execute'; render(); });
    document.getElementById('finishWorkoutBtn')?.addEventListener('click', async () => {
      const h = Storage.habits.getToday(); h.workout = true; Storage.habits.setToday(h);
      mode = 'overview'; setCounts = {}; expandedSet.clear();
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#7A9B76;color:#fff;padding:12px 26px;border-radius:22px;font-size:14px;font-weight:700;z-index:200;';
      t.textContent = '✓ Treino concluído!';
      document.getElementById('app').appendChild(t);
      setTimeout(() => t.remove(), 2500);
      render();
    });
    document.querySelector('[data-goto-manage]')?.addEventListener('click', () => { activeTab='manage'; mode='manage'; render(); });
  }

  function bindManageTab(plans) {
    document.querySelectorAll('[data-plan-details]').forEach(el => {
      el.addEventListener('toggle', () => { const k='plan_'+el.dataset.planDetails; if(el.open) expandedSet.add(k); else expandedSet.delete(k); });
    });
    document.querySelectorAll('[data-plan-id][data-field="name"]').forEach(inp => {
      inp.addEventListener('change', async () => { await Storage.workoutPlans.update(inp.dataset.planId, { name: inp.value.trim()||'Treino' }); render(); });
    });
    document.querySelectorAll('[data-ex-id]').forEach(inp => {
      inp.addEventListener('change', async () => {
        const field = inp.dataset.field;
        let value = inp.value;
        if (field==='target_sets') value = value==='' ? null : parseInt(value);
        else if (field==='target_load') value = value==='' ? null : parseFloat(value);
        else if (field==='name') value = value.trim()||'Exercício';
        const planId = inp.closest('[data-plan-details]')?.dataset.planDetails;
        if (planId) expandedSet.add('plan_'+planId);
        await Storage.workoutExercises.update(inp.dataset.exId, { [field]: value }); render();
      });
    });
    document.querySelectorAll('[data-add-exercise]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const planId = btn.dataset.addExercise;
        expandedSet.add('plan_'+planId);
        await Storage.workoutExercises.add(planId, { name:'Novo exercício', target_sets:3, target_reps:'8-12', target_load:null }); render();
      });
    });
    document.querySelectorAll('[data-remove-exercise]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover exercício? Histórico mantido.')) return;
        const planId = btn.closest('[data-plan-details]')?.dataset.planDetails;
        if (planId) expandedSet.add('plan_'+planId);
        await Storage.workoutExercises.remove(btn.dataset.removeExercise); render();
      });
    });
    document.querySelectorAll('[data-delete-plan]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Excluir treino? Histórico mantido.')) return;
        const planId = btn.dataset.deletePlan;
        await Storage.workoutPlans.remove(planId);
        if (activeTab===planId) { activeTab=null; mode='overview'; } render();
      });
    });
    document.getElementById('addPlanBtn')?.addEventListener('click', async () => {
      const name = nextPlanName(plans);
      await Storage.workoutPlans.add({ name });
      const created = Storage.workoutPlans.getAll().find(p => p.name===name);
      if (created) expandedSet.add('plan_'+created.id);
      render();
    });
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────────
  async function render() {
    const plans      = Storage.workoutPlans.getAll();
    const today      = Utils.dateKey();
    const weekDays   = Utils.lastNDays(7);
    const monthStart = today.slice(0,8) + '01';

    const [todayLogsRaw, lastByPlan, weekDaysSet, monthDaysSet] = await Promise.all([
      Storage.workoutLogs.getByDate(today),
      Storage.workoutLogs.lastDateByPlan(),
      Storage.training.daysInRange(weekDays[0], weekDays[weekDays.length-1]),
      Storage.training.daysInRange(monthStart, today),
    ]);

    const todayLogsByEx = {};
    todayLogsRaw.forEach(l => { (todayLogsByEx[l.exercise_id] ||= []).push(l); });

    const validTabs = new Set(['cardio','mobilidade','manage',...plans.map(p=>p.id)]);
    if (!activeTab || !validTabs.has(activeTab)) {
      activeTab = plans.length
        ? [...plans].sort((a,b)=>(lastByPlan[a.id]||'0000-00-00').localeCompare(lastByPlan[b.id]||'0000-00-00'))[0].id
        : 'manage';
    }

    const isPlanTab = plans.some(p => p.id === activeTab);
    if (!isPlanTab) mode = 'overview';

    const weekGoal = Storage.prefs.get('goal_strength_week', 4);
    Utils.el('workSub').textContent = `${weekDaysSet.size}/${weekGoal} esta semana · ${monthDaysSet.size} este mês`;

    let bodyHtml;
    if (activeTab==='manage') {
      mode='manage'; bodyHtml = renderManageTab(plans);
    } else if (activeTab==='cardio') {
      bodyHtml = await renderCardioTab();
    } else if (activeTab==='mobilidade') {
      bodyHtml = await renderMobilidadeTab();
    } else {
      const plan = plans.find(p => p.id===activeTab);
      if (!plan) bodyHtml = renderManageTab(plans);
      else if (mode==='execute') bodyHtml = renderPlanExecute(plan, todayLogsByEx);
      else bodyHtml = await renderPlanOverview(plan, todayLogsByEx, lastByPlan);
    }

    Utils.el('workContent').innerHTML =
      renderHeader(weekDaysSet.size, weekGoal, monthDaysSet.size) +
      renderTabs(plans) +
      `<div id="workBody">${bodyHtml}</div>`;

    document.getElementById('workTabs')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      if (btn.dataset.tab !== activeTab) { mode='overview'; setCounts={}; expandedSet.clear(); }
      activeTab = btn.dataset.tab; render();
    });

    if (activeTab==='manage') bindManageTab(plans);
    else if (activeTab==='cardio') bindCardioTab();
    else if (activeTab==='mobilidade') bindMobilidadeTab();
    else { const plan=plans.find(p=>p.id===activeTab); if(plan) bindPlanExecute(plan, todayLogsByEx); }
  }

  return { render };
})();
