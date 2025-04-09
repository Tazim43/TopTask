import { asyncHandler } from "../../../utils/asyncHandler";
import { Request, Response } from "express";

describe("Unit Test - asyncHandler", () => {
  const mockReq = {} as Request;
  const mockRes = {} as Response;

  test("should call the wrapped async function", async () => {
    const mockNext = jest.fn();
    const handler = jest.fn().mockResolvedValue(undefined);

    const wrapped = asyncHandler(handler);

    await wrapped(mockReq, mockRes, mockNext);

    expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
  });

  test("should catch errors and pass them to next()", async () => {
    const mockNext = jest.fn();
    const error = new Error("Test error");
    const handler = jest.fn().mockRejectedValue(error);

    const wrapped = asyncHandler(handler);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  test("should log the error to console", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const mockNext = jest.fn();
    const error = new Error("Something went wrong");
    const handler = jest.fn().mockRejectedValue(error);

    const wrapped = asyncHandler(handler);

    await wrapped(mockReq, mockRes, mockNext);

    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });
});
