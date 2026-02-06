import express from "express";
import morgan from "morgan";
import "dotenv/config"
import http from "http"
import cors from "cors"
import { Server } from "socket.io";
import { connectDB } from "./src/lib/db.js";
import userRouter from "./src/routes/userRoutes.js";
import messageRouter from "./src/routes/messageRoutes.js";
import aiRouter from "./src/routes/aiRoutes.js";

const app =express()
const PORT =process.env.PORT || 5000
const server = http.createServer(app)

//socket.io to server
export const io = new Server(server,{
  pingTimeout:60000,
  cors:{origin:"*"}
})
//online by using socketId as userID
export const userSocketMap={}; 
//connecting socket handler
io.on("connection",(socket)=>{
  const userId= socket.handshake.query.userId;
  console.log("user connected",userId);
  if(userId) userSocketMap[userId]=socket.id;
  //typing listener
  socket.on("typing",(receiverId)=>{
    const reciverSocketId= userSocketMap[receiverId];
    if(reciverSocketId){
      io.to(reciverSocketId).emit("typing")
    }
  });
  socket.on("stop typing",(receiverId)=>{
    const reciverSocketId= userSocketMap[receiverId]; 
   if(reciverSocketId){
      io.to(reciverSocketId).emit("stop typing")
    }
  })
  socket.on("seenMessage", ({ senderId }) => {
  const senderSocketId = userSocketMap[senderId];
  if (senderSocketId) {
    io.to(senderSocketId).emit("messagesSeen",{receiverId:userId});
  }
});

  // showing online users
io.emit("getOnlineUsers",Object.keys(userSocketMap))
  socket.on("disconnect",()=>{
  console.log("user disconnected",userId);
  delete userSocketMap[userId];
  io.emit("getOnlineUsers",Object.keys(userSocketMap))
})
})
app.use(express.json({limit:"4mb"}));
app.use(cors());
app.use(morgan("dev"))
await connectDB()

app.use("/api/auth",userRouter)
app.use("/api/ai",aiRouter)
app.use("/api/messages",messageRouter)
app.get("/api/status",(req,res)=>{
  res.send("its working")
})

server.listen(PORT,()=> console.log(`Running in http://localhost:${PORT}/`))
