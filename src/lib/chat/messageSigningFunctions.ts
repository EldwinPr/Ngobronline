import { secp256k1 } from '../crypto/secp256k1-setup';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { 
  stringToBytes, 
  bufferToHex, 
  hexToBytes,
  base64UrlToHex
} from '../utils/encoding';

/**
 * Retrieves the private key from local storage and converts it to a format usable for signing
 */
export function getPrivateKeyFromStorage(): Uint8Array {
  // Get the JWK private key from local storage
  const privateKeyJwk = JSON.parse(localStorage.getItem('ecdsa_private_key') || '{}');
  
  // Check if the key exists and has the necessary components
  if (!privateKeyJwk || !privateKeyJwk.d || privateKeyJwk.kty !== 'EC' || privateKeyJwk.crv !== 'secp256k1') {
    throw new Error('Valid ECDSA private key not found in local storage');
  }
  
  // Convert the base64url encoded 'd' parameter to hex
  const privateKeyHex = base64UrlToHex(privateKeyJwk.d);
  
  // Convert hex to bytes
  return hexToBytes(privateKeyHex);
}

/**
 * Creates a hash of the message data
 */
export async function createMessageHash(message: {
  sender_username: string;
  receiver_username: string;
  plaintext_message: string;
  timestamp: string;
}): Promise<string> {
  // Create a string representation of the message data
  const messageString = JSON.stringify({
    sender_username: message.sender_username,
    receiver_username: message.receiver_username,
    plaintext_message: message.plaintext_message,
    timestamp: message.timestamp
  });
  
  // Convert to bytes
  const messageBytes = stringToBytes(messageString);
  
  // Hash the message using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', messageBytes);
  
  // Convert to hex string
  return bufferToHex(hashBuffer);
}

/**
 * Signs a message hash with the provided private key
 */
export async function signMessageHash(messageHash: string, privateKey: Uint8Array): Promise<{ r: string, s: string }> {
  try {
    // Verify HMAC function is set before signing
    if (!(secp256k1.utils as any).hmacSha256Sync) {
      // Try to set it again if missing
      (secp256k1.utils as any).hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => {
        const h = hmac.create(sha256, key);
        messages.forEach(msg => h.update(msg));
        return h.digest();
      };
    }
    
    // Convert message hash from hex to bytes
    const messageHashBytes = hexToBytes(messageHash);
    
    // Sign the message hash
    const signature = await secp256k1.sign(messageHashBytes, privateKey);

    // Get the compact signature bytes (64 bytes: r[0..31], s[32..63])
    const compactSig = signature.toCompactRawBytes();

    // Get r and s values from signature
    const r = compactSig.slice(0, 32);
    const s = compactSig.slice(32, 64);
    
    // Convert to hex strings
    return {
      r: bufferToHex(r),
      s: bufferToHex(s)
    };
  } catch (error) {
    console.error('Error in signMessageHash:', error);
    throw error;
  }
}

/**
 * Creates a complete signed message object
 */
export async function createSignedMessage(
  senderUsername: string,
  receiverUsername: string,
  plaintextMessage: string
): Promise<{
  sender_username: string;
  receiver_username: string;
  plaintext_message: string;
  message_hash: string;
  signature: {
    r: string;
    s: string;
  };
  timestamp: string;
}> {
  // Get private key from local storage
  const privateKey = getPrivateKeyFromStorage();
  
  // Create timestamp
  const timestamp = new Date().toISOString();
  
  // Create message object
  const messageData = {
    sender_username: senderUsername,
    receiver_username: receiverUsername,
    plaintext_message: plaintextMessage,
    timestamp
  };
  
  // Create message hash
  const messageHash = await createMessageHash(messageData);
  
  // Sign message
  const signature = await signMessageHash(messageHash, privateKey);
  
  // Return complete signed message
  return {
    ...messageData,
    message_hash: messageHash,
    signature
  };
}
