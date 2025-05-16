import * as secp256k1 from '@noble/secp256k1';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';

// Configure the secp256k1 library with HMAC SHA-256
secp256k1.etc.hmacSha256Sync = (key, ...messages) => {
  const h = hmac.create(sha256, key);
  messages.forEach(msg => h.update(msg));
  return h.digest();
};

export { secp256k1 };
