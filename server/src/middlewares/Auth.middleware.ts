import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/apiError";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import User from "../models/User.model";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to authenticate users based on a JWT token.
 * This middleware verifies the token, extracts user information, and attaches the user object to `req.user`.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function to pass control to the next middleware
 * @throws {ApiError} If the token is missing, invalid, or the user is not found
 */
const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from cookies or Authorization header (Bearer Token)
    const token =
      req.cookies?.token || req.header("Authorization")?.split(" ")[1];

    if (!token) {
      throw new ApiError(StatusCodes.FORBIDDEN, "No token provided");
    }

    // Ensure JWT_SECRET is defined
    if (!JWT_SECRET) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "JWT SECRET is not defined"
      );
    }

    let decoded;

    try {
      // Verify and decode the token
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token");
    }

    // Ensure decoded token contains user ID
    if (typeof decoded === "object" && "id" in decoded) {
      const user = await User.findOne({ _id: decoded.id });

      if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
      }

      // Attach user object to request
      req.user = user;
      next(); // Proceed to the next middleware or route handler
    } else {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token payload");
    }
  } catch (error) {
    next(error); // Pass error to Express error handling middleware
  }
};

export { authenticate };
