import mongoose, { Document, Model, Schema, Types } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  todos: Types.ObjectId[];
}

interface IUserMethods {
  isPasswordValid(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema: Schema = new Schema<IUser, UserModel>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/, // Alphabets, numbers, and underscores
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    todos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Todo", // Reference to the Todo model
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUser>("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password as string, salt);
      next();
    } catch (error: unknown) {
      return next(error as mongoose.CallbackError);
    }
  } else {
    next();
  }
});

userSchema.methods.isPasswordValid = async function (
  password: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, this.password as string);
  } catch (error: unknown) {
    throw new Error("Password comparison failed");
  }
};

userSchema.methods.generateAccessToken = function (): string {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET as string, {
    expiresIn: "1h",
  });
  this.accessToken = token;

  return this.accessToken as string;
};

userSchema.methods.generateRefreshToken = function (): string {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
  this.refreshToken = token;

  return this.refreshToken as string;
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
export { IUser, UserModel };
export type { IUserMethods };
