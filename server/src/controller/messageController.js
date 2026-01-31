import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";

// making to appear all users in the slidebar
export const getAllUsers=async(req,res)=>{
 try{
    const userId= userId._id;
    const filteredUsers=await User.find({_id:{$ne: userId}}).select("-password");
    //now unseen
    const unSeenMessages={}
    const promises= filteredUsers.map(async(user)=>{
        const message= Message.find({sendrId:user._id,reciverId:userId},{seen:false})
        if(message.length>0){
            unSeenMessages[user._id]=message.length;
        }
    })
    await Promise.all(promises);
    res.json({success:true, users:filteredUsers,unSeenMessages})
 }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
 }   
}

//messages from induvidual users

export const getMessage =async(req,res)=>{
 try{
    const {id:selectedUserId}=req.body
    const myId= req.user._id

    const message = await Message.find({
        $or:[
            {senderID:myId,reciverId:selectedUserId},
            {senderID:selectedUserId,reciverId:myId}
        ]
    })
    await Message.updateMany({senderID:selectedUserId,reciverId:myId},{seen:true})

    res.json({success:true,message})
 }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
 }   
}

// now marking message as seen 

export const markMessageSeen =async(req,res)=>{
 try{
    const {id}= req.body
    await Message.findByIdAndUpdate(id,{seen:true})
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
        senderId,receiverId,text,image:imageUrl
    })
    res.json({success:true,newMessage})
    
 }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
 }   
}