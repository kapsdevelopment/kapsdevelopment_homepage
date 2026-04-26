const products = [
  {
    slug: "user-and-auth-reference",
    name: "User & Auth Reference",
    envPriceId: "KAPSDEV_PRODUCTS_STRIPE_PRICE_USER_AUTH",
    bundleVersion: "v1",
    bundlePath: "agentic-reference/user-and-auth-reference/v1/user-and-auth-reference.zip",
  },
  {
    slug: "iap-and-billing-reference",
    name: "IAP & Billing Reference",
    envPriceId: "KAPSDEV_PRODUCTS_STRIPE_PRICE_IAP_BILLING",
    bundleVersion: "v1",
    bundlePath: "agentic-reference/iap-and-billing-reference/v1/iap-and-billing-reference.zip",
  },
  {
    slug: "integrity-attestation-reference",
    name: "Integrity Attestation Reference",
    envPriceId: "KAPSDEV_PRODUCTS_STRIPE_PRICE_INTEGRITY",
    bundleVersion: "v1",
    bundlePath: "agentic-reference/integrity-attestation-reference/v1/integrity-attestation-reference.zip",
  },
  {
    slug: "all-in-one-reference",
    name: "All-in-One Reference",
    envPriceId: "KAPSDEV_PRODUCTS_STRIPE_PRICE_ALL_IN_ONE",
    bundleVersion: "v1",
    bundlePath: "agentic-reference/all-in-one-reference/v1/all-in-one-reference.zip",
  },
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name, fallback) {
  return process.env[name] || fallback;
}

function configuredProducts() {
  return products.map((product) => ({
    ...product,
    stripePriceId: requiredEnv(product.envPriceId),
  }));
}

function productBySlug(slug) {
  return configuredProducts().find((product) => product.slug === slug) || null;
}

function productByPriceId(priceId) {
  return configuredProducts().find((product) => product.stripePriceId === priceId) || null;
}

function siteBaseUrl() {
  return optionalEnv("KAPSDEV_PRODUCTS_SITE_BASE_URL", "https://kapsdevelopment.com").replace(/\/$/, "");
}

function apiBaseUrl() {
  return optionalEnv("KAPSDEV_PRODUCTS_API_BASE_URL", "https://kapsdev-products-api.vercel.app").replace(/\/$/, "");
}

function checkoutEnabled() {
  return optionalEnv("KAPSDEV_PRODUCTS_CHECKOUT_ENABLED", "false").toLowerCase() === "true";
}

function stripeMode() {
  const key = requiredEnv("KAPSDEV_PRODUCTS_STRIPE_SECRET_KEY");
  if (key.startsWith("sk_live_")) return "live";
  return "test";
}

function formatPrice(amount, currency) {
  if (typeof amount !== "number" || !currency) return "";
  const major = amount / 100;
  const normalized = currency.toUpperCase();

  if (normalized === "NOK") {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(major)} NOK`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalized,
    maximumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(major);
}

module.exports = {
  apiBaseUrl,
  checkoutEnabled,
  configuredProducts,
  formatPrice,
  productByPriceId,
  productBySlug,
  requiredEnv,
  siteBaseUrl,
  stripeMode,
};
