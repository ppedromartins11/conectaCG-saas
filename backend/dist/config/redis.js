"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
});
exports.redis.on("error", (err) => {
    if (env_1.env.NODE_ENV !== "test")
        console.error("[Redis]:", err.message);
});
//# sourceMappingURL=redis.js.map