import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000", {
  auth: { userId: localStorage.getItem("userId") }
});

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [toUserId, setToUserId] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("typing-start", (userId) => {
      setTypingUser(userId);
    });

    socket.on("typing-stop", () => {
      setTypingUser(null);
    });

    socket.on("user-online", (id) => {
      setOnlineUsers((prev) => [...new Set([...prev, id])]);
    });

    socket.on("user-offline", (id) => {
      setOnlineUsers((prev) => prev.filter((u) => u !== id));
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receive-message");
      socket.off("typing-start");
      socket.off("typing-stop");
      socket.off("user-online");
      socket.off("user-offline");
      socket.off("online-users");
    };
  }, []);

  const sendMessage = () => {
    if (!message || !toUserId) return;

    socket.emit("send-message", {
      toUserId,
      message
    });

    setMessages((prev) => [...prev, { content: message, self: true }]);
    setMessage("");
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    socket.emit("typing-start", { toUserId });

    setTimeout(() => {
      socket.emit("typing-stop", { toUserId });
    }, 1000);
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div>
      <h2>Chat 💬</h2>
      <button onClick={handleLogout} style={{ float: "right" }}>Logout</button>

      {typingUser && <p style={{ color: "gray" }}>{typingUser} is typing...</p>}

      <input
        type="text"
        placeholder="Receiver User ID"
        value={toUserId}
        onChange={(e) => setToUserId(e.target.value)}
      />
      <br />

      <div
        style={{
          border: "1px solid gray",
          height: "200px",
          overflowY: "auto",
          padding: "10px"
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{ textAlign: msg.self ? "right" : "left" }}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Type message..."
        value={message}
        onChange={handleTyping}
      />
      <button onClick={sendMessage}>Send</button>

      <h3>🟢 Online Users</h3>
      <ul>
        {onlineUsers
          .filter((u) => u !== localStorage.getItem("userId")) // ✅ exclude self
          .map((u) => (
            <li key={u}>{u}</li>
          ))}
      </ul>
    </div>
  );
}

export default Chat;
