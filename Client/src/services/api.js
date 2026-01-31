import axios from 'axios'

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export const fetchUsers = () => API.get("/user/all");
export const fetchMessages = (recipientId) => API.get(`/message/${recipientId}`);
export const markAsRead = (messageId) => API.put(`/message/read/${messageId}`);
export const editMessage = (messageId, content) => API.put(`/message/edit/${messageId}`, { content });
export const deleteMessage = (messageId) => API.delete(`/message/delete/${messageId}`);
export const reactToMessage = (messageId, emoji) => API.post(`/message/react/${messageId}`, { emoji });

export default API;