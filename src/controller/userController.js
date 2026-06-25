import User from "../models/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateEmail, validatePassword } from "../middleware/validator.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

// REGISTER FUNCTION
export const registerUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Email validation
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError });
    }

    // Password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verification URL
    const verifyURL = `http://localhost:3000/api/verify-email?token=${verificationToken}`;

    // Send email
    logger.info(`Verification email sent to: ${email}`);
    await transporter.sendMail({
      to: user.email,
      subject: "Verify your Email",
      html: `
        <h3>Email Verification</h3>
        <p>Click below to verify your account:</p>
        <a href="${verifyURL}">Verify Email</a>
      `,
    });

    logger.info(`New user registered: ${email}`);
    return res.status(200).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      id: user._id,
    });
  } catch (error) {
    console.error(error);
    logger.error(`Register Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// LOGIN FUNCTION
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Login failed (email not found): ${email}`);
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed (wrong password): ${email}`);
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }

    // Check email verification
    if (!user.isVerified) {
      logger.warn(`Login blocked (not verified): ${email}`);
      return res.status(403).json({
        success: false,
        message: "Please verify your email before login",
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    logger.info(`Login attempt: ${email}`);
    console.log("Setting cookie for user:", user._id);
    // Set cookie
    res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  maxAge: 24 * 60 * 60 * 1000,
});
    logger.info(`User logged in: ${email} (${user._id})`);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      userId: user._id,
    });
  } catch (error) {
    console.error(error);
    logger.error(`Login Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: new mongoose.Types.ObjectId(req.userID) }, //  cast to ObjectId
    }).select("-password -verificationToken -verificationTokenExpires");
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// LOGOUT FUNCTION
export const logout = (req, res) => {
  try {
    const userId = req.userID;

    logger.info(`User logged out: ${userId}`);

    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logger.error(`Logout Error: ${error.message}`);
    return res.status(500).json({ success: false });
  }
};
