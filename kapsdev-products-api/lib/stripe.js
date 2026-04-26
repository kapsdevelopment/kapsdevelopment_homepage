const Stripe = require("stripe");
const { requiredEnv } = require("./config");

let client;

function stripe() {
  if (!client) {
    client = new Stripe(requiredEnv("KAPSDEV_PRODUCTS_STRIPE_SECRET_KEY"));
  }
  return client;
}

module.exports = { stripe };
