/**
 * screens/ai.js — Assistente IA local
 */

const ScreenAI = (() => {
  let suggHidden = false;

  function addBubble(text, role) {
    const area = document.getElementById('msgArea');
    const div  = document.createElement('div');
    div.className = `bubble bubble-${role} fadein`;
    div.textContent = text;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  function showTyping() {
    const area = document.getElementById('msgArea');
    const div  = document.createElement('div');
    div.id        = 'typingBubble';
    div.className = 'bubble bubble-ai fadein';
    div.innerHTML = '<div class="typing-dots"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>';
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('typingBubble');
    if (el) el.remove();
  }

  function hideSuggestions() {
    if (suggHidden) return;
    const box = document.getElementById('suggBox');
    if (box) { box.style.display = 'none'; suggHidden = true; }
  }

  function respond(question) {
    const resp = DefaultData.aiResponses[question]
      || 'Com base nos seus dados locais: você está progredindo bem. Treino e sono são seus pontos mais fortes este mês.';

    hideSuggestions();
    addBubble(question, 'user');
    showTyping();
    setTimeout(() => { hideTyping(); addBubble(resp, 'ai'); }, 1400);
  }

  function doSend() {
    const inp = document.getElementById('aiInp');
    const q   = inp?.value.trim();
    if (!q) return;
    inp.value = '';
    respond(q);
  }

  function render() {
    // Greeting bubble
    const area = document.getElementById('msgArea');
    area.innerHTML = '';
    addBubble(
      `Olá, ${DefaultData.user.name}! Posso responder perguntas sobre sua saúde usando apenas seus dados locais. O que deseja saber?`,
      'ai'
    );
    suggHidden = false;

    // Suggestions
    const suggBox = document.getElementById('suggBox');
    suggBox.style.display = '';
    suggBox.innerHTML = DefaultData.aiSuggestions.map(s => `
      <button class="sugg-btn" data-q="${s}">
        ${s}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A5AA94"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>`).join('');

    suggBox.addEventListener('click', e => {
      const btn = e.target.closest('[data-q]');
      if (btn) respond(btn.dataset.q);
    });

    // Input
    const inp  = document.getElementById('aiInp');
    const send = document.getElementById('aiSendBtn');
    if (inp)  inp.addEventListener('keydown',  e => { if (e.key === 'Enter') doSend(); });
    if (send) send.addEventListener('click', doSend);
  }

  return { render };
})();
