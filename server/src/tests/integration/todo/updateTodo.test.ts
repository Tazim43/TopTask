import axios from "axios";
import { StatusCodes } from "http-status-codes";
import {
  TODO_CREATE_URL,
  TODO_UPDATE_URL,
  USER_SIGNUP_URL,
  USER_LOGIN_URL,
} from "../../constants";

describe("Todo Update - Integration Tests", () => {
  let token = "";
  let todoId = "";

  const todo = {
    title: "Original Todo",
    description: "Original description",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    priority: 5,
  };

  beforeAll(async () => {
    const user = {
      username: `user_${Math.random().toString(36).substring(2, 8)}`,
      password: "testPass123",
      email: `email_${Date.now()}@example.com`,
    };

    await axios.post(USER_SIGNUP_URL, user);

    const loginRes = await axios.post<any>(USER_LOGIN_URL, {
      username: user.username,
      password: user.password,
    });

    token = loginRes.data.data.accessToken;

    const todoRes = await axios.post<any>(TODO_CREATE_URL, todo, {
      headers: { Authorization: `Bearer ${token}` },
    });

    todoId = todoRes.data.data._id;
  });

  test("✅ Should update a todo successfully", async () => {
    const update = {
      title: "Updated Todo",
      description: "Updated description",
      dueDate: todo.dueDate,
      priority: 7,
    };

    const res = await axios.put<any>(`${TODO_UPDATE_URL}/${todoId}`, update, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.data.success).toBe(true);
    expect(res.data.data.title).toBe(update.title);
  });

  test("❌ Should fail to update with invalid todo ID", async () => {
    try {
      await axios.put(`${TODO_UPDATE_URL}/invalidId123`, todo, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error: any) {
      expect(error.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(error.response.data.success).toBe(false);
    }
  });

  test("❌ Should fail to update without auth token", async () => {
    try {
      await axios.put(`${TODO_UPDATE_URL}/${todoId}`, { title: "No Token" });
    } catch (error: any) {
      expect(error.response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(error.response.data.success).toBe(false);
    }
  });

  test("❌ Should fail to update with invalid priority", async () => {
    try {
      await axios.put(
        `${TODO_UPDATE_URL}/${todoId}`,
        { ...todo, priority: 20 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error: any) {
      expect(error.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(error.response.data.success).toBe(false);
    }
  });
});
