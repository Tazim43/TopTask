import express from "express";
import { MAX_REQUEST_LIMIT } from "./constants";
import cors from "cors";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
const credentials = process.env.CORS_CREDENTIALS === "true";

// app config
app.use(cors({ origin: allowedOrigins, credentials }));
app.use(express.json({ limit: MAX_REQUEST_LIMIT }));
app.use(express.urlencoded({ limit: MAX_REQUEST_LIMIT }));

app.get("/", (req, res) => {
  res.send("Hello world!");
});

export default app;
