import app from "./src/app.js";
import http from "http";
import { Server, Socket } from "socket.io";
import Message from "./src/models/message.js";

const PORT = process.env.PORT || 5000;

const server= http.createServer(app)

const io = new Server(server,{
  cors:{
    origin:"http://localhost:5173",
    methods:["GET","POST","PUT","DELETE"]
  }
});
const onlineUsers = new Map();
io.on("connection", (socket) => {

  socket.on("send-message", async ({  toUserId, message }) => {
  try{
    const fromUserId =socket.handshake.auth.userId;
      const newMessage = await Message.create({
      from: fromUserId,
      to: toUserId,
      content: message
    });

    const targetSocketId = onlineUsers.get(toUserId);

    if (targetSocketId) {

      newMessage.status="delivered"
      await newMessage.save();
      io.to(targetSocketId).emit("receive-message", {
        _id: newMessage._id,
        fromUserId,
        content: newMessage.content,
        status:newMessage.status,
        createdAt: newMessage.createdAt
      });
    }
  }  catch(error){
    console.error("send message error",error.message)
  }
});


  const userId = socket.handshake.auth.userId;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit("user-online", userId);
    console.log("🟢 online:", userId);
  }

  socket.on("typing-start", ({ fromUserId, toUserId }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    console.log("SERVER typing-start", fromUserId, "→", toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("typing-start", fromUserId);
    }
  });

  socket.on("typing-stop", ({ fromUserId, toUserId }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    console.log("SERVER typing-stop", fromUserId, "→", toUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("typing-stop", fromUserId);
    }
  });

  socket.on("disconnect", () => {
    if (userId) {
      onlineUsers.delete(userId);
      socket.broadcast.emit("user-offline", userId);
      console.log("🔴 offline:", userId);
    }
  });
});


server.listen(PORT,()=>{
  console.log(`Server is running on port ${PORT}`)
});