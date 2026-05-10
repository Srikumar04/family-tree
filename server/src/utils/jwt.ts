import jwt from 'jsonwebtoken';

const getSecret = (): string => process.env.JWT_SECRET ?? 'dev_secret_change_me';

export const signToken = (userId: number): string =>
  jwt.sign({ sub: userId }, getSecret(), { expiresIn: '7d' });

export const verifyToken = (token: string): { sub: number } => {
  const payload = jwt.verify(token, getSecret());
  if (typeof payload !== 'object' || payload === null || typeof payload.sub !== 'number') {
    throw new Error('Invalid token payload');
  }
  return { sub: payload.sub };
};
