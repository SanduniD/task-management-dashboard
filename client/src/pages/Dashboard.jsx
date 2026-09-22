import { useEffect, useState } from 'react';
import { AlertCircle, CheckCheck, ClipboardList, LoaderCircle, RefreshCw } from 'lucide-react';
import { getTasks } from '../services/taskService.js';
import TaskList from '../components/TaskList.jsx';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getTasks({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setTasks(data); })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refreshKey]);

  const completed = tasks.filter((task) => task.status === 'completed').length;
  const counts = [
    { label: 'Total tasks', value: tasks.length, style: 'total' },
    { label: 'Pending', value: tasks.length - completed, style: 'pending' },
    { label: 'Completed', value: completed, style: 'completed' },
  ];

  return (
    <>
      <a className="skip-link" href="#main">Skip to tasks</a>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand"><span className="brand-icon"><CheckCheck size={22} aria-hidden="true" /></span>Task Dashboard</div>
          <span className="workspace-label">My workspace</span>
        </div>
      </header>
      <main id="main" className="workspace">
        <div className="page-heading">
          <div><p className="eyebrow">WORKSPACE</p><h1>Tasks</h1></div>
          <button className="button refresh-button" type="button" disabled={loading}
            onClick={() => setRefreshKey((key) => key + 1)} title="Refresh tasks">
            <RefreshCw size={16} className={loading ? 'spin' : ''} aria-hidden="true" />
            Refresh
          </button>
        </div>
        <dl className="stats" aria-label="Task counts">
          {counts.map(({ label, value, style }) => (
            <div className={`stat ${style}`} key={label}>
              <dt><span className="stat-dot" />{label}</dt>
              <dd>{loading || error ? '-' : value}</dd>
            </div>
          ))}
        </dl>
        <section className="tasks-section" aria-labelledby="task-list-title" aria-busy={loading}>
          <div className="section-heading"><h2 id="task-list-title">All tasks</h2><span>Newest first</span></div>
          {loading ? (
            <div className="state" role="status"><LoaderCircle className="spin" size={26} aria-hidden="true" /><p>Loading tasks...</p></div>
          ) : error ? (
            <div className="state error-state" role="alert">
              <AlertCircle size={28} aria-hidden="true" /><h3>Couldn't load tasks</h3><p>{error}</p>
              <button className="button" onClick={() => setRefreshKey((key) => key + 1)}><RefreshCw size={16} aria-hidden="true" />Try again</button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="state" role="status"><ClipboardList size={32} aria-hidden="true" /><h3>No tasks yet</h3><p>Your task list is empty.</p></div>
          ) : <TaskList tasks={tasks} />}
        </section>
      </main>
    </>
  );
}
