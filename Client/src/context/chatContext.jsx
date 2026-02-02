import { useContext } from "react";
import { useState } from "react";
import { createContext } from "react";
import { AuthContext } from "./authContext";
import toast from "react-hot-toast";
import { useEffect } from "react";


export const ChatContext = createContext ();

export const ChatProvider = ({children})=>{

    const [messages,setMessages]=useState([])
    const [users,setUsers]=useState([])
    const [selectedUser,setSelectedUser]=useState(null)
    const [UnseenMessages,setUnSeenMessages]=useState({})

    const {socket, axios} =useContext(AuthContext)
    //get all user in sidebar
    const getUsers=async ()=>{
        try{
           const {data} = await axios.get("/api/messages/users")
           if(data.success){
            setUsers(data.users);
            setUnSeenMessages(data.UnseenMessages);
           }
        }catch(error){
            toast.error(error.message)
        }
    }
    //selected users fun
    const getMessages= async(userId)=>{
        try{
            const {data}= await axios.get(`/api/messages/${userId}`)
            if(data.success){
                setMessages(data.messages)

            }
        }catch(error){
            toast.error(error.message)
        }
    }
    // send mess to induvidual user
    const sendMessage=async(messageData)=>{
        try{
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`,messageData)
            if(data.success){
                setMessages((preMessages)=>[...preMessages,data.newMessage])
            }else{
                toast.error(data.message)
            }
        }catch(error){
            toast.error(error.message)
        }
    }
    //realtime mess from selected user
    useEffect(() => {
  if (!socket) return;

  const handler = (newMessage) => {
    if (selectedUser && newMessage.senderId === selectedUser._id) {
      setMessages(prev => [...prev, newMessage]);
      axios.put(`/api/messages/mark/${newMessage._id}`);
    } else {
      setUnSeenMessages(prev => {
  const safePrev = prev || {};   // fallback

  return {
    ...safePrev,
    [newMessage.senderId]: (safePrev[newMessage.senderId] || 0) + 1
  };
});

    }
  };

  socket.on("newMessage", handler);

  return () => {
    socket.off("newMessage", handler);
  };

}, [socket, selectedUser]);


    const value ={
        messages,users,selectedUser,getUsers,getMessages,sendMessage,setSelectedUser,
        UnseenMessages,setUnSeenMessages
    }
    return(
    <ChatContext.Provider value={value}>
            {children}
    </ChatContext.Provider>
)}