const { productBySlug, stripeMode } = require("./config");
const { orderAccessTable } = require("./supabase");

function idFromStripeValue(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value.id === "string") return value.id;
  return null;
}

function emailFromSession(session) {
  return session.customer_details?.email || session.customer_email || null;
}

async function fulfillCheckoutSession(session) {
  if (!session || !session.id) {
    throw new Error("Missing Stripe Checkout Session.");
  }

  const paymentStatus = session.payment_status || "unknown";
  if (paymentStatus !== "paid") {
    return { fulfilled: false, paymentStatus };
  }

  const productSlug = session.metadata?.productSlug;
  const product = productBySlug(productSlug);
  if (!product) {
    throw new Error(`Unknown product slug in Stripe session metadata: ${productSlug || "(missing)"}`);
  }

  const customerEmail = emailFromSession(session);
  if (!customerEmail) {
    throw new Error(`Missing customer email for Stripe session ${session.id}.`);
  }

  const row = {
    stripe_mode: stripeMode(),
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: idFromStripeValue(session.payment_intent),
    stripe_customer_id: idFromStripeValue(session.customer),
    stripe_price_id: product.stripePriceId,
    stripe_product_id: session.metadata?.stripeProductId || null,
    customer_email: customerEmail,
    product_slug: product.slug,
    product_name: product.name,
    bundle_version: product.bundleVersion,
    bundle_path: product.bundlePath,
    payment_status: paymentStatus,
    currency: session.currency || "nok",
    amount_subtotal: session.amount_subtotal,
    amount_tax: session.total_details?.amount_tax ?? null,
    amount_total: session.amount_total,
    fulfilled_at: new Date().toISOString(),
    metadata: {
      checkout_session_status: session.status,
      customer_details: session.customer_details || null,
      tax_id_collection: session.tax_id_collection || null,
      automatic_tax: session.automatic_tax || null,
    },
  };

  const { error } = await orderAccessTable().upsert(row, {
    onConflict: "stripe_checkout_session_id",
  });

  if (error) {
    throw new Error(error.message);
  }

  return { fulfilled: true, product };
}

module.exports = { fulfillCheckoutSession };
