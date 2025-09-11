(() => {
  const current_variant = document.currentScript.getAttribute("data-current-variant");
  const variants = document.currentScript.getAttribute("data-variants");
  const default_image = document.currentScript.getAttribute("data-default-image");
  const product_type = document.currentScript.getAttribute("data-product-type");
  const variant_inventory_quantities = JSON.parse(document.currentScript.getAttribute("data-variant-inventory-quantities"));
  const product_title = document.currentScript.getAttribute("data-title");
  const product_options = document.currentScript.getAttribute("data-product-options");
  const show_low_stock_warning = document.currentScript.getAttribute("data-default-image");
  const data_shop_money_with_currency_format = document.currentScript.getAttribute("data-shop-money-with-currency-format")

  console.log({
    current_variant,
    variants,
    default_image,
    product_type,
    variant_inventory_quantities,
    product_title,
    product_options,
    show_low_stock_warning,
    data_shop_money_with_currency_format
  })
})