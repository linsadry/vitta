/**
 * VITTA+ — Dashboard (Home) v2.0
 * Redesign botânico aquarela
 *
 * DEPENDÊNCIAS (marque quais correspondem ao seu código):
 *   router.navigateTo(page)  → navegar para uma página
 *   storage.getWeekStats()   → retorna objeto com stats da semana
 *   storage.getTodayLog()    → retorna log de hoje
 *   getNextWorkout()         → retorna treino do dia
 *   getCurrentCyclePhase()   → retorna fase atual do ciclo
 */

/* ═══ DADOS DE EXIBIÇÃO ═════════════════════════════════════════════ */

const STAT_DEFS = [
  { key:'strength',  icon:'vi-workout',   label:'Musculação',  goalKey:'goal_strength_week',  unit:'treinos' },
  { key:'cardio',    icon:'vi-cardio',    label:'Cardio',      goalKey:'goal_cardio_week',    unit:'sessões' },
  { key:'protein',   icon:'vi-protein',   label:'Proteína',    goalKey:'goal_protein_week',   unit:'dias' },
  { key:'water',     icon:'vi-water',     label:'Água',        goalKey:'goal_water_week',     unit:'dias' },
  { key:'sleep',     icon:'vi-sleep',     label:'Sono',        goalKey:'goal_sleep_week',     unit:'noites' },
];

const ACTION_DEFS = [
  {
    key:'sleep',    icon:'vi-sleep',    label:'Sono',
    page:'sono',
    getStatus: log => log?.sleep_hours ? `${log.sleep_hours}h registradas` : 'Não registrado',
    getCTA:    log => log?.sleep_hours ? 'Ver detalhe' : 'Registrar',
    isDone:    log => !!log?.sleep_hours,
  },
  {
    key:'water',    icon:'vi-water',    label:'Água',
    page:'agua',
    getStatus: log => log?.water_ml ? `${Math.round(log.water_ml/1000 * 10)/10}L adicionados` : 'Não registrado',
    getCTA:    log => log?.water_ml   ? 'Adicionar' : 'Adicionar',
    isDone:    log => (log?.water_ml || 0) >= 2000,
  },
  {
    key:'workout',  icon:'vi-workout',  label:'Treino',
    page:'treinos',
    getStatus: log => log?.workout_done ? log.workout_name : (log?.next_workout || 'Treino A'),
    getCTA:    log => log?.workout_done ? 'Ver treino' : 'Iniciar',
    isDone:    log => !!log?.workout_done,
  },
  {
    key:'cardio',   icon:'vi-cardio',   label:'Cardio',
    page:'treinos',
    getStatus: log => log?.cardio_done ? `${log.cardio_min} min` : 'Meta: 30 min',
    getCTA:    log => log?.cardio_done ? 'Concluído' : 'Registrar',
    isDone:    log => !!log?.cardio_done,
  },
  {
    key:'nutrition',icon:'vi-nutrition',label:'Nutrição',
    page:'nutricao',
    getStatus: log => log?.nutrition_logged ? 'Registrado' : 'Não registrado',
    getCTA:    log => log?.nutrition_logged ? 'Ver diário' : 'Registrar',
    isDone:    log => !!log?.nutrition_logged,
  },
  {
    key:'diary',    icon:'vi-diary',    label:'Diário',
    page:'diario',
    getStatus: log => log?.diary_written ? 'Escrito hoje' : 'Não registrado',
    getCTA:    log => log?.diary_written ? 'Reler' : 'Escrever',
    isDone:    log => !!log?.diary_written,
  },
  {
    key:'cycle',    icon:'vi-cycle',    label:'Ciclo',
    page:'ciclo',
    getStatus: log => log?.cycle_phase || 'Ver fase atual',
    getCTA:    _   => 'Ver ciclo',
    isDone:    _   => false,
  },
  {
    key:'exams',    icon:'vi-exams',    label:'Exames',
    page:'exames',
    getStatus: log => log?.pending_exams > 0 ? `${log.pending_exams} pendentes` : '0 pendentes',
    getCTA:    _   => 'Verificar',
    isDone:    _   => false,
  },
];

/* ═══ UTILITÁRIOS ════════════════════════════════════════════════════ */

function svgIcon(id, cls = '') {
  return `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia,';
  if (h < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

function fmtDate() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday:'long', day:'numeric', month:'long'
  }).replace(/^\w/, c => c.toUpperCase());
}

/* ═══ RENDER ═════════════════════════════════════════════════════════ */

function renderStatCard(def, weekStats, goals) {
  const done  = weekStats?.[def.key] ?? 0;
  const total = goals?.[def.goalKey] ?? 7;
  const pct   = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return `
    <div class="stat-card" role="button" data-nav="${def.key}-detail" tabindex="0">
      ${svgIcon(def.icon, 'stat-card-icon')}
      <span class="stat-card-label">${def.label}</span>
      <span class="stat-card-value">${done}<span class="text-faint text-sm"> / ${total}</span></span>
      <div class="stat-bar">
        <div class="stat-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function renderActionCard(def, log) {
  const done   = def.isDone(log);
  const status = def.getStatus(log);
  const cta    = def.getCTA(log);

  return `
    <div class="action-card ${done ? 'done' : ''}" role="button" data-nav="${def.page}" tabindex="0">
      ${svgIcon(def.icon, 'action-card-icon')}
      <span class="action-card-name">${def.label}</span>
      <span class="action-card-status">${status}</span>
      <button class="action-card-btn" data-nav="${def.page}">${cta}</button>
    </div>`;
}

/**
 * Renderiza a home. Chame com o container e os dados já carregados.
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {object} opts.weekStats  — { strength:2, cardio:1, protein:5, water:4, sleep:3, … }
 * @param {object} opts.goals      — { goal_strength_week:4, goal_cardio_week:6, … }
 * @param {object} opts.todayLog   — log de hoje do Supabase
 * @param {function} opts.navigate — função de navegação, ex: (page) => router.navigateTo(page)
 */
export function renderDashboard(container, { weekStats = {}, goals = {}, todayLog = {}, navigate } = {}) {

  const statCards   = STAT_DEFS.map(d => renderStatCard(d, weekStats, goals)).join('');
  const actionCards = ACTION_DEFS.map(d => renderActionCard(d, todayLog)).join('');

  container.innerHTML = `

    <!-- ── MARCA D'ÁGUA BOTÂNICA + HEADER ── -->
    <header class="home-header">
      <img class="botanical-mark" src="./botanical-watermark.svg" alt="" aria-hidden="true" loading="lazy">
      <p class="home-date">${fmtDate()}</p>
      <p class="home-greeting">${greeting()}</p>
      <span class="home-name">Adriana.</span>
      <p class="home-tagline">Sua jornada floresce<br>um passo de cada vez.</p>
    </header>

    <!-- ── EVOLUÇÃO DA SEMANA ── -->
    <section aria-labelledby="evolucao-titulo">
      <div class="section-head">
        <h2 class="section-title" id="evolucao-titulo">Evolução da semana</h2>
      </div>
      <div class="stat-row" role="list">
        ${statCards}
      </div>
    </section>

    <!-- ── AÇÕES DE HOJE ── -->
    <section aria-labelledby="acoes-titulo">
      <div class="section-head">
        <h2 class="section-title" id="acoes-titulo">Ações de hoje</h2>
      </div>
      <div class="action-grid" role="list">
        ${actionCards}
      </div>
    </section>

  `;

  /* ── EVENTOS DE NAVEGAÇÃO ──────────────────────────────────────── */
  if (typeof navigate === 'function') {
    container.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const page = el.dataset.nav;
        if (page) navigate(page);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const page = el.dataset.nav;
          if (page) navigate(page);
        }
      });
    });
  }
}

/* ═══ INICIALIZAÇÃO (integração com seu storage) ═════════════════════

Substitua pelo seu código real de carregamento de dados. Exemplo:

  import { renderDashboard } from './dashboard.js';
  import { storage }         from './storage.js';
  import { router }          from './router.js';   // ou seu equivalente

  async function initDashboard(container) {
    const [weekStats, todayLog, goals] = await Promise.all([
      storage.getWeekStats(),
      storage.getTodayLog(),
      storage.getGoals(),
    ]);

    renderDashboard(container, {
      weekStats,
      goals,
      todayLog,
      navigate: (page) => router.navigateTo(page),
    });
  }

═══════════════════════════════════════════════════════════════════════ */
