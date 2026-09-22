import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCheck, ClipboardList, LoaderCircle, Plus, RefreshCw, Search, X } from 'lucide-react';
import { completeTask, createTask, deleteTask, getTasks, updateTask } from '../services/taskService.js';
import TaskList from '../components/TaskList.jsx';
import TaskForm from '../components/TaskForm.jsx';
import DeleteTaskDialog from '../components/DeleteTaskDialog.jsx';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [completionError, setCompletionError] = useState(null);
  const actionInFlight = useRef(false);
  const newTaskRef = useRef(null);
  const filterGroupRef = useRef(null);

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

  async function saveTask(fields) {
    const saved = form.task ? await updateTask(form.task._id, fields) : await createTask(fields);
    setTasks((current) => form.task
      ? current.map((task) => task._id === saved._id ? saved : task)
      : [saved, ...current]);
    setNotice(form.task ? 'Task updated successfully.' : 'Task created successfully.');
    setCompletionError(null);
    setForm(null);
  }

  async function markCompleted(task) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setBusyTaskId(task._id);
    setNotice('');
    setCompletionError(null);
    try {
      const saved = await completeTask(task._id);
      setTasks((current) => current.map((item) => item._id === saved._id ? saved : item));
      setNotice('Task marked as completed.');
      requestAnimationFrame(() => {
        if (document.activeElement === document.body) {
          filterGroupRef.current?.querySelector('[aria-pressed="true"]')?.focus();
        }
      });
    } catch (failure) {
      setCompletionError({ task, message: failure.message || 'Unable to complete this task.' });
    } finally {
      actionInFlight.current = false;
      setBusyTaskId(null);
    }
  }

  async function confirmDelete(task) {
    await deleteTask(task._id);
    setTasks((current) => current.filter((item) => item._id !== task._id));
    setNotice('Task deleted successfully.');
    setCompletionError(null);
    setDeleteTarget(null);
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const statusFilteredTasks = filter === 'all' ? tasks : tasks.filter((task) => task.status === filter);
  const visibleTasks = normalizedSearch
    ? statusFilteredTasks.filter((task) =>
      task.title.toLowerCase().includes(normalizedSearch)
      || (task.description || '').toLowerCase().includes(normalizedSearch))
    : statusFilteredTasks;
  const listTitle = filter === 'all' ? 'All tasks' : filter === 'pending' ? 'Pending tasks' : 'Completed tasks';

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
          <div className="heading-actions">
          <button className="button refresh-button" type="button" disabled={loading || Boolean(busyTaskId)} aria-label="Refresh"
            onClick={() => { setCompletionError(null); setRefreshKey((key) => key + 1); }} title="Refresh tasks">
            <RefreshCw size={16} className={loading ? 'spin' : ''} aria-hidden="true" />
            <span className="button-label">Refresh</span>
          </button>
          <button ref={newTaskRef} className="button primary-button" disabled={loading || Boolean(error) || Boolean(busyTaskId)} onClick={() => { setNotice(''); setCompletionError(null); setForm({ task: null }); }}>
            <Plus size={17} aria-hidden="true" />New task
          </button>
          </div>
        </div>
        {notice && <div className="success-notice" role="status"><CheckCheck size={18} aria-hidden="true" /><span>{notice}</span><button className="icon-button" aria-label="Dismiss notification" title="Dismiss notification" onClick={() => setNotice('')}><X size={16} aria-hidden="true" /></button></div>}
        {completionError && <div className="action-error" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>{completionError.message}</span><button className="button" disabled={Boolean(busyTaskId)} onClick={() => markCompleted(completionError.task)}><RefreshCw size={15} aria-hidden="true" />Retry</button><button className="icon-button" aria-label="Dismiss error" title="Dismiss error" onClick={() => setCompletionError(null)}><X size={16} aria-hidden="true" /></button></div>}
        <dl className="stats" aria-label="Task counts">
          {counts.map(({ label, value, style }) => (
            <div className={`stat ${style}`} key={label}>
              <dt><span className="stat-dot" />{label}</dt>
              <dd>{loading || error ? '-' : value}</dd>
            </div>
          ))}
        </dl>
        <section className="tasks-section" aria-labelledby="task-list-title" aria-busy={loading}>
          <div className="section-heading"><h2 id="task-list-title">{listTitle}</h2><span>Newest first</span></div>
          <div className="task-controls">
            <div ref={filterGroupRef} className="status-filters" role="group" aria-label="Filter tasks by status">
              {['all', 'pending', 'completed'].map((value) => <button key={value} type="button" className="filter-button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All' : value === 'pending' ? 'Pending' : 'Completed'}</button>)}
            </div>
            <label className="task-search">
              <Search size={17} aria-hidden="true" />
              <span className="visually-hidden">Search tasks</span>
              <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search tasks" />
            </label>
          </div>
          {loading ? (
            <div className="state" role="status"><LoaderCircle className="spin" size={26} aria-hidden="true" /><p>Loading tasks...</p></div>
          ) : error ? (
            <div className="state error-state" role="alert">
              <AlertCircle size={28} aria-hidden="true" /><h3>Couldn't load tasks</h3><p>{error}</p>
              <button className="button" onClick={() => setRefreshKey((key) => key + 1)}><RefreshCw size={16} aria-hidden="true" />Try again</button>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="state" role="status"><ClipboardList size={32} aria-hidden="true" /><h3>{normalizedSearch ? 'No matching tasks' : filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}</h3><p>{normalizedSearch ? 'Try a different search term.' : filter === 'all' ? 'Your task list is empty.' : 'No tasks match this status.'}</p></div>
          ) : <TaskList tasks={visibleTasks} busyTaskId={busyTaskId} onComplete={markCompleted}
            onEdit={(task) => { setNotice(''); setCompletionError(null); setForm({ task }); }}
            onDelete={(task) => { setNotice(''); setCompletionError(null); setDeleteTarget(task); }} />}
        </section>
      </main>
      {form && <TaskForm task={form.task} onSave={saveTask} onClose={() => setForm(null)} fallbackFocusRef={newTaskRef} />}
      {deleteTarget && <DeleteTaskDialog task={deleteTarget} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} fallbackFocusRef={newTaskRef} />}
    </>
  );
}
