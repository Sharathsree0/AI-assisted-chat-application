import Redis from "ioredis";
import "dotenv/config";

export const redis = new Redis(process.env.REDIS_URI, {
    maxRetriesPerRequest: null, 
    tls: {
    rejectUnauthorized: false 
}
});
redis.on("connect", () => {
    console.log(" Redis Connected Successfully!");
});

redis.on("error", (err) => {
    console.log("Redis Connection Error:", err);
});