import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import Task from '../models/Task.js';

test('task API', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/tasks`;
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));

  const post = (body) => fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await t.test('creates a task with defaults and ignores client timestamps', async (t) => {
    t.mock.method(Task, 'create', async (fields) => {
      assert.equal(fields.createdAt, undefined);
      const task = new Task(fields);
      await task.validate();
      return task;
    });
    const response = await post({ title: '  Revise MERN  ', createdAt: '2000-01-01' });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.title, 'Revise MERN');
    assert.equal(body.status, 'pending');
    assert.equal(body.description, '');
    assert.ok(body._id);
  });

  await t.test('rejects invalid input before accessing MongoDB', async (t) => {
    const create = t.mock.method(Task, 'create', () => { throw new Error('Must not be called'); });
    for (const input of [{}, [], { title: ' ' }, { title: 42 },
      { title: 'Task', description: null }, { title: 'Task', status: 'unknown' },
      { title: 'Task', status: null }]) {
      const response = await post(input);
      assert.equal(response.status, 400);
      assert.equal(typeof (await response.json()).message, 'string');
    }
    assert.equal(create.mock.callCount(), 0);
  });

  await t.test('returns an empty list', async (t) => {
    t.mock.method(Task, 'find', () => ({ sort: async (order) => {
      assert.deepEqual(order, { createdAt: -1, _id: -1 });
      return [];
    } }));
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);
  });

  await t.test('returns task lists and individual tasks', async (t) => {
    const task = { _id: '507f1f77bcf86cd799439011', title: 'Example', status: 'pending' };
    t.mock.method(Task, 'find', () => ({ sort: async () => [task] }));
    t.mock.method(Task, 'findById', async (id) => {
      assert.equal(id, task._id);
      return task;
    });
    assert.deepEqual(await (await fetch(base)).json(), [task]);
    const response = await fetch(`${base}/${task._id}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), task);
  });

  await t.test('distinguishes invalid IDs from missing tasks', async (t) => {
    const find = t.mock.method(Task, 'findById', async () => null);
    const invalid = await fetch(`${base}/bad-id`);
    assert.equal(invalid.status, 400);
    assert.equal(find.mock.callCount(), 0);
    const missing = await fetch(`${base}/507f1f77bcf86cd799439011`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { message: 'Task not found.' });
  });

  await t.test('returns JSON errors for malformed JSON and unknown routes', async () => {
    const malformed = await fetch(base, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { message: 'Request body must contain valid JSON.' });
    const missing = await fetch(base.replace('/api/tasks', '/unknown'));
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { message: 'Route not found.' });
  });

  await t.test('handles database failures without exposing internal details', async (t) => {
    t.mock.method(Task, 'findById', async () => { throw new Error('private database details'); });
    t.mock.method(console, 'error', () => {});
    const response = await fetch(`${base}/507f1f77bcf86cd799439011`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { message: 'An unexpected server error occurred.' });
  });

  const id = '507f1f77bcf86cd799439011';
  const put = (body, taskId = id) => fetch(`${base}/${taskId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await t.test('filters tasks by either valid status and supports no filter', async (t) => {
    let expected = {};
    t.mock.method(Task, 'find', (filter) => {
      assert.deepEqual(filter, expected);
      return { sort: async () => [] };
    });
    assert.equal((await fetch(base)).status, 200);
    for (const status of ['pending', 'completed']) {
      expected = { status };
      assert.equal((await fetch(`${base}?status=${status}`)).status, 200);
    }
  });

  await t.test('rejects unsupported and repeated status filters', async (t) => {
    const find = t.mock.method(Task, 'find', () => { throw new Error('Must not query'); });
    for (const query of ['status=unknown', 'status=', 'status=pending&status=completed']) {
      assert.equal((await fetch(`${base}?${query}`)).status, 400);
    }
    assert.equal(find.mock.callCount(), 0);
  });

  await t.test('edits allowed fields without accepting IDs, timestamps, or update operators', async (t) => {
    t.mock.method(Task, 'findByIdAndUpdate', async (taskId, update, options) => {
      assert.equal(taskId, id);
      assert.deepEqual(update, { $set: { title: 'Edited', description: '', status: 'pending' } });
      assert.deepEqual(options, { returnDocument: 'after', runValidators: true });
      return { _id: id, ...update.$set };
    });
    const response = await put({ title: 'Edited', description: '', status: 'pending',
      _id: 'untrusted', createdAt: '2000-01-01', $unset: { title: 1 } });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).title, 'Edited');
  });

  await t.test('leaves omitted optional fields unchanged on edit', async (t) => {
    t.mock.method(Task, 'findByIdAndUpdate', async (taskId, update) => {
      assert.deepEqual(update, { $set: { title: 'Edited' } });
      return { _id: id, title: 'Edited', description: 'Keep me', status: 'completed' };
    });
    const response = await put({ title: 'Edited' });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).description, 'Keep me');
  });

  await t.test('rejects invalid edits without writing', async (t) => {
    const update = t.mock.method(Task, 'findByIdAndUpdate', () => { throw new Error('Must not write'); });
    for (const body of [{}, [], { title: ' ' }, { title: 3 },
      { title: 'Task', description: false }, { title: 'Task', status: null }]) {
      assert.equal((await put(body)).status, 400);
    }
    assert.equal(update.mock.callCount(), 0);
  });

  await t.test('completes tasks repeatedly without changing other fields', async (t) => {
    t.mock.method(Task, 'findByIdAndUpdate', async (taskId, update, options) => {
      assert.equal(taskId, id);
      assert.deepEqual(update, { $set: { status: 'completed' } });
      assert.deepEqual(options, { returnDocument: 'after', runValidators: true });
      return { _id: id, title: 'Keep me', status: 'completed' };
    });
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}/${id}/complete`, { method: 'PATCH' });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).status, 'completed');
    }
  });

  await t.test('deletes the requested task', async (t) => {
    t.mock.method(Task, 'findByIdAndDelete', async (taskId) => {
      assert.equal(taskId, id);
      return { _id: id };
    });
    const response = await fetch(`${base}/${id}`, { method: 'DELETE' });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: 'Task deleted successfully.' });
  });

  await t.test('returns 400 for invalid IDs on every mutation route', async (t) => {
    const update = t.mock.method(Task, 'findByIdAndUpdate', () => { throw new Error('Must not write'); });
    const remove = t.mock.method(Task, 'findByIdAndDelete', () => { throw new Error('Must not write'); });
    assert.equal((await put({ title: 'Task' }, 'bad-id')).status, 400);
    assert.equal((await fetch(`${base}/bad-id/complete`, { method: 'PATCH' })).status, 400);
    assert.equal((await fetch(`${base}/bad-id`, { method: 'DELETE' })).status, 400);
    assert.equal(update.mock.callCount(), 0);
    assert.equal(remove.mock.callCount(), 0);
  });

  await t.test('returns 404 for missing tasks on every mutation route', async (t) => {
    t.mock.method(Task, 'findByIdAndUpdate', async () => null);
    t.mock.method(Task, 'findByIdAndDelete', async () => null);
    assert.equal((await put({ title: 'Task' })).status, 404);
    assert.equal((await fetch(`${base}/${id}/complete`, { method: 'PATCH' })).status, 404);
    assert.equal((await fetch(`${base}/${id}`, { method: 'DELETE' })).status, 404);
  });

  await t.test('returns sanitized errors when writes fail', async (t) => {
    t.mock.method(Task, 'findByIdAndUpdate', async () => { throw new Error('private'); });
    t.mock.method(Task, 'findByIdAndDelete', async () => { throw new Error('private'); });
    t.mock.method(console, 'error', () => {});
    const responses = [await put({ title: 'Task' }),
      await fetch(`${base}/${id}/complete`, { method: 'PATCH' }),
      await fetch(`${base}/${id}`, { method: 'DELETE' })];
    for (const response of responses) {
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { message: 'An unexpected server error occurred.' });
    }
  });
});
