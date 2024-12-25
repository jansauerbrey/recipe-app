import crypto from 'node:crypto';

const TOKEN_LENGTH = 32;

/*
 * Create a 32 bytes token - ASYNC
 * callback(err, token)
 */
export const createToken = (callback) => {
  crypto.randomBytes(TOKEN_LENGTH, (ex, token) => {
    if (ex) callback(ex);

    if (token) callback(null, token.toString('hex'));
    else callback(new Error('Problem when generating token'));
  });
};

/*
 * Extract the token from the header Authorization.
 * Authorization: TOKEN-MECHANISM Token
 * Returns the token
 */
export const extractTokenFromHeader = (headers) => {
  if (headers == null) throw new Error('Header is null');
  if (headers.authorization == null) throw new Error('Authorization header is null');

  const authorization = headers.authorization;
  const authArr = authorization.split(' ');
  if (authArr.length != 2) throw new Error('Authorization header value is not of length 2');

  // retrieve token
  const token = authArr[1];
  if (token.length != TOKEN_LENGTH * 2) throw new Error('Token length is not the expected one');

  return token;
};

export default {
  createToken,
  extractTokenFromHeader,
};
