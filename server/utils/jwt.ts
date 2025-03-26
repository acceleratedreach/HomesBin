import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'homesbinsecret';
const JWT_EXPIRES_IN = '24h';

export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
}

/**
 * Generate a JWT token for authentication
 * @param payload User data to include in the token
 * @returns The signed JWT token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 * @param token The JWT token to verify
 * @returns The decoded payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}