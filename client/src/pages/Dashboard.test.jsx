import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import Dashboard from './Dashboard.jsx';
import { getTasks } from '../services/taskService.js';

vi.mock('../services/taskService.js', () => ({ getTasks: vi.fn() }));
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
