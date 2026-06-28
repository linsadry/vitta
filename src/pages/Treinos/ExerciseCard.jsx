const FEEL_COLORS = {
  facil: 'text-emerald-500',
  moderado: 'text-amber-500',
  dificil: 'text-red-400',
};

export default function ExerciseCard({ exercise, config, lastLog, onRegister }) {
  if (!exercise) return null;

  const lastSets = lastLog?.sets || [];
  const lastWeight = lastSets.length ? Math.max(...lastSets.map(s => s.weight || 0)) : null;
  const lastReps = lastSets[0]?.reps;

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Categoria */}
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">
            {exercise.category}
          </p>
          {/* Nome */}
          <h3 className="text-base font-semibold text-stone-800 mb-2">
            {exercise.name}
          </h3>

          {/* Config planejada */}
          <p className="text-xs text-stone-400 mb-2">
            {config.sets} séries · {config.reps} reps
            {config.notes && <span className="ml-2 italic">· {config.notes}</span>}
          </p>

          {/* Último treino */}
          {lastLog ? (
            <div className="flex items-center gap-3">
              <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-1.5">
                <p className="text-[10px] text-stone-400 mb-0.5">Última sessão</p>
                <p className="text-sm font-bold text-stone-700">
                  {lastWeight} kg
                </p>
                <p className="text-xs text-stone-500">
                  {lastSets.map(s => s.reps).join(' · ')}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-300 italic">Nenhum registro anterior</p>
          )}
        </div>

        {/* Botão registrar */}
        <button
          onClick={onRegister}
          className="ml-3 bg-sage-500 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-sage-600 transition-colors whitespace-nowrap"
        >
          Registrar
        </button>
      </div>
    </div>
  );
}
