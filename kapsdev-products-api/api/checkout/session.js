const { applyCors, handleOptions, methodNotAllowed, publicError, readJsonBody, sendJson } = require("../../lib/http");
const { checkoutEnabled, productBySlug, siteBaseUrl } = require("../../lib/config");
const { stripe } = require("../../lib/stripe");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  if (req.method !== "POST") {
    methodNotAllowed(res, req.method);
    return;
  }

  try {
    if (!checkoutEnabled()) {
      sendJson(res, 503, { message: "Checkout is temporarily disabled while these products are being prepared." });
      return;
    }

    const body = await readJsonBody(req);
    const product = productBySlug(body.productSlug);

    if (!product) {
      sendJson(res, 400, { message: "Unknown product." });
      return;
    }

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: true },
      billing_address_collection: "auto",
      tax_id_collection: { enabled: true },
      phone_number_collection: { enabled: false },
      customer_creation: "if_required",
      client_reference_id: product.slug,
      metadata: {
        productSlug: product.slug,
        bundleVersion: product.bundleVersion,
        bundlePath: product.bundlePath,
      },
      success_url: `${siteBaseUrl()}/products/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteBaseUrl()}/products/`,
    });

    sendJson(res, 200, { checkoutUrl: session.url });
  } catch (error) {
    sendJson(res, 500, { message: publicError(error) });
  }
};
