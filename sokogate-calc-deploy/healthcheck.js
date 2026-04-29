const http = require('http');

const DEFAULT_PORT = 3001;
const DEFAULT_BASE_PATH = '/repositories/sokogate-calc3/sokogate-calc-deploy';

function normalizePort(value) {
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_PORT;
}

function normalizeBasePath(value) {
  const trimmed = String(value || DEFAULT_BASE_PATH).trim();
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;
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
