import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { USER_LOGIN_URL, USER_SIGNUP_URL } from "../../constants";

describe("User Signin - Integration Tests", () => {
  const random = Math.random().toString(36).substring(2, 8);
  const user = {
    username: `testuser_${random}`,
    password: `validPassword_${random}`,
    email: `validEmail_${random}@example.com`,
  };

  beforeAll(async () => {
    axios.defaults.headers.common["Content-Type"] = "application/json";

    try {
      await axios.post(USER_SIGNUP_URL, user); // Register the user first
    } catch (err: any) {
      if (err.response.status !== StatusCodes.CONFLICT) {
        console.error("Error during user registration:", err.response.data);
      }
    }
  });

  test("✅ User can sign in with valid credentials", async () => {
    const res = await axios.post<any>(USER_LOGIN_URL, {
      username: user.username,
      password: user.password,
    });

    expect(res.data.status).toBe(StatusCodes.OK);
    expect(res.data.success).toBe(true);
    expect(res.data.data.user).toMatchObject({
      name: user.username,
      email: user.email,
    });
    expect(res.data.data.accessToken).toBeDefined();
    expect(res.data.data.refreshToken).toBeDefined();
  });

  test("❌ User cannot sign in with invalid username", async () => {
    try {
      await axios.post(USER_LOGIN_URL, {
        username: "invalidUsername",
        password: user.password,
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ User cannot sign in with invalid password", async () => {
    try {
      await axios.post(USER_LOGIN_URL, {
        username: user.username,
        password: "wrongPassword123",
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if username is missing", async () => {
    try {
      await axios.post(USER_LOGIN_URL, {
        password: user.password,
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if password is missing", async () => {
    try {
      await axios.post(USER_LOGIN_URL, {
        username: user.username,
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if fields are empty strings", async () => {
    try {
      await axios.post(USER_LOGIN_URL, {
        username: "",
        password: "",
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if credentials are incorrect (case-sensitive)", async () => {
    try {
      await axios.post(USER_LOGIN_URL, {
        username: user.username.toUpperCase(), // Different case
        password: user.password,
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if user is not registered", async () => {
    try {
      const got = await axios.post(USER_LOGIN_URL, {
        username: "nonExistentUser",
        password: "password123",
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(err.response.data.success).toBe(false);
    }
  });
});
