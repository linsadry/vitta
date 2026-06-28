import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ProgramCard from './ProgramCard';
import WeekSummary from './WeekSummary';
import EvolutionCard from './EvolutionCard';
import WorkoutView from './WorkoutView';
import CreateProgramModal from './CreateProgramModal';
import QuickSessionFAB from './QuickSessionFAB';

export default function TreinosPage({ userId }) {
  const [activeProgram, setActiveProgram] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [view, setView] = useState('home'); // 'home' | 'workout'
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);
    // Carrega programa ativo
    const { data: programs } = await supabase
      .from('programs')
      .select(`*, workouts(*)`)
      .eq('user_id', userId)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
      .limit(1);

    if (programs?.length) setActiveProgram(programs[0]);

    // Carrega sessões dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: sess } = await supabase
      .from('workout_sessions')
      .select(`*, workouts(name)`)
      .eq('user_id', userId)
      .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('session_date', { ascending: false });

    setSessions(sess || []);
    setLoading(false);
  }

  function handleOpenWorkout(workout) {
    setSelectedWorkout(workout);
    setView('workout');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'workout' && selectedWorkout) {
    return (
      <WorkoutView
        workout={selectedWorkout}
        userId={userId}
        program={activeProgram}
        onBack={() => { setView('home'); loadData(); }}
      />
    );
  }

  return (
    <div className="pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-xl font-semibold text-stone-800">Treinos</h1>
        <button
          onClick={() => setShowCreateProgram(true)}
          className="text-sm text-sage-600 font-medium"
        >
          + Programa
        </button>
      </div>

      {/* Sem programa ativo */}
      {!activeProgram ? (
        <div className="mx-4 p-8 bg-stone-50 border border-stone-200 rounded-2xl text-center">
          <p className="text-stone-500 text-sm mb-4">Nenhum programa ativo</p>
          <button
            onClick={() => setShowCreateProgram(true)}
            className="bg-sage-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            Criar primeiro programa
          </button>
        </div>
      ) : (
        <>
          <ProgramCard
            program={activeProgram}
            sessions={sessions}
            onOpenWorkout={handleOpenWorkout}
            onSwitch={() => setShowCreateProgram(true)}
          />
          <WeekSummary sessions={sessions} />
          <EvolutionCard program={activeProgram} userId={userId} />
        </>
      )}

      {showCreateProgram && (
        <CreateProgramModal
          userId={userId}
          onClose={() => setShowCreateProgram(false)}
          onCreated={() => { setShowCreateProgram(false); loadData(); }}
        />
      )}

      <QuickSessionFAB
        userId={userId}
        activeProgram={activeProgram}
        onOpenWorkout={handleOpenWorkout}
        onSaved={loadData}
      />
    </div>
  );
}
