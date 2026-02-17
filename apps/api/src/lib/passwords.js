import crypto from 'node:crypto';

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION
  });
  return `scrypt$${salt}$${derived.toString('hex')}`;
};

export const verifyPassword = (password, hashedPassword) => {
  const [algo, salt, hashHex] = (hashedPassword || '').split('$');
  if (algo !== 'scrypt' || !salt || !hashHex) return false;

  const derived = crypto.scryptSync(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION
  });

  return crypto.timingSafeEqual(Buffer.from(hashHex, 'hex'), derived);
};
