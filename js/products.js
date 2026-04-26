(function () {
  const apiBaseUrl = "https://kapsdev-products-api.vercel.app";
  const checkoutEnabled = false;
  const products = [
    {
      slug: "user-and-auth-reference",
      priceLabel: "250 NOK",
    },
    {
      slug: "iap-and-billing-reference",
      priceLabel: "250 NOK",
    },
    {
      slug: "integrity-attestation-reference",
      priceLabel: "250 NOK",
    },
    {
      slug: "all-in-one-reference",
      priceLabel: "500 NOK",
    },
  ];

  const status = document.getElementById("products-status");
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const setStatus = (message, kind) => {
    if (!status) return;
    status.textContent = message || "";
    if (kind) status.dataset.kind = kind;
    else delete status.dataset.kind;
  };

  const formatPrice = (amount, currency) => {
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
  };

  const applyProductData = (product) => {
    const current = bySlug.get(product.slug);
    if (!current) return;

    const amount = product.amount ?? product.unitAmount;
    const currency = product.currency;
    const priceLabel = product.priceLabel || formatPrice(amount, currency) || current.priceLabel;
    const label = document.querySelector(`[data-price-label="${product.slug}"]`);

    if (label && priceLabel) label.textContent = priceLabel;
    Object.assign(current, product, { priceLabel });
  };

  const loadAuthoritativePrices = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/products`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) return;

      const data = await response.json();
      const remoteProducts = Array.isArray(data) ? data : data.products;
      if (!Array.isArray(remoteProducts)) return;

      remoteProducts.forEach(applyProductData);
      setStatus("");
    } catch (_) {
      // The static page should remain readable before the API is deployed.
    }
  };

  const checkout = async (slug, button) => {
    if (!checkoutEnabled) {
      setStatus("Checkout is temporarily disabled while these packages are being prepared.", "info");
      return;
    }

    const product = bySlug.get(slug);
    if (!product) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Opening checkout...";
    setStatus("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/checkout/session`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productSlug: slug }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.message || "Checkout is not available yet.");
      }

      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setStatus(
        error.message || "Checkout is not available yet. Please try again later or contact Kapsdevelopment.",
        "error",
      );
      button.disabled = false;
      button.textContent = originalText;
    }
  };

  document.querySelectorAll("[data-checkout]").forEach((button) => {
    if (!checkoutEnabled) {
      button.disabled = true;
      button.textContent = "Coming soon";
      button.setAttribute("aria-label", "Checkout disabled while this product is under construction");
    }

    button.addEventListener("click", () => checkout(button.dataset.checkout, button));
  });

  loadAuthoritativePrices();
})();
