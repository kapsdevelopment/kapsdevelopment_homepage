(function () {
  const apiBaseUrl = "https://kapsdev-products-api.vercel.app";
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const title = document.getElementById("success-title");
  const message = document.getElementById("success-message");
  const order = document.getElementById("success-order");
  const productName = document.getElementById("success-product-name");
  const downloadLink = document.getElementById("download-link");

  const setText = (heading, copy) => {
    if (title) title.textContent = heading;
    if (message) message.textContent = copy;
  };

  const showOrder = (name) => {
    if (!order || !productName || !name) return;
    productName.textContent = name;
    order.hidden = false;
  };

  const showDownload = (url) => {
    if (!downloadLink || !url) return;
    downloadLink.href = url;
    downloadLink.hidden = false;
  };

  const loadAccess = async () => {
    if (!sessionId) {
      setText(
        "Missing checkout session",
        "The success page did not receive a Stripe session ID. Please use the link from your checkout redirect or contact Kapsdevelopment.",
      );
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/order/session-access?session_id=${encodeURIComponent(sessionId)}`,
        { headers: { Accept: "application/json" } },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "We could not verify this checkout session yet.");
      }

      showOrder(data.productName || data.product?.name);
      showDownload(data.downloadUrl || data.accessUrl);

      if (data.downloadUrl || data.accessUrl) {
        setText(
          "Your download is ready",
          "Payment is confirmed. You can download the ZIP package now, and the same access can also be sent by email.",
        );
      } else {
        setText(
          "Payment confirmed",
          "The order is confirmed, and download access is being prepared. Please refresh this page in a moment.",
        );
      }
    } catch (error) {
      setText(
        "Download access is not ready yet",
        error.message ||
          "The checkout completed, but the download API is not available yet. Please contact Kapsdevelopment with your Stripe receipt.",
      );
    }
  };

  loadAccess();
})();
