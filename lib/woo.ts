import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export const woo = new WooCommerceRestApi({
  url: process.env.WP_URL!,               
  consumerKey: process.env.WC_KEY!,
  consumerSecret: process.env.WC_SECRET!,
  version: "wc/v3",
});
