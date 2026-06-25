import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./Routes/userRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRouter from "./Routes/chatRoutes.js";
import logger from "./utils/logger.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// create HTTP server
const server = http.createServer(app);

//  init socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5500", "http://127.0.0.1:5500","https://livewirechat.onrender.com"],
    credentials: true,
  },
});

//  store online users
let onlineUsers = {};

// socket connection
io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);
  logger.info(`Socket connected: ${socket.id}`);
  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
    // console.log("User joined:", userId);
    logger.info(`User joined: ${userId}`);
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected");
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// middleware
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://livewirechat.onrender.com"  // no trailing slash
  ],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

// routes
app.use("/api", router);
app.use("/api", chatRouter);

const Port = process.env.PORT;
const Mongodb = process.env.MONGOURL;

app.get("/", (req, res) => {
  res.redirect("/Auth.html");
});
// DB + server start
mongoose
  .connect(Mongodb)
  .then(() => {
    server.listen(Port, () => {
      console.log(`Server running on ${Port}`);

      logger.info("Server starting...");
    });
    console.log("Database connected");
  })
  .catch((error) => {
    console.log(error);
  });

// export for controller use
export { io, onlineUsers };
