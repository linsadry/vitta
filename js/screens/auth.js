/**
 * screens/auth.js — Login (Supabase Auth) + PIN local
 *
 * Fluxo:
 *  1) Login com e-mail/senha (sessão persiste por dispositivo)
 *  2) PIN de 4 dígitos (verificado a cada abertura do app)
 *
 * FIX: usa apenas 'click' com touch-action:manipulation no CSS.
 *      Não usa touchstart/pointerType que quebrava no iOS.
 */

const ScreenAuth = (() => {

  // ── OVERLAY ─────────────────────────────────────────────────
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
    if (!btn) return;

    errEl.textContent = '';

    async function submit() {
      const email = emailEl?.value.trim();
      const pass  = passEl?.value;
      if (!email || !pass) { errEl.textContent = 'Preencha e-mail e senha.'; return; }
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
    if (passEl) passEl.onkeydown = e => { if (e.key === 'Enter') submit(); };
  }

  // ── PIN: atualizar dots ──────────────────────────────────────
  function setDots(count) {
    document.querySelectorAll('#pinDots .pin-dot').forEach((dot, i) => {
      const filled = i < count;
      dot.classList.toggle('filled', filled);
      // Garantia inline caso o CSS não carregue
      dot.style.background = filled ? '#D89A95' : '';
      dot.style.transform  = filled ? 'scale(1.2)' : '';
    });
  }

  // Animação de erro nos dots
  function shakeDots() {
    const el = document.getElementById('pinDots');
    if (!el) return;
    const frames = [10, -10, 8, -8, 5, -5, 0];
    frames.forEach((x, i) =>
      setTimeout(() => { el.style.transform = `translateX(${x}px)`; }, i * 55)
    );
    setTimeout(() => { el.style.transform = ''; }, frames.length * 55 + 60);
  }

  // Dots verdes no acerto (feedback positivo antes de abrir o app)
  function successDots() {
    document.querySelectorAll('#pinDots .pin-dot').forEach(dot => {
      dot.style.background = '#A8B8A0';
      dot.style.transform  = 'scale(1.1)';
    });
  }

  // ── PIN: construir teclado numérico ─────────────────────────
  // Usa APENAS click com touch-action:manipulation no CSS.
  // Isso elimina o delay de 300ms no iOS sem o bug touchstart.
  function buildPad(onKey) {
    const pad = document.getElementById('pinPad');
    if (!pad) return;

    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    pad.innerHTML = keys.map(k =>
      k === '' ? '<div class="pin-key-spacer"></div>'
               : `<button class="pin-key" type="button">${k}</button>`
    ).join('');

    pad.querySelectorAll('.pin-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.textContent.trim();
        onKey(key);
      });
    });
  }

  // ── PIN SETUP (criar PIN novo) ───────────────────────────────
  function showPinSetup(onSuccess) {
    showOverlay('pinScreen');
    _setTitle('Crie seu PIN', 'Escolha 4 dígitos');
    _clearError();
    setDots(0);

    let first  = null;
    let digits = '';

    buildPad(key => {
      _clearError();
      if (key === '⌫') {
        digits = digits.slice(0, -1);
        setDots(digits.length);
        return;
      }
      if (digits.length >= 4) return;
      digits += key;
      setDots(digits.length);

      if (digits.length < 4) return;

      if (first === null) {
        first = digits;
        digits = '';
        setTimeout(() => {
          setDots(0);
          _setTitle('Confirme o PIN', 'Digite novamente');
        }, 180);
      } else {
        if (digits === first) {
          successDots();
          Storage.pin.setup(digits).then(onSuccess);
        } else {
          shakeDots();
          _setError('PINs diferentes. Tente novamente.');
          first = null; digits = '';
          setTimeout(() => {
            setDots(0);
            _setTitle('Crie seu PIN', 'Escolha 4 dígitos');
          }, 500);
        }
      }
    });
  }

  // ── PIN UNLOCK (desbloquear) ─────────────────────────────────
  function showPinUnlock(onSuccess) {
    showOverlay('pinScreen');
    _setTitle('Digite seu PIN', '');
    _clearError();
    setDots(0);

    let digits  = '';
    let blocked = false; // evita multiplos submits simultâneos

    buildPad(key => {
      if (blocked) return;
      _clearError();

      if (key === '⌫') {
        digits = digits.slice(0, -1);
        setDots(digits.length);
        return;
      }
      if (digits.length >= 4) return;
      digits += key;
      setDots(digits.length);

      if (digits.length < 4) return;

      blocked = true;
      Storage.pin.verify(digits).then(ok => {
        if (ok) {
          successDots();
          setTimeout(onSuccess, 220);
        } else {
          shakeDots();
          _setError('PIN incorreto. Tente novamente.');
          digits = '';
          setTimeout(() => {
            setDots(0);
            blocked = false;
          }, 400);
        }
      }).catch(() => {
        _setError('Erro ao verificar PIN. Tente de novo.');
        digits = '';
        blocked = false;
        setDots(0);
      });
    });
  }

  // ── ESQUECI MEU PIN ─────────────────────────────────────────
  async function forgotPin() {
    const msg = 'Para redefinir seu PIN, você precisará fazer login novamente com e-mail e senha.';
    if (!window.confirm(msg)) return;

    try {
      // Sinaliza que é um reset de PIN (boot() vai detectar)
      sessionStorage.setItem('pinReset', '1');
      await Storage.auth.signOut();
      window.location.reload();
    } catch {
      // Se signOut falhar, limpa session e recarrega
      sessionStorage.clear();
      window.location.reload();
    }
  }

  // ── HELPERS ──────────────────────────────────────────────────
  function _setTitle(title, sub) {
    const t = document.getElementById('pinTitle');
    const s = document.getElementById('pinSub');
    if (t) t.textContent = title;
    if (s) s.textContent = sub || '';
  }

  function _setError(msg) {
    const el = document.getElementById('pinError');
    if (el) el.textContent = msg;
  }

  function _clearError() {
    const el = document.getElementById('pinError');
    if (el) el.textContent = '';
  }

  // Expor forgotPin globalmente para o botão HTML
  window.vittaForgotPin = forgotPin;

  return { showLogin, showPinSetup, showPinUnlock, hideOverlays };
})();
