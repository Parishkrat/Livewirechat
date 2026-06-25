import Message from "../models/message.js";
import mongoose from "mongoose";
import { io, onlineUsers } from "../server.js";
import logger from "../utils/logger.js";

export const sendMessage = async (req, res) => {
  try {
    const sender = req.userID;
    const { receiver, message } = req.body;

    if (!receiver || !message) {
      logger.warn("Missing receiver or message");
      return res.status(400).json({
        success: false,
        message: "receiver and message are required",
      });
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      message,
    });

    const populatedMsg = await newMessage.populate("sender", "email");

    logger.info(`Message sent from ${sender} → ${receiver}`);

    const receiverSocketId = onlineUsers[receiver];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMsg);
      logger.info(`Real-time message delivered to ${receiver}`);
    } else {
      logger.warn(`User ${receiver} is offline`);
    }

    return res.status(201).json({
      success: true,
      data: populatedMsg,
    });
  } catch (error) {
    logger.error(`SendMessage Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const getMessages = async (req, res) => {
  try {
    const myId = req.userID;
    const otherId = req.params.userId;

    logger.info(`Fetching messages between ${myId} and ${otherId}`);

    await Message.updateMany(
      { sender: otherId, receiver: myId, isRead: false },
      { $set: { isRead: true } },
    );

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherId },
        { sender: otherId, receiver: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "email")
      .populate("receiver", "email");

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    logger.error(`GetMessages Error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getUnreadCount = async (req, res) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.userID);

    logger.info(`Fetching unread messages for ${myId}`);

    const unread = await Message.aggregate([
      {
        $match: {
          receiver: myId,
          isRead: false,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
          latestMessage: { $first: "$message" },
          latestTime: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { senderId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$senderId"] },
              },
            },
            {
              $project: { email: 1 },
            },
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          email: "$user.email",
          count: 1,
          latestMessage: 1,
          latestTime: 1,
        },
      },
    ]);

    logger.info(`Unread messages fetched: ${unread.length}`);

    return res.status(200).json({ success: true, data: unread });
  } catch (error) {
    logger.error(`GetUnread Error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
