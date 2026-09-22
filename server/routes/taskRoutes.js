import { Router } from 'express';
import { createTask, getTask, getTasks } from '../controllers/taskController.js';

const router = Router();

router.route('/').get(getTasks).post(createTask);
router.get('/:id', getTask);

export default router;
