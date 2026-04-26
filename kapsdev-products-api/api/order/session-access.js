const { applyCors, handleOptions, methodNotAllowed, publicError, sendJson } = require("../../lib/http");
const { apiBaseUrl } = require("../../lib/config");
const { fulfillCheckoutSession } = require("../../lib/fulfillment");
const { orderAccessTable } = require("../../lib/supabase");
const { stripe } = require("../../lib/stripe");
const { accessExpiryDate, createAccessToken, hashAccessToken } = require("../../lib/tokens");

function orderExpiryDate(order) {
  const baseDate = order.fulfilled_at ? new Date(order.fulfilled_at) : new Date();
  return accessExpiryDate(Number.isNaN(baseDate.getTime()) ? new Date() : baseDate);
}

async function loadOrder(sessionId) {
  const { data, error } = await orderAccessTable()
    .select("stripe_checkout_session_id, product_name, payment_status, fulfilled_at, access_expires_at")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function mintAccess(sessionId, expiresAt) {
  const token = createAccessToken();
  const tokenHash = hashAccessToken(token);

  const { error } = await orderAccessTable()
    .update({
      access_token_hash: tokenHash,
      access_expires_at: expiresAt.toISOString(),
    })
    .eq("stripe_checkout_session_id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    accessUrl: `${apiBaseUrl()}/api/order/access?token=${encodeURIComponent(token)}`,
    expiresAt: expiresAt.toISOString(),
  };
}

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  if (req.method !== "GET") {
    methodNotAllowed(res, req.method);
    return;
  }

  const sessionId = req.query?.session_id;
  if (!sessionId || typeof sessionId !== "string") {
    sendJson(res, 400, { message: "Missing session_id." });
    return;
  }

  try {
    let order = await loadOrder(sessionId);

    if (!order) {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      const result = await fulfillCheckoutSession(session);

      if (!result.fulfilled) {
        sendJson(res, 202, {
          pending: true,
          message: "Payment is not confirmed yet.",
        });
        return;
      }

      order = await loadOrder(sessionId);
    }

    if (!order || order.payment_status !== "paid") {
      sendJson(res, 202, {
        pending: true,
        message: "Payment is not confirmed yet.",
      });
      return;
    }

    const expiresAt = orderExpiryDate(order);
    if (expiresAt.getTime() < Date.now()) {
      sendJson(res, 410, {
        message: "Download access has expired.",
      });
      return;
    }

    const access = await mintAccess(sessionId, expiresAt);
    sendJson(res, 200, {
      productName: order.product_name,
      accessUrl: access.accessUrl,
      expiresAt: access.expiresAt,
    });
  } catch (error) {
    sendJson(res, 500, { message: publicError(error) });
  }
};
