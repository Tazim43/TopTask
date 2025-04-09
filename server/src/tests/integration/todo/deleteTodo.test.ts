import axios from "axios";
import { StatusCodes } from "http-status-codes";
import {
  USER_LOGIN_URL,
  USER_SIGNUP_URL,
  TODO_CREATE_URL,
  TODO_DELETE_URL,
} from "../../constants";

describe("🧪 Delete Todo - Integration Tests", () => {
  let token: string;
  let todoId: string;

  const user = {
    username: `testuser_${Math.random().toString(36).substring(2, 8)}`,
    password: "validPassword123",
    email: `email_${Math.random().toString(36).substring(2, 8)}@test.com`,
  };

  const todo = {
    title: "Todo to Delete",
    description: "This will be deleted",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    priority: 3,
  };

  beforeAll(async () => {
    await axios.post(USER_SIGNUP_URL, user);
    const loginRes = await axios.post<any>(USER_LOGIN_URL, {
      username: user.username,
      password: user.password,
    });

    token = loginRes.data.data.accessToken;

    const createRes = await axios.post<any>(TODO_CREATE_URL, todo, {
      headers: { Authorization: `Bearer ${token}` },
    });

    todoId = createRes.data.data._id;
  });

  test("✅ Successfully deletes a todo", async () => {
    const res = await axios.delete<any>(`${TODO_DELETE_URL}/${todoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.data.success).toBe(true);
  });

  test("❌ Fails to delete with invalid todoId", async () => {
    try {
      await axios.delete(`${TODO_DELETE_URL}/invalidId123`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails to delete without token", async () => {
    try {
      await axios.delete(`${TODO_DELETE_URL}/${todoId}`);
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.UNAUTHORIZED);
    }
  });
});
