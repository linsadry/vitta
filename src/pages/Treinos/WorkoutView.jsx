import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ExerciseCard from './ExerciseCard';
import LogExerciseModal from './LogExerciseModal';

export default function WorkoutView({ workout, userId, program, onBack }) {
  const [exercises, setExercises] = useState([]);
  const [lastLogs, setLastLogs] = useState({}); // exerciseId → { weight, reps, sets[] }
  const [activeExercise, setActiveExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    loadExercises();
  }, [workout.id]);

  async function loadExercises() {
    setLoading(true);

    // Exercícios do treino
    const { data: wxs } = await supabase
      .from('workout_exercises')
      .select(`*, exercises_library(id, name, category)`)
      .eq('workout_id', workout.id)
      .order('order_index');

    setExercises(wxs || []);

    // Última sessão deste treino para pré-preencher cargas
    if (wxs?.length) {
      const { data: lastSession } = await supabase
        .from('workout_sessions')
        .select('id, session_date')
        .eq('user_id', userId)
        .eq('workout_id', workout.id)
        .order('session_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSession) {
        const exIds = wxs.map(x => x.exercises_library?.id).filter(Boolean);
        const { data: logs } = await supabase
          .from('exercise_logs')
          .select('*')
          .eq('session_id', lastSession.id)
          .in('exercise_id', exIds);

        if (logs) {
          const map = {};
          logs.forEach(log => {
            if (!map[log.exercise_id]) {
              map[log.exercise_id] = {
                date: lastSession.session_date,
                sets: []
              };
            }
            map[log.exercise_id].sets.push({ weight: log.weight, reps: log.reps });
          });
          setLastLogs(map);
        }
      }
    }
    setLoading(false);
  }

  // Cria sessão ao registrar o primeiro exercício
  async function ensureSession() {
    if (sessionId) return sessionId;
    const { data } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        program_id: program?.id,
        workout_id: workout.id,
        session_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();
    setSessionId(data.id);
    return data.id;
  }

  async function handleLogSaved() {
    setActiveExercise(null);
    await loadExercises();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-stone-100">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <p className="text-xs text-stone-400 font-medium">
            {program?.name?.toUpperCase()}
          </p>
          <h2 className="text-lg font-bold text-stone-800">
            Treino {workout.name}
            {workout.group_name && (
              <span className="text-sm font-normal text-stone-500 ml-2">
                · {workout.group_name}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Exercícios */}
      <div className="px-4 pt-4 space-y-3">
        {exercises.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            Nenhum exercício neste treino ainda.
          </div>
        ) : (
          exercises.map(wx => (
            <ExerciseCard
              key={wx.id}
              exercise={wx.exercises_library}
              config={wx}
              lastLog={lastLogs[wx.exercises_library?.id]}
              onRegister={() => setActiveExercise(wx)}
            />
          ))
        )}
      </div>

      {/* Modal de registro */}
      {activeExercise && (
        <LogExerciseModal
          exercise={activeExercise.exercises_library}
          config={activeExercise}
          lastLog={lastLogs[activeExercise.exercises_library?.id]}
          userId={userId}
          ensureSession={ensureSession}
          onSaved={handleLogSaved}
          onClose={() => setActiveExercise(null)}
        />
      )}
    </div>
  );
}
