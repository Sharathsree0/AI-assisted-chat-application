import axios from "axios";
import { useEffect, useState, createContext } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import assets from "../assets/assets";

const backenUrl = import.meta.env.VITE_BACKEND_URL;

axios.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        console.log("TOKEN SENT:", token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
//  set baseURL
axios.defaults.baseURL = backenUrl;
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);
    const [socket, setSocket] = useState(null);
    const [globalIncomingCall, setGlobalIncomingCall] = useState(null);
    const [loading, setLoading]= useState(true)
    

    // check auth
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
                return true;
            }
        } catch (error) {
            console.log(error, "Auth check failed");
        } finally{
            setLoading(false)
        }
    };

    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);

            console.log("BACKEND RESPONSE:", data);
            if (data.success) {
                localStorage.setItem("token", data.token);
                console.log("Stored:", localStorage.getItem("token"));
                setAuthUser(data.userData);
                connectSocket(data.userData);
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
            toast.error(errorMessage);
            return false;        }
    };

    const logout = async () => {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("selectedUserId")
            setAuthUser(null);
            setOnlineUser([]);
            socket?.disconnect();
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error("Failed in logout");
        }
    };

    // profile update
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
                return true;
            }
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    // SOCKET CONNECTION
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;

        const newSocket = io(backenUrl, {
            query: {
                userId: userData._id,
                fullName: userData.fullName,
                profilePic: userData.profilePic
            }
        });

        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUser(userIds);
        });

        newSocket.on("incomingCall", (data) => {
            setGlobalIncomingCall(data);
            const audio = new Audio(assets.ringtone);
            audio.loop = true;
            audio.play();
            window.__ringtone = audio;
        });

        newSocket.on("callAnswered", () => {
            if (window.__ringtone) {
                window.__ringtone.pause();
                window.__ringtone.currentTime = 0;
                window.__ringtone = null;
            }
        });

        newSocket.on("callEnded", () => {
            if (window.__ringtone) {
                window.__ringtone.pause();
                window.__ringtone.currentTime = 0;
                window.__ringtone = null;
            }
        });
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const value = {
        axios, authUser,loading, onlineUser, socket, login, logout, updateProfile, globalIncomingCall, setGlobalIncomingCall
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};