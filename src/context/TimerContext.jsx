import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getTimer, startTimer, stopTimer, updateTimer, cancelTimer } from '../api/timer';
import { elapsedSeconds } from '../utils/dates';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [session, setSession]       = useState(null);
  const [elapsed, setElapsed]       = useState(0);
  const [projectId, setProjectId]   = useState('');
  const [taskId, setTaskId]         = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading]       = useState(true);
  const debounceRef = useRef(null);

  // Load active session on mount
  useEffect(() => {
    getTimer()
      .then((active) => {
        if (active) {
          setSession(active);
          setProjectId(String(active.project_id));
          setTaskId(active.task_id || null);
          setDescription(active.description || '');
          setElapsed(elapsedSeconds(active.started_at));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Tick
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsed(elapsedSeconds(session.started_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  async function start(pid, tid) {
    const active = await startTimer(pid, tid);
    setSession(active);
    setProjectId(String(active.project_id));
    setTaskId(active.task_id || null);
    setDescription('');
    setElapsed(0);
  }

  async function stop(pid, desc) {
    await stopTimer(pid, desc);
    setSession(null);
    setElapsed(0);
    setDescription('');
    setTaskId(null);
  }

  async function cancel() {
    await cancelTimer();
    setSession(null);
    setElapsed(0);
    setDescription('');
    setTaskId(null);
  }

  function changeDescription(value) {
    setDescription(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateTimer(value), 800);
  }

  async function replaceTask(tid) {
    const updated = await updateTimer(description, tid);
    setSession(updated);
    setTaskId(updated.task_id || null);
  }

  return (
    <TimerContext.Provider value={{
      session, elapsed, projectId, taskId, description, loading,
      setProjectId, setTaskId, changeDescription, replaceTask,
      start, stop, cancel,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
