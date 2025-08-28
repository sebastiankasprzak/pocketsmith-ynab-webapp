#!/usr/bin/env node

const token = process.argv[2];

if (!token) {
  console.log('Usage: node decode-jwt.js <jwt-token>');
  process.exit(1);
}

try {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

  console.log('JWT Header:');
  console.log(JSON.stringify(header, null, 2));
  console.log('\nJWT Payload:');
  console.log(JSON.stringify(payload, null, 2));

  // Check token expiration
  const now = Math.floor(Date.now() / 1000);
  const exp = payload.exp;
  const timeUntilExpiry = exp - now;

  console.log('\nToken Status:');
  console.log(`Current time: ${now} (${new Date(now * 1000).toISOString()})`);
  console.log(`Expires at: ${exp} (${new Date(exp * 1000).toISOString()})`);
  console.log(`Time until expiry: ${timeUntilExpiry} seconds (${Math.floor(timeUntilExpiry / 60)} minutes)`);
  console.log(`Token is ${timeUntilExpiry > 0 ? 'VALID' : 'EXPIRED'}`);

} catch (error) {
  console.error('Error decoding JWT:', error.message);
  process.exit(1);
}