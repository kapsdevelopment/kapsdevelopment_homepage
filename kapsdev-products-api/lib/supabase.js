const { createClient } = require("@supabase/supabase-js");
const { requiredEnv } = require("./config");

let client;

function supabase() {
  if (!client) {
    client = createClient(
      requiredEnv("KAPSDEV_PRODUCTS_SUPABASE_URL"),
      requiredEnv("KAPSDEV_PRODUCTS_SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }
  return client;
}

function orderAccessTable() {
  return supabase().from("kapsdev_products_order_access");
}

function downloadsBucket() {
  return requiredEnv("KAPSDEV_PRODUCTS_SUPABASE_BUCKET");
}

module.exports = {
  downloadsBucket,
  orderAccessTable,
  supabase,
};
