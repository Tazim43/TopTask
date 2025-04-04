import { Request, Response, Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import { ResponseHandler } from "../utils/responseHandler";
import ApiError from "../utils/apiError";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import {
  userValidationSchema,
  UserValidationSchemaType,
} from "../zod/userValidation";

/**
 * User login handler.
 * Authenticates a user using email and password, generates a JWT token if credentials are valid.
 *
 * @throws {ApiError} If user is not found or password is invalid
 * @route POST /api/v1/auth/login
 */
const userLogin = asyncHandler(async (req: Request, res: Response) => {
  // Destructure JWT secret from environment variables
  const { JWT_SECRET } = process.env;

  // Ensure JWT_SECRET is defined
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  // Extract email and password from request body
  const { username, password } = req.body;

  // Check if email and password are provided
  if (!username || !password) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Email and password are requried"
    );
  }

  // Attempt to find the user by email in the database
  const user = (await User.findOne({ username })) as {
    _id: string;
    isPasswordValid: (password: string) => Promise<boolean>;
    email: string;
    username: string;
  };

  // If user is not found, throw an error
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "user not found");

  // Validate password
  const isPasswordValid: boolean = await user.isPasswordValid(password);

  // If password is invalid, throw an error
  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, ReasonPhrases.UNAUTHORIZED);
  }

  // Generate a JWT token with 1-hour expiration
  const token: string = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "1h",
  });

  // Prepare user info to be sent in the response
  const userInfo = {
    id: user._id,
    email: user.email,
    name: user.username,
  };

  // Respond with success, including user info and token
  ResponseHandler.success(res, { userInfo, token });
});

/**
 * User sign-up handler.
 *
 * @throws {ApiError} If username, email, or password is missing, or if validation fails or if the username or email is already in use.
 * @route POST /api/v1/auth/signup
 */
const userSignUp = asyncHandler(async (req: Request, res: Response) => {
  // Extract username, email, and password from request body
  const { username, email, password } = req.body;

  // Check if all required fields are provided
  if (!username || !email || !password) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Username, Email and password are required"
    );
  }

  // Validate the request body using the userValidationSchema
  const validationResult = userValidationSchema.safeParse(req.body);

  // If validation fails, throw an error with the validation issues
  if (!validationResult.success) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Validation error",
      validationResult.error.issues.map((val) => {
        return val.message;
      })
    );
  }

  // Extract the validated data
  const validatedData: UserValidationSchemaType = validationResult.data;

  // Check if a user with the username already exists
  const existingUserByUsername = await User.findOne({ username });
  if (existingUserByUsername) {
    throw new ApiError(StatusCodes.CONFLICT, "Username is already in use");
  }

  // check if a user with the same email already exists
  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    throw new ApiError(StatusCodes.CONFLICT, "Email is already in use");
  }

  // Create a new user instance
  const newUser = new User(validatedData);

  // Save the new user to the database
  await newUser.save();

  // Prepare user info to be sent in the response
  const userInfo = {
    id: newUser._id,
    email: newUser.email,
    name: newUser.username,
  };

  // Respond with success, including the created user info
  ResponseHandler.success(res, { user: userInfo });
});

/**
 * User logout handler.
 * Logs out the user by clearing access and refresh tokens from cookies and database.
 *
 * @throws {ApiError} If the user is not authenticated
 * @route POST /api/v1/auth/logout
 */
const userLogout = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  // Check if the user is authenticated
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  // Find the user in the database
  const userModel = await User.findById(user.id);
  if (!userModel) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Clear accessToken and refreshToken in the database
  userModel.accessToken = null;
  userModel.refreshToken = null;
  await userModel.save();

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  // Respond with success
  ResponseHandler.success(res, { message: "Logout successful" });
});

/**
 * Password reset handler.
 * Handles password reset functionality by verifying an access token and updating the user's password.
 *
 * @throws {ApiError} If the access token is invalid, expired, or if the new password is not provided
 * @route POST /api/v1/auth/password-reset
 */
const passwordReset = asyncHandler(async (req: Request, res: Response) => {
  const { JWT_SECRET } = process.env;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const { oldPassword, newPassword } = req.body;
  const { user } = req;

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  // Check if old password, and new password are provided
  if (!oldPassword || !newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "old password, and new password are required"
    );
  }

  try {
    // Verify the token
    const userModel = await User.findById(user?.id);
    if (!userModel) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
    }

    // Verify the old password
    const isPasswordValid = await userModel.isPasswordValid(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Old password is incorrect");
    }

    // Update the user's password
    userModel.password = newPassword;
    await userModel.save();

    ResponseHandler.success(res, { message: "Password reset successful" });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to reset password"
    );
  }
});

/**
 * Refresh token handler.
 * Generates a new JWT token if the provided refresh token is valid.
 *
 * @throws {ApiError} If the refresh token is invalid or expired
 * @route POST /api/v1/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  // Check if refresh token is provided
  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Refresh token is required");
  }

  try {
    // Verify the refresh token
    const decoded = jwt.decode(token) as { id: string };
    if (!decoded || !decoded.id) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token");
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token");
    }

    // Generate a new access token using the user.generateAccessToken() method
    const newToken: string = user.generateAccessToken();

    // Respond with success, including the new token
    ResponseHandler.success(res, { token: newToken });
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token");
  }
});

export { userLogin, userSignUp, userLogout, passwordReset, refreshToken };
