const http = require('http');

const DEFAULT_PORT = 3001;
const DEFAULT_BASE_PATH = '/';

function normalizePort(value) {
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_PORT;
}

function normalizeBasePath(value) {
  const trimmed = String(value || DEFAULT_BASE_PATH).trim();
  if (!trimmed.startsWith('/')) {
    return '/' + trimmed;
  }
  // Remove trailing slashes (but keep single '/' if that's the whole path)
  return trimmed.replace(/\/+$/, '') || '/';
}

const options = {
  hostname: 'localhost',
  port: normalizePort(process.env.APP_PORT || process.env.PORT),
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
