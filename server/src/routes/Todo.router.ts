import { authenticate } from "../middlewares/Auth.middleware";
import {
  createTask,
  getTodayTasks,
  markAsDoneById,
  getAllDoneTasks,
  getUpcommingTasks,
  getOverdueTasks,
  updateTaskById,
  deleteTaskById,
} from "../controllers/Todo.controller";

import express from "express";

const router = express.Router();
router.use(authenticate);

router.post("/", createTask);
router.get("/done", getAllDoneTasks);
router.get("/today", getTodayTasks);
router.get("/upcoming", getUpcommingTasks);
router.get("/overdue", getOverdueTasks);
router.patch("/:id/done", markAsDoneById);
router.put("/:id", updateTaskById);
router.delete("/:id", deleteTaskById);

export default router;
