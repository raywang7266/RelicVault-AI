import mongoose from "mongoose";

/**
 * Mongoose 单例连接池。
 *
 * 关键：把连接 Promise 挂到 `globalThis`，避免 Next.js 开发模式热重载（HMR）
 * 每次模块重载都重建连接（否则会快速耗尽 Mongo 的连接配额并报
 * "Too many connections"）。生产构建每个进程也只会建一次。
 */

type MongooseCache = {
  conn?: Promise<typeof mongoose>;
};

const globalForMongo = globalThis as unknown as {
  _mongoConn?: Promise<typeof mongoose>;
};

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("请在 .env.local 配置 MONGODB_URI（本地 MongoDB 连接串）");
  }

  if (!globalForMongo._mongoConn) {
    globalForMongo._mongoConn = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      bufferCommands: true,
    });
  }

  try {
    await globalForMongo._mongoConn;
  } catch (err) {
    // 连接失败时清空缓存，下次请求可重试（而不是永久卡死在 reject 状态）
    globalForMongo._mongoConn = undefined;
    throw err;
  }

  return mongoose;
}

export default connectDB;
