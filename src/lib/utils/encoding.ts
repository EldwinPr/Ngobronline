export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert any Uint8Array or ArrayBuffer to hex string
export function bufferToHex(buffer: Uint8Array | ArrayBuffer): string {
  const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(view)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  // Handle edge cases
  if (!hex || hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert hex string to Base64URL string for JWK format
export function hexToBase64Url(hexString: string): string {
  // Validate input
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(hexString)) {
    throw new Error('Invalid hex string');
  }
  
  // Convert hex to binary string
  let binary = '';
  for (let i = 0; i < hexString.length; i += 2) {
    const hex = hexString.substring(i, i + 2);
    const decimal = parseInt(hex, 16);
    binary += String.fromCharCode(decimal);
  }
  
  // Convert binary string to base64
  const base64 = btoa(binary);
  
  // Convert base64 to base64url
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Convert Base64URL to hex string
export function base64UrlToHex(base64url: string): string {
  if (!base64url) {
    throw new Error('Invalid base64url string');
  }
  
  // Restore padding
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  
  try {
    // Decode base64 to binary
    const binary = atob(base64);
    
    // Convert binary to hex
    let hex = '';
    for (let i = 0; i < binary.length; i++) {
      const byte = binary.charCodeAt(i).toString(16).padStart(2, '0');
      hex += byte;
    }
    
    return hex;
  } catch (error) {
    throw new Error('Failed to convert base64url to hex: ' + error);
  }
}

// Convert object to canonical JSON string (consistent ordering)
export function canonicalizeJson(obj: any): string {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  
  // For arrays, canonicalize each element
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  
  // For objects, sort keys and canonicalize each value
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(key => 
    `"${key}":${canonicalizeJson(obj[key])}`
  );
  
  return '{' + parts.join(',') + '}';
}