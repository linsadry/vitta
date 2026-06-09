/**
 * router.js — Navegação entre telas
 * Nav bar SEMPRE visível. FAB oculto só na tela IA.
 */

const Router = (() => {
  const SCREEN_IDS = {
    dash:   's-dash',
    nutri:  's-nutri',
    work:   's-work',
    prog:   's-prog',
    ai:     's-ai',
    hydro:  's-hydro',
    config: 's-config',
  };

  // Telas que têm item na nav principal
  const NAV_SCREENS = ['dash','nutri','work','prog','ai'];

  let current  = 'dash';
  let previous = 'dash';

  function go(id) {
    if (!SCREEN_IDS[id]) return;

    // Ocultar todas as telas
    Object.values(SCREEN_IDS).forEach(elId => {
      const el = document.getElementById(elId);
      if (el) el.classList.remove('on');
    });

    // Mostrar alvo
    const target = document.getElementById(SCREEN_IDS[id]);
    if (target) target.classList.add('on');

    previous = current;
    current  = id;

    // Fundo do scroll
    const scroll = document.getElementById('scrollEl');
    if (scroll) scroll.style.background = id === 'ai' ? '#fff' : '#F4F1EC';

    // FAB: ocultar APENAS na tela IA e config
    const fab = document.getElementById('fabBtn');
    if (fab) fab.style.display = (id === 'ai' || id === 'config') ? 'none' : 'flex';

    // Nav bar: SEMPRE visível
    // Destacar item ativo (usa a tela atual se estiver na nav, senão a anterior)
    const activeNav = NAV_SCREENS.includes(id) ? id : previous;
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === activeNav);
    });

    // Renderizar tela
    const renders = {
      dash:   () => ScreenDashboard.render(),
      nutri:  () => ScreenNutrition.render(),
      work:   () => ScreenWorkout.render(),
      prog:   () => ScreenProgress.render(),
      ai:     () => ScreenAI.render(),
      hydro:  () => ScreenHydration.render(),
      config: () => ScreenConfig.render(),
    };
    if (renders[id]) renders[id]();

    // Scroll para o topo
    if (scroll) scroll.scrollTop = 0;
  }

  function back() {
    go(previous);
  }

  function init() {
    // Nav principal
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => go(btn.dataset.nav));
    });

    // FAB → Hidratação
    document.getElementById('fabBtn')?.addEventListener('click', () => go('hydro'));

    // Tela inicial
    go('dash');
  }

  return { init, go, back, get current() { return current; } };
})();
