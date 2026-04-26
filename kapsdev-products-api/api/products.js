const { applyCors, handleOptions, methodNotAllowed, publicError, sendJson } = require("../lib/http");
const { configuredProducts, formatPrice } = require("../lib/config");
const { stripe } = require("../lib/stripe");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  if (req.method !== "GET") {
    methodNotAllowed(res, req.method);
    return;
  }

  try {
    const products = await Promise.all(
      configuredProducts().map(async (product) => {
        const price = await stripe().prices.retrieve(product.stripePriceId, {
          expand: ["product"],
        });
        const stripeProduct = typeof price.product === "object" ? price.product : {};

        return {
          slug: product.slug,
          name: stripeProduct.name || product.name,
          description: stripeProduct.description || "",
          priceId: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          priceLabel: formatPrice(price.unit_amount, price.currency),
          taxBehavior: price.tax_behavior,
          active: Boolean(price.active && stripeProduct.active !== false),
        };
      }),
    );

    sendJson(res, 200, { products });
  } catch (error) {
    sendJson(res, 500, { message: publicError(error) });
  }
};
