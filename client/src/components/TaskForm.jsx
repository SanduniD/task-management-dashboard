import { useEffect, useId, useRef, useState } from 'react';
import { LoaderCircle, Plus, Save, X } from 'lucide-react';

export default function TaskForm({ task, onSave, onClose }) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(document.activeElement);
  const titleRef = useRef(null);
  const submitting = useRef(false);
  const id = useId();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'pending');
  const [titleError, setTitleError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    titleRef.current.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      queueMicrotask(() => {
        if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
      });
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;
    if (!title.trim()) {
      setTitleError('Enter a task title.');
      titleRef.current.focus();
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      await onSave({ title: title.trim(), description: description.trim(), status });
    } catch (failure) {
      setError(failure.message || 'Unable to save this task. Please try again.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="task-dialog" aria-labelledby={`${id}-heading`}
      onCancel={(event) => { event.preventDefault(); if (!submitting.current) onClose(); }}>
      <form onSubmit={handleSubmit} noValidate aria-busy={saving}>
        <div className="dialog-heading">
          <h2 id={`${id}-heading`}>{task ? 'Edit task' : 'New task'}</h2>
          <button type="button" className="icon-button" title="Close form" aria-label="Close form" disabled={saving} onClick={onClose}><X size={19} aria-hidden="true" /></button>
        </div>
        <fieldset disabled={saving} className="form-fields">
          <div className="form-field">
            <label htmlFor={`${id}-title`}>Title <span className="required-mark" aria-hidden="true">*</span></label>
            <input id={`${id}-title`} ref={titleRef} value={title} required
              aria-invalid={Boolean(titleError)} aria-describedby={titleError ? `${id}-title-error` : undefined}
              onChange={(event) => { setTitle(event.target.value); setTitleError(''); }} />
            {titleError && <p className="field-error" id={`${id}-title-error`} role="alert">{titleError}</p>}
          </div>
          <div className="form-field">
            <label htmlFor={`${id}-description`}>Description <span className="optional-label">(optional)</span></label>
            <textarea id={`${id}-description`} value={description} rows={4} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor={`${id}-status`}>Status</label>
            <select id={`${id}-status`} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="pending">Pending</option><option value="completed">Completed</option>
            </select>
          </div>
        </fieldset>
        {error && <p className="save-error" role="alert">{error}</p>}
        <div className="dialog-footer">
          <button type="button" className="button" disabled={saving} onClick={onClose}>Cancel</button>
          <button type="submit" className="button primary-button" disabled={saving}>
            {saving ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : task ? <Save size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {saving ? 'Saving...' : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
