import { Router } from "express";
import {
  userLogin,
  userSignUp,
  userLogout,
  passwordReset,
  refreshToken,
} from "../controllers/User.controller";
import { authenticate } from "../middlewares/Auth.middleware";

const router = Router();

router.route("/login").post(userLogin);
router.route("/signup").post(userSignUp);
router.route("/logout").post(authenticate, userLogout);
router.route("/password-reset").post(authenticate, passwordReset);
router.route("/refresh-token").post(authenticate, refreshToken);

export default router;
