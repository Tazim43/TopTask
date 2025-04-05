import express, { NextFunction, Request, Response } from "express";
import { MAX_REQUEST_LIMIT } from "./constants";
import cors from "cors";
import ApiError from "./utils/apiError";
import ResponseHandler, { ResponseHandlerType } from "./utils/responseHandler";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
const credentials = process.env.CORS_CREDENTIALS === "true";

// app config
app.use(cors({ origin: allowedOrigins, credentials }));
app.use(express.json({ limit: MAX_REQUEST_LIMIT }));
app.use(express.urlencoded({ limit: MAX_REQUEST_LIMIT, extended: true }));

// app routes
import userRouter from "./routes/User.router";
import todoRouter from "./routes/Todo.router";

app.use("/api/v1/auth/", userRouter);
app.use("/api/v1/todos/", todoRouter);

app.get("/", (req, res) => {
  res.json({
    api: "/api/v1",
  });
});

app.get("/api/v1", (req, res) => {
  res.json({
    msg: "Welcome to TopTask API",
    appname: "TopTask",
    version: "1.0.0",
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ApiError) {
    console.error("API Error:", err.message);
    ResponseHandler.error(res, err.message, err.status, err.errors);
    return;
  }

  // Handle payload to large error
  if (err.status === 413 || err.type === "entity.too.large") {
    ResponseHandler.error(res, "Payload Too Large", 413, err.errors);
    return;
  }
  // Handle other errors
  ResponseHandler.error(res, "Internal Server Error", 500, err.errors);
  return;
});

export default app;
