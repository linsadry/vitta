/**
 * screens/auth.js — Login (Supabase Auth) + PIN local
 *
 * Fluxo:
 *  1) Login com e-mail/senha (uma vez por dispositivo)
 *  2) PIN de 4 dígitos (verificado a cada abertura)
 *
 * FIX: dots visuais corrigidos + feedback imediato + overlay robusto
 */

const ScreenAuth = (() => {

  // ── OVERLAY CONTROL ─────────────────────────────────────────
  function showOverlay(id) {
    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('on'));
    document.getElementById(id)?.classList.add('on');
  }

  function hideOverlays() {
    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('on'));
  }

  // ── LOGIN ────────────────────────────────────────────────────
  function showLogin(onSuccess) {
    showOverlay('authScreen');
    const emailEl = document.getElementById('authEmail');
    const passEl  = document.getElementById('authPassword');
    const errEl   = document.getElementById('authError');
    const btn     = document.getElementById('authSubmitBtn');

    errEl.textContent = '';

    async function submit() {
      const email = emailEl.value.trim();
      const pass  = passEl.value;
      if (!email || !pass) {
        errEl.textContent = 'Preencha e-mail e senha.';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Entrando…';
      try {
        await Storage.auth.signIn(email, pass);
        onSuccess();
      } catch {
        errEl.textContent = 'E-mail ou senha incorretos.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Entrar';
      }
    }

    btn.onclick = submit;
    passEl.onkeydown = e => { if (e.key === 'Enter') submit(); };
  }

  // ── PIN PAD ──────────────────────────────────────────────────
  // Renderiza pad numérico com feedback visual imediato
  function renderPinPad(onKey) {
    const pad = document.getElementById('pinPad');
    if (!pad) return;

    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

    pad.innerHTML = keys.map(k => {
      if (!k) return '<div></div>';
      return `<button class="pin-key" type="button" data-key="${k}">${k}</button>`;
    }).join('');

    // Usar addEventListener direto em cada botão (mais confiável que delegação)
    pad.querySelectorAll('.pin-key').forEach(btn => {
      // Usar touchstart para resposta imediata no mobile
      const handler = (e) => {
        e.preventDefault();  // evita duplo disparo touch+click
        // Feedback visual imediato: escurecer o botão
        btn.style.background = 'rgba(201,138,134,0.25)';
        setTimeout(() => { btn.style.background = ''; }, 180);
        onKey(btn.dataset.key);
      };
      btn.addEventListener('touchstart', handler, { passive: false });
      btn.addEventListener('click', (e) => {
        // Click só processa se não houve touch (evita duplo disparo)
        if (!e.isTrusted || e.pointerType === '') return;
        handler(e);
      });
    });
  }

  // Atualiza os 4 dots — com classe 'filled' que o CSS usa
  function updateDots(count) {
    const dots = document.querySelectorAll('#pinDots .pin-dot');
    dots.forEach((dot, i) => {
      if (i < count) {
        dot.classList.add('filled');
        dot.style.background = '#C98A86';  // garantia inline caso CSS falhe
        dot.style.transform  = 'scale(1.2)';
        setTimeout(() => { dot.style.transform = ''; }, 150);
      } else {
        dot.classList.remove('filled');
        dot.style.background = '';
        dot.style.transform  = '';
      }
    });
  }

  // Shaker animation nos dots (PIN errado)
  function shakeDots() {
    const el = document.getElementById('pinDots');
    if (!el) return;
    el.style.animation = 'none';
    // Shake inline via keyframes temporários
    el.style.transition = 'transform 0.1s';
    const seq = [8, -8, 6, -6, 4, -4, 0];
    seq.forEach((x, i) => {
      setTimeout(() => { el.style.transform = `translateX(${x}px)`; }, i * 60);
    });
    setTimeout(() => { el.style.transform = ''; }, seq.length * 60 + 50);
  }

  // ── PIN SETUP (criar PIN novo) ───────────────────────────────
  function showPinSetup(onSuccess) {
    showOverlay('pinScreen');
    document.getElementById('pinTitle').textContent = 'Crie seu PIN';
    document.getElementById('pinSub').textContent   = 'Escolha 4 dígitos';
    document.getElementById('pinError').textContent = '';
    updateDots(0);

    let first  = null;
    let digits = '';

    renderPinPad((key) => {
      const errEl = document.getElementById('pinError');
      if (errEl) errEl.textContent = '';

      if (key === '⌫') {
        if (digits.length > 0) {
          digits = digits.slice(0, -1);
          updateDots(digits.length);
        }
        return;
      }
      if (digits.length >= 4) return;

      digits += key;
      updateDots(digits.length);

      if (digits.length === 4) {
        if (first === null) {
          first = digits;
          digits = '';
          setTimeout(() => {
            updateDots(0);
            const sub = document.getElementById('pinSub');
            if (sub) sub.textContent = 'Confirme o PIN';
          }, 200);
        } else {
          if (digits === first) {
            Storage.pin.setup(digits).then(() => onSuccess());
          } else {
            shakeDots();
            if (errEl) errEl.textContent = 'PINs diferentes. Tente novamente.';
            first = null; digits = '';
            setTimeout(() => {
              updateDots(0);
              const sub = document.getElementById('pinSub');
              if (sub) sub.textContent = 'Escolha 4 dígitos';
            }, 500);
          }
        }
      }
    });
  }

  // ── PIN UNLOCK (desbloquear) ─────────────────────────────────
  function showPinUnlock(onSuccess) {
    showOverlay('pinScreen');
    document.getElementById('pinTitle').textContent = 'Digite seu PIN';
    document.getElementById('pinSub').textContent   = '';
    document.getElementById('pinError').textContent = '';
    updateDots(0);

    let digits = '';

    renderPinPad((key) => {
      const errEl = document.getElementById('pinError');
      if (errEl) errEl.textContent = '';

      if (key === '⌫') {
        if (digits.length > 0) {
          digits = digits.slice(0, -1);
          updateDots(digits.length);
        }
        return;
      }
      if (digits.length >= 4) return;

      digits += key;
      updateDots(digits.length);

      if (digits.length === 4) {
        Storage.pin.verify(digits).then(ok => {
          if (ok) {
            // Dots ficam verdes por um instante antes de entrar
            const dots = document.querySelectorAll('#pinDots .pin-dot');
            dots.forEach(d => { d.style.background = '#AEB89A'; });
            setTimeout(() => onSuccess(), 200);
          } else {
            shakeDots();
            digits = '';
            setTimeout(() => {
              updateDots(0);
              if (errEl) errEl.textContent = 'PIN incorreto. Tente de novo.';
            }, 350);
          }
        });
      }
    });
  }

  return { showLogin, showPinSetup, showPinUnlock, hideOverlays };
})();
