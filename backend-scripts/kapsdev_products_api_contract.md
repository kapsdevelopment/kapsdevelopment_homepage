# Kapsdevelopment Products API Contract

This is the Vercel API contract for the static `/products/` page on `kapsdevelopment.com`.

## Environment

Use these environment variables in the Vercel API project:

```text
KAPSDEV_PRODUCTS_STRIPE_SECRET_KEY=
KAPSDEV_PRODUCTS_STRIPE_WEBHOOK_SECRET=
KAPSDEV_PRODUCTS_STRIPE_PRICE_USER_AUTH=
KAPSDEV_PRODUCTS_STRIPE_PRICE_IAP_BILLING=
KAPSDEV_PRODUCTS_STRIPE_PRICE_INTEGRITY=
KAPSDEV_PRODUCTS_STRIPE_PRICE_ALL_IN_ONE=
KAPSDEV_PRODUCTS_SUPABASE_URL=
KAPSDEV_PRODUCTS_SUPABASE_SERVICE_ROLE_KEY=
KAPSDEV_PRODUCTS_SUPABASE_BUCKET=kapsdev-products-private-downloads
KAPSDEV_PRODUCTS_SITE_BASE_URL=https://kapsdevelopment.com
KAPSDEV_PRODUCTS_API_BASE_URL=https://kapsdev-products-api.vercel.app
KAPSDEV_PRODUCTS_CHECKOUT_ENABLED=false
KAPSDEV_PRODUCTS_ACCESS_TOKEN_SECRET=
```

Optional when email delivery is added:

```text
KAPSDEV_PRODUCTS_RESEND_API_KEY=
KAPSDEV_PRODUCTS_FROM_EMAIL=orders@kapsdevelopment.com
```

## Product Slugs

The frontend and backend should use these stable slugs:

```text
user-and-auth-reference
iap-and-billing-reference
integrity-attestation-reference
all-in-one-reference
```

## Bundle Paths

Store ZIP files in the private Supabase bucket with these paths:

```text
agentic-reference/user-and-auth-reference/v1/user-and-auth-reference.zip
agentic-reference/iap-and-billing-reference/v1/iap-and-billing-reference.zip
agentic-reference/integrity-attestation-reference/v1/integrity-attestation-reference.zip
agentic-reference/all-in-one-reference/v1/all-in-one-reference.zip
```

## Routes

### `GET /api/products`

Returns public product data for the static product page. Stripe should be the source of truth for name, description,
active state, amount, currency, and tax behavior.

```json
{
  "products": [
    {
      "slug": "user-and-auth-reference",
      "name": "User & Auth Reference",
      "description": "A reference package supporting agentic coding...",
      "priceId": "price_...",
      "amount": 25000,
      "currency": "nok",
      "priceLabel": "250 NOK",
      "taxBehavior": "exclusive",
      "active": true
    }
  ]
}
```

### `POST /api/checkout/session`

Input:

```json
{
  "productSlug": "user-and-auth-reference"
}
```

Creates a Stripe Checkout Session with:

```text
mode=payment
automatic_tax.enabled=true
billing_address_collection=auto
tax_id_collection.enabled=true
phone_number_collection.enabled=false
success_url=https://kapsdevelopment.com/products/success/?session_id={CHECKOUT_SESSION_ID}
cancel_url=https://kapsdevelopment.com/products/
```

Output:

```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

### `POST /api/stripe/webhook`

Verifies the Stripe signature and fulfills completed checkout sessions idempotently.

Handle at least:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
```

Fulfillment writes or updates `public.kapsdev_products_order_access`, including Stripe IDs, customer email, product slug,
bundle path, amount fields, payment status, and a hashed access token.

### `GET /api/order/session-access?session_id=...`

Used by `/products/success/` after Stripe redirects back to the static site.

Returns either direct download access or a retryable pending state:

```json
{
  "productName": "User & Auth Reference",
  "accessUrl": "https://...",
  "expiresAt": "2026-04-26T12:00:00Z"
}
```

### `GET /api/order/access?token=...`

Validates the token against `public.kapsdev_products_order_access.access_token_hash`, checks expiry, and creates a fresh
Supabase signed URL for the stored `bundle_path`.

## Notes

- Store only the hash of access tokens in Supabase.
- Keep ZIP files private and serve them through short-lived signed URLs.
- The static frontend never talks to Supabase or Stripe directly.
- Sandbox and production use different Stripe price IDs; keep those in backend configuration.
- Switch `KAPSDEV_PRODUCTS_API_BASE_URL` and the static JS API base to `https://api.kapsdevelopment.com` after the
  custom Vercel domain is configured.
