const { applyCors, handleOptions, methodNotAllowed, publicError, sendJson } = require("../../lib/http");
const { downloadsBucket, orderAccessTable, supabase } = require("../../lib/supabase");
const { hashAccessToken } = require("../../lib/tokens");

function filenameFromPath(path) {
  return path.split("/").pop() || "download.zip";
}

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  if (req.method !== "GET") {
    methodNotAllowed(res, req.method);
    return;
  }

  const token = req.query?.token;
  if (!token || typeof token !== "string") {
    sendJson(res, 400, { message: "Missing access token." });
    return;
  }

  try {
    const tokenHash = hashAccessToken(token);
    const { data: order, error } = await orderAccessTable()
      .select("product_name, bundle_path, access_expires_at, payment_status")
      .eq("access_token_hash", tokenHash)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!order || order.payment_status !== "paid") {
      sendJson(res, 404, { message: "Download access was not found." });
      return;
    }

    if (!order.access_expires_at || new Date(order.access_expires_at).getTime() < Date.now()) {
      sendJson(res, 410, { message: "Download access has expired." });
      return;
    }

    const { data, error: signedUrlError } = await supabase()
      .storage
      .from(downloadsBucket())
      .createSignedUrl(order.bundle_path, 300, {
        download: filenameFromPath(order.bundle_path),
      });

    if (signedUrlError) {
      throw new Error(signedUrlError.message);
    }

    res.statusCode = 303;
    res.setHeader("Location", data.signedUrl);
    res.end();
  } catch (error) {
    sendJson(res, 500, { message: publicError(error) });
  }
};
