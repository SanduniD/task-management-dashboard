import { CheckCircle2, Circle } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', year: 'numeric',
});

function TaskItem({ task }) {
  const date = new Date(task.createdAt);
  const validDate = !Number.isNaN(date.getTime());
  const Icon = task.status === 'completed' ? CheckCircle2 : Circle;
  return (
    <li className="task-row">
      <Icon className={`task-icon ${task.status}`} size={20} aria-hidden="true" />
      <div className="task-copy">
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
      </div>
      <div className="task-status"><StatusBadge status={task.status} /></div>
      <div className="task-date">
        {validDate ? <time dateTime={task.createdAt}>{dateFormat.format(date)}</time> : '-'}
      </div>
    </li>
  );
}

export default function TaskList({ tasks }) {
  return (
    <div className="task-list">
      <div className="list-heading" aria-hidden="true">
        <span>Task</span><span>Status</span><span>Created</span>
      </div>
      <ul aria-label="Tasks">
        {tasks.map((task) => <TaskItem key={task._id} task={task} />)}
      </ul>
    </div>
  );
}
