import mongoose from "mongoose";
const messagSchema= new mongoose.Schema(
    {
        from:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            require:true
        },
        to:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            require:true
        },
        content:{
            type:String,
            require:true
        },
        status:{
            type:String,
            enum:["sent","delivered","read"],
            default:"sent"
        },
        isEdited:{
            type:Boolean,
            default:false
        },
        isDeleted:{
            type:Boolean,
            default:false
        },
        reactions:[
            {
                user:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"User"
                },
                emoji:{
                    type:String
                }
            }
        ]
    },
    {
        timestamps:true
    }
);

const Message = mongoose.model("Message",messagSchema);
export default Message;