import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/chat");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed ❌");
    }
  };

  return (
    <div className="login-page">
      
      {/* Floating Chat Icons */}
      <div className="floating-icons">
        <span>💬</span>
        <span>😁</span>
        <span>📞</span>
        <span>😍</span>
        <span>🎥</span>
        <span>😊</span>
        <span>🤖</span>
        <span>❤️</span>
        <span>👍</span>
        <span>😝</span>
        <span>📩</span>
      </div>

      {/* Login Box */}
      <div className="login-box">
        <h2>Welcome Back 👋</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>

        <p onClick={() => navigate("/register")}>
          Don’t have an account? <span>Register</span>
        </p>
      </div>
    </div>
  );
}

export default Login;
