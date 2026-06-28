import { useMemo } from 'react';

const OBJECTIVES = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento',
  manutencao: 'Manutenção',
  corrida: 'Corrida',
};

export default function ProgramCard({ program, sessions, onOpenWorkout, onSwitch }) {
  const progress = useMemo(() => {
    if (!program.start_date || !program.total_weeks) return null;
    const start = new Date(program.start_date);
    const now = new Date();
    const daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const totalDays = program.total_weeks * 7;
    const currentWeek = Math.floor(daysElapsed / 7) + 1;
    const pct = Math.min(daysElapsed / totalDays, 1);
    return { currentWeek, totalWeeks: program.total_weeks, pct };
  }, [program]);

  const endDate = program.end_date
    ? new Date(program.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  const startDate = program.start_date
    ? new Date(program.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  const workouts = program.workouts || [];

  // Último treino realizado neste programa
  const lastSession = sessions.find(s => s.program_id === program.id);

  return (
    <div className="mx-4 bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
      {/* Nome do programa */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-0.5">
            {OBJECTIVES[program.objective] || program.objective || 'Programa ativo'}
          </p>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight">
            {program.name.toUpperCase()}
          </h2>
        </div>
        <button
          onClick={onSwitch}
          className="text-xs text-stone-400 mt-1 underline underline-offset-2"
        >
          Trocar
        </button>
      </div>

      {/* Datas */}
      {startDate && (
        <p className="text-xs text-stone-400 mb-3">
          {startDate}{endDate ? ` → ${endDate}` : ''}
        </p>
      )}

      {/* Progresso em semanas */}
      {progress && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-stone-500 mb-1.5">
            <span>Semana {progress.currentWeek} de {progress.totalWeeks}</span>
            <span>{Math.round(progress.pct * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-400 rounded-full transition-all"
              style={{ width: `${progress.pct * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Treinos A B C D */}
      <div className="flex gap-2 mb-4">
        {workouts.sort((a,b) => a.order_index - b.order_index).map(w => (
          <button
            key={w.id}
            onClick={() => onOpenWorkout(w)}
            className="flex-1 py-3 bg-stone-50 hover:bg-sage-50 border border-stone-200 hover:border-sage-300 rounded-xl text-sm font-semibold text-stone-700 transition-all"
          >
            {w.name}
          </button>
        ))}
      </div>

      {/* Último treino */}
      {lastSession && (
        <p className="text-xs text-stone-400">
          Último: Treino {lastSession.workouts?.name} —{' '}
          {new Date(lastSession.session_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
        </p>
      )}
    </div>
  );
}
