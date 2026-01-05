const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.MOCK_PORT || 3001);
const ROOT = path.resolve(process.cwd(), 'examples/mock');

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sanitizeSegments(segments) {
  const out = [];
  for (const s of segments) {
    if (!s || s === '.') continue;
    if (s === '..') return null;
    if (!/^[a-zA-Z0-9_-]+$/.test(s)) return null;
    out.push(s);
  }
  return out;
}

function readBody(req, cb) {
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    cb(null, null);
    return;
  }
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
    if (data.length > 2 * 1024 * 1024) {
      req.destroy();
    }
  });
  req.on('end', () => {
    const type = req.headers['content-type'] || '';
    if (type.includes('application/json')) {
      try {
        const json = data ? JSON.parse(data) : {};
        cb(null, json);
      } catch (e) {
        cb(new Error('invalid json body'));
      }
    } else {
      cb(null, { raw: data });
    }
  });
  req.on('error', (err) => cb(err));
}

function candidatesFor(method, segments) {
  const m = method.toLowerCase();
  if (segments.length === 0) return [];
  const res = [];
  if (segments.length >= 2) {
    const [resource, id] = [segments[0], segments[1]];
    res.push(path.join(ROOT, resource, `${id}.${m}.json`));
    res.push(path.join(ROOT, resource, `${id}.json`));
  }
  const resource = segments[0];
  res.push(path.join(ROOT, `${resource}.${m}.json`));
  res.push(path.join(ROOT, `${resource}.json`));
  return res;
}

function readFirstExisting(files, cb) {
  if (files.length === 0) {
    cb(new Error('no candidates'));
    return;
  }
  let i = 0;
  const next = () => {
    const f = files[i++];
    if (!f) {
      cb(new Error('not found'));
      return;
    }
    fs.readFile(f, 'utf8', (err, data) => {
      if (err) return next();
      cb(null, data, f);
    });
  };
  next();
}

function selectVariant(json, query, body) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const keyName = query._key || 'id';
  const keyVal = (body && body[keyName]) || query[keyName];
  if (keyVal != null && Object.prototype.hasOwnProperty.call(json, String(keyVal))) {
    return json[String(keyVal)];
  }
  const pageCandidates = [
    body && body.perPage,
    body && body.pageNum,
    body && body.pageNo,
    body && body.currentPage,
    body && body.page,
    body && body.params && body.params.perPage,
    body && body.params && body.params.pageNum,
    body && body.params && body.params.pageNo,
    body && body.params && body.params.currentPage,
    body && body.params && body.params.page,
    query && query.perPage,
    query && query.pageNum,
    query && query.pageNo,
    query && query.currentPage,
    query && query.page
  ];
  for (let i = 0; i < pageCandidates.length; i++) {
    const v = pageCandidates[i];
    if (v != null && Object.prototype.hasOwnProperty.call(json, String(v))) {
      return json[String(v)];
    }
  }
  const action = (body && body.action) || query.action;
  if (action != null && Object.prototype.hasOwnProperty.call(json, String(action))) {
    return json[String(action)];
  }
  return null;
}

function handleRequest(req, res) {
  try {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname || '/';
    if (pathname === '/api/__health') {
      sendJson(res, 200, { ok: true });
      return;
    }
    if (!pathname.startsWith('/api/')) {
      sendJson(res, 404, { code: 404, message: 'not found' });
      return;
    }
    const raw = pathname.replace(/^\/api\//, '');
    const parts = sanitizeSegments(raw.split('/'));
    if (!parts) {
      sendJson(res, 400, { code: 400, message: 'invalid path' });
      return;
    }
    readBody(req, (bodyErr, body) => {
      if (bodyErr) {
        sendJson(res, 400, { code: 400, message: bodyErr.message });
        return;
      }
      const files = candidatesFor(req.method || 'GET', parts);
      readFirstExisting(files, (readErr, data) => {
        if (readErr) {
          sendJson(res, 404, { code: 404, message: 'mock file not found' });
          return;
        }
        try {
          const json = JSON.parse(data);
          const variant = selectVariant(json, parsed.query || {}, body || {});
          const target = variant != null ? variant : json;
          const q = parsed.query || {};
          const bp = body || {};
          const gp = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
          const page = gp((bp.params && (bp.params.perPage || bp.params.pageNo || bp.params.currentPage || bp.params.page)) || (bp.perPage || bp.pageNo || bp.currentPage || bp.page) || (q.perPage || q.pageNo || q.currentPage || q.page)) || 1;
          const size = gp((bp.params && (bp.params.pageNum || bp.params.pageSize)) || (bp.pageNum || bp.pageSize) || (q.pageNum || q.pageSize)) || 10;
          if (target && target.data && Array.isArray(target.data.list)) {
            const full = target.data.list.slice();
            const total = full.length;
            const start = Math.max(0, (page - 1) * size);
            const sliced = full.slice(start, start + size);
            const out = {
              code: target.code != null ? target.code : 0,
              msg: target.msg != null ? target.msg : 'ok',
              data: Object.assign({}, target.data, {
                list: sliced,
                page: {
                  totalRowNum: total,
                  perPage: page,
                  pageNum: size
                }
              })
            };
            sendJson(res, 200, out);
          } else {
            sendJson(res, 200, target);
          }
        } catch (e) {
          sendJson(res, 500, { code: 500, message: 'invalid json format' });
        }
      });
    });
  } catch (e) {
    sendJson(res, 500, { code: 500, message: 'internal error' });
  }
}

const server = http.createServer(handleRequest);

server.on('error', (err) => {
  console.error('[mock-server] error:', err && err.message ? err.message : String(err));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-server] listening on http://localhost:${PORT}`);
});
