import { useEffect } from 'react'
import assets from '../assets/assets'
import { useRef } from 'react'
import { formatMessageTime } from '../lib/utilis'
import { useContext } from 'react'
import { ChatContext } from '../context/chatContext'
import { AuthContext } from '../context/authContext'
import { useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'

const Chatcontainer = () => {
    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, isTyping, setMessages } = useContext(ChatContext)
    const { authUser, onlineUser, socket } = useContext(AuthContext)

    const scrollEnd = useRef()
    const [input, setInput] = useState("")

    const [typing, setTyping] = useState(false)
    //edit and delete state
    const [editingMsgId, setEditingMsgId] = useState(null)
    const [editText, setEditText] = useState("")

    // ai states and settings
    const [oldInput, setOldInput] = useState("")
    const [showDecline, setShowDecline] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const [menuMsgId, setMenuMsgId] = useState(null)

    const handleAiRephrase = async () => {
        if (!input.trim()) return

        try {
            setAiLoading(true)
            setShowMenu(false)
            const { data } = await axios.post("/api/ai/rephrase", { text: input })

            if (data.success) {
                setOldInput(input)
                setInput(data.result)
                setShowDecline(true)
            }
        } catch {
            toast.error("AI failed")
        } finally {
            setAiLoading(false)
        }
    }

    const summarizingHandler = async () => {
        if (!input.trim()) return
        try {
            setAiLoading(true)
            setShowMenu(false)
            const { data } = await axios.post("/api/ai/summarizes", { text: input })
            if (data.success) {
                setOldInput(input)
                setInput(data.result)
                setShowDecline(true)
            }
        } catch {
            toast.error("AI failed")
        } finally {
            setAiLoading(false)
        }
    }

    // reaction send handler 
    const handleSendReaction = async (messageId, emoji) => {
        await axios.post(`/api/messages/react/${messageId}`, { emoji })
        setMenuMsgId(null)
    }

    // sending message handler

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (input.trim() === "") return null
        await sendMessage({ text: input.trim() })
        setInput("")
        setShowDecline(false)
    }

    const handleSendImage = async (e) => {
        const file = e.target.files[0]
        if (!file || !file.type.startsWith("image/")) {
            toast.error("select an image file")
            return
        }
        const reader = new FileReader()
        reader.onloadend = async () => {
            await sendMessage({ image: reader.result })
            e.target.value = ""
        }
        reader.readAsDataURL(file)
    }

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id)
        }
    }, [selectedUser])

    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" })
        }

    }, [messages])

    useEffect(() => {
        if (!socket) return;

        const handleEdit = (updatedMessage) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === updatedMessage._id ? updatedMessage : msg
                )
            );
        };

        const handleDelete = ({ messageId }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId
                        ? { ...msg, isDeleted: true, text: "", image: "" }
                        : msg
                )
            );
        };

        socket.on("messageEdited", handleEdit);
        socket.on("messageDeleted", handleDelete);

        return () => {
            socket.off("messageEdited", handleEdit);
            socket.off("messageDeleted", handleDelete);
        };
    }, [socket]);


    return selectedUser ? (
        <div className='h-full overflow-scroll relative backdrop-blur-lg'>
            {/* Header */}
            <div className='flex items-center gap-8 py-3 mx-4 border-b border-stone-500'>
                <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
                <p className='flex-1 text-lg text-white flex items-center gap-2'>
                    {selectedUser.fullName}
                    {onlineUser?.includes(selectedUser._id) &&
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                </p>

                <img onClick={() => setSelectedUser(null)}
                    src={assets.arrow_icon} alt="" className='md:hidden max-w-7 cursor-pointer' />
                <img src={assets.Audio_call} alt="" className='max-md:hidden max-w-5 cursor-wait' />
                <img src={assets.Vide_call} alt="" className='max-md:hidden max-w-5 cursor-wait ' />
                <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5 cursor-wait' />
            </div>

            {/* Messages */}
            <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === authUser._id
                    const groupReaction = {}
                    msg.reactions?.forEach(r => {
                        groupReaction[r.emoji] = (groupReaction[r.emoji] || 0) + 1
                    })

                    return (
                        <div
                            key={index}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                setMenuMsgId(msg._id)
                            }}
                            className={`relative flex items-end gap-2 justify-end ${!isMe && 'flex-row-reverse'}`}
                        >
                            {msg.image ? (
                                <img
                                    src={msg.image}
                                    alt=""
                                    className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8'
                                />
                            ) : (
                                <p
                                    className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}
                                >
                                    {msg.isDeleted ? (
                                        <span className="italic text-gray-300">
                                            This message was deleted
                                        </span>
                                    ) : (
                                        <>
                                            {editingMsgId === msg._id ? (
                                                <input
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === "Enter") {
                                                            await axios.put(`/api/messages/edit/${msg._id}`, {
                                                                content: editText
                                                            })
                                                            setEditingMsgId(null)
                                                        }
                                                        if (e.key === "Escape") {
                                                            setEditingMsgId(null)
                                                        }
                                                    }}
                                                    className="bg-transparent border-b border-gray-400 outline-none text-white text-sm"
                                                    autoFocus
                                                />
                                            ) : (
                                                <>
                                                    {msg.isDeleted ? (
                                                        <span className="italic text-gray-300">
                                                            This message was deleted
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span>{msg.text}</span>
                                                            {msg.editedAt && (
                                                                <span className="text-[10px] text-gray-300 ml-1">
                                                                    Edited
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}

                                        </>
                                    )}
                                </p>
                            )}

                            {Object.keys(groupReaction).length > 0 && (
                                <div className={`absolute -bottom-4 text-xs flex gap-1 ${isMe ? 'right-2' : 'left-2'}`}>
                                    {Object.entries(groupReaction).map(([emoji, count]) => (
                                        <span key={emoji} className="text-base text-white">
                                            {emoji} {count > 1 && count}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="text-center text-xs">
                                <img
                                    src={isMe ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon}
                                    alt=""
                                    className='w-7 rounded-bl-none'
                                />
                                <p className='text-gray-500'>
                                    {msg.createdAt ? formatMessageTime(msg.createdAt) : "sending..."}
                                </p>

                                {isMe && (
                                    <span className="text-white text-xs ml-1">
                                        {msg.status === "sent" && "✓"}
                                        {msg.status === "delivered" && "✓✓"}
                                        {msg.status === "seen" && (
                                            <span className="text-blue-400 text-xs ml-1">✓✓</span>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
                <div ref={scrollEnd}></div>
            </div>

            //centerlised message reaction
            {menuMsgId && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setMenuMsgId(null)}
                >
                    <div
                        className="bg-gray-900 text-white rounded-xl shadow-xl p-4 w-64"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between text-2xl mb-3">
                            {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                                <span
                                    key={emoji}
                                    className="cursor-pointer hover:scale-125 transition"
                                    onClick={() => handleSendReaction(menuMsgId, emoji)}
                                >
                                    {emoji}
                                </span>
                            ))}
                        </div>
                        <hr className="border-gray-700 my-2" />
                        <p className="cursor-pointer hover:text-violet-400 py-1">Copy</p>
                        <p
                            className="cursor-pointer hover:text-violet-400 py-1"
                            onClick={() => {
                                const msg = messages.find(m => m._id === menuMsgId)
                                setEditingMsgId(menuMsgId)
                                setEditText(msg.text)
                                setMenuMsgId(null)
                            }}>Edit</p>
                        <p className="cursor-pointer hover:text-red-400 py-1"
                            onClick={async () => {
                                await axios.delete(`/api/messages/delete/${menuMsgId}`)
                                setMenuMsgId(null)
                            }}> Delete</p>

                    </div>
                </div>
            )}

            {/* Footer */}
            <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
                <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full overflow-visible'>

                    {isTyping && (
                        <div className="flex gap-1 items-center px-4 py-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            <p className="text-xs text-gray-400 ml-2">Typing...</p>
                        </div>
                    )}

                    <input
                        onChange={(e) => {
                            setInput(e.target.value)
                            if (!typing) {
                                setTyping(true)
                                socket.emit("typing", selectedUser._id)
                                setTimeout(() => {
                                    socket.emit("stop typing", selectedUser._id)
                                    setTyping(false)
                                }, 3000)
                            }
                        }}
                        value={input}
                        onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null}
                        type="text"
                        placeholder="Send a message"
                        className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'
                    />

                    {aiLoading && (
                        <span className="text-xs text-gray-400 ml-2 animate-pulse">
                            AI generating...
                        </span>
                    )}

                    <div className='relatrelative group'>
                        <img src={assets.Voice_recoder} className='w-5 mr-2 cursor-pointer' />
                    </div>

                    <div className='relatrelative group'>
                        <img src={assets.AI_logo} onClick={() => setShowMenu(!showMenu)} className='w-5 mr-2 cursor-pointer' />
                    </div>

                    {showDecline && (
                        <button
                            onClick={() => {
                                setInput(oldInput)
                                setShowDecline(false)
                            }}
                            className="absolute bottom-16 right-20 text-xs bg-red-500 px-2 py-1 rounded"
                        >
                            Decline
                        </button>
                    )}

                    {showMenu && (
                        <div className="absolute bottom-14 right-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg text-sm text-white p-3 w-40 z-50">
                            <p onClick={handleAiRephrase} className="cursor-pointer hover:text-violet-400">
                                ✨ Rephrasing
                            </p>
                            <p className="cursor-pointer hover:text-violet-400 mt-2" onClick={summarizingHandler}>
                                🪄 summarizes
                            </p>
                        </div>
                    )}

                    <label htmlFor="image" className='p-2 relative group'>
                        <input onChange={handleSendImage} type="file" id="image" accept="image/png, image/jpeg" hidden />
                        <img src={assets.gallery_icon} alt="" className="w-4.5 mr-2 cursor-pointer" />
                    </label>
                </div>

                <img onClick={handleSendMessage} src={assets.send_button} alt="" className="w-7 cursor-pointer" />
            </div>
        </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
            <img src={assets.logo_icon} alt="" className='max-w-16' />
            <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
        </div>
    )
}

export default Chatcontainer
