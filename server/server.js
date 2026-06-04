import { redis } from "./src/lib/redis.js";
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
import { protectedRoute } from "./src/middleWare/auth.js";
const app =express()
const PORT =process.env.PORT || 5000
const server = http.createServer(app)
app.set("trust proxy",1)
//socket.io to server
export const io = new Server(server,{
  pingTimeout:60000,
  cors:{
    origin:process.env.CLIENT_URL,
    credentials:true
  }
})

//online by using socketId as userID

//connecting socket handler
io.on("connection",async (socket)=>{
  const userId= socket.handshake.query.userId;
  socket.userId = userId;
  console.log("user connected",userId);
  
  if(userId) {
    await redis.hset("userSocketMap",userId,socket.id)
  }
    // showing online users
    const brodcastAllUsers= async()=>{
      const users = await redis.hkeys("userSocketMap")
      io.emit("getOnlineUsers",users)
    }
    await brodcastAllUsers();
  
  //typing listener
  socket.on("typing",async(receiverId)=>{
    if(!receiverId) return;
    const reciverSocketId= await redis.hget("userSocketMap",receiverId);
    if(reciverSocketId){
      io.to(reciverSocketId).emit("typing")
    }
  });
  socket.on("stop typing",async(receiverId)=>{
    if (!receiverId) return;
    const reciverSocketId= await redis.hget("userSocketMap",receiverId); 
   if(reciverSocketId){
      io.to(reciverSocketId).emit("stop typing")
    }
  })
  //message seen 
  socket.on("seenMessage",async ({ senderId }={}) => {
    if (!senderId) return;
  const senderSocketId = await redis.hget("userSocketMap",senderId);
  if (senderSocketId) {
    io.to(senderSocketId).emit("messagesSeen",{receiverId:userId});
  }
});


  //audio call invocking
socket.on("callUser", async({ receiverId, offer, callType }={}) => {
  if (!receiverId) return;
   const reciverSocketId = await redis.hget("userSocketMap",receiverId);

   if (reciverSocketId) {
      io.to(reciverSocketId).emit("incomingCall", {
        offer,
        callerId: socket.userId,
        callerName: socket.handshake.query.fullName,
        profilePic: socket.handshake.query.profilePic, 
        callType
      })
   }
})

socket.on("answerCall", async({ callerId, answer }={}) => {
  if (!callerId) return;
const callerSocketId = await redis.hget("userSocketMap", callerId);
if (callerSocketId) {
   io.to(callerSocketId).emit("callAnswered", { answer })
}})
socket.on("iceCandidate",async ({ receiverId, candidate }={}) => {
  if (!receiverId) return;
const receiverSocketId = await redis.hget("userSocketMap", receiverId);   if (receiverSocketId) {
      io.to(receiverSocketId).emit("iceCandidate", { candidate })
   }
})
socket.on("endCall",async ({ receiverId }={}) => {
  if (!receiverId) return;
const receiverSocketId = await redis.hget("userSocketMap", receiverId);
   if (receiverSocketId) {
      io.to(receiverSocketId).emit("callEnded")
   }
})

socket.on("disconnect",async () => {
  if(userId){
    await redis.hdel("userSocketMap", userId);
await brodcastAllUsers();
  }
});
})
app.use(express.json({limit:"4mb"}));
app.use(cors({
  origin: process.env.CLIENT_URL, 
  credentials: true
}));
app.use(morgan("dev"))
await connectDB()
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use("/api/auth",userRouter)
app.use("/api/ai",aiRouter)
app.use("/api/messages",messageRouter)
app.get("/api/status",(req,res)=>{
  res.send("its working")
})

server.listen(PORT,()=> console.log(`Running in http://localhost:${PORT}/`))
