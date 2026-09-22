import Task from '../models/Task.js';

function validateTask(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Provide a JSON object containing task fields.';
  }

  if (typeof body.title !== 'string' || !body.title.trim()) {
    return 'Title must be a non-empty string.';
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return 'Description must be a string.';
  }
  if (body.status !== undefined && !['pending', 'completed'].includes(body.status)) {
    return 'Status must be pending or completed.';
  }
}

export async function createTask(req, res) {
  const message = validateTask(req.body);
  if (message) return res.status(400).json({ message });
  const body = req.body;

  const task = await Task.create({
    title: body.title,
    description: body.description,
    status: body.status,
  });

  res.status(201).json(task);
}

export async function getTasks(req, res) {
  const { status } = req.query;
  if (status !== undefined && !['pending', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Status filter must be pending or completed.' });
  }
  const filter = status === undefined ? {} : { status };
  const tasks = await Task.find(filter).sort({ createdAt: -1, _id: -1 });
  res.status(200).json(tasks);
}

export async function getTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  res.status(200).json(task);
}

export async function updateTask(req, res) {
  const message = validateTask(req.body);
  if (message) return res.status(400).json({ message });

  const fields = { title: req.body.title };
  if (req.body.description !== undefined) fields.description = req.body.description;
  if (req.body.status !== undefined) fields.status = req.body.status;

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $set: fields },
    { returnDocument: 'after', runValidators: true },
  );
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  res.status(200).json(task);
}

export async function completeTask(req, res) {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $set: { status: 'completed' } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  res.status(200).json(task);
}

export async function deleteTask(req, res) {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  res.status(200).json({ message: 'Task deleted successfully.' });
}
