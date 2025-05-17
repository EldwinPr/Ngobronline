import type { SignedMessage } from './types';
import { 
  base64UrlToHex, 
  hexToBytes, 
  stringToBytes, 
  bufferToHex 
} from '$lib/utils/encoding';

// Create a hash of the message data (should match the signing logic)
async function createMessageHash(message: {
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
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Cache of public keys
interface PublicKeyCache {
  [username: string]: {
    key: any;
    expires: number;
  };
}

// Cache public keys to avoid unnecessary requests
const publicKeyCache: PublicKeyCache = {};
const CACHE_EXPIRY = 30 * 1000; // 30 seconds in milliseconds - reduced from 5 minutes

// Get a user's public key
async function getPublicKey(username: string, forceRefresh = false): Promise<any> {
  // Check cache first - bypass if forceRefresh is true
  const cachedKey = publicKeyCache[username];
  const now = Date.now();
  
  if (!forceRefresh && cachedKey && cachedKey.expires > now) {
    console.log(`Using cached public key for ${username}`);
    return cachedKey.key;
  }
  
  // Fetch from server if not in cache, expired, or force refresh requested
  try {
    console.log(`Fetching fresh public key for ${username} from server`);
    const response = await fetch(`/api/users/${username}/publickey`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch public key: ${response.status}`);
    }
    
    const data = await response.json();
    const publicKey = JSON.parse(data.publicKey); // Parse the JSON string to object
    
    console.log(`Retrieved public key for ${username}:`, {
      x: publicKey.x.substring(0, 10) + '...',
      y: publicKey.y.substring(0, 10) + '...'
    });
    
    // Cache the key
    publicKeyCache[username] = {
      key: publicKey,
      expires: now + CACHE_EXPIRY
    };
    
    return publicKey;
  } catch (error) {
    console.error('Error fetching public key:', error);
    throw error;
  }
}

// Clear public key cache for a specific user or all users
export function clearPublicKeyCache(username?: string): void {
  if (username) {
    delete publicKeyCache[username];
    console.log(`Cleared public key cache for ${username}`);
  } else {
    for (const key in publicKeyCache) {
      delete publicKeyCache[key];
    }
    console.log('Cleared entire public key cache');
  }
}

// Import secp256k1 module
import { secp256k1 } from '$lib/crypto/secp256k1-setup';

// Verify a signed message
export async function verifySignedMessage(signedMessage: SignedMessage, forceRefresh = false): Promise<boolean> {
  try {
    console.log(`Verifying message from ${signedMessage.sender_username} to ${signedMessage.receiver_username}`);
    
    // Step 1: Get sender's public key - with option to force refresh
    const publicKeyJwk = await getPublicKey(signedMessage.sender_username, forceRefresh);
    
    // Step 2: Recreate the message hash (same as during signing)
    const messageHash = await createMessageHash({
      sender_username: signedMessage.sender_username,
      receiver_username: signedMessage.receiver_username,
      plaintext_message: signedMessage.plaintext_message,
      timestamp: signedMessage.timestamp
    });
    
    // Log message hash comparison for debugging
    console.log('Message hash check:');
    console.log('Original:', signedMessage.message_hash.substring(0, 16) + '...');
    console.log('Recreated:', messageHash.substring(0, 16) + '...');
    console.log('Match?', signedMessage.message_hash === messageHash);
    
    // Step 3: Convert the hash to bytes
    const messageHashBytes = hexToBytes(messageHash);
    
    // Step 4: Convert signature components from hex to bytes
    const sigR = hexToBytes(signedMessage.signature.r);
    const sigS = hexToBytes(signedMessage.signature.s);
    
    // Step 5: Combine signature components (r and s) into single signature
    const signature = new Uint8Array(64); // 32 bytes for r, 32 bytes for s
    signature.set(sigR.slice(0, 32), 0);
    signature.set(sigS.slice(0, 32), 32);
    
    // Log signature details
    console.log('Signature info:');
    console.log('R:', signedMessage.signature.r.substring(0, 16) + '...');
    console.log('S:', signedMessage.signature.s.substring(0, 16) + '...');
    
    // Step 6: Extract public key x and y coordinates from JWK
    const publicKeyX = base64UrlToHex(publicKeyJwk.x);
    const publicKeyY = base64UrlToHex(publicKeyJwk.y);
    
    // Step 7: Combine x and y to form uncompressed public key (prefixed with 0x04)
    const publicKeyHex = '04' + publicKeyX + publicKeyY;
    const publicKeyBytes = hexToBytes(publicKeyHex);
    
    console.log('Public key info:');
    console.log('X:', publicKeyX.substring(0, 16) + '...');
    console.log('Y:', publicKeyY.substring(0, 16) + '...');
    
    // Step 8: Verify the signature using secp256k1.verify
    console.log('Calling secp256k1.verify with:');
    console.log('- Signature length:', signature.length);
    console.log('- Message hash length:', messageHashBytes.length);
    console.log('- Public key length:', publicKeyBytes.length);
    
    // Perform actual verification
    const isValid = secp256k1.verify(signature, messageHashBytes, publicKeyBytes);
    console.log('✅ Verification result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

// Verify message with status tracking and optional force refresh
export async function verifyMessageWithStatus(
  signedMessage: SignedMessage,
  onStatusChange: (status: 'verifying' | 'verified' | 'failed', isValid?: boolean) => void,
  forceRefresh = false
): Promise<boolean> {
  try {
    // Update status to verifying
    onStatusChange('verifying');
    
    // Verify the message - pass the forceRefresh flag
    const isValid = await verifySignedMessage(signedMessage, forceRefresh);
    
    // Update status based on result
    onStatusChange(isValid ? 'verified' : 'failed', isValid);
    
    return isValid;
  } catch (error) {
    // Handle errors
    console.error('Verification process error:', error);
    onStatusChange('failed', false);
    return false;
  }
}