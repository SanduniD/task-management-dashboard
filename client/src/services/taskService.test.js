import { afterEach, expect, test, vi } from 'vitest';
import { createTask, updateTask } from './taskService.js';

afterEach(() => vi.unstubAllGlobals());

test('sends task creation as JSON', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ _id: '1' }) });
  vi.stubGlobal('fetch', fetch);
  await createTask({ title: 'New' });
  expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/tasks$/), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"title":"New"}',
  });
});

test('uses PUT for edits and surfaces server validation errors', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: 'Invalid title' }) });
  vi.stubGlobal('fetch', fetch);
  await expect(updateTask('task-id', { title: '' })).rejects.toThrow('Invalid title');
  expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/tasks\/task-id$/), expect.objectContaining({ method: 'PUT' }));
});

test('reports network failures without discarding the request context', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
  await expect(createTask({ title: 'New' })).rejects.toThrow('Cannot reach the server');
});
