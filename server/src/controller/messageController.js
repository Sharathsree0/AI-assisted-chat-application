import Message from "../models/message.js";
import User from "../models/user.js";
import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";

// making to appear all users in the slidebar
export const getAllUsers=async(req,res)=>{
 try{
    const userId= req.user._id;
    const filteredUsers=await User.find({_id:{$ne: userId}}).select("-password").lean();
    //now unseen
    const UnSeenMessages={}
    const promises= filteredUsers.map(async(user)=>{
        const unseencount= await Message.find({senderId:user._id,receiverId:userId,seen:false})
        if(unseencount.length>0){
            UnSeenMessages[user._id]=unseencount.length;
        }
        const latestMessage = await Message.findOne({
            $or: [
                { senderId: user._id, receiverId: userId },
                { senderId: userId, receiverId: user._id }
            ]
        }).sort({ createdAt: -1 });

        // 3. Attach the timestamp (If you've never chatted, default to the year 1970 so they stay at the bottom)
        user.latestMessageTimestamp = latestMessage ? latestMessage.createdAt : new Date(0);
    });
    await Promise.all(promises);
    filteredUsers.sort((a, b) => b.latestMessageTimestamp - a.latestMessageTimestamp);
    res.json({success:true, users:filteredUsers,UnSeenMessages})
 }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
 }   
}

//messages from induvidual users

export const getMessage =async(req,res)=>{
 try{
    const selectedUserId = String(req.params.id).trim();
    const myId = String(req.user._id).trim();

    const message = await Message.find({
        $or:[
            {senderId:myId,receiverId:selectedUserId},
            {senderId:selectedUserId,receiverId:myId}
        ]
    })
    await Message.updateMany({senderId:selectedUserId,receiverId:myId,seen:false},{seen:true,status:"seen"})
    const otherUserSocketId= await redis.hget("userSocketMap",selectedUserId.toString());
   if(otherUserSocketId){
req.io.to(otherUserSocketId).emit("messagesSeen", { receiverId: myId, status: "seen" });    }
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
    const {text,image,audio } = req.body;
    const receiverId = String(req.params.id).trim();
    const senderId = String(req.user._id).trim();
    let imageUrl
    if(image){
        const uploadingResponse= await cloudinary.uploader.upload(image)
        imageUrl = uploadingResponse.secure_url;
    }
  let audioUrl;

if (audio) {
  const uploadAudio = await cloudinary.uploader.upload(audio, {
    resource_type: "video"
  });

  audioUrl = uploadAudio.secure_url;
}


    const newMessage= await Message.create({
        senderId,receiverId,text,image:imageUrl,audio: audioUrl,status:"sent"
    })
    //socket
   const reciverSocketId= await redis.hget("userSocketMap",receiverId.toString())
   if(reciverSocketId){
      req.io.to(reciverSocketId).emit("newMessage",newMessage)
      newMessage.status="delivered";
      await newMessage.save();
   }

      const senderSocketId = await redis.hget("userSocketMap",senderId.toString())
      if(senderSocketId){
      req.io.to(senderSocketId).emit("messageStatusUpdate",{
         messageId:newMessage._id,status:"delivered"
      })}

    res.json({success:true,newMessage})
    
 }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
 }   
}
//reaction logic function 

export const reactToMessage= async(req,res)=>{
   try{
      const userId= req.user._id;
      const {messageId}=req.params;
      const {emoji}=req.body
      const message = await Message.findById(messageId)
      if(!message){
         return res.status(404).json({success:false,message:"Message not found"})
      }

      const existingReactionIndex= message.reactions.findIndex(
         (reaction)=>reaction.userId.toString() === userId.toString()
      ) ;
      if(existingReactionIndex === -1){
         message.reactions.push({userId,emoji})
      }else{
         const existingUser= message.reactions[existingReactionIndex]
         if(existingUser.emoji === emoji){
            message.reactions.splice(existingReactionIndex,1)
         }else{
            message.reactions[existingReactionIndex].emoji = emoji
         }
      }  
      // message reaction
      const senderSocketId = await redis.hget("userSocketMap",message.senderId.toString());
      const reciverSocketId = await redis.hget("userSocketMap",message.receiverId.toString())
      
      if(senderSocketId){
        req.io.to(senderSocketId).emit("messageReactionUpdate",{
          messageId,reactions:message.reactions
        })
      }
      if(reciverSocketId){
        req.io.to(reciverSocketId).emit("messageReactionUpdate",{
          messageId,reactions:message.reactions
        })
      }
      await message.save()
      res.json({ success: true, reactions: message.reactions });

   }catch(error){
      res.status(500).json({success:false,message:error.message})
   }
}

// Editing the message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // only sender can edit
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can edit only your messages"
      });
    }

    // cannot edit deleted message
    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit deleted message"
      });
    }

    // store previous version
    message.editHistory.push({
      text: message.text,
      editedAt: new Date()
    });

    // update message
    message.text = content;
    message.editedAt = new Date();

    await message.save();

    // socket update (both users)
    const senderSocketId = await redis.hget("userSocketMap",message.senderId.toString());
    const receiverSocketId = await redis.hget("userSocketMap",message.receiverId.toString());

    if (senderSocketId) {
      req.io.to(senderSocketId).emit("messageEdited", message);
    }
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("messageEdited", message);
    }

    res.json({
      success: true,
      message
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Deleting the message its soft delete
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // only sender can delete
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can delete only your messages"
      });
    }

    // already deleted
    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Message already deleted"
      });
    }

    message.isDeleted = true;
    message.text = "";
    message.image = "";
    message.audio = "";

    await message.save();

    // socket notify both users
    const senderSocketId = await redis.hget("userSocketMap",message.senderId.toString());
    const receiverSocketId = await redis.hget("userSocketMap",message.receiverId.toString());

    if (senderSocketId) {
      req.io.to(senderSocketId).emit("messageDeleted", { 
        messageId: message._id
      });
    }

    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("messageDeleted", {
        messageId: message._id
      });
    }

    res.json({ success: true });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
