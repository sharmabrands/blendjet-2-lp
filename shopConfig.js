var urlParams = new URLSearchParams(window.location.search);
var discountValue = urlParams.get("discount_value");
var discountType = urlParams.get("discount_type");

window.SHOP_CONFIG = [
  {
    productId: "4695416602690",
    domElId: "shop-section-1",
    galleryId: "shop-section-gallery-1",
  },
];
window.STOREFRONT_API_KEY = "32ec18da35149dcec235531b328003b5";
window.STOREFRONT_SHOP_URL = "https://blendjet.myshopify.com";
window.CURRENCY = "$";
window.STOREFRONT_GRAPHQL_URL = `${window.STOREFRONT_SHOP_URL}/api/2023-07/graphql.json`;
window.STOREFRONT_HEADER = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Shopify-Storefront-Access-Token": window.STOREFRONT_API_KEY,
};
window.PRODUCTS_DATA = null;
window.GLOBAL_DISCOUNT =
  discountValue && discountType
    ? {
        value: discountValue,
        type: discountType,
      }
    : null;
