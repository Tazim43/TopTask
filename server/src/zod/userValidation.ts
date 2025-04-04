import z from "zod";

const usernameRegex = /^[a-zA-Z0-9_]+$/; // Alphabets, numbers, and underscores
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation

export const userValidationSchema = z.object({
  username: z
    .string()
    .regex(usernameRegex, {
      message: "Username can only contain letters, numbers, and underscores",
    })
    .min(3, { message: "Username must be at least 3 characters long" })
    .transform((val) => val.trim().toLowerCase()),

  email: z.string().regex(emailRegex, { message: "Invalid email address" }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export type UserValidationSchemaType = z.infer<typeof userValidationSchema>;
