import axios from "axios";
import { StatusCodes } from "http-status-codes";
import {
  TODO_CREATE_URL,
  USER_LOGIN_URL,
  USER_SIGNUP_URL,
} from "../../constants";

describe("📝 Create ToDo - Integration Test", () => {
  let token: string;

  beforeAll(async () => {
    const random = Math.random().toString(36).substring(2, 8);
    const user = {
      username: `testuser_${random}`,
      password: "testPassword" + random,
      email: `email_${random}@test.com`,
    };

    await axios.post(USER_SIGNUP_URL, user);

    const res = await axios.post<any>(USER_LOGIN_URL, {
      username: user.username,
      password: user.password,
    });

    token = res.data.data.accessToken;
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  });

  const postTodo = async (data: any) => {
    return axios.post(TODO_CREATE_URL, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  // Test #1

  test("✅ should create a todo successfully", async () => {
    const todo = {
      title: "Test Todo",
      description: "Write integration tests",
      dueDate: new Date().toISOString(),
      completed: false,
      priorityScore: 5,
      estimatedTime: 120,
      tags: ["testing", "integration"],
    };

    const res: any = await postTodo(todo);

    expect(res.status).toBe(StatusCodes.CREATED);
    expect(res.data.success).toBe(true);
    expect(res.data.data.title).toBe(todo.title);
    expect(res.data.data.description).toBe(todo.description);
    expect(new Date(res.data.data.dueDate).toISOString()).toBe(todo.dueDate);
    expect(res.data.data.completed).toBe(todo.completed);
    expect(res.data.data.priorityScore).toBe(todo.priorityScore);
    expect(res.data.data.estimatedTime).toBe(todo.estimatedTime);
    expect(res.data.data.tags).toEqual(todo.tags);
  });

  // Test  #2
  test("❌ Should fail when priority is out of range", async () => {
    const todo = {
      title: "Invalid Priority",
      description: "Priority > 10",
      priority: 11,
    };

    try {
      await postTodo(todo);
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Should fail when title is missing", async () => {
    const todo = {
      description: "No title provided",
      dueDate: new Date().toISOString(),
      priority: 3,
    };

    await expect(postTodo(todo)).rejects.toThrow(
      "Request failed with status code 400"
    );
  });

  test("❌ Should fail when description is missing", async () => {
    const todo = {
      title: "Missing description",
      dueDate: new Date().toISOString(),
      priority: 5,
    };

    await expect(postTodo(todo)).rejects.toThrow(
      "Request failed with status code 400"
    );
  });

  test("❌ Should fail when dueDate is missing", async () => {
    const todo = {
      title: "Missing dueDate",
      description: "Due date is required",
      priority: 6,
    };

    await expect(postTodo(todo)).rejects.toThrow(
      "Request failed with status code 400"
    );
  });

  test("❌ Should fail when dueDate is invalid", async () => {
    const todo = {
      title: "Invalid dueDate format",
      description: "DueDate should be a valid ISO string",
      dueDate: "not-a-date",
      priority: 2,
    };

    await expect(postTodo(todo)).rejects.toThrow(
      "Request failed with status code 400"
    );
  });
});
