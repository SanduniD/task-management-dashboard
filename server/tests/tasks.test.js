import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import Task from '../models/Task.js';

test('task create/read API', async (t) => {
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
});
