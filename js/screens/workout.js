/**
 * screens/workout.js — Tela "Treinos"
 *
 * Fase 4 — Redesign:
 *   · Modo Overview  — cards de exercício com última carga / melhor carga / evolução
 *   · Modo Execução  — inputs de série + botão Concluir Treino
 *   · Modo Planejamento — editar exercícios e planos (tab ⚙)
 *   · Cardio — usa cardio_logs, mostra frequência semanal + totais
 */

const ScreenWorkout = (() => {
  let activeTab   = null;
  let mode        = 'overview';   // 'overview' | 'execute' | 'manage'
  let expandedSet = new Set();
  let setCounts   = {};

  // ── HELPERS ───────────────────────────────────────────────────

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

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function loadStr(v) {
    if (!v && v !== 0) return '—';
    return `${Number(v) % 1 === 0 ? Number(v) : Number(v).toFixed(1)} kg`;
  }

  // ── INDICADORES ──────────────────────────────────────────────

  function renderIndicators(weekCount, weekGoal, monthCount) {
    return `
      <div class="strio" style="margin-bottom:12px">
        <div class="strioi">
          <p class="striol">Esta semana</p>
          <p class="striov" style="color:#7A9B76">${weekCount}/${weekGoal}</p>
        </div>
        <div class="strioi">
          <p class="striol">Este mês</p>
          <p class="striov" style="color:#3E6770">${monthCount}</p>
        </div>
      </div>`;
  }

  // ── TABS ─────────────────────────────────────────────────────

  function renderTabs(plans) {
    const tabs = [
      ...plans.map(p => ({ id: p.id, label: p.name })),
      { id: 'cardio',   label: 'Cardio' },
      { id: 'mobilidade', label: 'Mobilidade' },
      { id: 'manage',   label: '⚙ Planos' },
    ];
    return `<div class="tabs" id="workTabs">
      ${tabs.map(t => `<button class="chip ${t.id === activeTab ? 'chip-on' : 'chip-off'}" data-tab="${t.id}">${esc(t.label)}</button>`).join('')}
    </div>`;
  }

  // ── OVERVIEW: CARD DE EXERCÍCIO COM PROGRESSÃO ───────────────

  function renderExerciseOverviewCard(ex, history, todayLogs) {
    const done = todayLogs.length > 0 && todayLogs.some(l => l.reps);
    const last = history.length ? history[history.length - 1] : null;
    const best = history.length ? Math.max(...history.map(h => h.maxLoad)) : null;
    const first = history.length > 1 ? history[0].maxLoad : null;
    const evoDelta = (last && first && last.maxLoad > 0 && first > 0)
      ? (last.maxLoad - first).toFixed(1)
      : null;
    const tags = [];
    if (ex.target_sets || ex.target_reps) tags.push(`${ex.target_sets || '—'}×${ex.target_reps || '—'}`);

    return `
      <div class="card" style="margin-bottom:10px;padding:14px 16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div style="flex:1;min-width:0">
            <p style="font-size:14px;font-weight:600;color:#2C2B28;margin-bottom:3px">${esc(ex.name)}</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${tags.map(t => `<span style="font-size:10px;background:#F0EBE3;color:#7A7570;padding:2px 7px;border-radius:6px">${t}</span>`).join('')}
              ${done ? `<span style="font-size:10px;background:#EDF4EC;color:#7A9B76;padding:2px 7px;border-radius:6px">✓ hoje</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <div style="text-align:center;padding:8px;background:#F7F4EE;border-radius:10px">
            <p style="font-size:9px;color:#A5AA94;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Última</p>
            <p style="font-size:14px;font-weight:700;color:#2C2B28">${last ? loadStr(last.maxLoad) : '—'}</p>
          </div>
          <div style="text-align:center;padding:8px;background:#F7F4EE;border-radius:10px">
            <p style="font-size:9px;color:#A5AA94;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Melhor</p>
            <p style="font-size:14px;font-weight:700;color:#3E6770">${best !== null ? loadStr(best) : '—'}</p>
          </div>
          <div style="text-align:center;padding:8px;background:${evoDelta && parseFloat(evoDelta) > 0 ? '#EDF4EC' : '#F7F4EE'};border-radius:10px">
            <p style="font-size:9px;color:#A5AA94;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Evolução</p>
            <p style="font-size:14px;font-weight:700;color:${evoDelta && parseFloat(evoDelta) > 0 ? '#7A9B76' : '#A5AA94'}">${evoDelta ? `+${evoDelta}kg` : '—'}</p>
          </div>
        </div>
      </div>`;
  }

  // ── OVERVIEW: PAINEL DO PLANO ─────────────────────────────────

  async function renderPlanOverview(plan, todayLogsByEx, lastByPlan) {
    const lastDate = lastByPlan[plan.id];
    const exCount  = plan.exercises.length;
    const hasTodayLogs = plan.exercises.some(ex => (todayLogsByEx[ex.id] || []).length > 0);

    if (!exCount) {
      return `
        <div class="empty" style="padding:32px 0">
          <div class="eico">🏋️</div>
          <p class="etxt">Nenhum exercício neste treino ainda</p>
          <button class="btn-ok" data-goto-manage type="button" style="width:auto;padding:10px 18px;margin-top:12px">Adicionar exercícios</button>
        </div>`;
    }

    // Buscar histórico de todos os exercícios em paralelo
    const histories = await Promise.all(
      plan.exercises.map(ex => Storage.workoutLogs.exerciseHistory(ex.id, 10))
    );

    const lastExec = lastDate
      ? `Última execução: ${Utils.formatDateShort(lastDate)}`
      : 'Nunca executado';

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:0 2px">
        <div>
          <p style="font-size:10px;color:#A5AA94;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">${lastExec}</p>
          <p style="font-size:12px;color:#7A7570">${exCount} exercício${exCount === 1 ? '' : 's'}</p>
        </div>
        <button class="mainbtn" id="startWorkoutBtn" style="background:#3E6770;padding:12px 20px;width:auto">
          ${hasTodayLogs ? 'Continuar Treino' : 'Iniciar Treino'}
        </button>
      </div>
      ${plan.exercises.map((ex, i) =>
        renderExerciseOverviewCard(ex, histories[i] || [], todayLogsByEx[ex.id] || [])
      ).join('')}`;
  }

  // ── EXECUTE: CARD DE EXERCÍCIO COM INPUTS DE SÉRIE ────────────

  function renderExerciseExecuteCard(ex, todayLogs) {
    const sortedLogs = [...todayLogs].sort((a, b) => (a.set_number || 0) - (b.set_number || 0));
    const targetSets = ex.target_sets || 3;
    const done       = sortedLogs.length >= targetSets && sortedLogs.length > 0;
    const rowCount   = setCounts[ex.id] || Math.max(targetSets, sortedLogs.length, 1);
    const isOpen     = expandedSet.has(ex.id);

    return `
      <details class="exdetails" data-ex="${ex.id}" ${isOpen ? 'open' : ''}>
        <summary class="exrow" style="cursor:pointer">
          <span class="exname">${esc(ex.name)}</span>
          <div class="extags">
            ${ex.target_sets || ex.target_reps ? `<span class="etag">${ex.target_sets || '—'}×${ex.target_reps || '—'}</span>` : ''}
            ${ex.target_load ? `<span class="etag">${ex.target_load}kg</span>` : ''}
            ${done ? `<span class="etag" style="background:#7A9B76;color:#fff">✓ hoje</span>` : ''}
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
            <button class="btn-ok"  data-save-sets="${ex.id}" type="button" style="flex:1 1 100px">Salvar séries</button>
          </div>
        </div>
      </details>`;
  }

  // ── EXECUTE: PAINEL DO PLANO ──────────────────────────────────

  function renderPlanExecute(plan, todayLogsByEx) {
    return `
      <div style="background:#EEF4F5;border-radius:14px;padding:14px 16px;margin-bottom:14px">
        <p style="font-size:10px;color:#3E6770;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px">Em execução</p>
        <p style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#2C2B28">${esc(plan.name)}</p>
      </div>
      <div class="card" style="margin-bottom:12px">
        ${plan.exercises.map(ex => renderExerciseExecuteCard(ex, todayLogsByEx[ex.id] || [])).join('')}
      </div>
      <button class="mainbtn" id="finishWorkoutBtn" style="background:#7A9B76;margin-top:4px">
        ✓ Concluir Treino
      </button>`;
  }

  // ── MANAGE: EDITAR EXERCÍCIOS ─────────────────────────────────

  function renderExerciseEditRow(ex) {
    return `
      <div data-exercise-row="${ex.id}" style="display:grid;grid-template-columns:2fr 0.8fr 1fr 0.9fr auto;gap:6px;margin-bottom:6px;align-items:center">
        <input class="form-input" data-ex-id="${ex.id}" data-field="name" value="${esc(ex.name || '')}" placeholder="Exercício">
        <input class="form-input" data-ex-id="${ex.id}" data-field="target_sets" type="number" min="1" inputmode="numeric" value="${ex.target_sets ?? ''}" placeholder="Séries">
        <input class="form-input" data-ex-id="${ex.id}" data-field="target_reps" value="${esc(ex.target_reps || '')}" placeholder="Reps">
        <input class="form-input" data-ex-id="${ex.id}" data-field="target_load" type="number" step="0.5" min="0" inputmode="decimal" value="${ex.target_load ?? ''}" placeholder="Carga">
        <button data-remove-exercise="${ex.id}" type="button" style="background:none;border:none;font-size:18px;color:#C9845A;cursor:pointer;padding:0 2px">×</button>
      </div>`;
  }

  function renderManageTab(plans) {
    return `
      ${plans.map(p => `
        <details class="card" data-plan-details="${p.id}" style="margin-bottom:12px" ${expandedSet.has('plan_' + p.id) ? 'open' : ''}>
          <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center">
            <span style="font-family:var(--font-display);font-size:16px;font-weight:700;color:#2C2B28">${esc(p.name)}</span>
            <span style="font-size:11px;color:#A5AA94">${p.exercises.length} exercício${p.exercises.length === 1 ? '' : 's'}</span>
          </summary>
          <div style="margin-top:12px">
            <label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">Nome do treino</label>
            <input class="form-input" data-plan-id="${p.id}" data-field="name" value="${esc(p.name)}" style="margin-bottom:12px;font-weight:600">
            <p class="caps" style="margin-bottom:6px">Exercícios</p>
            <div id="exList_${p.id}">
              ${p.exercises.map(ex => renderExerciseEditRow(ex)).join('')}
              ${!p.exercises.length ? `<p style="font-size:12px;color:#A5AA94;text-align:center;padding:6px 0">Nenhum exercício ainda</p>` : ''}
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
              <button class="btn-adj" data-add-exercise="${p.id}" type="button">+ Exercício</button>
              <button class="btn-adj" data-delete-plan="${p.id}" type="button" style="color:#C9845A">Excluir treino</button>
            </div>
          </div>
        </details>`).join('')}
      <button class="mainbtn" id="addPlanBtn" type="button" style="background:#3E6770">+ Novo Treino</button>
      ${!plans.length ? `<p style="font-size:12px;color:#A5AA94;text-align:center;margin-top:10px">Crie seu primeiro treino (ex: "Treino A") e adicione os exercícios.</p>` : ''}`;
  }

  // ── ABA CARDIO ────────────────────────────────────────────────

  async function renderCardioTab() {
    const today      = Utils.dateKey();
    const weekStats  = await Storage.cardio.getWeekStats();
    const todayCardio = await Storage.cardio.getByDate(today);

    const types = ['Caminhada', 'Corrida', 'Bicicleta', 'Elíptico', 'Natação', 'Outro'];

    return `
      <!-- Stats da semana -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Esta semana</p>
        <div class="strio">
          <div class="strioi">
            <p class="striol">Sessões</p>
            <p class="striov" style="color:#3E6770">${weekStats.days.size}</p>
          </div>
          <div class="strioi">
            <p class="striol">Tempo total</p>
            <p class="striov" style="color:#7A836A">${weekStats.totalMin}<span style="font-size:10px"> min</span></p>
          </div>
          <div class="strioi">
            <p class="striol">Distância</p>
            <p class="striov" style="color:#A5AA94">${weekStats.totalKm.toFixed(1)}<span style="font-size:10px"> km</span></p>
          </div>
        </div>
      </div>

      <!-- Registros de hoje -->
      ${todayCardio.length ? `
        <p class="caps" style="margin-bottom:8px">Hoje</p>
        ${todayCardio.map(c => `
          <div class="card" style="margin-bottom:8px;padding:12px 16px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <p style="font-size:13px;font-weight:600;color:#2C2B28">${esc(c.type)}</p>
                <p style="font-size:11px;color:#7A7570;margin-top:2px">
                  ${c.duration_min ? `${c.duration_min} min` : ''}
                  ${c.distance_km  ? ` · ${c.distance_km} km` : ''}
                  ${c.intensity    ? ` · ${esc(c.intensity)}` : ''}
                </p>
              </div>
              <button data-del-cardio="${c.id}" style="background:none;border:none;color:#A5AA94;font-size:16px;cursor:pointer;padding:4px">×</button>
            </div>
          </div>`).join('')}
      ` : ''}

      <!-- Formulário de registro -->
      <div class="card" style="margin-top:4px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <p class="caps" style="margin:0">Novo registro</p>
        </div>
        <label class="field-label">Tipo</label>
        <select class="form-input" id="cardioTypeSelect" style="margin-bottom:10px">
          ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <label class="field-label">Duração (min)</label>
            <input class="form-input" id="cardioDurField" type="number" inputmode="numeric" min="1" placeholder="30">
          </div>
          <div>
            <label class="field-label">Distância (km)</label>
            <input class="form-input" id="cardioDistField" type="number" step="0.1" inputmode="decimal" placeholder="Opcional">
          </div>
        </div>
        <label class="field-label">Intensidade</label>
        <div style="display:flex;gap:6px;margin-bottom:14px">
          ${['Leve','Moderada','Alta'].map(v => `
            <label style="flex:1;text-align:center;padding:9px 0;border:1.5px solid #E8E0D0;border-radius:10px;font-size:12px;font-weight:500;cursor:pointer;color:#7A7570">
              <input type="radio" name="cardioIntFld" value="${v}" style="display:none">${v}
            </label>`).join('')}
        </div>
        <button class="mainbtn" id="saveCardioFld" style="background:#3E6770">Salvar Cardio</button>
      </div>`;
  }

  // ── ABA MOBILIDADE ────────────────────────────────────────────

  async function renderMobilidadeTab() {
    const today = Utils.dateKey();
    const items = (await Storage.workouts.getByDate(today)).filter(w => w.tabType === 'yoga');

    return `
      ${items.length ? items.map(w => `
        <div class="card">
          <p style="font-size:14px;font-weight:600;color:#2C2B28">${esc(w.yogaType || 'Mobilidade')}</p>
          <p style="font-size:12px;color:#7A7570">${w.duration || '—'} minutos</p>
        </div>`).join('') : `<div class="empty"><div class="eico">🧘</div><p class="etxt">Nenhuma prática hoje</p></div>`}
      <div class="card" style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <p class="caps" style="margin:0">Registrar prática</p>
          <button id="toggleYoga" type="button" style="background:none;border:none;font-size:18px;color:#3E6770;cursor:pointer">+</button>
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
      const type  = document.getElementById('cardioTypeSelect').value;
      const dur   = parseInt(document.getElementById('cardioDurField').value);
      const dist  = parseFloat(document.getElementById('cardioDistField').value) || null;
      const intens = document.querySelector('input[name="cardioIntFld"]:checked')?.value || null;
      if (!dur) return;
      await Storage.cardio.add({ type, duration_min: dur, distance_km: dist, intensity: intens });
      render();
    });
    document.querySelectorAll('[data-del-cardio]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await Storage.cardio.delete(btn.dataset.delCardio);
        render();
      });
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

  function bindPlanExecute(plan, todayLogsByEx) {
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
        setCounts[exId] = (setCounts[exId] || Math.max(ex?.target_sets || 1, (todayLogsByEx[exId] || []).length, 1)) + 1;
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
          reps: rowsMap[i].reps !== '' ? parseInt(rowsMap[i].reps) : null,
          load: rowsMap[i].load !== '' ? parseFloat(rowsMap[i].load) : null,
        }));
        await Storage.workoutLogs.replaceForExercise(Utils.dateKey(), exId, sets, plan.id, plan.name, ex.name);
        expandedSet.add(exId);
        render();
      });
    });

    // Concluir Treino
    document.getElementById('finishWorkoutBtn')?.addEventListener('click', async () => {
      // Marcar hábito workout como feito no dashboard
      const h = Storage.habits.getToday();
      h.workout = true;
      Storage.habits.setToday(h);
      mode = 'overview';
      setCounts = {};
      expandedSet.clear();
      const toast = document.createElement('div');
      toast.style.cssText = `position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#7A9B76;color:#fff;padding:12px 24px;border-radius:20px;font-size:14px;font-weight:600;z-index:200;`;
      toast.textContent = '✓ Treino concluído!';
      document.getElementById('app').appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
      render();
    });

    // Iniciar Treino (no overview)
    document.getElementById('startWorkoutBtn')?.addEventListener('click', () => {
      mode = 'execute';
      render();
    });

    document.querySelector('[data-goto-manage]')?.addEventListener('click', () => {
      activeTab = 'manage';
      mode = 'manage';
      render();
    });
  }

  function bindManageTab(plans) {
    document.querySelectorAll('[data-plan-details]').forEach(el => {
      el.addEventListener('toggle', () => {
        const key = 'plan_' + el.dataset.planDetails;
        if (el.open) expandedSet.add(key); else expandedSet.delete(key);
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
        if (!confirm('Remover este exercício? O histórico de séries é mantido.')) return;
        const planId = btn.closest('[data-plan-details]')?.dataset.planDetails;
        if (planId) expandedSet.add('plan_' + planId);
        await Storage.workoutExercises.remove(btn.dataset.removeExercise);
        render();
      });
    });

    document.querySelectorAll('[data-delete-plan]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Excluir este treino? O histórico de séries é mantido.')) return;
        const planId = btn.dataset.deletePlan;
        await Storage.workoutPlans.remove(planId);
        if (activeTab === planId) { activeTab = null; mode = 'overview'; }
        render();
      });
    });

    document.getElementById('addPlanBtn')?.addEventListener('click', async () => {
      const name = nextPlanName(plans);
      await Storage.workoutPlans.add({ name });
      const created = Storage.workoutPlans.getAll().find(p => p.name === name);
      if (created) { expandedSet.add('plan_' + created.id); }
      render();
    });
  }

  // ── RENDER PRINCIPAL ─────────────────────────────────────────

  async function render() {
    const plans      = Storage.workoutPlans.getAll();
    const today      = Utils.dateKey();
    const weekDays   = Utils.lastNDays(7);
    const monthStart = today.slice(0, 8) + '01';

    const [todayLogsRaw, lastByPlan, weekDaysSet, monthDaysSet] = await Promise.all([
      Storage.workoutLogs.getByDate(today),
      Storage.workoutLogs.lastDateByPlan(),
      Storage.training.daysInRange(weekDays[0], weekDays[weekDays.length - 1]),
      Storage.training.daysInRange(monthStart, today),
    ]);

    const todayLogsByEx = {};
    todayLogsRaw.forEach(l => { (todayLogsByEx[l.exercise_id] ||= []).push(l); });

    // Aba ativa padrão
    const validTabs = new Set(['cardio', 'mobilidade', 'manage', ...plans.map(p => p.id)]);
    if (!activeTab || !validTabs.has(activeTab)) {
      activeTab = plans.length
        ? [...plans].sort((a, b) => (lastByPlan[a.id] || '0000-00-00').localeCompare(lastByPlan[b.id] || '0000-00-00'))[0].id
        : 'manage';
    }

    // Resetar modo se trocar de aba para plano
    const isPlanTab = plans.some(p => p.id === activeTab);
    if (!isPlanTab) mode = 'overview';

    const weekGoal = Storage.prefs.get('goal_strength_week', 4);
    Utils.el('workSub').textContent = `${weekDaysSet.size}/${weekGoal} esta semana · ${monthDaysSet.size} este mês`;

    let bodyHtml;
    if (activeTab === 'manage') {
      mode = 'manage';
      bodyHtml = renderManageTab(plans);
    } else if (activeTab === 'cardio') {
      bodyHtml = await renderCardioTab();
    } else if (activeTab === 'mobilidade') {
      bodyHtml = await renderMobilidadeTab();
    } else {
      const plan = plans.find(p => p.id === activeTab);
      if (!plan) {
        bodyHtml = renderManageTab(plans);
      } else if (mode === 'execute') {
        bodyHtml = renderPlanExecute(plan, todayLogsByEx);
      } else {
        bodyHtml = await renderPlanOverview(plan, todayLogsByEx, lastByPlan);
      }
    }

    Utils.el('workContent').innerHTML = `
      ${renderIndicators(weekDaysSet.size, weekGoal, monthDaysSet.size)}
      ${renderTabs(plans)}
      <div id="workBody">${bodyHtml}</div>`;

    // Tab click
    document.getElementById('workTabs').addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      const newTab = btn.dataset.tab;
      if (newTab !== activeTab) {
        mode = 'overview';
        setCounts = {};
        expandedSet.clear();
      }
      activeTab = newTab;
      render();
    });

    // Bindings do conteúdo ativo
    if (activeTab === 'manage') {
      bindManageTab(plans);
    } else if (activeTab === 'cardio') {
      bindCardioTab();
    } else if (activeTab === 'mobilidade') {
      bindMobilidadeTab();
    } else {
      const plan = plans.find(p => p.id === activeTab);
      if (plan) bindPlanExecute(plan, todayLogsByEx);
    }
  }

  return { render };
})();
