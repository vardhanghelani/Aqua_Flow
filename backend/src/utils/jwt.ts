import jwt from 'jsonwebtoken';
import { AuthUser } from '../types';
import { getJwtSecret, getJwtExpiresIn } from '../config/env';

export function signToken(user: AuthUser): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: getJwtExpiresIn() } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, getJwtSecret()) as AuthUser;
}
