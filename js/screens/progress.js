/**
 * screens/progress.js — Tela "Progresso"
 *
 * Duas abas:
 *   · "Corpo"   — peso, score de consistência, medidas corporais, fotos (Fase 5, preliminar)
 *   · "Exames"  — Fase 3, Painel de Saúde Metabólica (marcadores + histórico + linha do tempo)
 */

const ScreenProgress = (() => {
  let activeTab     = 'corpo'; // 'corpo' | 'exames'

  // Estado da aba Exames
  let showExamForm   = false;
  let editingExamId  = null;
  let customRows     = [];      // [{name, unit, value}] — marcadores personalizados no formulário
  let expandedMarker = null;    // key (ou 'custom:<nome>') com histórico expandido

  const TABS = [
    { id: 'corpo',  label: 'Corpo' },
    { id: 'exames', label: 'Exames' },
  ];

  function renderTabs() {
    return `<div class="tabs" id="progTabs">
      ${TABS.map(t => `<button class="chip ${t.id === activeTab ? 'chip-on' : 'chip-off'}" data-tab="${t.id}">${t.label}</button>`).join('')}
    </div>`;
  }

  // ════════════════════════════════════════════════════════════════
  // ABA CORPO — peso, score, medidas, fotos
  // ════════════════════════════════════════════════════════════════

  async function renderCorpoTab() {
    const [weightHistory, latest] = await Promise.all([
      Promise.resolve(Storage.weight.getHistory()),
      Storage.measurements.getLatest(),
    ]);

    const todayScore  = Storage.score.get(Utils.dateKey()) || 0;
    const weekScores  = Storage.score.getWeek().map(d => d.score).filter(v => v !== null && v !== undefined);
    const weekAvg     = weekScores.length ? Math.round(weekScores.reduce((a, b) => a + b, 0) / weekScores.length) : 0;
    const monthScores = Storage.score.getMonth().map(d => d.score).filter(v => v !== null && v !== undefined);
    const monthAvg    = monthScores.length ? Math.round(monthScores.reduce((a, b) => a + b, 0) / monthScores.length) : 0;

    const latestKg = weightHistory.length ? weightHistory[weightHistory.length - 1].kg : null;
    const firstKg  = weightHistory.length > 1 ? weightHistory[0].kg : null;
    const wDelta   = (latestKg && firstKg) ? (latestKg - firstKg).toFixed(1) : null;

    document.getElementById('progTabBody').innerHTML = `
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
          <div class="strioi"><p class="striol">Mês</p><p class="striov" style="color:#A5AA94">${monthAvg}</p></div>
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
      renderCorpoTab();
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
      renderCorpoTab();
    });
    document.getElementById('cancelMeasBtn').addEventListener('click', () => {
      document.getElementById('addMeasCard').style.display = 'none';
    });
  }

  // ════════════════════════════════════════════════════════════════
  // ABA EXAMES — Fase 3: Painel de Saúde Metabólica
  // ════════════════════════════════════════════════════════════════

  const STATUS_COLOR = { low: '#D4956E', ok: '#7A836A', high: '#C9845A' };

  function renderMarkerRow(key, latestMap, label, unit, dec, ref) {
    const entry  = latestMap[key];
    const status = entry ? LabCatalog.status(key.startsWith('custom:') ? null : key, entry.value) : null;
    const dot    = STATUS_COLOR[status] || '#C8C5BC';
    const valStr = entry ? Utils.formatNum(entry.value, dec) : '—';
    const expanded = expandedMarker === key;

    return `
      <div class="measrow" data-marker="${key}" style="cursor:pointer;flex-wrap:wrap">
        <span class="measname" style="display:flex;align-items:center;gap:8px">
          <span style="width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0"></span>
          ${label}
        </span>
        <div class="measright">
          <span class="measval">${valStr}${(entry && unit) ? ` <span style="font-size:10px;color:#A5AA94;font-weight:400">${unit}</span>` : ''}</span>
          ${entry ? `<span style="font-size:10px;color:#A5AA94">${Utils.formatDateShort(entry.date)}</span>` : ''}
        </div>
      </div>
      ${expanded ? renderMarkerHistory(key, ref, unit) : ''}`;
  }

  function renderMarkerHistory(key, ref, unit) {
    const isCustom = key.startsWith('custom:');
    const history = isCustom ? Storage.labs.getCustomHistory(key.slice(7)) : Storage.labs.getHistory(key);

    if (history.length < 2) {
      return `<div class="card-alt" style="margin:6px 0 10px;padding:12px">
        <p style="font-size:11px;color:#A5AA94;text-align:center">${history.length === 1 ? 'Apenas 1 registro até agora' : 'Sem registros'}</p>
      </div>`;
    }
    return `<div class="card-alt" style="margin:6px 0 10px;padding:12px 12px 8px">
      <div data-history="${key}"></div>
      ${ref ? `<p style="font-size:10px;color:#A5AA94;text-align:center;margin-top:6px">Referência: ${ref[0]}–${ref[1]}${unit ? ' ' + unit : ''}</p>` : ''}
    </div>`;
  }

  function renderFixedCard(latestMap) {
    return `<div class="card" style="margin-bottom:12px">
      <p class="caps">Marcadores principais</p>
      ${LabCatalog.fixedKeys().map(key => {
        const m = LabCatalog.markers[key];
        return renderMarkerRow(key, latestMap, m.label, m.unit, m.dec, m.ref);
      }).join('')}
    </div>`;
  }

  function renderCategorySections(latestMap) {
    const fixedKeys = new Set(LabCatalog.fixedKeys());
    let html = '';

    for (const cat of LabCatalog.categories) {
      const items = LabCatalog.byCategory(cat).filter(m => !fixedKeys.has(m.key) && latestMap[m.key]);
      if (!items.length) continue;
      html += `<div class="card" style="margin-bottom:12px">
        <p class="caps">${cat}</p>
        ${items.map(m => renderMarkerRow(m.key, latestMap, m.label, m.unit, m.dec, m.ref)).join('')}
      </div>`;
    }

    const customNames = Storage.labs.customMarkerNames();
    if (customNames.length) {
      html += `<div class="card" style="margin-bottom:12px">
        <p class="caps">Personalizados</p>
        ${customNames.map(name => {
          const key   = `custom:${name}`;
          const entry = latestMap[key];
          return renderMarkerRow(key, latestMap, name, entry?.unit, 2, null);
        }).join('')}
      </div>`;
    }

    return html;
  }

  function renderTimeline() {
    const rows = [...Storage.labs.getAll()].sort((a, b) => b.date.localeCompare(a.date));
    if (!rows.length) {
      return `<div class="empty"><div class="eico">🧪</div><p class="etxt">Nenhum exame registrado ainda</p></div>`;
    }
    return rows.map(r => {
      const recorded   = Object.keys(LabCatalog.markers).filter(k => r[k] !== null && r[k] !== undefined);
      const customArr  = Array.isArray(r.custom) ? r.custom : Object.values(r.custom || {});
      const totalCount = recorded.length + customArr.length;
      return `
        <div class="exrow" data-exam="${r.id}" style="cursor:pointer">
          <div style="min-width:0">
            <span class="exname">${r.category || 'Exame'}</span>
            <p style="font-size:11px;color:#A5AA94;margin-top:2px">${Utils.formatDateShort(r.date)}</p>
          </div>
          <div class="extags"><span class="etag">${totalCount} marcador${totalCount === 1 ? '' : 'es'}</span></div>
        </div>`;
    }).join('');
  }

  function renderCustomRows() {
    if (!customRows.length) {
      return `<p style="font-size:12px;color:#A5AA94;text-align:center;padding:6px 0">Nenhum marcador personalizado</p>`;
    }
    return customRows.map((r, i) => `
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:6px;margin-bottom:6px;align-items:center">
        <input class="form-input" data-custom="${i}" data-field="name" placeholder="Nome" value="${r.name || ''}">
        <input class="form-input" data-custom="${i}" data-field="unit" placeholder="Unidade" value="${r.unit || ''}">
        <input class="form-input" data-custom="${i}" data-field="value" type="number" step="0.01" inputmode="decimal" placeholder="Valor" value="${r.value ?? ''}">
        <button type="button" data-remove-custom="${i}" style="background:none;border:none;font-size:18px;color:#C9845A;cursor:pointer;padding:0 4px">×</button>
      </div>`).join('');
  }

  function renderExamForm() {
    const editingRow = editingExamId ? Storage.labs.getAll().find(r => r.id === editingExamId) : null;
    const dateVal = editingRow?.date || Utils.dateKey();
    const catVal  = editingRow?.category && editingRow.category !== 'Geral' ? editingRow.category : '';

    return `
      <div class="card" id="examFormCard" style="margin-bottom:12px">
        <p class="caps" style="margin-bottom:10px">${editingRow ? 'Editar exame' : 'Novo exame'}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px">
          <div>
            <label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">Data</label>
            <input class="form-input" id="examDate" type="date" value="${dateVal}">
          </div>
          <div>
            <label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">Categoria (opcional)</label>
            <input class="form-input" id="examCategory" placeholder="Ex: Check-up anual" value="${catVal}">
          </div>
        </div>

        ${LabCatalog.categories.map(cat => `
          <details ${['Metabólico','Lipídico'].includes(cat) ? 'open' : ''} style="margin-top:8px">
            <summary style="font-size:12px;font-weight:600;color:#4A4844;cursor:pointer;padding:6px 0">${cat}</summary>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:4px 0 2px">
              ${LabCatalog.byCategory(cat).map(m => `
                <div>
                  <label style="font-size:10px;color:#7A7570;display:block;margin-bottom:4px">${m.label}${m.unit ? ` (${m.unit})` : ''}</label>
                  <input class="form-input" id="lab_${m.key}" type="number" step="0.01" inputmode="decimal"
                    value="${editingRow?.[m.key] ?? ''}"
                    placeholder="${m.ref ? `${m.ref[0]}–${m.ref[1]}` : '—'}">
                </div>`).join('')}
            </div>
          </details>`).join('')}

        <div style="margin-top:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <p class="caps" style="margin:0">Marcadores personalizados</p>
            <button type="button" id="addCustomRowBtn" style="background:none;border:none;font-size:18px;color:#7A836A;cursor:pointer">+</button>
          </div>
          <div id="customRowsArea">${renderCustomRows()}</div>
        </div>

        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn-ok" id="saveExamBtn">Salvar</button>
          <button class="btn-adj" id="cancelExamBtn">Cancelar</button>
          ${editingRow ? `<button class="btn-adj" id="deleteExamBtn" style="color:#C9845A;flex:0 0 auto;padding:10px 14px">Excluir</button>` : ''}
        </div>
      </div>`;
  }

  function renderExamesTab() {
    const latestMap = Storage.labs.getLatest();
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <p class="screen-sub" style="margin:0">Marcadores e histórico de exames</p>
        <button id="toggleExamFormBtn" style="background:${showExamForm ? '#E8E0D0' : 'var(--color-olive)'};color:${showExamForm ? '#4A4844' : '#fff'};border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;margin-left:12px">${showExamForm ? 'Fechar' : '+ Novo exame'}</button>
      </div>
      ${showExamForm ? renderExamForm() : ''}
      ${renderFixedCard(latestMap)}
      ${renderCategorySections(latestMap)}
      <div class="card">
        <p class="caps">Linha do tempo</p>
        ${renderTimeline()}
      </div>`;
  }

  function bindCustomRowEvents() {
    document.querySelectorAll('[data-custom]').forEach(el => {
      el.addEventListener('input', () => {
        const i = Number(el.dataset.custom);
        const field = el.dataset.field;
        customRows[i] = customRows[i] || {};
        customRows[i][field] = el.value;
      });
    });
    document.querySelectorAll('[data-remove-custom]').forEach(el => {
      el.addEventListener('click', () => {
        const i = Number(el.dataset.removeCustom);
        customRows.splice(i, 1);
        document.getElementById('customRowsArea').innerHTML = renderCustomRows();
        bindCustomRowEvents();
      });
    });
  }

  function renderAndBindExames() {
    document.getElementById('progTabBody').innerHTML = renderExamesTab();
    bindExamesEvents();
  }

  function bindExamesEvents() {
    document.getElementById('toggleExamFormBtn').addEventListener('click', () => {
      showExamForm = !showExamForm;
      if (!showExamForm) { editingExamId = null; customRows = []; }
      renderAndBindExames();
    });

    // Tap em marcador → expande/recolhe histórico
    document.querySelectorAll('[data-marker]').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.marker;
        expandedMarker = expandedMarker === key ? null : key;
        renderAndBindExames();
      });
    });

    // Tap em item da linha do tempo → abre formulário para edição
    document.querySelectorAll('[data-exam]').forEach(el => {
      el.addEventListener('click', () => {
        editingExamId = el.dataset.exam;
        const row = Storage.labs.getAll().find(r => r.id === editingExamId);
        const ca  = row?.custom;
        customRows = ca ? (Array.isArray(ca) ? ca.map(c => ({ ...c })) : Object.values(ca).map(c => ({ ...c }))) : [];
        showExamForm = true;
        renderAndBindExames();
      });
    });

    if (showExamForm) {
      bindCustomRowEvents();

      document.getElementById('addCustomRowBtn').addEventListener('click', () => {
        customRows.push({ name: '', unit: '', value: '' });
        document.getElementById('customRowsArea').innerHTML = renderCustomRows();
        bindCustomRowEvents();
      });

      document.getElementById('saveExamBtn').addEventListener('click', async () => {
        const payload = {
          date:     document.getElementById('examDate').value || Utils.dateKey(),
          category: document.getElementById('examCategory').value.trim() || null,
        };
        if (editingExamId) payload.id = editingExamId;

        Object.keys(LabCatalog.markers).forEach(key => {
          const v = document.getElementById(`lab_${key}`)?.value;
          payload[key] = (v !== '' && v !== undefined) ? parseFloat(v) : null;
        });

        payload.custom = customRows
          .filter(r => r.name && String(r.name).trim() && r.value !== '' && r.value !== undefined && r.value !== null)
          .map(r => ({ name: String(r.name).trim(), unit: r.unit || '', value: parseFloat(r.value) }));

        await Storage.labs.add(payload);
        showExamForm = false; editingExamId = null; customRows = [];
        renderAndBindExames();
      });

      document.getElementById('cancelExamBtn').addEventListener('click', () => {
        showExamForm = false; editingExamId = null; customRows = [];
        renderAndBindExames();
      });

      document.getElementById('deleteExamBtn')?.addEventListener('click', async () => {
        if (!confirm('Excluir este exame? Esta ação não pode ser desfeita.')) return;
        await Storage.labs.remove(editingExamId);
        showExamForm = false; editingExamId = null; customRows = [];
        renderAndBindExames();
      });
    }

    // Gráficos de histórico dos marcadores expandidos
    document.querySelectorAll('[data-history]').forEach(el => {
      const key      = el.dataset.history;
      const isCustom = key.startsWith('custom:');
      const history  = isCustom ? Storage.labs.getCustomHistory(key.slice(7)) : Storage.labs.getHistory(key);
      Charts.barChart(el, history.map(h => h.value), {
        labels: history.map(h => Utils.formatDateShort(h.date)),
        color: '#7A836A', height: 64,
      });
    });
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════════

  async function renderTabBody() {
    if (activeTab === 'corpo') {
      await renderCorpoTab();
    } else {
      document.getElementById('progTabBody').innerHTML = renderExamesTab();
      bindExamesEvents();
    }
  }

  async function render() {
    document.getElementById('progContent').innerHTML = `${renderTabs()}<div id="progTabBody"></div>`;

    document.getElementById('progTabs').addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      activeTab = btn.dataset.tab;
      document.querySelectorAll('#progTabs .chip').forEach(b => {
        b.className = `chip ${b.dataset.tab === activeTab ? 'chip-on' : 'chip-off'}`;
      });
      renderTabBody();
    });

    await renderTabBody();
  }

  return { render };
})();
