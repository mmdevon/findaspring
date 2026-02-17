import crypto from 'node:crypto';

const b64url = (input) => Buffer.from(input).toString('base64url');

const signPayload = (payload, secret) => {
  const content = b64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(content)
    .digest('base64url');
  return `${content}.${signature}`;
};

const verifyToken = (token, secret) => {
  const [content, signature] = token.split('.');
  if (!content || !signature) return null;

  const expected = crypto.createHmac('sha256', secret).update(content).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  const parsed = JSON.parse(Buffer.from(content, 'base64url').toString('utf8'));
  if (!parsed?.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
};

export const issueTokenPair = ({ userId, secret, accessTtlSec, refreshTtlSec }) => {
  const now = Math.floor(Date.now() / 1000);

  const accessPayload = {
    sub: userId,
    typ: 'access',
    iat: now,
    exp: now + accessTtlSec
  };

  const refreshId = crypto.randomUUID();
  const refreshPayload = {
    sub: userId,
    typ: 'refresh',
    jti: refreshId,
    iat: now,
    exp: now + refreshTtlSec
  };

  return {
    accessToken: signPayload(accessPayload, secret),
    refreshToken: signPayload(refreshPayload, secret),
    refreshId,
    refreshExpUnix: refreshPayload.exp
  };
};

export const verifyAccessToken = (token, secret) => {
  const parsed = verifyToken(token, secret);
  if (!parsed || parsed.typ !== 'access') return null;
  return parsed;
};

export const verifyRefreshToken = (token, secret) => {
  const parsed = verifyToken(token, secret);
  if (!parsed || parsed.typ !== 'refresh' || !parsed.jti) return null;
  return parsed;
};
