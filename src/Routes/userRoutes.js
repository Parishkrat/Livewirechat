import express from "express";
import {
  login,
  logout,
  registerUser,
  getAllUsers,
} from "../controller/userController.js";
import { verifyEmail } from "../controller/verifyContoller.js";
import { loginLimiter } from "../middleware/ratelimiter.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginLimiter, login);
router.get("/verify-email", verifyEmail);
router.get("/users", protect, getAllUsers);
router.post("/logout", logout);

export default router;
