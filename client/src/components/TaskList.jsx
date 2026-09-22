import { CheckCircle2, Circle, LoaderCircle, Pencil, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', year: 'numeric',
});

function TaskItem({ task, onEdit, onComplete, onDelete, busyTaskId }) {
  const date = new Date(task.createdAt);
  const validDate = !Number.isNaN(date.getTime());
  return (
    <li className="task-row">
      {task.status === 'completed'
        ? <span className="completion-indicator" title="Completed"><CheckCircle2 className="task-icon completed" size={20} aria-hidden="true" /></span>
        : <button className="icon-button complete-button" disabled={Boolean(busyTaskId)}
          aria-label={`Mark as completed: ${task.title}`} title="Mark as completed" onClick={() => onComplete(task)}>
          {busyTaskId === task._id ? <LoaderCircle size={20} className="spin" aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
        </button>}
      <div className="task-copy">
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
      </div>
      <div className="task-status"><StatusBadge status={task.status} /></div>
      <div className="task-date">
        {validDate ? <time dateTime={task.createdAt}>{dateFormat.format(date)}</time> : '-'}
      </div>
      <div className="task-actions">
        <button className="icon-button" disabled={Boolean(busyTaskId)} type="button" title="Edit task" aria-label={`Edit task: ${task.title}`} onClick={() => onEdit(task)}><Pencil size={16} aria-hidden="true" /></button>
        <button className="icon-button delete-button" disabled={Boolean(busyTaskId)} type="button" title="Delete task" aria-label={`Delete task: ${task.title}`} onClick={() => onDelete(task)}><Trash2 size={16} aria-hidden="true" /></button>
      </div>
    </li>
  );
}

export default function TaskList({ tasks, onEdit, onComplete, onDelete, busyTaskId }) {
  return (
    <div className="task-list">
      <div className="list-heading" aria-hidden="true">
        <span /><span>Task</span><span>Status</span><span>Created</span><span />
      </div>
      <ul aria-label="Tasks">
        {tasks.map((task) => <TaskItem key={task._id} task={task} onEdit={onEdit} onComplete={onComplete} onDelete={onDelete} busyTaskId={busyTaskId} />)}
      </ul>
    </div>
  );
}
