/**
 * screens/diary.js — Diário pessoal
 * Registros diários de pensamentos, reflexões e bem-estar
 * Tabela: diary_entries (Supabase)
 */

const ScreenDiary = (() => {

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function fmtDate(d) {
    if (!d) return '—';
    const [y,m,day] = d.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${day} ${months[parseInt(m)-1]}, ${y}`;
  }

  async function getEntries() {
    const { data, error } = await Storage.client
      .from('diary_entries')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);
    return error ? [] : (data || []);
  }

  async function addEntry(date, content, mood) {
    const session = await Storage.auth.getSession();
    if (!session) return;
    await Storage.client.from('diary_entries').insert({
      user_id: session.user.id, date, content, mood: mood || null,
    });
  }

  async function deleteEntry(id) {
    await Storage.client.from('diary_entries').delete().eq('id', id);
  }

  const MOODS = [
    { value: 'great',   label: '😊', title: 'Ótima' },
    { value: 'good',    label: '🙂', title: 'Boa' },
    { value: 'neutral', label: '😐', title: 'Neutra' },
    { value: 'low',     label: '😔', title: 'Difícil' },
    { value: 'tired',   label: '😴', title: 'Cansada' },
  ];

  async function render() {
    const el = document.getElementById('diaryContent');
    if (!el) return;

    el.innerHTML = '<p style="text-align:center;color:#B5ADA8;padding:16px 0">Carregando...</p>';

    const today   = Utils.dateKey();
    const entries = await getEntries();

    el.innerHTML = `
      <!-- NOVO REGISTRO -->
      <div class="card" style="margin-bottom:16px;position:relative;overflow:hidden">
        <!-- Botanical watermark -->
        <svg aria-hidden="true" style="position:absolute;bottom:-10px;right:-10px;opacity:0.07;pointer-events:none" width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path d="M50 90C50 70 50 50 50 20" stroke="#D68A86" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M50 65C40 58 28 58 24 48C20 38 30 30 38 36C44 41 48 54 50 65Z" fill="#E8B6B1" fill-opacity="0.4"/>
          <path d="M50 50C60 43 72 41 76 31C80 21 70 13 62 20C55 26 51 40 50 50Z" fill="#E8B6B1" fill-opacity="0.4"/>
          <circle cx="50" cy="16" r="5" fill="#D68A86" fill-opacity="0.4"/>
        </svg>

        <p class="caps" style="color:#D68A86;margin-bottom:4px">Como você está hoje?</p>
        <p style="font-family:'Parisienne','Dancing Script',cursive;font-size:13px;color:#B5ADA8;margin:0 0 14px">Um espaço só seu</p>

        <!-- Mood selector -->
        <div style="display:flex;gap:8px;margin-bottom:14px;justify-content:center">
          ${MOODS.map(m => `
            <label style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer">
              <input type="radio" name="diaryMood" value="${m.value}" style="display:none">
              <span class="mood-btn" style="font-size:24px;padding:6px;border-radius:12px;transition:background 0.15s;display:block">${m.label}</span>
              <span style="font-size:9px;color:#B5ADA8">${m.title}</span>
            </label>`).join('')}
        </div>

        <label class="field-label">Data</label>
        <input class="form-input" id="diaryDate" type="date" value="${today}" style="margin-bottom:10px">

        <label class="field-label">Escreva livremente</label>
        <textarea class="form-input" id="diaryContent" rows="5"
          placeholder="O que está no seu coração hoje? Conquistas, aprendizados, sentimentos..."
          style="resize:vertical;margin-bottom:16px;line-height:1.6;font-size:13px"></textarea>

        <button class="mainbtn" id="saveDiaryBtn" style="background:#D68A86">Salvar entrada</button>
      </div>

      <!-- ENTRADAS ANTERIORES -->
      ${entries.length ? `
        <p class="caps" style="margin-bottom:10px">Registros anteriores</p>
        ${entries.map(e => `
          <div class="card" style="margin-bottom:10px;padding:14px 16px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <div>
                <p style="font-size:12px;font-weight:700;color:#D68A86;margin:0 0 2px">${fmtDate(e.date)}</p>
                ${e.mood ? `<span style="font-size:18px">${MOODS.find(m => m.value === e.mood)?.label || ''}</span>` : ''}
              </div>
              <button data-del-diary="${e.id}" style="background:none;border:none;color:#E8B6B1;font-size:18px;cursor:pointer">×</button>
            </div>
            <p style="font-size:13px;color:#3B3532;line-height:1.6;margin:0;white-space:pre-line">${esc(e.content)}</p>
          </div>`).join('')}
      ` : `<div class="empty"><div class="eico">✍️</div><p class="etxt">Sua primeira entrada vai aparecer aqui.</p></div>`}`;

    // Mood button highlight
    document.querySelectorAll('input[name="diaryMood"]').forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('.mood-btn').forEach(b => { b.style.background = 'none'; });
        radio.closest('label').querySelector('.mood-btn').style.background = 'rgba(214,138,134,0.15)';
      });
    });

    // Save
    document.getElementById('saveDiaryBtn')?.addEventListener('click', async () => {
      const date    = document.getElementById('diaryDate').value;
      const content = document.getElementById('diaryContent').value.trim();
      const mood    = document.querySelector('input[name="diaryMood"]:checked')?.value || null;
      if (!content) { return; }
      await addEntry(date, content, mood);
      render();
    });

    // Delete
    document.querySelectorAll('[data-del-diary]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Apagar esta entrada?')) return;
        await deleteEntry(btn.dataset.delDiary);
        render();
      });
    });
  }

  return { render };
})();
