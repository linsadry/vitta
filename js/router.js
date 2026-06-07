/**
 * router.js — Navegação entre telas
 */

const Router = (() => {
  const SCREENS = {
    dash:    { el: 's-dash',    render: () => ScreenDashboard.render() },
    nutri:   { el: 's-nutri',  render: () => ScreenNutrition.render() },
    work:    { el: 's-work',   render: () => ScreenWorkout.render()   },
    prog:    { el: 's-prog',   render: () => ScreenProgress.render()  },
    ai:      { el: 's-ai',     render: () => ScreenAI.render()        },
    hydro:   { el: 's-hydro',  render: () => ScreenHydration.render() },
    config:  { el: 's-config', render: () => ScreenConfig.render()    },
  };

  let current  = 'dash';
  let previous = 'dash'; // para botão voltar

  function go(id) {
    if (!SCREENS[id]) return;

    // Ocultar todas
    Object.values(SCREENS).forEach(s => {
      const el = document.getElementById(s.el);
      if (el) el.classList.remove('on');
    });

    // Mostrar alvo
    const target = document.getElementById(SCREENS[id].el);
    if (target) target.classList.add('on');

    previous = current;
    current  = id;

    // Fundo scroll
    const scroll = document.getElementById('scrollEl');
    if (scroll) scroll.style.background = id === 'ai' ? '#fff' : '#F4F1EC';

    // FAB: visível em todas exceto IA e config
    const fab = document.getElementById('fabBtn');
    if (fab) fab.style.display = (id === 'ai' || id === 'config') ? 'none' : 'flex';

    // Nav: ativa o item correspondente (hydro e config não têm item na nav)
    const NAV_IDS = ['dash','nutri','work','prog','ai'];
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === id);
    });
    // Se for tela sem nav (hydro/config), mantém o item anterior destacado
    if (!NAV_IDS.includes(id)) {
      document.querySelectorAll('[data-nav]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.nav === previous);
      });
    }

    // Renderizar
    SCREENS[id].render();

    // Scroll topo
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
