import ApiError from "../../../utils/apiError";

describe("Unit Test - ApiError Class", () => {
  test("should create an error with custom status and message", () => {
    const error = new ApiError(404, "Not Found");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not Found");
    expect(error.errors).toEqual([]);
    expect(error.success).toBe(false);
  });

  test("should assign default values when optional params are not provided", () => {
    const error = new ApiError(500);

    expect(error.status).toBe(500);
    expect(error.message).toBe("something went wrong");
    expect(error.errors).toEqual([]);
    expect(error.success).toBe(false);
  });

  test("should include provided errors and set success to true if passed", () => {
    const mockErrors = [{ message: "Validation failed" }];
    const error = new ApiError(400, "Bad Request", mockErrors, true);

    expect(error.status).toBe(400);
    expect(error.message).toBe("Bad Request");
    expect(error.errors).toEqual(mockErrors);
    expect(error.success).toBe(true);
  });

  test("should inherit from Error and have a stack trace", () => {
    const error = new ApiError(401, "Unauthorized");

    expect(error instanceof Error).toBe(true);
    expect(typeof error.stack).toBe("string");
  });
});
