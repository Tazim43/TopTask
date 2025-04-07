import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { USER_SIGNUP_URL } from "../../constants";

describe("User Signup - Integration Tests", () => {
  beforeAll(() => {
    axios.defaults.baseURL = USER_SIGNUP_URL;
    axios.defaults.headers.common["Content-Type"] = "application/json";
  });

  const generateRandomUser = (overrides = {}) => {
    const random = Math.random().toString(36).substring(2, 8);
    return {
      username: `test_user_${random}`,
      password: `test_pass_${random}`,
      email: `email_${random}@example.com`,
      ...overrides,
    };
  };

  test("✅ User can sign up with valid credentials", async () => {
    const user = generateRandomUser();
    const res = await axios.post<any>("/", user);

    expect(res.status).toBe(StatusCodes.CREATED);
    expect(res.data.success).toBe(true);
    expect(res.data.data.user).toMatchObject({
      name: user.username,
      email: user.email,
    });
  });

  test("❌ Cannot signup with existing username", async () => {
    const user = generateRandomUser();
    await axios.post("/", user); // First signup

    try {
      await axios.post("/", {
        ...user,
        email: `different_${user.email}`, // Different email, same username
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.CONFLICT);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Cannot signup with existing email", async () => {
    const user = generateRandomUser();
    await axios.post("/", user); // First signup

    try {
      await axios.post("/", {
        ...user,
        username: `${user.username}_new`, // Different username, same email
      });
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.CONFLICT);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if username is missing", async () => {
    const user = generateRandomUser({ username: undefined });

    try {
      await axios.post("/", user);
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if password is missing", async () => {
    const user = generateRandomUser({ password: undefined });

    try {
      await axios.post("/", user);
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if email is missing", async () => {
    const user = generateRandomUser({ email: undefined });

    try {
      await axios.post("/", user);
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if email format is invalid", async () => {
    const user = generateRandomUser({ email: "invalid-email" });

    try {
      await axios.post("/", user);
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if password is too short", async () => {
    const user = generateRandomUser({ password: "123" });

    try {
      await axios.post("/", user);
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if username is too short", async () => {
    const user = generateRandomUser({ username: "ab" });

    try {
      await axios.post("/", user);
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });

  test("❌ Fails if fields are empty strings", async () => {
    const user = {
      username: "",
      password: "",
      email: "",
    };

    try {
      await axios.post("/", user);
    } catch (err: any) {
      expect(err.response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(err.response.data.success).toBe(false);
    }
  });
});
