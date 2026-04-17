#!/usr/bin/env node
/**
 * WWB Local Server
 * Serves WTML world documents and the browser interface.
 * Usage: node server.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const port = parseInt(process.argv[2]) || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.wtml': 'application/xml',
  '.xml':  'application/xml',
  '.json': 'application/json',
  '.css':  'text/css',
  '.js':   'application/javascript',
};

const server = http.createServer( async (req, res) => {
  // CORS — required by the spec for WTML documents
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/worlds') {
    try {
      const files = await fs.promises.readdir(path.join(__dirname, 'worlds'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Could not read worlds folder' }));
    }
    return;
  }

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/browser.html';

  const filePath = path.join(__dirname, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'text/plain';

  // Security: prevent path traversal
  const base = path.resolve(__dirname);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(base)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${urlPath}`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║       World Web Browser — Local Server  ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  Browser:  http://localhost:${port}/          ║`);
  console.log(`║  Worlds:   http://localhost:${port}/worlds/   ║`);
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(`\nOpen http://localhost:${port}/ in your browser.`);
  console.log(`Then enter:  wtml://0001-land-of-war  in the address bar.\n`);
  console.log(`Press Ctrl+C to stop.\n`);
});
