import { useId, useRef, useState } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import useDialog from '../hooks/useDialog.js';

export default function DeleteTaskDialog({ task, onConfirm, onClose, fallbackFocusRef }) {
  const cancelRef = useRef(null);
  const dialogRef = useDialog(cancelRef, fallbackFocusRef);
  const submitting = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const id = useId();

  async function handleDelete(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setDeleting(true);
    setError('');
    try {
      await onConfirm(task);
    } catch (failure) {
      setError(failure.message || 'Unable to delete this task. Please try again.');
    } finally {
      submitting.current = false;
      setDeleting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="task-dialog delete-dialog" aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); if (!submitting.current) onClose(); }}>
      <form onSubmit={handleDelete} aria-busy={deleting}>
        <div className="dialog-heading"><h2 id={`${id}-heading`}>Delete task?</h2></div>
        <div className="delete-description" id={`${id}-description`}>
          <p><strong>{task.title}</strong> will be permanently deleted.</p>
          <p>This cannot be undone.</p>
        </div>
        {error && <p className="save-error" role="alert">{error}</p>}
        <div className="dialog-footer">
          <button ref={cancelRef} type="button" className="button" disabled={deleting} onClick={onClose}>Cancel</button>
          <button type="submit" className="button danger-button" disabled={deleting}>
            {deleting ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
            {deleting ? 'Deleting...' : 'Delete task'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
