const crypto = require("crypto");
const { requiredEnv } = require("./config");

function createAccessToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashAccessToken(token) {
  return crypto
    .createHmac("sha256", requiredEnv("KAPSDEV_PRODUCTS_ACCESS_TOKEN_SECRET"))
    .update(token)
    .digest("hex");
}

function accessExpiryDate(baseDate = new Date()) {
  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

module.exports = {
  accessExpiryDate,
  createAccessToken,
  hashAccessToken,
};
