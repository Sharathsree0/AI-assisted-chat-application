import express from "express";
import { protectedRoute } from "../middleWare/auth.js";
import { getAllUsers, getMessage, markMessageSeen, sendMessage } from "../controller/messageController.js";

const messageRouter = express.Router()

messageRouter.get("/users",protectedRoute,getAllUsers)
messageRouter.get("/:id",protectedRoute,getMessage)
messageRouter.get("/mark/:id",protectedRoute,markMessageSeen)
messageRouter.post("/send/:id",protectedRoute,sendMessage)

export default messageRouter

