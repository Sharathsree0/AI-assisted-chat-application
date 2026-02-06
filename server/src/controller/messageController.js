import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io,userSocketMap } from "../../server.js";
// making to appear all users in the slidebar
export const getAllUsers=async(req,res)=>{
 try{
    const userId= req.user._id;
    const filteredUsers=await User.find({_id:{$ne: userId}}).select("-password");
    //now unseen
    const UnSeenMessages={}
    const promises= filteredUsers.map(async(user)=>{
        const message= await Message.find({senderId:user._id,receiverId:userId,seen:false})
        if(message.length>0){
            UnSeenMessages[user._id]=message.length;
        }
    })
    await Promise.all(promises);
    res.json({success:true, users:filteredUsers,UnSeenMessages})
 }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
 }   
}

//messages from induvidual users

export const getMessage =async(req,res)=>{
 try{
    const selectedUserId=req.params.id
    const myId= req.user._id

    const message = await Message.find({
        $or:[
            {senderId:myId,receiverId:selectedUserId},
            {senderId:selectedUserId,receiverId:myId}
        ]
    })
    await Message.updateMany({senderId:selectedUserId,receiverId:myId,seen:false},{seen:true,status:"seen"})
    const otherUserSocketId=userSocketMap[selectedUserId];
    if(otherUserSocketId){
      io.to(otherUserSocketId).emit("messagesSeen",{receiverId:myId,status:"seen"})
    }
    res.json({success:true,messages:message})
 }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
 }   
}

// now marking message as seen 

export const markMessageSeen =async(req,res)=>{
 try{
    const id= req.params.id;
    await Message.findByIdAndUpdate(id,{seen:true,status:"seen"})
    res.json({success:true})
    
 }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
 }   
}

//now message sending for individul means selected user

export const sendMessage =async(req,res)=>{
 try{
    const {text,image} = req.body;
    const receiverId= req.params.id;
    const senderId= req.user._id;
    let imageUrl
    if(image){
        const uploadingResponse= await cloudinary.uploader.upload(image)
        imageUrl = uploadingResponse.secure_url;
    }
    const newMessage= await Message.create({
        senderId,receiverId,text,image:imageUrl,status:"sent"
    })
    //socket
   const reciverSocketId= userSocketMap[receiverId]
   if(reciverSocketId){
      io.to(reciverSocketId).emit("newMessage",newMessage)
      newMessage.status="delivered";
      await newMessage.save();
      io.to(userSocketMap[senderId]).emit("messageStatusUpdate",{
         messageId:newMessage._id,status:"delivered"
      })
   }

    res.json({success:true,newMessage})
    
 }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
 }   
}