import { NextFunction, Request, Response } from "express";

export const asyncHandler = (requestHandler: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      console.error(err);
      next(err);
    });
  };
};
