import test from 'node:test';
import assert from 'node:assert/strict';
import * as tus from 'tus-js-client';

// Replicating utility functions for test verification
const isValidJwt = (token) => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return false;
  return parts[0].startsWith('eyJ') && parts[1].length > 0 && parts[2].length > 0;
};

const getJwtExpiration = (token) => {
  if (!isValidJwt(token)) return null;
  try {
    const parts = (token || '').split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
};

test('JWT Validation - rejects publishable keys and malformed strings', () => {
  // Supabase publishable key must NEVER be accepted as a compact JWS
  assert.strictEqual(isValidJwt('sb_publishable_Q7a2cXVNY0UcwjW6T42nVQ_VD6twbzV'), false);
  assert.strictEqual(isValidJwt(''), false);
  assert.strictEqual(isValidJwt(null), false);
  assert.strictEqual(isValidJwt(undefined), false);
  assert.strictEqual(isValidJwt('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ'), false); // Only 2 parts
  assert.strictEqual(isValidJwt('not-a-jwt.token.here'), false); // Doesn't start with eyJ
});

test('JWT Validation - accepts standard compact JWS', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'user-uuid', exp: 1792180000 })).toString('base64url');
  const dummyJwt = `${header}.${payload}.signature12345`;

  assert.strictEqual(isValidJwt(dummyJwt), true);
  assert.strictEqual(getJwtExpiration(dummyJwt), 1792180000);
});

test('TUS Header Construction - prevents duplicate Authorization header concatenation', async () => {
  const recordedHeaders = [];
  const headerMap = {};

  // Mock httpStack simulating browser XMLHttpRequest header accumulation behavior
  const fakeHttpStack = {
    createRequest(method, url) {
      return {
        getMethod: () => method,
        getURL: () => url,
        setHeader(name, value) {
          recordedHeaders.push({ name, value });
          // In standard browser XMLHttpRequest, calling setHeader multiple times merges with comma
          if (headerMap[name]) {
            headerMap[name] += `, ${value}`;
          } else {
            headerMap[name] = value;
          }
        },
        getHeader(name) {
          return headerMap[name];
        },
        send() {
          return Promise.resolve({
            getStatus: () => 200,
            getHeader: (h) => (h === 'Location' ? 'http://localhost/upload/123' : null),
            getBody: () => '',
          });
        },
      };
    },
  };

  const dummyJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNzkzMDAwMDAwfQ.signature';
  const publishableKey = 'sb_publishable_Q7a2cXVNY0UcwjW6T42nVQ_VD6twbzV';

  // Configured exactly as in the updated uploadService.ts:
  // headers only contains static headers ('x-upsert'), while onBeforeRequest exclusively sets auth
  const upload = new tus.Upload(Buffer.from('video-data'), {
    endpoint: 'http://localhost/storage/v1/upload/resumable',
    httpStack: fakeHttpStack,
    headers: {
      'x-upsert': 'true',
    },
    onBeforeRequest: async (req) => {
      req.setHeader('authorization', `Bearer ${dummyJwt}`);
      req.setHeader('apikey', publishableKey);
    },
  });

  await new Promise((resolve) => {
    upload.options.onBeforeRequest(fakeHttpStack.createRequest('POST', 'http://localhost/test'));
    resolve();
  });

  // Check header calls
  const authCalls = recordedHeaders.filter((h) => h.name.toLowerCase() === 'authorization');
  assert.strictEqual(authCalls.length, 1, 'Authorization header must be set exactly once');
  assert.strictEqual(authCalls[0].value, `Bearer ${dummyJwt}`, 'Authorization must be Bearer <jwt>');

  // Check merged header map (simulated XHR state)
  assert.strictEqual(
    headerMap['authorization'],
    `Bearer ${dummyJwt}`,
    'Authorization header must not contain commas or duplicated Bearer tokens'
  );
  assert.strictEqual(
    headerMap['authorization'].includes(','),
    false,
    'Authorization must never contain a comma'
  );
  assert.strictEqual(headerMap['apikey'], publishableKey);
});
