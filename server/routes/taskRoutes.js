import { Router } from 'express';
import mongoose from 'mongoose';
import {
  createTask, getTask, getTasks, updateTask, completeTask, deleteTask,
} from '../controllers/taskController.js';

const router = Router();

router.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: 'Invalid task ID.' });
  }
  next();
});

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.patch('/:id/complete', completeTask);

export default router;
