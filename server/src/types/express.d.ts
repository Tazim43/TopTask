import { IUser } from "../models/User.model";
import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser; // Add user property to Request interface
  }
}
