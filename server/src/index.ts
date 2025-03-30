import dotenv from "dotenv";
dotenv.config();
import app from "./app";

import { connectDB } from "./config/dbConnection";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    try {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Error starting server:", error);
    }
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit the process with failure
  });
