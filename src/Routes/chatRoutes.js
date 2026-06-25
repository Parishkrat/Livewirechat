import express from "express";
import {
  sendMessage,
  getMessages,
  getUnreadCount,
} from "../controller/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// protect runs first — if no valid JWT cookie, request is blocked here
router.post("/send", protect, sendMessage);
router.get("/messages/:userId", protect, getMessages);
router.get("/unread", protect, getUnreadCount);
export default router;
