import Message from "../models/message.js";

export const markAsRead= async (req,res)=>{
    try{
        const {userId}= req.params;
        const currentUserId = req.user.id;
        
        await Message.updateMany(
            {
                from:userId,
                to:currentUserId,
                status:{$ne:"read"}
            }
        )
        res.json({message:"message marked as read"})
    }catch{
        res.status(500).json({message:"failed to update status"})
    }
}

export const editMessage= async (req,res)=>{
try{

    const {messageId}=req.params;
    const {content}=req.body;
    

    const userId =req.user.id;
    const message = await Message.findById(messageId)


    if(!message){
        return res.status(404).json({message:"message not found"});
    }
    if(message.from.toString() !== userId){
        return res.status(403).json({message:"not allowed"})
    }

    message.content=content;
    message.isEdited=true;
    await message.save();

    res.json(message)

}catch{
res.status(500).json({message:"edit failed"})
}
}

export const  deleteMessage= async (req,res)=>{
    try{
        const {messageId}=req.params;
        const userId =req.user.id;

        const message= await Message.findById(messageId);

        if(!message){
            return res.status(404).json({message:"message not found"})
        }

    if(message.from.toString()!== userId){
        return res.status(403).json({message:"not allowed"})
    }
    message.isDeleted=true;
    message.content="this message was deleted";
    await message.save();

    res.json(message)
    }catch{
        res.status(500).json({message:"deleting failed"})
    }
}

export const reactToMessage= async (req,res)=>{
    try{
        const{messageId}=req.params;
        const {emoji}=req.body;
        const userId= req.user.id;


const message = await Message.findById(messageId);
if(!message){
    return res.status(404).json({message:"message not found"})
}
const existingReactionIndex= message.reactions.findIndex(r=>r.user.toString() === userId)

if (existingReactionIndex !==-1){
    if(message.reactions[existingReactionIndex].emoji ===emoji){
        message.reactions.splice(existingReactionIndex, 1);
    }else{
      message.reactions[existingReactionIndex].emoji = emoji;
}
}else{
    message.reactions.push({ user: userId, emoji });
}

await message.save();
res.json(message);

    }catch(error){
        res.status(500).json({message:"failed to react"})
    }
}