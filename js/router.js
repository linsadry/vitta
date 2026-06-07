/**
 * router.js — Navegação entre telas
 */

const Router = (() => {
  const SCREENS = {
    dash:  { el: 's-dash',  render: () => ScreenDashboard.render() },
    nutri: { el: 's-nutri', render: () => ScreenNutrition.render() },
    work:  { el: 's-work',  render: () => ScreenWorkout.render()   },
    prog:  { el: 's-prog',  render: () => ScreenProgress.render()  },
    ai:    { el: 's-ai',    render: () => ScreenAI.render()        },
    // Hydration acessível via FAB ou atalho (não na nav principal)
    hydro: { el: 's-hydro', render: () => ScreenHydration.render() },
  };

  let current = 'dash';

  function go(id) {
    if (!SCREENS[id]) return;

    // Esconder todas as telas
    Object.values(SCREENS).forEach(s => {
      const el = document.getElementById(s.el);
      if (el) el.classList.remove('on');
    });

    // Mostrar a tela alvo
    const target = document.getElementById(SCREENS[id].el);
    if (target) target.classList.add('on');

    // Scroll area: fundo branco na tela IA
    const scroll = document.getElementById('scrollEl');
    if (scroll) scroll.style.background = id === 'ai' ? '#fff' : '#F4F1EC';

    // FAB: ocultar na tela IA
    const fab = document.getElementById('fabBtn');
    if (fab) fab.style.display = id === 'ai' ? 'none' : 'flex';

    // Nav: atualizar estado ativo
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === id);
    });

    // Renderizar conteúdo da tela
    SCREENS[id].render();

    // Scroll para o topo
    if (scroll) scroll.scrollTop = 0;

    current = id;
  }

  function init() {
    // Bind nav buttons
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => go(btn.dataset.nav));
    });

    // FAB: abre hidratação
    const fab = document.getElementById('fabBtn');
    if (fab) fab.addEventListener('click', () => go('hydro'));

    // Tela inicial
    go('dash');
  }

  return { init, go, get current() { return current; } };
})();
