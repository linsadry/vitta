/**
 * screens/auth.js — Login (Supabase Auth) + PIN local
 *
 * Duas camadas de acesso:
 *  1) Login com e-mail/senha (uma vez por dispositivo, sessão persiste)
 *  2) PIN de 4 dígitos (trava de tela local, verificado a cada abertura)
 */

const ScreenAuth = (() => {

  function showOverlay(id) {
    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('on'));
    document.getElementById(id)?.classList.add('on');
  }

  function hideOverlays() {
    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('on'));
  }

  // ── LOGIN ─────────────────────────────────────────────────
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
      btn.textContent = 'Entrando...';
      try {
        await Storage.auth.signIn(email, pass);
        onSuccess();
      } catch (err) {
        errEl.textContent = 'E-mail ou senha incorretos.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Entrar';
      }
    }

    btn.onclick = submit;
    passEl.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  }

  // ── PIN (setup ou unlock) ───────────────────────────────────
  function renderPinPad() {
    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    return keys.map(k => {
      if (k === '') return `<div></div>`;
      return `<button class="pin-key" data-key="${k}">${k}</button>`;
    }).join('');
  }

  function updateDots(n) {
    document.querySelectorAll('#pinDots .pin-dot').forEach((dot, i) => {
      dot.classList.toggle('pin-dot-filled', i < n);
    });
  }

  function showPinSetup(onSuccess) {
    showOverlay('pinScreen');
    document.getElementById('pinTitle').textContent = 'Crie seu PIN';
    document.getElementById('pinSub').textContent   = 'Escolha 4 dígitos para travar o app';
    document.getElementById('pinError').textContent = '';
    document.getElementById('pinPad').innerHTML = renderPinPad();

    let first = null;
    let digits = '';
    updateDots(0);

    document.getElementById('pinPad').onclick = async (e) => {
      const key = e.target.closest('.pin-key')?.dataset.key;
      if (key === undefined) return;
      const errEl = document.getElementById('pinError');

      if (key === '⌫') {
        digits = digits.slice(0, -1);
        updateDots(digits.length);
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
            document.getElementById('pinSub').textContent = 'Confirme o PIN';
          }, 150);
        } else {
          if (digits === first) {
            await Storage.pin.setup(digits);
            onSuccess();
          } else {
            errEl.textContent = 'PINs diferentes. Tente novamente.';
            first = null; digits = '';
            setTimeout(() => {
              updateDots(0);
              document.getElementById('pinSub').textContent = 'Escolha 4 dígitos para travar o app';
            }, 400);
          }
        }
      }
    };
  }

  function showPinUnlock(onSuccess) {
    showOverlay('pinScreen');
    document.getElementById('pinTitle').textContent = 'Digite seu PIN';
    document.getElementById('pinSub').textContent   = '';
    document.getElementById('pinError').textContent = '';
    document.getElementById('pinPad').innerHTML = renderPinPad();

    let digits = '';
    updateDots(0);

    document.getElementById('pinPad').onclick = async (e) => {
      const key = e.target.closest('.pin-key')?.dataset.key;
      if (key === undefined) return;
      const errEl = document.getElementById('pinError');

      if (key === '⌫') {
        digits = digits.slice(0, -1);
        updateDots(digits.length);
        return;
      }
      if (digits.length >= 4) return;
      digits += key;
      updateDots(digits.length);

      if (digits.length === 4) {
        const ok = await Storage.pin.verify(digits);
        if (ok) {
          onSuccess();
        } else {
          errEl.textContent = 'PIN incorreto.';
          digits = '';
          setTimeout(() => updateDots(0), 300);
        }
      }
    };
  }

  return { showLogin, showPinSetup, showPinUnlock, hideOverlays };
})();
