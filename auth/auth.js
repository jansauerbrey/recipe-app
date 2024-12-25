import redisHelper from './redisHelper.js';
import tokenHelper from './tokenHelper.js';
import User from '../models/User.js';

const DEFAULT_TIME_TO_LIVE = 300; // 5 minutes
let TIME_TO_LIVE = DEFAULT_TIME_TO_LIVE;

/*
 * Middleware to verify the token and store the user data in req._user
 */
export const loadUser = (req, res, next) => {
  const headers = req.headers;
  let token;

  if (headers != null) {
    // Get token
    try {
      token = tokenHelper.extractTokenFromHeader(headers);
    } catch (err) {
      console.log(err);
    }
  }

  // Verify it in redis set data in req._user
  if (token) {
    redisHelper.getDataByToken(token, (err, data) => {
      if (!err) {
        if (data.autologin === true) {
          TIME_TO_LIVE = 60 * 60 * 24 * 30;
        }

        try {
          redisHelper.renewToken(token, TIME_TO_LIVE, (err, success) => {
            return (err, success);
          });
        } catch (err) {
          console.log(err);
          next();
        }

        console.log(data);
        User.findOne({ username: data.username }, (err, user) => {
          req._user = user;
        });
      }
    });
  }
  next();
};

export const verify = (req, res, next) => {
  const headers = req.headers;
  if (headers == null) return res.sendStatus(401);

  // Get token
  try {
    const token = tokenHelper.extractTokenFromHeader(headers);

    // Verify it in redis set data in req._user
    redisHelper.getDataByToken(token, (err, data) => {
      if (err) return res.sendStatus(401);

      if (data.autologin === true) {
        TIME_TO_LIVE = 60 * 60 * 24 * 30;
      }

      try {
        redisHelper.renewToken(token, TIME_TO_LIVE, (err, success) => {
          return (err, success);
        });
      } catch (err) {
        console.log(err);
        return res.sendStatus(401);
      }

      User.findOne({ username: data.username }, (err, user) => {
        req._user = user;
        next();
      });
    });
  } catch (err) {
    console.log(err);
    return res.sendStatus(401);
  }
};

/*
 * Middleware to verify the token and admin level and store the user data in req._user
 */
export const verifyAdmin = (req, res, next) => {
  const headers = req.headers;
  if (headers == null) return res.sendStatus(401);

  // Get token
  try {
    const token = tokenHelper.extractTokenFromHeader(headers);

    // Verify it in redis set data in req._user
    redisHelper.getDataByToken(token, (err, data) => {
      if (err) return res.sendStatus(401);

      if (data.is_admin) {
        if (data.autologin === true) {
          TIME_TO_LIVE = 60 * 60 * 24 * 30;
        }

        try {
          redisHelper.renewToken(token, TIME_TO_LIVE, (err, success) => {
            return (err, success);
          });
        } catch (err) {
          console.log(err);
          return res.sendStatus(401);
        }

        User.findOne({ username: data.username }, (err, user) => {
          req._user = user;
          next();
        });
      } else {
        return res.sendStatus(401);
      }
    });
  } catch (err) {
    console.log(err);
    return res.sendStatus(401);
  }
};

/*
 * Create a new token stores it in redis with data during ttl time in seconds
 * callback(err, token);
 */
export const createAndStoreToken = (data, ttl, callback) => {
  data = data || {};
  ttl = ttl || TIME_TO_LIVE;

  if (data != null && typeof data !== 'object') callback(new Error('data is not an Object'));
  if (ttl != null && typeof ttl !== 'number') callback(new Error('ttl is not a valid Number'));

  tokenHelper.createToken((err, token) => {
    if (err) callback(err);

    redisHelper.setTokenWithData(token, data, ttl, (err, success) => {
      if (err) callback(err);

      if (success) {
        callback(null, token);
      } else {
        callback(new Error('Error when saving token'));
      }
    });
  });
};

/*
 * Expires the token (remove from redis)
 */
export const expireToken = (headers, callback) => {
  if (headers == null) callback(new Error('Headers are null'));

  // Get token
  try {
    const token = tokenHelper.extractTokenFromHeader(headers);
    if (token == null) callback(new Error('Token is null'));
    redisHelper.expireToken(token, callback);
  } catch (err) {
    console.log(err);
    return callback(err);
  }
};
