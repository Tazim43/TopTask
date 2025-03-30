import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcrypt";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

type UserModel = Model<IUser>;

const userSchema: Schema = new Schema<IUser, UserModel>(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password as string, salt);
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

const User = mongoose.model<IUser>("User", userSchema);

export default User;
