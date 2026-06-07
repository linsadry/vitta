/**
 * data.js — Dados padrão e seed para modo demo
 *
 * Quando não há dados reais salvos, usa estes valores
 * para demonstrar a interface. Em produção, tudo vem
 * do Storage (IndexedDB/localStorage).
 */

const DefaultData = {
  user: {
    name: 'Adriana',
    waterGoalMl: 2500,
    kcalGoal: 1800,
    proteinGoalG: 120,
    weightGoalKg: 62,
    stepsGoal: 10000,
    sleepGoalH: 7,
  },

  // Dados de demonstração (substituídos pelos reais via Storage)
  demo: {
    sleep:   { hours: 7.2, bedtime: '23:10', wakeup: '06:22' },
    water:   { ml: 1750 },
    steps:   { today: 8340 },
    weight:  { current: 63.4 },
    score:   { day: 78, week: 71, month: 68 },

    habits: {
      sleep: true, water: false, workout: true, protein: true, meals: false,
    },

    meals: [
      { id: 1, name: 'Café da manhã', time: '07:30', cal: 420, p: 28, c: 38, f: 14,
        foods: ['Ovos mexidos', 'Pão integral', 'Café com leite'] },
      { id: 2, name: 'Almoço', time: '12:45', cal: 680, p: 45, c: 72, f: 18,
        foods: ['Frango grelhado', 'Arroz integral', 'Brócolis', 'Azeite'] },
      { id: 3, name: 'Lanche', time: '16:00', cal: 210, p: 12, c: 24, f: 6,
        foods: ['Iogurte grego', 'Granola'] },
    ],

    workouts: [
      { day: 'Seg', done: true,  type: 'Musculação' },
      { day: 'Ter', done: false, type: null },
      { day: 'Qua', done: true,  type: 'Corrida' },
      { day: 'Qui', done: false, type: null },
      { day: 'Sex', done: true,  type: 'Musculação' },
      { day: 'Sáb', done: false, type: null },
      { day: 'Dom', done: false, type: null },
    ],

    todayWorkout: {
      name: 'Pernas',
      time: '07h15',
      exercises: [
        { name: 'Agachamento',    sets: 4, reps: '12', load: '60kg' },
        { name: 'Stiff',          sets: 3, reps: '10', load: '50kg' },
        { name: 'Leg press',      sets: 3, reps: '15', load: '120kg' },
        { name: 'Cadeira flexora',sets: 3, reps: '12', load: '30kg' },
      ],
    },

    lastRun: {
      distance: '5.2 km', time: "32'40\"", pace: "6'17\"/km", hr: '148 bpm',
    },

    waterWeek: [1800, 2100, 2400, 1600, 2300, 1750, 1900],
    sleepWeek:  [6.5,  7.2,  8.0,  6.8,  7.5,  7.2,  0],

    measurements: {
      waist: 72, hip: 94, abdomen: 79, arm: 32, thigh: 56,
    },

    weightHistory: [
      { m: 'Jan', v: 65.2 },
      { m: 'Fev', v: 64.8 },
      { m: 'Mar', v: 64.3 },
      { m: 'Abr', v: 63.9 },
      { m: 'Mai', v: 63.4 },
    ],
  },

  // Sugestões para o assistente IA
  aiSuggestions: [
    'Como foi meu sono esta semana?',
    'Estou bebendo menos água?',
    'Qual hábito está mais consistente?',
    'Quantas vezes treinei este mês?',
  ],

  aiResponses: {
    'Como foi meu sono esta semana?':
      'Sua média foi 7,1h esta semana — acima da meta de 7h ✓\n\nMelhor noite: quarta (8h). Pior: segunda (6,5h). Tendência estável e positiva.',
    'Estou bebendo menos água?':
      'Sim, leve redução. Média atual: 2,0L/dia vs 2,2L em maio.\n\nMeta de 2,5L não atingida em 4 dos últimos 7 dias. Pico: quarta com 2,4L.',
    'Qual hábito está mais consistente?':
      'Ranking este mês:\n1. Treino — 71%\n2. Registro alimentar — 65%\n3. Sono — 60%\n4. Proteína — 48%\n5. Hidratação — 42%',
    'Quantas vezes treinei este mês?':
      '9 treinos em junho até agora:\n• 5× Musculação\n• 3× Corrida\n• 1× Yoga\n\nRecorde: abril com 14 treinos.',
  },
};
