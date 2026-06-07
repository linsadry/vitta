/**
 * data.js — Configurações do usuário e constantes do app
 *
 * Sem dados de demonstração. Tudo vem do Storage (IndexedDB/localStorage).
 */

const DefaultData = {
  user: {
    name:          'Adriana',
    waterGoalMl:   2500,
    kcalGoal:      1800,
    proteinGoalG:  120,
    weightGoalKg:  62,
    stepsGoal:     10000,
    sleepGoalH:    7,
  },

  // Hábitos zerados (estado inicial do dia)
  emptyHabits: {
    sleep: false, water: false, workout: false, protein: false, meals: false,
  },

  aiSuggestions: [
    'Como foi meu sono esta semana?',
    'Estou bebendo menos água?',
    'Qual hábito está mais consistente?',
    'Quantas vezes treinei este mês?',
  ],

  aiResponses: {
    'Como foi meu sono esta semana?':
      'Preciso de mais dados de sono registrados para te responder com precisão. Registre seu sono por alguns dias e voltarei com uma análise real.',
    'Estou bebendo menos água?':
      'Registre sua hidratação diariamente e em breve poderei comparar semanas e te dar um retrato fiel do seu consumo de água.',
    'Qual hábito está mais consistente?':
      'Ainda não tenho histórico suficiente. Continue marcando seus hábitos diários — em uma semana já consigo identificar padrões.',
    'Quantas vezes treinei este mês?':
      'Registre seus treinos na aba Treino e eu vou contabilizar automaticamente para você.',
  },
};
