import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const userId = localStorage.getItem("userId");

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/chat"
          element={userId ? <Chat /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={<Navigate to={userId ? "/chat" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
