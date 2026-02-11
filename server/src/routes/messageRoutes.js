import express from "express";
import { protectedRoute } from "../middleWare/auth.js";
import { deleteMessage, editMessage, getAllUsers, getMessage, markMessageSeen, reactToMessage, sendMessage } from "../controller/messageController.js";

const messageRouter = express.Router()

messageRouter.get("/users",protectedRoute,getAllUsers)
messageRouter.get("/:id",protectedRoute,getMessage)
messageRouter.get("/mark/:id",protectedRoute,markMessageSeen)
messageRouter.post("/send/:id",protectedRoute,sendMessage)
messageRouter.post("/react/:messageId",protectedRoute,reactToMessage)
messageRouter.put ("/edit/:messageId",protectedRoute,editMessage)
messageRouter.delete("/delete/:messageId", protectedRoute, deleteMessage);
export default messageRouter

