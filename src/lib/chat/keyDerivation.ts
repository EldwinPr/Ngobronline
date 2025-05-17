import { secp256k1 } from '../crypto/secp256k1-setup';

import { 
  stringToBytes, 
  bufferToHex, 
  hexToBase64Url 
} from '../utils/encoding';

// Generate a deterministic private key with enhanced complexity
async function generatePrivateKey(username: string, password: string): Promise<Uint8Array> {
  // Create initial data - always the same for same username/password
  const inputData = stringToBytes(`${username}:${password}`);
  const reversedData = stringToBytes(`${password}:${username}`);
  
  // Generate SHA-256 hash using Web Crypto API
  const sha256Buffer = await crypto.subtle.digest('SHA-256', inputData);
  const sha256Array = new Uint8Array(sha256Buffer);
  
  // Generate another hash with reversed input
  const sha256Buffer2 = await crypto.subtle.digest('SHA-256', reversedData);
  const sha256Array2 = new Uint8Array(sha256Buffer2);
  
  // Apply XOR operation between hashes
  const xorArray = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    xorArray[i] = sha256Array[i] ^ sha256Array2[i];
  }
  
  // Apply a non-linear transformation
  for (let i = 0; i < 32; i++) {
    // Non-linear operation: (x^2 + x + 41) mod 256
    const x = xorArray[i];
    xorArray[i] = ((x * x + x + 41) % 256);
    
    // Mix with previous bytes for avalanche effect
    if (i > 0) {
      xorArray[i] = (xorArray[i] + xorArray[i-1] * 7) % 256;
    }
  }
  
  // Final hash to ensure proper distribution
  const finalBuffer = await crypto.subtle.digest('SHA-256', xorArray);
  return new Uint8Array(finalBuffer);
}

// Generate ECDSA key pair from username and password in JWK format
export async function generateKeyPair(username: string, password: string) {
  // Generate deterministic private key
  const privateKeyArray = await generatePrivateKey(username, password);
  const privateKeyHex = bufferToHex(privateKeyArray);
  
  // Get the public key in uncompressed format (04 + x + y)
  const publicKeyUncompressed = secp256k1.getPublicKey(privateKeyHex, false);
  
  // Extract x and y coordinates from uncompressed public key
  // Format is: 04 + 32-byte x-coordinate + 32-byte y-coordinate
  const xCoordHex = bufferToHex(publicKeyUncompressed.slice(1, 33));
  const yCoordHex = bufferToHex(publicKeyUncompressed.slice(33, 65));
  
  // Create JWK format for the private key
  const privateKeyJWK = {
    kty: "EC",
    crv: "secp256k1",
    d: hexToBase64Url(privateKeyHex),
    x: hexToBase64Url(xCoordHex),
    y: hexToBase64Url(yCoordHex),
    ext: true
  };
  
  // Create JWK format for the public key
  const publicKeyJWK = {
    kty: "EC",
    crv: "secp256k1",
    x: hexToBase64Url(xCoordHex),
    y: hexToBase64Url(yCoordHex),
    ext: true
  };
  
  // Return the JWK format keys as the primary return values
  // to support destructuring { publicKey, privateKey }
  return {
    publicKey: publicKeyJWK,
    privateKey: privateKeyJWK,
    
    // Also include additional formats for convenience
    hex: {
      privateKey: privateKeyHex,
      publicKey: bufferToHex(secp256k1.getPublicKey(privateKeyHex, true)),
      publicKeyUncompressed: bufferToHex(publicKeyUncompressed)
    }
  };
}
