function allowedOrigins() {
  const siteBaseUrl = process.env.KAPSDEV_PRODUCTS_SITE_BASE_URL || "https://kapsdevelopment.com";
  return new Set([
    siteBaseUrl,
    "https://kapsdevelopment.com",
    "https://www.kapsdevelopment.com",
    "http://localhost:8123",
    "http://127.0.0.1:8123",
  ]);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  const origins = allowedOrigins();
  const allowedOrigin = origin && origins.has(origin) ? origin : process.env.KAPSDEV_PRODUCTS_SITE_BASE_URL;

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin || "https://kapsdevelopment.com");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Stripe-Signature");
}

function handleOptions(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function methodNotAllowed(res, method) {
  sendJson(res, 405, { message: `${method} is not allowed.` });
}

function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === "string") {
    return Promise.resolve(req.body ? JSON.parse(req.body) : {});
  }

  return readRawBody(req).then((raw) => {
    if (!raw) return {};
    return JSON.parse(raw);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function publicError(error) {
  if (error && typeof error.message === "string") {
    return error.message;
  }
  return "Unexpected server error.";
}

module.exports = {
  applyCors,
  handleOptions,
  methodNotAllowed,
  publicError,
  readJsonBody,
  readRawBody,
  sendJson,
};
