import app from "./src/app.js";
import http from "http";
import { Server } from "socket.io";
import Message from "./src/models/message.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Map of userId → Set of socketIds
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) return;

  console.log("🟢 connected:", userId);

  // Add socket to user's set
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
    socket.broadcast.emit("user-online", userId);
  }
  onlineUsers.get(userId).add(socket.id);

  // Send online users list to this client (excluding self)
  socket.emit(
    "online-users",
    Array.from(onlineUsers.keys()).filter((id) => id !== userId)
  );

  // Broadcast full list to everyone else
  socket.broadcast.emit("online-users", Array.from(onlineUsers.keys()));

  // ================= SEND MESSAGE =================
  socket.on("send-message", async ({ toUserId, message }) => {
    try {
      const fromUserId = socket.handshake.auth.userId; // trusted
      const newMessage = await Message.create({
        from: fromUserId,
        to: toUserId,
        content: message,
        status: "sent"
      });

      const targetSockets = onlineUsers.get(toUserId);
      if (targetSockets && targetSockets.size > 0) {
        newMessage.status = "delivered";
        await newMessage.save();

        targetSockets.forEach((sid) => {
          io.to(sid).emit("receive-message", {
            _id: newMessage._id,
            fromUserId,
            content: newMessage.content,
            status: newMessage.status,
            createdAt: newMessage.createdAt
          });
        });
      }

      // Echo back to sender for UI sync
      socket.emit("receive-message", {
        _id: newMessage._id,
        fromUserId,
        content: newMessage.content,
        status: newMessage.status,
        createdAt: newMessage.createdAt
      });

    } catch (error) {
      console.error("❌ send-message error:", error.message);
    }
  });

  // ================= TYPING INDICATOR =================
  socket.on("typing-start", ({ toUserId }) => {
    const fromUserId = socket.handshake.auth.userId;
    const targetSockets = onlineUsers.get(toUserId);
    if (targetSockets) {
      targetSockets.forEach((sid) => {
        io.to(sid).emit("typing-start", fromUserId);
      });
    }
  });

  socket.on("typing-stop", ({ toUserId }) => {
    const fromUserId = socket.handshake.auth.userId;
    const targetSockets = onlineUsers.get(toUserId);
    if (targetSockets) {
      targetSockets.forEach((sid) => {
        io.to(sid).emit("typing-stop", fromUserId);
      });
    }
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    if (onlineUsers.has(userId)) {
      const userSockets = onlineUsers.get(userId);
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("user-offline", userId);
        console.log("🔴 disconnected:", userId);
      }
    }

    // Update online users list for everyone else
    socket.broadcast.emit("online-users", Array.from(onlineUsers.keys()));
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
