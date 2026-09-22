import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import Dashboard from './Dashboard.jsx';
import { createTask, getTasks, updateTask } from '../services/taskService.js';

vi.mock('../services/taskService.js', () => ({ getTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), completeTask: vi.fn(), deleteTask: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

test('shows loading feedback and disables refresh', () => {
  getTasks.mockReturnValue(new Promise(() => {}));
  render(<Dashboard />);
  expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
});

test('shows an empty state', async () => {
  getTasks.mockResolvedValue([]);
  render(<Dashboard />);
  expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
});

test('renders tasks returned by the API', async () => {
  getTasks.mockResolvedValue([{ _id: '1', title: 'Revise MERN', description: 'Practice routes', status: 'pending', createdAt: '2026-09-22T00:00:00Z' }]);
  render(<Dashboard />);
  expect(await screen.findByRole('heading', { name: 'Revise MERN' })).toBeInTheDocument();
  expect(screen.getByText('Practice routes')).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Tasks' })).toBeInTheDocument();
});

test('retries a failed request successfully', async () => {
  getTasks.mockRejectedValueOnce(new Error('Connection failed')).mockResolvedValueOnce([]);
  render(<Dashboard />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection failed');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
  expect(getTasks).toHaveBeenCalledTimes(2);
});

test('aborts its pending request on unmount', () => {
  getTasks.mockReturnValue(new Promise(() => {}));
  const { unmount } = render(<Dashboard />);
  const signal = getTasks.mock.calls[0][0].signal;
  unmount();
  expect(signal.aborted).toBe(true);
});

async function openNewForm() {
  getTasks.mockResolvedValue([]);
  render(<Dashboard />);
  await screen.findByText('No tasks yet');
  fireEvent.click(screen.getByRole('button', { name: 'New task' }));
}

test('validates a blank title before submitting', async () => {
  await openNewForm();
  fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create task' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a task title.');
  expect(createTask).not.toHaveBeenCalled();
});

test('creates a task and updates the list', async () => {
  createTask.mockResolvedValue({ _id: '2', title: 'New item', description: '', status: 'pending' });
  await openNewForm();
  fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: '  New item  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create task' }));
  expect(await screen.findByRole('heading', { name: 'New item' })).toBeInTheDocument();
  expect(createTask).toHaveBeenCalledWith({ title: 'New item', description: '', status: 'pending' });
  expect(screen.getByRole('status')).toHaveTextContent('Task created successfully.');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('prefills an edit and saves changed fields', async () => {
  getTasks.mockResolvedValue([{ _id: '1', title: 'Old title', description: 'Old description', status: 'completed' }]);
  updateTask.mockResolvedValue({ _id: '1', title: 'Edited title', description: 'Old description', status: 'completed' });
  render(<Dashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit task: Old title' }));
  expect(screen.getByLabelText(/^Title/)).toHaveValue('Old title');
  expect(screen.getByLabelText(/^Description/)).toHaveValue('Old description');
  expect(screen.getByLabelText('Status')).toHaveValue('completed');
  fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Edited title' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('heading', { name: 'Edited title' })).toBeInTheDocument();
  expect(updateTask).toHaveBeenCalledWith('1', { title: 'Edited title', description: 'Old description', status: 'completed' });
});

test('retains the draft after failure and allows retry', async () => {
  createTask.mockRejectedValueOnce(new Error('Server unavailable')).mockResolvedValueOnce({ _id: '2', title: 'Keep draft', description: '', status: 'pending' });
  await openNewForm();
  fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Keep draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create task' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
  expect(screen.getByLabelText(/^Title/)).toHaveValue('Keep draft');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create task' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Create task' }));
  expect(await screen.findByRole('heading', { name: 'Keep draft' })).toBeInTheDocument();
});

test('disables form actions during a pending save', async () => {
  createTask.mockReturnValue(new Promise(() => {}));
  await openNewForm();
  fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Saving item' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create task' }));
  expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByLabelText(/^Title/)).toBeDisabled();
  fireEvent.submit(screen.getByRole('button', { name: 'Saving...' }).closest('form'));
  expect(createTask).toHaveBeenCalledTimes(1);
});

test('cancelling does not submit the draft', async () => {
  await openNewForm();
  fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Discard draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(createTask).not.toHaveBeenCalled();
});
