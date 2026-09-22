import mongoose from 'mongoose';
import Task from '../models/Task.js';

export async function createTask(req, res) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'Provide a JSON object containing task fields.' });
  }

  if (typeof body.title !== 'string' || !body.title.trim()) {
    return res.status(400).json({ message: 'Title must be a non-empty string.' });
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return res.status(400).json({ message: 'Description must be a string.' });
  }
  if (body.status !== undefined && !['pending', 'completed'].includes(body.status)) {
    return res.status(400).json({ message: 'Status must be pending or completed.' });
  }

  const task = await Task.create({
    title: body.title,
    description: body.description,
    status: body.status,
  });

  res.status(201).json(task);
}

export async function getTasks(req, res) {
  const tasks = await Task.find().sort({ createdAt: -1, _id: -1 });
  res.status(200).json(tasks);
}

export async function getTask(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task ID.' });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  res.status(200).json(task);
}
