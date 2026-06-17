/**
 * router.js — Navegação entre telas
 * Fase 4: nav Hoje / Evolução / Saúde / Treinos / IA + FAB global
 */

const Router = (() => {
  const SCREEN_IDS = {
    dash:   's-dash',
    prog:   's-prog',
    health: 's-health',
    work:   's-work',
    ai:     's-ai',
    nutri:  's-nutri',
    hydro:  's-hydro',
    config: 's-config',
    diary:  's-diary',
    ciclo:  's-health',   // ciclo abre health com tab específica
    exames: 's-prog',     // exames abre a tela de Evolução (labs)
  };

  // Telas que têm item na nav principal
  const NAV_SCREENS = ['dash', 'prog', 'health', 'work', 'ai'];

  let current  = 'dash';
  let previous = 'dash';
  let fabOpen  = false;

  function go(id) {
    if (!SCREEN_IDS[id]) return;

    // Fechar FAB se aberto
    closeFab();

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
    if (scroll) scroll.style.background = id === 'ai' ? '#fff' : 'var(--bg-screen)';

    // FAB: ocultar na IA e config
    const fab = document.getElementById('fabBtn');
    if (fab) fab.style.display = (id === 'ai' || id === 'config') ? 'none' : 'flex';

    // Nav bar: destacar item ativo
    const activeNav = NAV_SCREENS.includes(id) ? id : previous;
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === activeNav);
    });

    // Renderizar tela
    const renders = {
      dash:   () => ScreenDashboard.render(),
      prog:   () => ScreenProgress.render(),
      health: () => ScreenHealth.render(),
      work:   () => ScreenWorkout.render(),
      ai:     () => ScreenAI.render(),
      nutri:  () => ScreenNutrition.render(),
      hydro:  () => ScreenHydration.render(),
      config: () => ScreenConfig.render(),
      diary:  () => ScreenDiary.render(),
      // ciclo e exames redirecionam via handleFabAction
    };
    if (renders[id]) renders[id]();

    if (scroll) scroll.scrollTop = 0;
  }

  function back() { go(previous); }

  // ── FAB Speed Dial ───────────────────────────────────────────

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
    if (!overlay || !fabOpen) return;
    fabOpen = false;
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 180);
    document.getElementById('fabBtn')?.classList.remove('fab-open');
  }

  function toggleFab() {
    if (fabOpen) closeFab(); else openFab();
  }

  function init() {
    // Nav principal
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => go(btn.dataset.nav));
    });

    // FAB principal → abre/fecha speed dial
    document.getElementById('fabBtn')?.addEventListener('click', toggleFab);

    // FAB overlay: fechar ao clicar no backdrop
    document.getElementById('fabOverlay')?.addEventListener('click', e => {
      if (e.target === document.getElementById('fabOverlay')) closeFab();
    });

    // FAB action items
    document.querySelectorAll('[data-fab-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.fabAction;
        closeFab();
        handleFabAction(action);
      });
    });

    // Sair (sidebar desktop)
    document.getElementById('navLogoutBtn')?.addEventListener('click', async () => {
      if (!confirm('Sair da sua conta neste dispositivo?')) return;
      await Storage.auth.signOut();
      location.reload();
    });

    go('dash');
  }

  function handleFabAction(action) {
    switch (action) {
      case 'water':    go('hydro');   break;
      case 'nutri':    go('nutri');   break;
      case 'treino':   go('work');    break;
      case 'progress': go('prog');    break;
      case 'health':   go('health');  break;
      case 'config':   go('config');  break;
      case 'diary':    go('diary');   break;
      case 'exames':   go('prog');    break;
      case 'ciclo':
        go('health');
        setTimeout(() => { if (typeof ScreenHealth !== 'undefined') ScreenHealth.openTab('ciclo'); }, 80);
        break;
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

  return { init, go, back, closeFab, get current() { return current; } };
})();
