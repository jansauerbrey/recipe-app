import dotenv from 'dotenv';
import redis from 'redis';
import * as auth from './auth.js';

dotenv.config();

const redisClient = redis.createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Connect to Redis
(async () => {
  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });

  redisClient.on('reconnecting', () => {
    console.log('Redis client reconnecting');
  });

  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Redis connection error:', err);
    process.exit(1);
  }
})();

/*
 * Stores a token with user data for a ttl period of time
 * token: String - Token used as the key in redis
 * data: Object - value stored with the token
 * ttl: Number - Time to Live in seconds (default: 24Hours)
 * callback: Function
 */
export const setTokenWithData = async (token, data, ttl, callback) => {
  if (token == null) throw new Error('Token is null');
  if (data != null && typeof data !== 'object') throw new Error('data is not an Object');

  const userData = data || {};
  userData._ts = new Date();

  const timeToLive = ttl || auth.TIME_TO_LIVE;
  if (timeToLive != null && typeof timeToLive !== 'number') {
    throw new Error('TimeToLive is not a Number');
  }

  try {
    await redisClient.setEx(token, timeToLive, JSON.stringify(userData));
    callback(null, true);
  } catch (err) {
    callback(err);
  }
};

/*
 * Gets the associated data of the token.
 * token: String - token used as the key in redis
 * callback: Function - returns data
 */
export const getDataByToken = async (token, callback) => {
  if (token == null) callback(new Error('Token is null'));

  try {
    const userData = await redisClient.get(token);
    if (userData != null) callback(null, JSON.parse(userData));
    else callback(new Error('Token Not Found'));
  } catch (err) {
    callback(err);
  }
};

/*
 * Renew a token by updating the entry in redis
 * callback(null, true) if successfully updated
 */
export const renewToken = async (token, ttl, callback) => {
  if (token == null) callback(new Error('Token is null'));

  try {
    const reply = await redisClient.expire(token, ttl);
    if (reply) callback(null, true);
    else callback(new Error('Token not found'));
  } catch (err) {
    callback(err);
  }
};

/*
 * Expires a token by deleting the entry in redis
 * callback(null, true) if successfully deleted
 */
export const expireToken = async (token, callback) => {
  if (token == null) callback(new Error('Token is null'));

  try {
    const reply = await redisClient.del(token);
    if (reply) callback(null, true);
    else callback(new Error('Token not found'));
  } catch (err) {
    callback(err);
  }
};

export default {
  setTokenWithData,
  getDataByToken,
  renewToken,
  expireToken,
};
