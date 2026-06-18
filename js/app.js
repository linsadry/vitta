/**
 * app.js — Inicialização do Vitta+
 * Fluxo: sessão Supabase → PIN → Router
 */
(() => {
  async function boot() {
    const authed = await Storage.init();

    if (!authed) {
      ScreenAuth.showLogin(boot);
      return;
    }

    // Usuário acabou de fazer "Esqueci meu PIN" → forçar criação de novo PIN
    if (sessionStorage.getItem('pinReset') === '1') {
      sessionStorage.removeItem('pinReset');
      // Limpar PIN antigo no Supabase para forçar setup
      try {
        await Storage.client
          .from('fitness_settings')
          .update({ pin_hash: null, pin_salt: null })
          .eq('user_id', (await Storage.client.auth.getUser()).data.user.id);
      } catch { /* ignora erros aqui */ }
      ScreenAuth.showPinSetup(boot);
      return;
    }

    if (!Storage.pin.isUnlocked()) {
      if (Storage.pin.hasPin()) {
        ScreenAuth.showPinUnlock(boot);
      } else {
        ScreenAuth.showPinSetup(boot);
      }
      return;
    }

    ScreenAuth.hideOverlays();
    Router.init();
  }

  boot();
})();
