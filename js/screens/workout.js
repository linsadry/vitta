/**
 * screens/workout.js — Tela "Treino"
 *
 * Fase 2 — Treinos estruturados (Treino A/B/C/D, progressão de carga).
 *
 * Abas dinâmicas: uma por plano ativo (fitness_workout_plans), mais
 * "Cardio" e "Mobilidade" (registro livre, fitness_workouts) e
 * "⚙ Planos" (gerenciar planos/exercícios).
 */

const ScreenWorkout = (() => {
  let activeTab    = null;        // id do plano ativo | 'corr' | 'yoga' | 'manage'
  let expandedSet  = new Set();   // exercise.id com <details> aberto
  let expandedProg = new Set();   // exercise.id com gráfico de progressão visível
  let setCounts    = {};          // exercise.id -> nº de linhas de série exibidas

  // ── HELPERS ───────────────────────────────────────────────────

  /** Sugere o próximo nome no padrão "Treino A/B/C/D...". */
  function nextPlanName(plans) {
    const used = new Set(plans.map(p => {
      const m = /^Treino ([A-Z])$/.exec(p.name || '');
      return m ? m[1] : null;
    }).filter(Boolean));
    for (let i = 0; i < 26; i++) {
      const L = String.fromCharCode(65 + i);
      if (!used.has(L)) return `Treino ${L}`;
    }
    return `Treino ${plans.length + 1}`;
  }

  function targetTags(ex) {
    const tags = [];
    if (ex.target_sets || ex.target_reps) tags.push(`${ex.target_sets || '—'}×${ex.target_reps || '—'}`);
    if (ex.target_load) tags.push(`${Utils.formatNum(ex.target_load, ex.target_load % 1 ? 1 : 0)}kg`);
    return tags;
  }

  // ── INDICADORES ──────────────────────────────────────────────

  function renderIndicators(weekCount, weekGoal, monthCount, weekVolume) {
    return `
      <div class="strio">
        <div class="strioi">
          <p class="striol">Esta semana</p>
          <p class="striov" style="color:#7A836A">${weekCount}/${weekGoal}</p>
        </div>
        <div class="strioi">
          <p class="striol">Este mês</p>
          <p class="striov" style="color:#C9845A">${monthCount}</p>
        </div>
        <div class="strioi">
          <p class="striol">Volume · 7 dias</p>
          <p class="striov" style="color:#A5AA94;font-size:18px">${Math.round(weekVolume).toLocaleString('pt-BR')}<span style="font-size:10px"> kg</span></p>
        </div>
      </div>`;
  }

  // ── TABS ─────────────────────────────────────────────────────

  function renderTabs(plans) {
    const tabs = [
      ...plans.map(p => ({ id: p.id, label: p.name })),
      { id: 'corr',   label: '🏃 Cardio' },
      { id: 'yoga',   label: '🧘 Mobilidade' },
      { id: 'manage', label: '⚙ Planos' },
    ];
    return `<div class="tabs" id="workTabs">
      ${tabs.map(t => `<button class="chip ${t.id === activeTab ? 'chip-on' : 'chip-off'}" data-tab="${t.id}">${t.label}</button>`).join('')}
    </div>`;
  }

  // ── EXERCÍCIO (registro de séries) ──────────────────────────────

  function renderExerciseCard(ex, todayLogs) {
    const sortedLogs = [...todayLogs].sort((a, b) => (a.set_number || 0) - (b.set_number || 0));
    const targetSets = ex.target_sets || 1;
    const done       = sortedLogs.length >= targetSets && sortedLogs.length > 0;
    const rowCount   = setCounts[ex.id] || Math.max(targetSets, sortedLogs.length, 1);
    const tags       = targetTags(ex);
    const isOpen     = expandedSet.has(ex.id);
    const showProg   = expandedProg.has(ex.id);

    return `
      <details class="exdetails" data-ex="${ex.id}" ${isOpen ? 'open' : ''}>
        <summary class="exrow" style="cursor:pointer">
          <span class="exname">${ex.name}</span>
          <div class="extags">
            ${tags.map(t => `<span class="etag">${t}</span>`).join('')}
            ${done ? `<span class="etag" style="background:var(--color-olive);color:#fff">✓ hoje</span>` : ''}
          </div>
        </summary>
        <div style="padding:8px 0 4px">
          ${Array.from({ length: rowCount }, (_, i) => {
            const log = sortedLogs[i];
            return `
              <div style="display:grid;grid-template-columns:56px 1fr 1fr;gap:8px;align-items:center;margin-bottom:6px">
                <span style="font-size:11px;color:#A5AA94">Série ${i + 1}</span>
                <input class="form-input" data-set-input data-ex="${ex.id}" data-set="${i}" data-field="reps"
                  type="number" inputmode="numeric" min="0"
                  placeholder="${ex.target_reps || 'reps'}" value="${log?.reps ?? ''}">
                <input class="form-input" data-set-input data-ex="${ex.id}" data-set="${i}" data-field="load"
                  type="number" step="0.5" inputmode="decimal" min="0"
                  placeholder="${ex.target_load ?? 'kg'}" value="${log?.load ?? ''}">
              </div>`;
          }).join('')}
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            <button class="btn-adj" data-add-set="${ex.id}" type="button" style="flex:0 0 auto;padding:10px 14px">+ Série</button>
            <button class="btn-ok" data-save-sets="${ex.id}" type="button" style="flex:1 1 100px">Salvar</button>
            <button class="btn-adj" data-toggle-prog="${ex.id}" type="button" style="flex:0 0 auto;padding:10px 14px">${showProg ? 'Ocultar gráfico' : 'Progressão'}</button>
          </div>
          ${showProg ? `<div class="card-alt" style="margin-top:8px;padding:12px 12px 8px"><div data-prog-chart="${ex.id}"></div></div>` : ''}
        </div>
      </details>`;
  }

  // ── ABA DE PLANO (Treino A/B/C/D...) ────────────────────────────

  function renderPlanTab(plan, todayLogsByEx) {
    if (!plan.exercises.length) {
      return `<div class="empty">
        <div class="eico">🏋️</div>
        <p class="etxt">Nenhum exercício neste treino ainda</p>
        <button class="btn-ok" data-goto-manage type="button" style="width:auto;padding:10px 18px">Adicionar exercícios</button>
      </div>`;
    }
    return `<div class="card">
      ${plan.exercises.map(ex => renderExerciseCard(ex, todayLogsByEx[ex.id] || [])).join('')}
    </div>`;
  }

  // ── ABA "⚙ PLANOS" — gerenciar treinos e exercícios ─────────────

  function renderExerciseEditRow(ex) {
    return `
      <div data-exercise-row="${ex.id}" style="display:grid;grid-template-columns:2fr 0.8fr 1fr 0.9fr auto;gap:6px;margin-bottom:6px;align-items:center">
        <input class="form-input" data-ex-id="${ex.id}" data-field="name" value="${ex.name || ''}" placeholder="Exercício">
        <input class="form-input" data-ex-id="${ex.id}" data-field="target_sets" type="number" min="1" inputmode="numeric" value="${ex.target_sets ?? ''}" placeholder="Séries">
        <input class="form-input" data-ex-id="${ex.id}" data-field="target_reps" value="${ex.target_reps || ''}" placeholder="Reps">
        <input class="form-input" data-ex-id="${ex.id}" data-field="target_load" type="number" step="0.5" min="0" inputmode="decimal" value="${ex.target_load ?? ''}" placeholder="Carga">
        <button data-remove-exercise="${ex.id}" type="button" style="background:none;border:none;font-size:18px;color:#C9845A;cursor:pointer;padding:0 2px">×</button>
      </div>`;
  }

  function renderManageTab(plans) {
    return `
      ${plans.map(p => `
        <details class="card" data-plan-details="${p.id}" style="margin-bottom:12px" ${expandedSet.has('plan_' + p.id) ? 'open' : ''}>
          <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center">
            <span style="font-family:var(--font-display);font-size:16px;font-weight:700;color:#2C2B28">${p.name}</span>
            <span style="font-size:11px;color:#A5AA94">${p.exercises.length} exercício${p.exercises.length === 1 ? '' : 's'}</span>
          </summary>
          <div style="margin-top:12px">
            <label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">Nome do treino</label>
            <input class="form-input" data-plan-id="${p.id}" data-field="name" value="${p.name}" style="margin-bottom:12px;font-weight:600">

            <p class="caps" style="margin-bottom:6px">Exercícios</p>
            <div id="exList_${p.id}">
              ${p.exercises.map(ex => renderExerciseEditRow(ex)).join('')}
              ${!p.exercises.length ? `<p style="font-size:12px;color:#A5AA94;text-align:center;padding:6px 0">Nenhum exercício ainda</p>` : ''}
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
              <button class="btn-adj" data-add-exercise="${p.id}" type="button" style="flex:0 0 auto">+ Exercício</button>
              <button class="btn-adj" data-delete-plan="${p.id}" type="button" style="flex:0 0 auto;color:#C9845A">Excluir treino</button>
            </div>
          </div>
        </details>`).join('')}
      <button class="mainbtn" id="addPlanBtn" type="button" style="background:var(--color-olive)">+ Novo Treino</button>
      ${!plans.length ? `<p style="font-size:12px;color:#A5AA94;text-align:center;margin-top:10px">Crie seu primeiro treino (ex: "Treino A") e adicione os exercícios — sets, reps e carga alvo.</p>` : ''}`;
  }

  // ── ABA "CARDIO" (livre, fitness_workouts) ──────────────────────

  async function renderCardioTab() {
    const today = Utils.dateKey();
    const items = (await Storage.workouts.getByDate(today)).filter(w => w.tabType === 'corr');

    return `
      ${items.length ? items.map(w => `
        <div class="card">
          <div class="g2" style="margin:0">
            <div class="smini"><p class="sml">Distância</p><p class="smv">${w.distance || '—'} km</p></div>
            <div class="smini"><p class="sml">Tempo</p><p class="smv">${w.duration || '—'} min</p></div>
          </div>
        </div>`).join('') : `<div class="empty"><div class="eico">🏃</div><p class="etxt">Nenhum cardio hoje</p></div>`}
      <div class="card" style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <p class="caps" style="margin:0">Registrar cardio</p>
          <button id="toggleCorr" type="button" style="background:none;border:none;font-size:18px;color:#7A836A;cursor:pointer">+</button>
        </div>
        <div id="corrForm" style="display:none;margin-top:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <input class="form-input" id="corrDist" placeholder="Distância (km)" type="number" step="0.1" inputmode="decimal">
            <input class="form-input" id="corrTime" placeholder="Tempo (min)" type="number" inputmode="numeric">
          </div>
          <input class="form-input" id="corrNotes" placeholder="Obs (opcional)" style="margin-top:8px">
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn-ok" id="saveCorrBtn" type="button">Salvar</button>
            <button class="btn-adj" id="cancelCorrBtn" type="button">Cancelar</button>
          </div>
        </div>
      </div>`;
  }

  // ── ABA "MOBILIDADE" (livre, fitness_workouts) ──────────────────

  async function renderMobilidadeTab() {
    const today = Utils.dateKey();
    const items = (await Storage.workouts.getByDate(today)).filter(w => w.tabType === 'yoga');

    return `
      ${items.length ? items.map(w => `
        <div class="card">
          <p style="font-size:14px;font-weight:600;color:#2C2B28">${w.yogaType || 'Mobilidade'}</p>
          <p style="font-size:12px;color:#7A7570">${w.duration || '—'} minutos</p>
        </div>`).join('') : `<div class="empty"><div class="eico">🧘</div><p class="etxt">Nenhuma prática hoje</p></div>`}
      <div class="card" style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <p class="caps" style="margin:0">Registrar prática</p>
          <button id="toggleYoga" type="button" style="background:none;border:none;font-size:18px;color:#7A836A;cursor:pointer">+</button>
        </div>
        <div id="yogaForm" style="display:none;margin-top:12px">
          <input class="form-input" id="yogaType" placeholder="Tipo (ex: Mobilidade, Yin, Alongamento)" style="margin-bottom:8px">
          <input class="form-input" id="yogaDuration" placeholder="Duração (min)" type="number" inputmode="numeric">
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn-ok" id="saveYogaBtn" type="button">Salvar</button>
            <button class="btn-adj" id="cancelYogaBtn" type="button">Cancelar</button>
          </div>
        </div>
      </div>`;
  }

  // ── BINDINGS: CARDIO / MOBILIDADE ────────────────────────────────

  function bindCardioTab() {
    const toggleBtn = document.getElementById('toggleCorr');
    const form = document.getElementById('corrForm');
    toggleBtn?.addEventListener('click', () => {
      const open = form.style.display === 'none';
      form.style.display = open ? 'block' : 'none';
      toggleBtn.textContent = open ? '−' : '+';
    });
    document.getElementById('saveCorrBtn')?.addEventListener('click', async () => {
      const dist = parseFloat(document.getElementById('corrDist').value);
      const time = parseFloat(document.getElementById('corrTime').value);
      if (!dist && !time) return;
      await Storage.workouts.add({
        tabType: 'corr', type: 'Cardio',
        distance: dist || 0, duration: time || 0,
        notes: document.getElementById('corrNotes').value || '',
      });
      render();
    });
    document.getElementById('cancelCorrBtn')?.addEventListener('click', () => {
      form.style.display = 'none';
      toggleBtn.textContent = '+';
    });
  }

  function bindMobilidadeTab() {
    const toggleBtn = document.getElementById('toggleYoga');
    const form = document.getElementById('yogaForm');
    toggleBtn?.addEventListener('click', () => {
      const open = form.style.display === 'none';
      form.style.display = open ? 'block' : 'none';
      toggleBtn.textContent = open ? '−' : '+';
    });
    document.getElementById('saveYogaBtn')?.addEventListener('click', async () => {
      const type = document.getElementById('yogaType').value.trim() || 'Mobilidade';
      const dur  = parseFloat(document.getElementById('yogaDuration').value);
      if (!dur) return;
      await Storage.workouts.add({ tabType: 'yoga', type: 'Mobilidade', yogaType: type, duration: dur });
      render();
    });
    document.getElementById('cancelYogaBtn')?.addEventListener('click', () => {
      form.style.display = 'none';
      toggleBtn.textContent = '+';
    });
  }

  // ── BINDINGS: ABA DE PLANO ───────────────────────────────────────

  function bindPlanTab(plan, todayLogsByEx) {
    // Persistir estado aberto/fechado dos exercícios entre re-renders
    document.querySelectorAll('[data-ex]').forEach(el => {
      el.addEventListener('toggle', () => {
        if (el.open) expandedSet.add(el.dataset.ex);
        else expandedSet.delete(el.dataset.ex);
      });
    });

    document.querySelectorAll('[data-add-set]').forEach(btn => {
      btn.addEventListener('click', () => {
        const exId = btn.dataset.addSet;
        const ex   = plan.exercises.find(e => e.id === exId);
        const current = setCounts[exId] || Math.max(ex?.target_sets || 1, (todayLogsByEx[exId] || []).length, 1);
        setCounts[exId] = current + 1;
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
        inputs.forEach(inp => {
          const i = Number(inp.dataset.set);
          rowsMap[i] = rowsMap[i] || {};
          rowsMap[i][inp.dataset.field] = inp.value;
        });
        const sets = Object.keys(rowsMap).sort((a, b) => a - b).map(i => ({
          reps: rowsMap[i].reps !== '' && rowsMap[i].reps !== undefined ? parseInt(rowsMap[i].reps) : null,
          load: rowsMap[i].load !== '' && rowsMap[i].load !== undefined ? parseFloat(rowsMap[i].load) : null,
        }));
        await Storage.workoutLogs.replaceForExercise(Utils.dateKey(), exId, sets, plan.id, plan.name, ex.name);
        expandedSet.add(exId);
        render();
      });
    });

    document.querySelectorAll('[data-toggle-prog]').forEach(btn => {
      btn.addEventListener('click', () => {
        const exId = btn.dataset.toggleProg;
        if (expandedProg.has(exId)) expandedProg.delete(exId);
        else expandedProg.add(exId);
        expandedSet.add(exId);
        render();
      });
    });

    document.querySelector('[data-goto-manage]')?.addEventListener('click', () => {
      activeTab = 'manage';
      render();
    });

    // Gráficos de progressão (carga máxima por sessão)
    document.querySelectorAll('[data-prog-chart]').forEach(el => {
      const exId = el.dataset.progChart;
      Storage.workoutLogs.exerciseHistory(exId, 8).then(history => {
        if (!history.length) {
          el.innerHTML = `<p style="font-size:11px;color:#A5AA94;text-align:center">Nenhum registro anterior ainda</p>`;
          return;
        }
        Charts.barChart(el, history.map(h => h.maxLoad), {
          labels: history.map(h => Utils.formatDateShort(h.date)),
          color: '#7A836A', height: 64,
        });
      });
    });
  }

  // ── BINDINGS: ABA "⚙ PLANOS" ─────────────────────────────────────

  function bindManageTab(plans) {
    document.querySelectorAll('[data-plan-details]').forEach(el => {
      el.addEventListener('toggle', () => {
        const key = 'plan_' + el.dataset.planDetails;
        if (el.open) expandedSet.add(key);
        else expandedSet.delete(key);
      });
    });

    document.querySelectorAll('[data-plan-id][data-field="name"]').forEach(inp => {
      inp.addEventListener('change', async () => {
        await Storage.workoutPlans.update(inp.dataset.planId, { name: inp.value.trim() || 'Treino' });
        render();
      });
    });

    document.querySelectorAll('[data-ex-id]').forEach(inp => {
      inp.addEventListener('change', async () => {
        const field = inp.dataset.field;
        let value = inp.value;
        if (field === 'target_sets')      value = value === '' ? null : parseInt(value);
        else if (field === 'target_load') value = value === '' ? null : parseFloat(value);
        else if (field === 'name')        value = value.trim() || 'Exercício';
        const planId = inp.closest('[data-plan-details]')?.dataset.planDetails;
        if (planId) expandedSet.add('plan_' + planId);
        await Storage.workoutExercises.update(inp.dataset.exId, { [field]: value });
        render();
      });
    });

    document.querySelectorAll('[data-add-exercise]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const planId = btn.dataset.addExercise;
        expandedSet.add('plan_' + planId);
        await Storage.workoutExercises.add(planId, { name: 'Novo exercício', target_sets: 3, target_reps: '8-12', target_load: null });
        render();
      });
    });

    document.querySelectorAll('[data-remove-exercise]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover este exercício do plano? O histórico de séries já registradas é mantido.')) return;
        const planId = btn.closest('[data-plan-details]')?.dataset.planDetails;
        if (planId) expandedSet.add('plan_' + planId);
        await Storage.workoutExercises.remove(btn.dataset.removeExercise);
        render();
      });
    });

    document.querySelectorAll('[data-delete-plan]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Excluir este treino e seus exercícios? O histórico de séries já registradas é mantido.')) return;
        const planId = btn.dataset.deletePlan;
        await Storage.workoutPlans.remove(planId);
        if (activeTab === planId) activeTab = null;
        render();
      });
    });

    document.getElementById('addPlanBtn')?.addEventListener('click', async () => {
      const name = nextPlanName(plans);
      await Storage.workoutPlans.add({ name });
      const created = Storage.workoutPlans.getAll().find(p => p.name === name);
      if (created) expandedSet.add('plan_' + created.id);
      render();
    });
  }

  // ── RENDER PRINCIPAL ─────────────────────────────────────────────

  async function render() {
    const plans      = Storage.workoutPlans.getAll();
    const today      = Utils.dateKey();
    const weekDays   = Utils.lastNDays(7);
    const monthStart = today.slice(0, 8) + '01';

    const [todayLogsRaw, lastByPlan, weekDaysSet, monthDaysSet, weekVolume] = await Promise.all([
      Storage.workoutLogs.getByDate(today),
      Storage.workoutLogs.lastDateByPlan(),
      Storage.training.daysInRange(weekDays[0], weekDays[weekDays.length - 1]),
      Storage.training.daysInRange(monthStart, today),
      Storage.workoutLogs.volumeInRange(weekDays[0], weekDays[weekDays.length - 1]),
    ]);

    const todayLogsByEx = {};
    todayLogsRaw.forEach(l => { (todayLogsByEx[l.exercise_id] ||= []).push(l); });

    // Aba ativa padrão: plano sugerido pela rotação A/B/C/D, ou "Planos" se nenhum existir
    const validTabs = new Set(['corr', 'yoga', 'manage', ...plans.map(p => p.id)]);
    if (!activeTab || !validTabs.has(activeTab)) {
      activeTab = plans.length
        ? [...plans].sort((a, b) => (lastByPlan[a.id] || '0000-00-00').localeCompare(lastByPlan[b.id] || '0000-00-00'))[0].id
        : 'manage';
    }

    const weekGoal = Storage.prefs.get('goal_strength_week', 4);
    Utils.el('workSub').textContent = `${weekDaysSet.size}/${weekGoal} esta semana · ${monthDaysSet.size} este mês`;

    let bodyHtml;
    if (activeTab === 'manage') {
      bodyHtml = renderManageTab(plans);
    } else if (activeTab === 'corr') {
      bodyHtml = await renderCardioTab();
    } else if (activeTab === 'yoga') {
      bodyHtml = await renderMobilidadeTab();
    } else {
      const plan = plans.find(p => p.id === activeTab);
      bodyHtml = plan ? renderPlanTab(plan, todayLogsByEx) : renderManageTab(plans);
    }

    Utils.el('workContent').innerHTML = `
      ${renderIndicators(weekDaysSet.size, weekGoal, monthDaysSet.size, weekVolume)}
      ${renderTabs(plans)}
      <div id="workBody">${bodyHtml}</div>`;

    document.getElementById('workTabs').addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      activeTab = btn.dataset.tab;
      render();
    });

    if (activeTab === 'manage') {
      bindManageTab(plans);
    } else if (activeTab === 'corr') {
      bindCardioTab();
    } else if (activeTab === 'yoga') {
      bindMobilidadeTab();
    } else {
      const plan = plans.find(p => p.id === activeTab);
      if (plan) bindPlanTab(plan, todayLogsByEx);
    }
  }

  return { render };
})();
