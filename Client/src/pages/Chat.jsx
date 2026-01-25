import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUserIdFromToken } from "../../../server/src/utils/auth";
import "./Chat.css";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const socketRef = useRef();
  const scrollRef = useRef();
  const navigate = useNavigate();
  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    socketRef.current = io("http://localhost:5000", {
      auth: { userId: currentUserId },
    });

    const fetchUsers = async () => {
      const res = await API.get("/users");
      setAllUsers(res.data);
    };
    fetchUsers();

    socketRef.current.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socketRef.current.on("online-users", (users) => setOnlineUsers(users));

    return () => socketRef.current.disconnect();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message || !selectedUserId) return ;

    const msgData = { toUserId: selectedUserId, message, from: currentUserId };
    socketRef.current.emit("send-message", msgData);

    setMessages((prev) => [...prev, msgData]);
    setMessage("");
  };

  const selectedUser = allUsers.find((u) => u._id === selectedUserId);

  return (
    <div className="chat-layout">

      {/* Sidebar */}
      <div className="sidebar">

       <div className="ai-network-bg">
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
    <span></span>
  <span></span>
  <span></span>
  <span></span>

</div>

        <div className="sidebar-header">Messages</div>

        {allUsers.map((u) => (
          <div
            key={u._id}
            className={`user-item ${selectedUserId === u._id ? "active" : ""}`}
            onClick={() => setSelectedUserId(u._id)}
          >
            <div className="avatar">{u.name[0]}</div>
            <div className="user-info">
              <span>{u.name}</span>
              {onlineUsers.includes(u._id) && <small>online</small>}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="chat-area">

        {!selectedUser ? (
          <div className="empty-chat">
            Select a friend to start chatting 💬
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="avatar">{selectedUser.name[0]}</div>
                <div className="chat-user-info">
                  <h4>{selectedUser.name}</h4>
                  <span
                    className={`status ${
                      onlineUsers.includes(selectedUser._id)
                        ? "online"
                        : "offline"
                    }`}
                  >
                    {onlineUsers.includes(selectedUser._id)
                      ? "online"
                      : "offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages">

              {/* Chat background icons */}
              <div className="chat-bg-icons">
                <span>💬</span>
                <span>📞</span>
                <span>🎥</span>
                <span>😊</span>
                <span>🤖</span>
                <span>❤️</span>
              </div>

              {messages
                .filter(
                  (m) =>
                    (m.from === currentUserId &&
                      m.toUserId === selectedUserId) ||
                    (m.from === selectedUserId &&
                      m.toUserId === currentUserId)
                )
                .map((msg, i) => (
                  <div
                    key={i}
                    className={`msg ${
                      msg.from === currentUserId ? "sent" : "received"
                    }`}
                  >
                    {msg.message}
                  </div>
                ))}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="chat-input">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
