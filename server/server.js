import express from "express";
import morgan from "morgan";
import "dotenv/config"
import http from "http"
import cors from "cors"
import { Server } from "socket.io";
import { connectDB } from "./src/lib/db.js";
import userRouter from "./src/routes/userRoutes.js";
import messageRouter from "./src/routes/messageRoutes.js";
import { Socket } from "socket.io-client";

const app =express()
const PORT =process.env.PORT || 5000
const server = http.createServer(app)

//socket.io to server
export const io = new Server(server,{
  cors:{origin:"*"}
})
//online by using socketId as userID
export const userSocketMap={}; 
//connecting socket handler
io.on("connection",(socket)=>{
  const userId= socket.handshake.query.userId;
  console.log("user connected",userId);
  if(userId) userSocketMap[userId]=Socket.id;

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
app.use("/api/messages",messageRouter)
app.get("/api/status",(req,res)=>{
  res.send("its working")
})

server.listen(PORT,()=> console.log(`Running in http://localhost:${PORT}/`))
