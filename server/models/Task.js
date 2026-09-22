import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export default mongoose.model('Task', taskSchema);
