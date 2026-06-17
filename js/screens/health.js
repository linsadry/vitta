/**
 * screens/health.js — Tela "Saúde"
 *
 * Fase 4 — Módulos: Consultas, Medicamentos, Eventos de Saúde, Resumo Médico
 */

const ScreenHealth = (() => {
  let activeTab = 'consultas';

  // ── HELPERS ───────────────────────────────────────────────────

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function fmtDate(d) {
    if (!d) return '—';
    try {
      const [y,m,day] = d.split('-');
      return `${day}/${m}/${y}`;
    } catch { return d; }
  }

  function fieldLabel(label) {
    return `<label class="field-label">${label}</label>`;
  }

  function tabs() {
    const items = [
      { id: 'consultas',    label: 'Consultas' },
      { id: 'medicamentos', label: 'Medicamentos' },
      { id: 'ciclo',        label: '🌸 Ciclo' },
      { id: 'fiv',          label: '✨ Fertilidade' },
      { id: 'eventos',      label: 'Eventos' },
      { id: 'resumo',       label: 'Resumo' },
    ];
    return `<div class="tabs" style="margin-bottom:16px">
      ${items.map(t => `
        <button class="chip ${t.id === activeTab ? 'chip-on' : 'chip-off'}"
          data-health-tab="${t.id}">${t.label}</button>`).join('')}
    </div>`;
  }

  // ── ABA: CONSULTAS ────────────────────────────────────────────

  async function renderConsultas() {
    const list = await Storage.consultations.getAll();
    const today = Utils.dateKey();

    const upcoming  = list.filter(c => c.date >= today);
    const past      = list.filter(c => c.date < today);

    return `
      <!-- Adicionar consulta -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps" style="margin-bottom:12px;color:var(--color-health)">Nova Consulta</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            ${fieldLabel('Data')}
            <input class="form-input" id="consDate" type="date" value="${today}">
          </div>
          <div>
            ${fieldLabel('Especialidade')}
            <input class="form-input" id="consSpec" type="text" placeholder="Ex: Cardiologia">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            ${fieldLabel('Médico')}
            <input class="form-input" id="consDr" type="text" placeholder="Dra. Nome">
          </div>
          <div>
            ${fieldLabel('Retorno em')}
            <input class="form-input" id="consNext" type="date">
          </div>
        </div>
        ${fieldLabel('Observações')}
        <textarea class="form-input" id="consNotes" rows="2" placeholder="Diagnóstico, orientações..." style="resize:vertical;margin-bottom:10px"></textarea>
        <button class="mainbtn" id="saveConsBtn" style="background:var(--color-health)">Salvar Consulta</button>
      </div>

      <!-- Próximas -->
      ${upcoming.length ? `
        <p class="caps" style="margin-bottom:8px">Próximas</p>
        ${upcoming.map(c => renderConsCard(c, true)).join('')}
      ` : ''}

      <!-- Histórico -->
      ${past.length ? `
        <p class="caps" style="margin-bottom:8px;margin-top:${upcoming.length ? 12 : 0}px">Histórico</p>
        ${past.slice(0, 10).map(c => renderConsCard(c, false)).join('')}
      ` : ''}

      ${!list.length ? `
        <div class="empty"><div class="eico">🏥</div>
        <p class="etxt">Nenhuma consulta registrada ainda</p></div>
      ` : ''}`;
  }

  function renderConsCard(c, upcoming) {
    return `
      <div class="card" style="margin-bottom:8px;border-left:3px solid ${upcoming ? 'var(--color-health)' : '#E8E0D0'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="flex:1;min-width:0">
            <p style="font-size:13px;font-weight:600;color:#2C2B28">${esc(c.specialty || 'Consulta')}</p>
            <p style="font-size:11px;color:#7A7570;margin-top:2px">${fmtDate(c.date)}${c.doctor ? ` · ${esc(c.doctor)}` : ''}</p>
            ${c.notes ? `<p style="font-size:11px;color:#A5AA94;margin-top:4px;line-height:1.4">${esc(c.notes)}</p>` : ''}
            ${c.next_date ? `<p style="font-size:10px;color:var(--color-health);margin-top:4px">↩ Retorno: ${fmtDate(c.next_date)}</p>` : ''}
          </div>
          <button data-del-cons="${c.id}" style="background:none;border:none;color:#E8E0D0;font-size:16px;cursor:pointer;padding:0 0 0 8px;flex-shrink:0">×</button>
        </div>
      </div>`;
  }

  // ── ABA: MEDICAMENTOS ─────────────────────────────────────────

  async function renderMedicamentos() {
    const all    = await Storage.medications.getAll();
    const active = all.filter(m => m.active);
    const past   = all.filter(m => !m.active);

    return `
      <!-- Adicionar -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps" style="margin-bottom:12px;color:var(--color-health)">Novo Medicamento</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            ${fieldLabel('Nome')}
            <input class="form-input" id="medName" placeholder="Ex: Levotiroxina">
          </div>
          <div>
            ${fieldLabel('Dose')}
            <input class="form-input" id="medDose" placeholder="Ex: 25mcg">
          </div>
        </div>
        ${fieldLabel('Frequência')}
        <input class="form-input" id="medFreq" placeholder="Ex: 1x ao dia, em jejum" style="margin-bottom:10px">
        <button class="mainbtn" id="saveMedBtn" style="background:var(--color-health)">Salvar Medicamento</button>
      </div>

      <!-- Em uso -->
      ${active.length ? `
        <p class="caps" style="margin-bottom:8px">Em uso</p>
        ${active.map(m => renderMedCard(m)).join('')}
      ` : '<div class="empty"><div class="eico">💊</div><p class="etxt">Nenhum medicamento ativo</p></div>'}

      <!-- Histórico -->
      ${past.length ? `
        <p class="caps" style="margin-top:12px;margin-bottom:8px">Histórico</p>
        ${past.slice(0, 5).map(m => renderMedCard(m)).join('')}
      ` : ''}`;
  }

  function renderMedCard(m) {
    return `
      <div class="card" style="margin-bottom:8px;opacity:${m.active ? 1 : 0.6}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="flex:1">
            <p style="font-size:13px;font-weight:600;color:#2C2B28">${esc(m.name)}</p>
            <p style="font-size:11px;color:#7A7570;margin-top:2px">
              ${m.dose ? esc(m.dose) : ''}${m.frequency ? ` · ${esc(m.frequency)}` : ''}
            </p>
            ${m.start_date ? `<p style="font-size:10px;color:#A5AA94;margin-top:3px">Desde ${fmtDate(m.start_date)}</p>` : ''}
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            ${m.active ? `<button data-toggle-med="${m.id}" style="background:none;border:1px solid #E8E0D0;border-radius:8px;font-size:10px;color:#A5AA94;cursor:pointer;padding:4px 8px">Parar</button>` : ''}
            <button data-del-med="${m.id}" style="background:none;border:none;color:#E8E0D0;font-size:16px;cursor:pointer;padding:0">×</button>
          </div>
        </div>
      </div>`;
  }

  // ── ABA: EVENTOS ──────────────────────────────────────────────

  async function renderEventos() {
    const list = await Storage.healthEvents.getAll();

    const CATEGORIES = ['Sintoma', 'Dor', 'Mal-estar', 'Alergia', 'Exame', 'Cirurgia', 'Internação', 'Outro'];

    const BRANCH = '<svg aria-hidden="true" style="position:absolute;bottom:-8px;right:-8px;opacity:0.09;pointer-events:none" width="100" height="70" viewBox="0 0 100 70" fill="none"><path d="M8 58C28 46 58 38 92 14" stroke="#7A9B76" stroke-width="1.2" stroke-linecap="round"/><path d="M34 50C28 36 18 26 26 16" stroke="#7A9B76" stroke-width="0.9" stroke-linecap="round"/><path d="M34 50C40 36 34 24 44 16" stroke="#7A9B76" stroke-width="0.9" stroke-linecap="round"/><path d="M62 34C56 20 46 14 54 4" stroke="#7A9B76" stroke-width="0.9" stroke-linecap="round"/><path d="M62 34C68 20 62 12 72 4" stroke="#7A9B76" stroke-width="0.9" stroke-linecap="round"/><circle cx="26" cy="16" r="2" fill="#7A9B76" fill-opacity="0.4"/><circle cx="44" cy="16" r="2" fill="#7A9B76" fill-opacity="0.4"/><circle cx="54" cy="4" r="2" fill="#7A9B76" fill-opacity="0.4"/><circle cx="72" cy="4" r="2" fill="#7A9B76" fill-opacity="0.4"/></svg>';
    return `
      <!-- Adicionar -->
      <div class="card" style="margin-bottom:12px;position:relative;overflow:hidden">
        ${BRANCH}
        <p class="caps" style="margin-bottom:12px;color:var(--color-health)">Novo Evento</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            ${fieldLabel('Data')}
            <input class="form-input" id="evtDate" type="date" value="${Utils.dateKey()}">
          </div>
          <div>
            ${fieldLabel('Categoria')}
            <select class="form-input" id="evtCat">
              ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
        </div>
        ${fieldLabel('Notas')}
        <textarea class="form-input" id="evtNotes" rows="2" placeholder="Descreva o evento..." style="resize:vertical;margin-bottom:10px"></textarea>
        <button class="mainbtn" id="saveEvtBtn" style="background:var(--color-health)">Salvar Evento</button>
      </div>

      <!-- Lista -->
      ${list.length ? list.slice(0, 20).map(e => `
        <div class="card" style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="font-size:11px;background:#F0EBE3;color:#7A7570;padding:2px 7px;border-radius:6px">${esc(e.category)}</span>
                <span style="font-size:11px;color:#A5AA94">${fmtDate(e.date)}</span>
              </div>
              ${e.notes ? `<p style="font-size:12px;color:#4A4844;line-height:1.4">${esc(e.notes)}</p>` : ''}
            </div>
            <button data-del-evt="${e.id}" style="background:none;border:none;color:#E8E0D0;font-size:16px;cursor:pointer;padding:0 0 0 8px">×</button>
          </div>
        </div>`).join('')
      : `<div class="empty"><div class="eico">📋</div><p class="etxt">Nenhum evento registrado</p></div>`}`;
  }

  // ── ABA: RESUMO MÉDICO ────────────────────────────────────────

  async function renderResumo() {
    const [nextConsult, activeMeds, recentEvents] = await Promise.all([
      Storage.consultations.getNext(),
      Promise.resolve(Storage.medications.getActive()),
      Storage.healthEvents.getAll().then(l => l.slice(0, 5)),
    ]);
    const allLabs = Storage.labs.getAll();
    const lastLab = allLabs.length ? allLabs[allLabs.length - 1] : null;

    const FLOWER = '<svg aria-hidden="true" style="position:absolute;bottom:-10px;right:-10px;opacity:0.09;pointer-events:none" width="90" height="90" viewBox="0 0 90 90" fill="none"><circle cx="45" cy="45" r="7" fill="#9B7A9B"/><ellipse cx="45" cy="24" rx="6" ry="14" fill="#9B7A9B" fill-opacity="0.7"/><ellipse cx="45" cy="66" rx="6" ry="14" fill="#9B7A9B" fill-opacity="0.7"/><ellipse cx="24" cy="45" rx="14" ry="6" fill="#9B7A9B" fill-opacity="0.7"/><ellipse cx="66" cy="45" rx="14" ry="6" fill="#9B7A9B" fill-opacity="0.7"/><ellipse cx="29" cy="29" rx="6" ry="13" transform="rotate(45 29 29)" fill="#9B7A9B" fill-opacity="0.5"/><ellipse cx="61" cy="29" rx="6" ry="13" transform="rotate(-45 61 29)" fill="#9B7A9B" fill-opacity="0.5"/><ellipse cx="29" cy="61" rx="6" ry="13" transform="rotate(-45 29 61)" fill="#9B7A9B" fill-opacity="0.5"/><ellipse cx="61" cy="61" rx="6" ry="13" transform="rotate(45 61 61)" fill="#9B7A9B" fill-opacity="0.5"/><circle cx="45" cy="45" r="4" fill="#FAF8F5"/></svg>';
    return `
      <div class="card" style="margin-bottom:12px;border-left:4px solid var(--color-health);position:relative;overflow:hidden">
        ${FLOWER}
        <p class="caps" style="color:var(--color-health);margin-bottom:12px">Resumo Médico</p>

        <p style="font-size:10px;color:#A5AA94;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Próxima Consulta</p>
        <p style="font-size:14px;font-weight:600;color:#2C2B28;margin-bottom:12px">
          ${nextConsult ? `${fmtDate(nextConsult.date)} · ${esc(nextConsult.specialty || 'Consulta')}` : 'Nenhuma agendada'}
        </p>

        <p style="font-size:10px;color:#A5AA94;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Medicamentos Ativos</p>
        <p style="font-size:14px;font-weight:600;color:#2C2B28;margin-bottom:12px">
          ${activeMeds.length ? activeMeds.map(m => esc(m.name)).join(', ') : 'Nenhum'}
        </p>

        <p style="font-size:10px;color:#A5AA94;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Último Exame</p>
        <p style="font-size:14px;font-weight:600;color:#2C2B28;margin-bottom:12px">
          ${lastLab ? `${fmtDate(lastLab.date)} · ${esc(lastLab.category || 'Exame')}` : 'Nenhum'}
        </p>

        ${recentEvents.length ? `
          <p style="font-size:10px;color:#A5AA94;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Eventos Recentes</p>
          ${recentEvents.map(e => `
            <p style="font-size:12px;color:#4A4844;margin-bottom:3px">
              <span style="color:#A5AA94">${fmtDate(e.date)}</span> · ${esc(e.category)}${e.notes ? ` — ${esc(e.notes.slice(0,60))}${e.notes.length > 60 ? '…' : ''}` : ''}
            </p>`).join('')}
        ` : ''}
      </div>

      <p style="font-size:11px;color:#A5AA94;text-align:center;padding-top:4px">
        Dados pessoais · Não compartilhados
      </p>`;
  }

  // ── BINDINGS ──────────────────────────────────────────────────

  async function bindConsultas() {
    document.getElementById('saveConsBtn')?.addEventListener('click', async () => {
      const date    = document.getElementById('consDate').value;
      const spec    = document.getElementById('consSpec').value.trim();
      const doctor  = document.getElementById('consDr').value.trim();
      const next    = document.getElementById('consNext').value || null;
      const notes   = document.getElementById('consNotes').value.trim() || null;
      if (!date) return;
      await Storage.consultations.add({ date, specialty: spec || null, doctor: doctor || null, next_date: next, notes });
      render();
    });
    document.querySelectorAll('[data-del-cons]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover esta consulta?')) return;
        await Storage.consultations.remove(btn.dataset.delCons);
        render();
      });
    });
  }

  async function bindMedicamentos() {
    document.getElementById('saveMedBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('medName').value.trim();
      const dose = document.getElementById('medDose').value.trim();
      const freq = document.getElementById('medFreq').value.trim();
      if (!name) return;
      await Storage.medications.add({ name, dose: dose || null, frequency: freq || null, start_date: Utils.dateKey() });
      render();
    });
    document.querySelectorAll('[data-toggle-med]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await Storage.medications.update(btn.dataset.toggleMed, { active: false, end_date: Utils.dateKey() });
        render();
      });
    });
    document.querySelectorAll('[data-del-med]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover medicamento?')) return;
        await Storage.medications.remove(btn.dataset.delMed);
        render();
      });
    });
  }

  async function bindEventos() {
    document.getElementById('saveEvtBtn')?.addEventListener('click', async () => {
      const date  = document.getElementById('evtDate').value;
      const cat   = document.getElementById('evtCat').value;
      const notes = document.getElementById('evtNotes').value.trim() || null;
      if (!date || !cat) return;
      await Storage.healthEvents.add({ date, category: cat, notes });
      render();
    });
    document.querySelectorAll('[data-del-evt]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover evento?')) return;
        await Storage.healthEvents.remove(btn.dataset.delEvt);
        render();
      });
    });
  }

  // ── openTab: permite navegação externa para aba específica ─────
  function openTab(tab) {
    activeTab = tab;
    render();
  }

  // ── RENDER CICLO ──────────────────────────────────────────────
  async function renderCiclo() {
    const entries = await Storage.cycleEntries.getAll();
    const today = Utils.dateKey();
    const typeLabels = {
      menstruation_start: '🌸 Início da menstruação',
      menstruation_end:   '🌸 Fim da menstruação',
      symptom:            '⚡ Sintoma',
      mood:               '💭 Humor',
      energy:             '✨ Energia',
      ovulation:          '🌼 Ovulação estimada',
    };
    return `
      <div class="card" style="margin-bottom:12px">
        <p class="caps" style="color:#D68A86;margin-bottom:12px">Registrar</p>
        <label class="field-label">Tipo</label>
        <select class="form-input" id="cycleType" style="margin-bottom:10px">
          <option value="menstruation_start">Início da menstruação</option>
          <option value="menstruation_end">Fim da menstruação</option>
          <option value="symptom">Sintoma</option>
          <option value="mood">Humor</option>
          <option value="energy">Energia</option>
          <option value="ovulation">Ovulação estimada</option>
        </select>
        <label class="field-label">Data</label>
        <input class="form-input" id="cycleDate" type="date" value="${today}" style="margin-bottom:10px">
        <label class="field-label">Valor / Notas</label>
        <input class="form-input" id="cycleValue" placeholder="Ex: fluxo intenso, cólica leve..." style="margin-bottom:12px">
        <button class="mainbtn" id="saveCycleBtn" style="background:#D68A86">Salvar registro</button>
      </div>
      ${entries.length ? `
        <p class="caps" style="margin-bottom:8px">Histórico</p>
        ${entries.slice(0, 15).map(e => `
          <div class="card" style="margin-bottom:8px;padding:12px 14px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="flex:1">
                <p style="font-size:13px;font-weight:700;color:#3B3532;margin:0 0 2px">${typeLabels[e.type] || esc(e.type)}</p>
                ${e.value ? `<p style="font-size:11px;color:#7A726E;margin:0">${esc(e.value)}</p>` : ''}
              </div>
              <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
                <span style="font-size:10px;color:#B5ADA8">${fmtDate(e.date)}</span>
                <button data-del-cycle="${e.id}" style="background:none;border:none;color:#E8B6B1;font-size:18px;cursor:pointer;padding:0">×</button>
              </div>
            </div>
          </div>`).join('')}
      ` : `<div class="empty"><div class="eico">🌸</div><p class="etxt">Nenhum registro de ciclo ainda.<br>Comece registrando o início da sua menstruação.</p></div>`}`;
  }

  async function bindCiclo() {
    document.getElementById('saveCycleBtn')?.addEventListener('click', async () => {
      const type  = document.getElementById('cycleType').value;
      const date  = document.getElementById('cycleDate').value;
      const value = document.getElementById('cycleValue').value.trim() || null;
      if (!date) return;
      await Storage.cycleEntries.add({ date, type, value });
      render();
    });
    document.querySelectorAll('[data-del-cycle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover este registro?')) return;
        await Storage.cycleEntries.remove(btn.dataset.delCycle);
        render();
      });
    });
  }

  // ── RENDER FIV / FERTILIDADE ──────────────────────────────────
  async function renderFIV() {
    const events = await Storage.fertilityEvents.getAll();
    const today  = Utils.dateKey();
    const typeLabels = {
      consultation:  '🩺 Consulta',
      procedure:     '⚕️ Procedimento',
      transfer:      '🌱 Transferência',
      result:        '📋 Resultado',
      exam:          '🔬 Exame',
      medication:    '💊 Medicação',
    };
    return `
      <div class="card" style="margin-bottom:12px">
        <p class="caps" style="color:#C8B5D8;margin-bottom:12px">Registrar evento de fertilidade</p>
        <label class="field-label">Tipo</label>
        <select class="form-input" id="fivType" style="margin-bottom:10px">
          <option value="consultation">Consulta</option>
          <option value="procedure">Procedimento</option>
          <option value="transfer">Transferência de embrião</option>
          <option value="exam">Exame</option>
          <option value="medication">Medicação</option>
          <option value="result">Resultado</option>
        </select>
        <label class="field-label">Data</label>
        <input class="form-input" id="fivDate" type="date" value="${today}" style="margin-bottom:10px">
        <label class="field-label">Título / Notas</label>
        <input class="form-input" id="fivTitle" placeholder="Ex: Beta-hCG, coleta de óvulos..." style="margin-bottom:10px">
        <textarea class="form-input" id="fivNotes" rows="2" placeholder="Observações..." style="resize:vertical;margin-bottom:12px"></textarea>
        <button class="mainbtn" id="saveFivBtn" style="background:#C8B5D8">Salvar evento</button>
      </div>
      ${events.length ? `
        <p class="caps" style="margin-bottom:8px">Linha do tempo</p>
        ${events.slice(0, 20).map(e => `
          <div class="card" style="margin-bottom:8px;padding:12px 14px;border-left:3px solid #C8B5D8">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="flex:1">
                <p style="font-size:12px;font-weight:700;color:#C8B5D8;margin:0 0 2px">${typeLabels[e.type] || esc(e.type)}</p>
                ${e.title ? `<p style="font-size:13px;font-weight:600;color:#3B3532;margin:0 0 2px">${esc(e.title)}</p>` : ''}
                ${e.notes ? `<p style="font-size:11px;color:#7A726E;margin:0">${esc(e.notes)}</p>` : ''}
              </div>
              <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
                <span style="font-size:10px;color:#B5ADA8">${fmtDate(e.date)}</span>
                <button data-del-fiv="${e.id}" style="background:none;border:none;color:#C8B5D8;font-size:18px;cursor:pointer;padding:0">×</button>
              </div>
            </div>
          </div>`).join('')}
      ` : `<div class="empty"><div class="eico">✨</div><p class="etxt">Nenhum evento de fertilidade registrado.<br>Acompanhe sua jornada de FIV aqui.</p></div>`}`;
  }

  async function bindFIV() {
    document.getElementById('saveFivBtn')?.addEventListener('click', async () => {
      const type  = document.getElementById('fivType').value;
      const date  = document.getElementById('fivDate').value;
      const title = document.getElementById('fivTitle').value.trim() || null;
      const notes = document.getElementById('fivNotes').value.trim() || null;
      if (!date) return;
      await Storage.fertilityEvents.add({ date, type, title, notes });
      render();
    });
    document.querySelectorAll('[data-del-fiv]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover este evento?')) return;
        await Storage.fertilityEvents.remove(btn.dataset.delFiv);
        render();
      });
    });
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────────

  async function render() {
    const el = document.getElementById('healthContent');
    if (!el) return;

    // Tab HTML first (sync)
    let bodyHtml = `<div style="text-align:center;padding:32px 0;color:#A5AA94">Carregando...</div>`;
    el.innerHTML = tabs() + `<div id="healthBody">${bodyHtml}</div>`;

    // Bind tab clicks
    el.querySelectorAll('[data-health-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.healthTab;
        render();
      });
    });

    // Render tab content
    const body = document.getElementById('healthBody');
    if (!body) return;

    try {
      switch (activeTab) {
        case 'consultas':
          body.innerHTML = await renderConsultas();
          await bindConsultas();
          break;
        case 'medicamentos':
          body.innerHTML = await renderMedicamentos();
          await bindMedicamentos();
          break;
        case 'eventos':
          body.innerHTML = await renderEventos();
          await bindEventos();
          break;
        case 'ciclo':
          body.innerHTML = await renderCiclo();
          await bindCiclo();
          break;
        case 'fiv':
          body.innerHTML = await renderFIV();
          await bindFIV();
          break;
        case 'resumo':
          body.innerHTML = await renderResumo();
          break;
      }
    } catch (err) {
      console.error('ScreenHealth error:', err);
      body.innerHTML = `<div class="empty"><p class="etxt">Erro ao carregar dados de saúde</p></div>`;
    }
  }

  return { render };
})();
