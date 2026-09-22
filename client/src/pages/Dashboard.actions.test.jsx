import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import Dashboard from './Dashboard.jsx';
import { completeTask, deleteTask, getTasks } from '../services/taskService.js';

vi.mock('../services/taskService.js', () => ({ getTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), completeTask: vi.fn(), deleteTask: vi.fn() }));
const pending = { _id: '1', title: 'Buy groceries', description: 'Get fruit and milk', status: 'pending' };
const completed = { _id: '2', title: 'Pay bill', description: 'Electricity account', status: 'completed' };
beforeEach(() => { vi.resetAllMocks(); getTasks.mockResolvedValue([pending, completed]); });

async function openDashboard() {
  render(<Dashboard />);
  await screen.findByRole('heading', { name: pending.title });
}

test('filters All, Pending, and Completed while preserving overall counts', async () => {
  await openDashboard();
  fireEvent.click(screen.getByRole('button', { name: 'Pending', exact: true }));
  expect(screen.queryByRole('heading', { name: completed.title })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: pending.title })).toBeInTheDocument();
  expect(screen.getByText('Total tasks').nextElementSibling).toHaveTextContent('2');
  fireEvent.click(screen.getByRole('button', { name: 'Completed', exact: true }));
  expect(screen.queryByRole('heading', { name: pending.title })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: completed.title })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'All', exact: true }));
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
});

test('searches task titles and descriptions without changing overall counts', async () => {
  await openDashboard();
  const search = screen.getByRole('searchbox', { name: 'Search tasks' });
  fireEvent.change(search, { target: { value: 'electricity' } });
  expect(screen.queryByRole('heading', { name: pending.title })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: completed.title })).toBeInTheDocument();
  expect(screen.getByText('Total tasks').nextElementSibling).toHaveTextContent('2');
  fireEvent.change(search, { target: { value: 'BUY' } });
  expect(screen.getByRole('heading', { name: pending.title })).toBeInTheDocument();
});

test('combines search with status filters and shows an empty result', async () => {
  await openDashboard();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search tasks' }), { target: { value: 'bill' } });
  fireEvent.click(screen.getByRole('button', { name: 'Pending', exact: true }));
  expect(screen.getByRole('heading', { name: 'No matching tasks' })).toBeInTheDocument();
  expect(screen.getByText('Try a different search term.')).toBeInTheDocument();
});

test('completion removes a task from Pending and updates totals', async () => {
  completeTask.mockResolvedValue({ ...pending, status: 'completed' });
  await openDashboard();
  fireEvent.click(screen.getByRole('button', { name: 'Pending', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: `Mark as completed: ${pending.title}` }));
  expect(await screen.findByRole('heading', { name: 'No pending tasks' })).toBeInTheDocument();
  expect(completeTask).toHaveBeenCalledWith('1');
  fireEvent.click(screen.getByRole('button', { name: 'Completed', exact: true }));
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
});

test('failed completion preserves the task and can be retried', async () => {
  completeTask.mockRejectedValueOnce(new Error('Completion failed')).mockResolvedValueOnce({ ...pending, status: 'completed' });
  await openDashboard();
  fireEvent.click(screen.getByRole('button', { name: `Mark as completed: ${pending.title}` }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Completion failed');
  expect(screen.getByRole('heading', { name: pending.title })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry', exact: true }));
  expect(await screen.findByText('Task marked as completed.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: `Mark as completed: ${pending.title}` })).not.toBeInTheDocument();
});

test('blocks duplicate completion and conflicting actions while pending', async () => {
  completeTask.mockReturnValue(new Promise(() => {}));
  await openDashboard();
  const button = screen.getByRole('button', { name: `Mark as completed: ${pending.title}` });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(button).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  expect(screen.getByRole('button', { name: `Edit task: ${pending.title}` })).toBeDisabled();
  expect(completeTask).toHaveBeenCalledTimes(1);
});

test('canceling deletion does not call the API', async () => {
  await openDashboard();
  fireEvent.click(screen.getByRole('button', { name: `Delete task: ${pending.title}` }));
  const dialog = screen.getByRole('dialog', { name: 'Delete task?' });
  expect(dialog).toHaveTextContent(pending.title);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(deleteTask).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: pending.title })).toBeInTheDocument();
});

test('confirmed deletion removes only the selected task', async () => {
  deleteTask.mockResolvedValue({ message: 'Deleted' });
  await openDashboard();
  fireEvent.click(screen.getByRole('button', { name: `Delete task: ${pending.title}` }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete task', exact: true }));
  expect(await screen.findByText('Task deleted successfully.')).toBeInTheDocument();
  expect(deleteTask).toHaveBeenCalledWith('1');
  expect(screen.queryByRole('heading', { name: pending.title })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: completed.title })).toBeInTheDocument();
  expect(screen.getByText('Total tasks').nextElementSibling).toHaveTextContent('1');
});

test('failed deletion keeps the confirmation open for retry', async () => {
  deleteTask.mockRejectedValueOnce(new Error('Deletion failed')).mockResolvedValueOnce({});
  await openDashboard();
  fireEvent.click(screen.getByRole('button', { name: `Delete task: ${pending.title}` }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete task', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Deletion failed');
  expect(screen.getByRole('dialog')).toHaveTextContent(pending.title);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Delete task', exact: true })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Delete task', exact: true }));
  expect(await screen.findByText('Task deleted successfully.')).toBeInTheDocument();
});

test('prevents duplicate deletion submissions', async () => {
  deleteTask.mockReturnValue(new Promise(() => {}));
  await openDashboard();
  fireEvent.click(screen.getByRole('button', { name: `Delete task: ${pending.title}` }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete task', exact: true }));
  const button = screen.getByRole('button', { name: 'Deleting...' });
  expect(button).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.submit(button.closest('form'));
  expect(deleteTask).toHaveBeenCalledTimes(1);
});

test('refresh keeps the selected status filter', async () => {
  await openDashboard();
  fireEvent.click(screen.getByRole('button', { name: 'Pending', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await screen.findByRole('heading', { name: pending.title });
  expect(screen.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('heading', { name: completed.title })).not.toBeInTheDocument();
});
