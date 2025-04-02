import mongoose, { Model } from "mongoose";

interface ITodo {
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  priorityScore: number;
  estimatedTime: number;
  tags: string[];
}

type TodoModel = Model<ITodo>;

const todoSchema = new mongoose.Schema<ITodo, TodoModel>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  priorityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  estimatedTime: {
    type: Number,
    default: 0,
  },
  tags: {
    type: [String],
    default: [],
  },
});

const Todo = mongoose.model<ITodo>("Todo", todoSchema);

export default Todo;
