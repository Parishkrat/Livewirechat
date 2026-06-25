import rateLimit from "express-rate-limit"; // Library to limit requests

// Account lock after failed attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 5, // Maximum 5 attempts per window
  message: {
    message: "Too many login attempts. Try again after 15 minutes",
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});
