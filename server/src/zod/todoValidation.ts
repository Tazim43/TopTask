import { z } from "zod";

export const todoValidationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.preprocess((arg) => new Date(arg as string), z.date()),
  isCompleted: z.boolean().default(false),
  priorityScore: z.number().default(0),
  estimatedTime: z.number().default(0),
  tags: z.array(z.string()).default([]),
});

export type TodoValidationType = z.infer<typeof todoValidationSchema>;
