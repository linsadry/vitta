/**
 * app.js — Inicialização do Fitness OS
 *
 * Fluxo: sessão Supabase? -> PIN local? -> hidrata cache -> Router
 */

(() => {
  async function boot() {
    const authed = await Storage.init();

    if (!authed) {
      ScreenAuth.showLogin(boot);
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
