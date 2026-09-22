import { Check, Clock3 } from 'lucide-react';

export default function StatusBadge({ status }) {
  const completed = status === 'completed';
  const Icon = completed ? Check : Clock3;
  return (
    <span className={`status-badge ${completed ? 'completed' : 'pending'}`}>
      <Icon size={13} aria-hidden="true" />
      {completed ? 'Completed' : 'Pending'}
    </span>
  );
}
