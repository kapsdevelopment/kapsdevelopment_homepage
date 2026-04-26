const { publicError, readRawBody, sendJson } = require("../../lib/http");
const { requiredEnv } = require("../../lib/config");
const { fulfillCheckoutSession } = require("../../lib/fulfillment");
const { stripe } = require("../../lib/stripe");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { message: `${req.method} is not allowed.` });
    return;
  }

  try {
    const signature = req.headers["stripe-signature"];
    const rawBody = await readRawBody(req);
    const event = stripe().webhooks.constructEvent(
      rawBody,
      signature,
      requiredEnv("KAPSDEV_PRODUCTS_STRIPE_WEBHOOK_SECRET"),
    );

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await fulfillCheckoutSession(event.data.object);
    }

    sendJson(res, 200, { received: true });
  } catch (error) {
    sendJson(res, 400, { message: publicError(error) });
  }
};
