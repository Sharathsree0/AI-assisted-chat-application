import express from "express";
import dotenv from "dotenv"
import morgan from "morgan";
import connectDB from "./config/db.js";
import router from "./routes/authroutes.js";
import profileRoutes from "./routes/profile.js"
import messageRouter from "./routes/message.js";
import userRoutes from "./routes/user.js";


dotenv.config();
connectDB();

const app = express()

import cors from "cors";

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use("/api/users", userRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/profile",profileRoutes)
app.use(morgan("dev"))
app.use(express.json());
app.use("/api/auth",router)
app.use("/api/messages",messageRouter)
app.get("/",(req,res)=>{
    res.send("api is running");
})
export default app