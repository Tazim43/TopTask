import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Todo from "../models/Todo.model";
import User from "src/models/User.model";
import { ResponseHandler } from "../utils/responseHandler";
import ApiError from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  todoValidationSchema,
  TodoValidationType,
} from "src/zod/todoValidation";

/**
 * Handles the creation of a new task (Todo) for an authenticated user.
 *
 * This function validates the request body using a Zod schema, ensures the user is authenticated,
 * and associates the newly created task with the user's account. If any validation or database
 * operation fails, it throws an appropriate error.
 *
 * @async
 * @function createTask
 * @route {POST} /api/v1/todos
 * @throws {ApiError} If the user is not authenticated or not found.
 * @throws {ApiError} If the request body contains invalid data.
 * @throws {ApiError} If there is an internal server error during task creation.
 */
const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  const userModel = await User.findById(user.id);
  if (!userModel) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  // Validate request body using zod schema
  const validationResult = todoValidationSchema.safeParse(req.body);

  if (!validationResult.success) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid input data",
      validationResult.error.issues.map((val) => {
        return val.message;
      })
    );
  }

  const todoData: TodoValidationType = validationResult.data;
  try {
    // Create a new Todo
    const todo = await Todo.create(todoData);
    userModel.todos.push(todo._id);
    await userModel.save();

    ResponseHandler.success(res, todo);
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to create todo"
    );
  }
});

/**
 *  Get all due tasks for the current day.
 *
 * This function extracts the authenticated user from the request object and
 * queries the database for tasks created within the current day's time range
 * (from 00:00:00 to 23:59:59). If the user is not authenticated, an
 * unauthorized error is thrown. In case of any database or server errors,
 * an internal server error is returned.
 
 * @async
 * @function getTodayTasks
 * @route {GET} /api/v1/todos/today
 * @throws {ApiError} If the user is not authenticated, an unauthorized error is thrown.
 * @throws {ApiError} If there is a failure in fetching the tasks, an internal server error is thrown.
 *
 */

const getTodayTasks = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  try {
    // Get today's tasks
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const todos = await User.findById(user.id)
      .populate({
        path: "todos",
        match: {
          createdAt: { $gte: startOfToday, $lte: endOfToday },
          completed: false,
        },
      })
      .select("todos")
      .lean();

    if (!todos) {
      throw new ApiError(StatusCodes.NOT_FOUND, "No tasks found for today");
    }

    ResponseHandler.success(res, todos);
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch today's tasks"
    );
  }
});

/**
 * Marks a Todo item as completed for an authenticated user.
 *
 * This function retrieves the Todo ID from the request parameters and ensures the user is authenticated.
 * It updates the specified Todo item to mark it as completed. If the Todo item is not found or the user
 * is not authorized, it throws an appropriate error. Handles any internal server errors during the process.
 *
 * @async
 * @function markAsDoneById
 * @route {PATCH} /api/v1/todos/:id/done
 * @throws {ApiError} If the user is not authenticated.
 * @throws {ApiError} If the Todo ID is not provided.
 * @throws {ApiError} If the Todo item is not found.
 * @throws {ApiError} If there is an internal server error during the update operation.
 */
const markAsDoneById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  if (!id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Todo ID is required");
  }

  try {
    // Mark the Todo as complete
    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: user.id },
      { completed: true }
    );

    if (!todo) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Todo not found");
    }

    ResponseHandler.success(res, { message: "Todo marked as complete" });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to mark todo as complete"
    );
  }
});

/**
 * Retrieves all completed tasks (Todos) for an authenticated user.
 *
 * This function ensures the user is authenticated, fetches all tasks marked as completed
 * that belong to the user, and returns them in the response. If the user is not authenticated
 * or if there is an issue during the database query, it throws an appropriate error.
 *
 * @async
 * @function getAllDoneTasks
 * @route {GET} /api/v1/todos/done
 * @throws {ApiError} If the user is not authenticated.
 * @throws {ApiError} If there is an internal server error during task retrieval.
 */
const getAllDoneTasks = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  try {
    // Get all done tasks
    const todos = await User.findById(user.id)
      .populate({
        path: "todos",
        match: {
          completed: true,
        },
      })
      .select("todos")
      .lean();

    if (!todos) {
      throw new ApiError(StatusCodes.NOT_FOUND, "No completed tasks found");
    }

    ResponseHandler.success(res, todos);
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch completed tasks"
    );
  }
});

/**
 * Retrieves the upcoming tasks for an authenticated user.
 *
 * This function checks if the user is authenticated, fetches tasks created before the start of the current day,
 * and returns them in the response. If the user is not authenticated or an error occurs during the database query,
 * an appropriate error is thrown.
 *
 * @async
 * @function getUpcommingTasks
 * @route {GET} /api/v1/todos/upcoming
 * @throws {ApiError} If the user is not authenticated.
 * @throws {ApiError} If there is an internal server error during task retrieval.
 */
const getUpcommingTasks = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  try {
    // Get upcoming tasks
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    // Find all todos for the user that are not completed and have a due date before today
    const todos = await User.findById(user.id)
      .populate({
        path: "todos",
        match: {
          dueDate: { $lt: startOfToday },
          isCompleted: false,
        },
      })
      .select("todos")
      .lean();

    if (!todos) {
      throw new ApiError(StatusCodes.NOT_FOUND, "No upcoming tasks found");
    }

    ResponseHandler.success(res, todos);
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch upcoming tasks"
    );
  }
});

/**
 * Retrieves overdue tasks for an authenticated user.
 *
 * This function checks if the user is authenticated, fetches tasks that are overdue (i.e., due date is before today),
 * and returns them in the response. If the user is not authenticated or an error occurs during the database query,
 * an appropriate error is thrown.
 *
 * @async
 * @function getOverdueTasks
 * @route {GET} /api/v1/todos/overdue
 * @throws {ApiError} If the user is not authenticated.
 * @throws {ApiError} If there is an internal server error during task retrieval.
 */
const getOverdueTasks = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  try {
    // Get overdue tasks based on dueDate
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    const userModel = await User.findById(user.id).populate("todos");
    if (!userModel) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
    }

    const todos = userModel.todos.filter(
      (todo: any) => todo.dueDate < startOfToday && !todo.completed
    );

    ResponseHandler.success(res, todos);
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch overdue tasks"
    );
  }
});

/**
 * Updates a Todo item by its ID for an authenticated user.
 *
 * This function retrieves the Todo ID from the request parameters and ensures the user is authenticated.
 * It validates the request body using a Zod schema and updates the specified Todo item. If the Todo item is not found
 * or the user is not authorized, it throws an appropriate error. Handles any internal server errors during the process.
 *
 * @async
 * @function updateTaskById
 * @route {PUT} /api/v1/todos/:id
 * @throws {ApiError} If the user is not authenticated.
 * @throws {ApiError} If the Todo ID is not provided.
 * @throws {ApiError} If the Todo item is not found.
 * @throws {ApiError} If there is an internal server error during the update operation.
 */

const updateTaskById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  if (!id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Todo ID is required");
  }

  try {
    const validationResult = todoValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid input data",
        validationResult.error.issues.map((val) => val.message)
      );
    }

    // Update the Todo
    const todo = await Todo.findByIdAndUpdate(id, validationResult.data, {
      new: true,
    });

    if (!todo) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Todo not found");
    }

    ResponseHandler.success(res, todo);
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update todo"
    );
  }
});
/**
 * Deletes a Todo item by its ID for an authenticated user.
 *
 * This function retrieves the Todo ID from the request parameters and ensures the user is authenticated.
 * It deletes the specified Todo item. If the Todo item is not found or the user is not authorized,
 * it throws an appropriate error. Handles any internal server errors during the process.
 *
 * @async
 * @function deleteTaskById
 * @route {DELETE} /api/v1/todos/:id
 * @throws {ApiError} If the user is not authenticated.
 * @throws {ApiError} If the Todo ID is not provided.
 * @throws {ApiError} If the Todo item is not found.
 * @throws {ApiError} If there is an internal server error during the delete operation.
 */
const deleteTaskById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  // Check if id is provided
  if (!id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Todo ID is required");
  }

  try {
    // Delete the Todo
    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Todo not found");
    }

    ResponseHandler.success(res, { message: "Todo deleted successfully" });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to delete todo"
    );
  }
});

export {
  createTask,
  getTodayTasks,
  markAsDoneById,
  getAllDoneTasks,
  getUpcommingTasks,
  getOverdueTasks,
  updateTaskById,
  deleteTaskById,
};
