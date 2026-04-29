const http = require('http');

const DEFAULT_BASE_PATH = '/repositories/sokogate-calc3/sokogate-calc-deploy';

function normalizeBasePath(value) {
  const trimmed = String(value || DEFAULT_BASE_PATH).trim();
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;
}

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: normalizeBasePath(process.env.BASE_PATH) + '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
