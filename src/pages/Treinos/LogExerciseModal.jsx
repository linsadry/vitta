import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const FEELS = [
  { key: 'facil', label: '🙂 Fácil' },
  { key: 'moderado', label: '😐 Moderado' },
  { key: 'dificil', label: '😮 Difícil' },
];

export default function LogExerciseModal({
  exercise, config, lastLog, userId,
  ensureSession, onSaved, onClose
}) {
  const lastSets = lastLog?.sets || [];

  // Inicia com as cargas do último treino (ou valores padrão)
  const [sets, setSets] = useState(() => {
    const n = config.sets || 3;
    return Array.from({ length: n }, (_, i) => ({
      weight: lastSets[i]?.weight ?? '',
      reps: lastSets[i]?.reps ?? config.reps ?? 12,
    }));
  });

  const [feel, setFeel] = useState(null);
  const [rpe, setRpe] = useState(null);
  const [saving, setSaving] = useState(false);

  function updateSet(index, field, value) {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function addSet() {
    const last = sets[sets.length - 1];
    setSets(prev => [...prev, { weight: last?.weight ?? '', reps: last?.reps ?? 12 }]);
  }

  function removeSet(index) {
    if (sets.length <= 1) return;
    setSets(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const sid = await ensureSession();

      const logs = sets
        .filter(s => s.weight !== '' && s.reps)
        .map((s, i) => ({
          session_id: sid,
          exercise_id: exercise.id,
          set_number: i + 1,
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          rpe: rpe,
        }));

      if (logs.length) {
        await supabase.from('exercise_logs').insert(logs);
      }

      // Atualizar feel da sessão (se informado)
      if (feel) {
        await supabase
          .from('workout_sessions')
          .update({ feel })
          .eq('id', sid);
      }

      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const totalVolume = sets.reduce((acc, s) => {
    return acc + ((parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0));
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 bg-stone-200 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="mb-5">
            <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-0.5">
              {exercise.category}
            </p>
            <h3 className="text-xl font-bold text-stone-800">{exercise.name}</h3>
            {lastLog && (
              <p className="text-xs text-stone-400 mt-1">
                Último treino: {lastLog.sets?.map(s => `${s.weight}kg×${s.reps}`).join(' · ')}
              </p>
            )}
          </div>

          {/* Séries */}
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-12 text-xs text-stone-400 font-medium mb-1 px-1">
              <span className="col-span-1">#</span>
              <span className="col-span-5">Peso (kg)</span>
              <span className="col-span-5">Reps</span>
              <span className="col-span-1" />
            </div>

            {sets.map((s, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-1 text-xs text-stone-400 font-medium">{i + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={s.weight}
                  onChange={e => updateSet(i, 'weight', e.target.value)}
                  placeholder="0"
                  className="col-span-5 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-center font-medium focus:outline-none focus:border-sage-400"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={s.reps}
                  onChange={e => updateSet(i, 'reps', e.target.value)}
                  className="col-span-5 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-center font-medium focus:outline-none focus:border-sage-400"
                />
                <button
                  onClick={() => removeSet(i)}
                  className="col-span-1 text-stone-300 hover:text-red-400 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addSet}
            className="w-full py-2.5 border border-dashed border-stone-200 rounded-xl text-sm text-stone-400 hover:text-stone-600 hover:border-stone-300 mb-5 transition-colors"
          >
            + Adicionar série
          </button>

          {/* Volume calculado */}
          {totalVolume > 0 && (
            <p className="text-xs text-center text-stone-400 mb-4">
              Volume total: <span className="font-semibold text-stone-600">{totalVolume} kg</span>
            </p>
          )}

          {/* RPE */}
          <div className="mb-4">
            <p className="text-xs text-stone-500 font-medium mb-2">RPE (esforço percebido)</p>
            <div className="flex gap-2">
              {[6,7,8,9,10].map(r => (
                <button
                  key={r}
                  onClick={() => setRpe(r === rpe ? null : r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    rpe === r
                      ? 'bg-sage-500 text-white border-sage-500'
                      : 'border-stone-200 text-stone-500 hover:border-sage-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Sensação */}
          <div className="mb-6">
            <p className="text-xs text-stone-500 font-medium mb-2">Como foi?</p>
            <div className="flex gap-2">
              {FEELS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFeel(f.key === feel ? null : f.key)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                    feel === f.key
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-sage-500 text-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-sage-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar exercício'}
          </button>
        </div>
      </div>
    </div>
  );
}
