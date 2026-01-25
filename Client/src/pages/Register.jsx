import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await API.post("/auth/register", { name, email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);

      alert("Registered successfully 🎉");
      navigate("/chat");
    } catch (err) {
      alert(err.response?.data?.message || "Register failed ❌");
    }
  };

  return (
    <div className="register-page">

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
        <span>😂</span>
        <span>📩</span>
      </div>

      {/* Register Box */}
      <div className="register-box">
        <h2>Create Account </h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

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

        <button onClick={handleRegister}>Register</button>

        <p onClick={() => navigate("/login")}>
          Already have an account? <span>Login</span>
        </p>
      </div>
    </div>
  );
}

export default Register;
