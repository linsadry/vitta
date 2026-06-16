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

    return `
      <!-- Adicionar -->
      <div class="card" style="margin-bottom:12px">
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

    return `
      <div class="card" style="margin-bottom:12px;border-left:4px solid var(--color-health)">
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
