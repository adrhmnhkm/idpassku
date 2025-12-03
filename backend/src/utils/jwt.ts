import jwt from 'jsonwebtoken';

const accessSecret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export function signAccessToken(userId: string, email: string) {
  return jwt.sign({ sub: userId, email, type: 'access' }, accessSecret, {
    expiresIn: '15m',
  });
}

export function signRefreshToken(userId: string, email: string) {
  return jwt.sign({ sub: userId, email, type: 'refresh' }, refreshSecret, {
    expiresIn: '7d',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, refreshSecret) as JwtPayload;
}
