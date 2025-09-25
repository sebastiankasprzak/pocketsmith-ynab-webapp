#!/usr/bin/env node

const https = require('https');

const API_BASE = 'https://aqyuit04jc.execute-api.ap-southeast-2.amazonaws.com/staging';

const endpoints = [
  '/health',
  '/accounts/pocketsmith',
  '/accounts/ynab',
  '/mappings',
  '/credentials',
  '/credentials/validate',
  '/balances/compare',
  '/test-connectivity' // This should 404
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'aqyuit04jc.execute-api.ap-southeast-2.amazonaws.com',
      port: 443,
      path: `/staging${path}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        path,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      resolve({
        path,
        status: 'ERROR',
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path,
        status: 'TIMEOUT',
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('Testing API endpoints...\n');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint.padEnd(25)} -> ${result.status} ${result.statusText || result.error || ''}`);
  }
}

testAllEndpoints().catch(console.error);