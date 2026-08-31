import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

export const signToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>, options?: SignOptions): string => {
  const signOptions: SignOptions = {
    expiresIn: (env.JWT_EXPIRES_IN || '7d') as any,
    ...options,
  };
  return jwt.sign(payload, env.JWT_SECRET, signOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
