/**
 * router.js — Vitta+
 * Gestão de navegação entre telas
 */
const Router = (() => {

  const SCREEN_IDS = {
    dash:    's-dash',
    prog:    's-prog',
    health:  's-health',
    work:    's-work',
    ai:      's-ai',
    nutri:   's-nutri',
    hydro:   's-hydro',
    config:  's-config',
    diary:   's-diary',
    // Aliases — redirecionam para tela principal + abrem tab específica
    ciclo:   's-health',
    fiv:     's-health',
    exames:  's-prog',
    eventos: 's-health',
  };

  const NAV_SCREENS = ['dash','prog','health','work','ai'];

  let current  = 'dash';
  let previous = 'dash';
  let fabOpen  = false;

  function go(id) {
    const target = SCREEN_IDS[id];
    if (!target) return;

    previous = current;
    current  = id;

    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));

    // Mostra a tela alvo
    const el = document.getElementById(target);
    if (el) el.classList.add('on');

    // Atualiza nav mobile
    document.querySelectorAll('.ni[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === id ||
        (btn.dataset.nav === 'health' && ['health','ciclo','fiv','eventos'].includes(id)) ||
        (btn.dataset.nav === 'prog'   && ['prog','exames'].includes(id)));
    });

    // FAB: ocultar em AI e Config
    const fab = document.getElementById('fabBtn');
    if (fab) fab.style.display = (id === 'ai' || id === 'config') ? 'none' : 'flex';

    closeFab();

    // Scroll topo
    const scrollEl = document.getElementById('scrollEl');
    if (scrollEl) scrollEl.scrollTop = 0;

    // Renderiza a tela
    switch (id) {
      case 'dash':    ScreenDashboard.render();    break;
      case 'prog':    ScreenProgress.render();     break;
      case 'health':  ScreenHealth.render();       break;
      case 'work':    ScreenWorkout.render();      break;
      case 'ai':      ScreenAI.render();           break;
      case 'nutri':   ScreenNutrition.render();    break;
      case 'hydro':   ScreenHydration.render();    break;
      case 'config':  ScreenConfig.render();       break;
      case 'diary':   ScreenDiary.render();        break;
      // Aliases com navegação para tab específica
      case 'ciclo':
        ScreenHealth.render();
        setTimeout(() => ScreenHealth.openTab?.('ciclo'), 80);
        break;
      case 'fiv':
        ScreenHealth.render();
        setTimeout(() => ScreenHealth.openTab?.('fiv'), 80);
        break;
      case 'exames':
        ScreenProgress.render();
        break;
      case 'eventos':
        ScreenHealth.render();
        setTimeout(() => ScreenHealth.openTab?.('consultas'), 80);
        break;
    }
  }

  function back() { go(previous); }

  function handleFabAction(action) {
    switch (action) {
      case 'water':   go('hydro');  break;
      case 'nutri':   go('nutri');  break;
      case 'treino':  go('work');   break;
      case 'health':  go('health'); break;
      case 'config':  go('config'); break;
      case 'diary':   go('diary');  break;
      case 'exames':  go('exames'); break;
      case 'eventos': go('eventos');break;
      case 'ciclo':   go('ciclo');  break;
      case 'fiv':     go('fiv');    break;
      case 'sleep':
        ScreenDashboard.openSleepModal?.();
        break;
      case 'cardio':
        ScreenDashboard.openCardioModal?.();
        break;
      case 'peso':
        ScreenDashboard.openWeightModal?.();
        break;
    }
  }

  function openFab() {
    const overlay = document.getElementById('fabOverlay');
    if (!overlay) return;
    fabOpen = true;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    document.getElementById('fabBtn')?.classList.add('fab-open');
  }

  function closeFab() {
    const overlay = document.getElementById('fabOverlay');
    if (!overlay) return;
    fabOpen = false;
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 180);
    document.getElementById('fabBtn')?.classList.remove('fab-open');
  }

  function init() {
    // Nav principal (bottom nav mobile + sidebar desktop)
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => go(btn.dataset.nav));
    });

    // FAB principal
    document.getElementById('fabBtn')?.addEventListener('click', () => {
      fabOpen ? closeFab() : openFab();
    });

    // FAB items
    document.querySelectorAll('[data-fab-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.fabAction;
        closeFab();
        handleFabAction(action);
      });
    });

    // Fechar FAB ao clicar no overlay
    document.getElementById('fabOverlay')?.addEventListener('click', e => {
      if (e.target === document.getElementById('fabOverlay')) closeFab();
    });

    // Render inicial
    go('dash');
  }

  return { go, back, init, handleFabAction };
})();
