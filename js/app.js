/**
 * app.js — Inicialização do Fitness OS
 */

(async () => {
  // 1. Inicializar banco de dados local
  try {
    await Storage.init();
  } catch (err) {
    console.warn('IndexedDB não disponível, usando apenas localStorage:', err);
  }

  // 2. Relógio em tempo real
  Utils.startClock('stTime');

  // 3. Inicializar roteador (renderiza a primeira tela)
  Router.init();
})();
