import { Response } from "express";

class ResponseHandler {
  static success(
    res: Response,
    data = {},
    message: string = "success",
    status: number = 200
  ) {
    return res.status(status).json({
      success: true,
      status,
      message,
      data,
    });
  }

  static error(
    res: Response,
    message: string = "something went wrong",
    status: number = 500,
    errors: Error[] = []
  ) {
    return res.status(status).json({
      success: false,
      status,
      message,
      errors,
    });
  }
}

export default ResponseHandler;
export { ResponseHandler };
export type { ResponseHandler as ResponseHandlerType };
