const cartElements = {
  indicators: document.querySelectorAll(".cart-indicator"),
  drawer: document.querySelector(".cart"),
  forms: document.querySelectorAll('form[action="/cart/add"]'),
  cartLinks: document.querySelectorAll(".js-cart-icon"),
};

// Potentially remove the event listener here for even more brevity?
document.addEventListener("DOMContentLoaded", () => {
  initCartFromStorage();
  addCartEventListeners();
});

// Refactored
function initCartFromStorage() {
  const savedCart = localStorage.getItem("cartData");
  if (savedCart) {
    const cart = JSON.parse(savedCart);
    if (cart.count > 0) {
      updateCartIndicators(cart.count);
    }
  }

  fetchCart().then((freshCart) => {
    updateCartDrawer().then(() => {
      if (freshCart?.item_count > 0) {
        handleSliderIndependently();
      }
    });
  });
}

// Refactored
function prePopulateCartDrawer(cartData) {
  const cartEmpty = document.querySelector(".cart__empty-state");
  if (!cartEmpty) return;

  if (!cartData?.items?.length) return;

  cartEmpty.remove();
  const cartForm = document.querySelector(".cart__form");

  const escapeHtml = (str) => {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  };

  cartForm.innerHTML = `
    <div class="cart__shipping" style="display: block;">
      <p class="cart__shipping-text small"></p>
      <div class="cart__shipping-bar">
        <div class="cart__shipping-progress"></div>
      </div>
    </div>
    <div class="cart__items"></div>
  `;

  const itemsContainer = cartForm.querySelector(".cart__items");

  cartData.items.forEach((item) => {
    const cartItem = document.createElement("article");
    cartItem.className = "cart-item";
    cartItem.setAttribute("data-line-item-key", item.key || "");

    if (item.variant?.inventory_quantity !== undefined) {
      cartItem.setAttribute("data-inventory-quantity", item.variant.inventory_quantity);
    }

    const variantInfo =
      item.variant_title && item.variant_title !== "Default Title" ? item.variant_title.replace(".0", "") : "One Size";

    cartItem.innerHTML = `
      <div class="cart-item__image">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" width="100" height="auto">
      </div>
      <div class="cart-item__content">
        <div class="cart-item__row">
          <div class="cart-item__details">
            <h3 class="cart-item__title body--bold">
              <a href="${escapeHtml(item.url)}">${escapeHtml(item.product_title || item.title)}</a>
            </h3>
            <div class="cart-item__specifics">
              <p class="cart-item__variant small">${escapeHtml(variantInfo)}</p>
              <div class="cart-item__price">
                <p class="small">${formatMoney(item.line_price || 0)}</p>
              </div>
            </div>
            <div class="cart-item__actions">
              <div class="cart-item__quantity">
                <button class="cart-item__quantity-button cart-item__quantity-button--minus body" type="button" aria-label="Decrease quantity">-</button>
                <input type="text" class="cart-item__quantity-input small" readonly value="${
                  parseInt(item.quantity) || 1
                }" aria-label="Quantity">
                <button class="cart-item__quantity-button cart-item__quantity-button--plus body" type="button" aria-label="Increase quantity">+</button>
              </div>
              <button type="button" class="cart-item__remove small">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;

    itemsContainer.appendChild(cartItem);
  });

  ensureSliderContainerExists();

  if (!document.querySelector(".cart__footer")) {
    const footer = document.createElement("footer");
    footer.className = "cart__footer";
    footer.innerHTML = `
      <div class="cart__footer-row">
        <h3 class="cart__footer-label body">Subtotal</h3>
        <span class="cart__footer-value body--bold">${formatMoney(cartData.total || 0)}</span>
      </div>
      <button type="submit" name="checkout" class="cart__checkout body" style="height: var(--space-xl);">Checkout</button>
    `;
    cartForm.appendChild(footer);
  }

  updateFreeShippingBar(cartData.total || 0);
  updateComplementarySlider();
}

// Refactored
function formatMoney(cents, format = "{{amount_with_comma_separator}}") {
  const amount = typeof cents === "string" ? parseFloat(cents.replace(".", "")) : cents;
  if (isNaN(amount) || amount == null) return "0.00";

  const formatType = format.replace(/[{}{\s}]/g, "");
  const dollars = (amount / 100).toFixed(formatType === "amount_no_decimals" ? 0 : 2);

  const formats = {
    amount: [",", "."],
    amount_with_comma_separator: [".", ","],
    amount_no_decimals: [",", "."],
    amount_with_space_separator: [" ", ","],
  };

  const [thousands, decimal] = formats[formatType] || formats["amount"];
  const [whole, decimals] = dollars.split(".");
  const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);

  return decimals !== undefined ? formatted + decimal + decimals : formatted;
}

// Refactored
function createAnimatedLoader() {
  const loader = document.createElement("div");
  loader.innerHTML = `<svg fill=#E7E7E7 style=height:4px;display:block viewBox="0 0 40 4"xmlns=http://www.w3.org/2000/svg><style>.react{animation:moving 1s ease-in-out infinite}@keyframes moving{0%{width:0%}50%{width:100%;transform:translate(0,0)}100%{width:0;right:0;transform:translate(100%,0)}}</style><rect class=react fill=#E7E7E7 height=4 width=40 /></svg>`;
  return loader;
}

// Refactored
function showError(container, message, className = "product-error body") {
  container.querySelectorAll('[class*="error"]').forEach((el) => el.remove());

  const error = document.createElement("div");
  error.className = className;
  error.textContent = message;

  container.querySelector("#js--addtocart, .cart-item__actions")?.after(error);
}

// Refactored
function createLoadingPlaceholder(element) {
  const original = element.innerHTML;
  element.replaceChildren(createAnimatedLoader());
  return original;
}

// Refactored
function applyCartTotalLoaders() {
  document.querySelectorAll(".cart__footer-value").forEach((el) => createLoadingPlaceholder(el));
  const checkoutButton = document.querySelector(".cart__checkout");
  if (checkoutButton) checkoutButton.innerHTML = '<span class="loader--spinner"></span>';
}

// Refactored
function openCartDrawer() {
  if (window.openCart) return window.openCart();
  cartElements.drawer.classList.add("cart--active");
  document.body.classList.add("cart-open");
}

// Refactored
function closeCartDrawer() {
  window.closeCart?.() ||
    (cartElements.drawer.classList.remove("cart--active"), document.body.classList.remove("cart-open"));
}

// Refactored
function updateCartIndicators(count) {
  cartElements.indicators.forEach((el) => {
    el.style.visibility = "visible";
    el.classList.toggle("hide", count <= 0);
  });
  localStorage.setItem("cartCount", count.toString());
}

// Refactored
async function fetchCart() {
  try {
    const res = await fetch("/cart.js");
    const cart = await res.json();

    localStorage.setItem(
      "cartData",
      JSON.stringify({
        count: cart.item_count,
        items: cart.items,
        total: cart.total_price,
      })
    );

    updateCartIndicators(cart.item_count);
    return cart;
  } catch (e) {
    console.error("Error fetching cart:", e);
    return null;
  }
}

// Refactored
let sliderUpdateInProgress = false;

// Refactored
function destroyComplementarySlider() {
  window.complementarySlider?.destroy();
  window.complementarySlider = null;
  const container = document.querySelector(".cart__complementary-products");
  if (container) container.style.display = "none";
}

// Refactored
async function rebuildComplementarySlider(productIds) {
  if (sliderUpdateInProgress) return;
  sliderUpdateInProgress = true;

  destroyComplementarySlider();

  const container = document.querySelector(".cart__complementary-products");
  const loading = document.querySelector(".cart__complementary-products-loading");
  const content = document.querySelector(".cart__complementary-products-content");
  const splideList = container?.querySelector(".splide__list");

  if (!container || !loading || !content || !splideList || productIds.length === 0) {
    if (container) container.style.display = "none";
    sliderUpdateInProgress = false;
    return;
  }

  container.style.display = "block";
  loading.style.display = "block";
  content.style.display = "none";

  try {
    const products = await fetchComplementaryProducts(productIds);

    if (!sliderUpdateInProgress || products.length === 0) {
      container.style.display = "none";
      sliderUpdateInProgress = false;
      return;
    }

    splideList.innerHTML = products
      .map(
        (product) => `
      <li class="splide__slide">
        <a href="/products/${product.handle}">
          <div class="cart__complementary-products-image-wrapper">
            <img src="https:${product.featured_image}&width=300" alt="${
          product.title
        }" class="cart__complementary-products-image">
          </div>
          <h3 class="body--bold cart__complementary-products-title-product">${product.title}</h3>
          <p class="small cart__complementary-products-price">$${formatMoney(product.price)}</p>
        </a>
      </li>
    `
      )
      .join("");

    window.complementarySlider = new Splide(container.querySelector(".cart__complementary-products-slider"), {
      type: "slide",
      perPage: 2,
      gap: "var(--space-2xs)",
      arrows: true,
      pagination: false,
    }).mount();

    const arrowsContainer = container.querySelector(".splide__arrows");
    if (arrowsContainer) {
      arrowsContainer.style.display = products.length <= 2 ? "none" : "flex";
    }

    loading.style.display = "none";
    content.style.display = "block";
  } catch (e) {
    console.error("Error rebuilding slider:", e);
    container.style.display = "none";
  } finally {
    sliderUpdateInProgress = false;
  }
}

// Refactored
async function updateCartDrawer() {
  try {
    const currentProgress = document.querySelector(".cart__shipping-progress");
    const currentWidth = currentProgress ? currentProgress.style.width || "0%" : "0%";

    const [drawerRes, cartData] = await Promise.all([fetch("/?section_id=cart-drawer"), fetchCart()]);

    const html = document.createElement("div");
    html.innerHTML = await drawerRes.text();

    document.querySelectorAll(".cart__shipping--loading").forEach((el) => el.remove());

    const newShipping = html.querySelector(".cart__shipping");
    const oldShipping = document.querySelector(".cart__shipping");
    if (newShipping && oldShipping) {
      const hasItems = html.querySelector(".cart-item");
      if (hasItems) {
        newShipping.style.display = "block";
        newShipping.style.height = "93px";

        const threshold = 9900;
        const newText = newShipping.querySelector(".cart__shipping-text");
        const newProgress = newShipping.querySelector(".cart__shipping-progress");

        if (cartData && newText && newProgress) {
          if (cartData.total_price >= threshold) {
            newText.textContent = "Your Order Has Free Shipping!";
          } else {
            const remaining = formatMoney(threshold - cartData.total_price);
            newText.textContent = `$${remaining} Away From Free Shipping`;
          }
          newProgress.style.width = currentWidth;
        }
      }
      oldShipping.replaceWith(newShipping);
    }

    const replaceIfExists = (selector) => {
      const newEl = html.querySelector(selector);
      const oldEl = document.querySelector(selector);
      if (newEl && oldEl) oldEl.replaceWith(newEl);
    };

    replaceIfExists(".cart__items");
    replaceIfExists(".cart__footer");

    const newEmpty = html.querySelector(".cart__empty-state");
    const oldEmpty = document.querySelector(".cart__empty-state");
    const cartForm = document.querySelector(".cart__form");

    if (newEmpty && !oldEmpty && cartForm) {
      cartForm.innerHTML = "";
      cartForm.appendChild(newEmpty);
    } else if (!newEmpty && oldEmpty) {
      oldEmpty.remove();
    }

    addCartEventListeners();

    const cart = await fetchCart();
    if (cart) {
      setTimeout(() => {
        animateShippingProgress(cart.total_price);
      }, 100);
    }

    return true;
  } catch (e) {
    console.error("Error updating cart drawer:", e);
    return false;
  }
}

// Refactored
function ensureSliderContainerExists() {
  if (document.querySelector(".cart__complementary-products")) return;

  const cartForm = document.querySelector(".cart__form");
  const footer = document.querySelector(".cart__footer");
  if (!cartForm || !footer) return;

  const container = document.createElement("div");
  container.className = "cart__complementary-products";
  container.style.display = "none";
  container.innerHTML = `
    <div class="cart__complementary-products-loading"></div>
    <div class="cart__complementary-products-content" style="display: none;">
      <h3 class="cart__complementary-products-title heading--l">Complement Your Look</h3>
      <div class="cart__complementary-products-slider splide">
        <div class="splide__arrows">
          <button class="splide__arrow splide__arrow--prev" type="button">
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1L1 6L6 11" stroke="#0F0F0F" stroke-linecap="square"/>
            </svg>
          </button>
          <button class="splide__arrow splide__arrow--next" type="button">
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 6L1 11" stroke="#0F0F0F" stroke-linecap="square"/>
            </svg>
          </button>
        </div>
        <div class="splide__track">
          <ul class="splide__list"></ul>
        </div>
      </div>
    </div>
  `;

  container.querySelector(".cart__complementary-products-loading").appendChild(createAnimatedLoader());

  cartForm.insertBefore(container, footer);
}

// Refactored
function handleSliderIndependently() {
  const cartItems = document.querySelectorAll(".cart-item");

  if (!cartItems.length) {
    hideComplementaryProducts();
    return;
  }

  ensureSliderContainerExists();

  const productIds = Array.from(cartItems)
    .map((item) => item.querySelector(".cart-item__title a")?.href?.split("/products/")[1]?.split("?")[0])
    .filter(Boolean);

  if (productIds.length) {
    rebuildComplementarySlider(productIds);
  }
}

// Refactored
function updateFreeShippingBar(cartTotal) {
  const shipping = document.querySelector(".cart__shipping");
  const text = document.querySelector(".cart__shipping-text");
  const progress = document.querySelector(".cart__shipping-progress");
  const hasItems = document.querySelector(".cart-item");

  if (!shipping || !hasItems) {
    if (shipping) shipping.style.display = "none";
    return;
  }

  const threshold = 9900;
  const percentage = Math.min((cartTotal / threshold) * 100, 100);
  const isFreeShipping = cartTotal >= threshold;

  shipping.classList.remove("cart__shipping--loading");
  shipping.style.display = "block";
  shipping.style.height = "93px";

  text.textContent = isFreeShipping
    ? "Your order has free shipping!"
    : `$${formatMoney(threshold - cartTotal)} away from free shipping`;

  progress.style.width = `${percentage}%`;
}

// Refactored
function animateShippingProgress(cartTotal) {
  const progress = document.querySelector(".cart__shipping-progress");
  if (!progress) return;
  const threshold = 9900;
  progress.style.width = `${Math.min((cartTotal / threshold) * 100, 100)}%`;
}

// Refactored
function applyOptimisticUI() {
  const productTitle = document.querySelector(".product-details__title")?.textContent || "";
  const variantId = document.querySelector("#js--variant-id")?.value || "";

  const variantSelections = getVariantSelections();
  const productImage = getProductImage();

  applyCartTotalLoaders();
  ensureSliderContainerExists();

  const isCartEmpty = document.querySelector(".cart__empty-state");
  if (isCartEmpty) {
    setupEmptyCart(isCartEmpty);
  }

  const itemsContainer = document.querySelector(".cart__items");
  if (!itemsContainer) return;

  const existingItem = document.querySelector(`.cart-item[data-line-item-key*="${variantId}"]`);

  if (existingItem) {
    updateExistingItem(existingItem);
  } else {
    addNewItem(itemsContainer, variantId, productImage, productTitle, variantSelections);
  }

  updateSliderWithCurrentProducts();
}

// Refactored
function getVariantSelections() {
  const options = [];
  document.querySelectorAll(".js--variant-options:checked").forEach((input) => {
    const optGroup = input.closest(".js--variant-options");
    const legend = optGroup?.querySelector("legend");
    const label = input.nextElementSibling;

    if (legend && label) {
      const optionName = legend.textContent.replace(":", "").trim();
      const optionValue = label.textContent.trim();
      if (optionName && optionValue) {
        options.push(`${optionName}: ${optionValue}`);
      }
    }
  });

  return options.length > 0 ? options.join(", ") : "One Size";
}

// Refactored
function getProductImage() {
  const img = document.querySelector(
    ".splide__slide.is-active img, .splide__slide img, .product-gallery img, .product-image img"
  );

  return img?.src || document.querySelector('meta[property="og:image"]')?.content || "";
}

// Refactored
function setupEmptyCart(emptyState) {
  const cartForm = document.querySelector(".cart__form");
  emptyState.remove();

  cartForm.innerHTML = `
    <div class="cart__shipping cart__shipping--loading" style="display: block; height: 93px;">
      <p class="cart__shipping-text small">${createAnimatedLoader().outerHTML}</p>
      <div class="cart__shipping-bar">
        <div class="cart__shipping-progress"></div>
      </div>
    </div>
    <div class="cart__items"></div>
    <div class="cart__complementary-products" style="display: block;">
      <div class="cart__complementary-products-loading">${createAnimatedLoader().outerHTML}</div>
      <div class="cart__complementary-products-content" style="display: none;">
        <h3 class="cart__complementary-products-title heading--l">Complement Your Look</h3>
        <div class="cart__complementary-products-slider splide">
          <div class="splide__arrows">
            <button class="splide__arrow splide__arrow--prev" type="button">
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 1L1 6L6 11" stroke="#0F0F0F" stroke-linecap="square"/>
              </svg>
            </button>
            <button class="splide__arrow splide__arrow--next" type="button">
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L6 6L1 11" stroke="#0F0F0F" stroke-linecap="square"/>
              </svg>
            </button>
          </div>
          <div class="splide__track">
            <ul class="splide__list"></ul>
          </div>
        </div>
      </div>
    </div>
    <footer class="cart__footer">
      <div class="cart__footer-row">
        <h3 class="cart__footer-label body">Subtotal</h3>
        <span class="cart__footer-value body--bold">${createAnimatedLoader().outerHTML}</span>
      </div>
      <button type="submit" name="checkout" class="cart__checkout body">
        <span class="loader--spinner"></span>
      </button>
    </footer>
  `;
}

// Refactored
function updateExistingItem(item) {
  const priceElement = item.querySelector(".cart-item__price");
  if (priceElement) createLoadingPlaceholder(priceElement);

  const actionsEl = item.querySelector(".cart-item__actions");
  if (actionsEl) {
    actionsEl.innerHTML = `
      <div class="placeholder-loader">${createAnimatedLoader().outerHTML}</div>
      <div class="placeholder-remove"></div>
    `;
  }
}

// Refactored
function addNewItem(container, variantId, image, title, selections) {
  const cartItem = document.createElement("article");
  cartItem.className = "cart-item";
  cartItem.setAttribute("data-line-item-key", `temp-${variantId}`);

  cartItem.innerHTML = `
    <div class="cart-item__image">
      <img src="${image}" alt="${title}" width="100" height="150">
    </div>
    <div class="cart-item__content">
      <div class="cart-item__row">
        <div class="cart-item__details">
          <h3 class="cart-item__title body--bold">
            <a href="${window.location.pathname}">${title}</a>
          </h3>
          <div class="cart-item__specifics">
            <p class="cart-item__variant small">${selections}</p>
            <div class="cart-item__price">
              <div class="price-placeholder">${createAnimatedLoader().outerHTML}</div>
            </div>
          </div>
          <div class="cart-item__actions">
            <div class="placeholder-loader">${createAnimatedLoader().outerHTML}</div>
            <div class="placeholder-remove"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.prepend(cartItem);
}

// Refactored
function updateSliderWithCurrentProducts() {
  const productIds = Array.from(document.querySelectorAll(".cart-item .cart-item__title a"))
    .map((link) => link.href.split("/products/")[1]?.split("?")[0])
    .filter(Boolean);

  if (productIds.length > 0) {
    setTimeout(() => rebuildComplementarySlider(productIds), 100);
  } else {
    setTimeout(handleSliderIndependently, 100);
  }
}

// Refactored
function addErrorWithTimeout(item, message) {
  const error = document.createElement("div");
  error.className = "cart-item__error small cart-item__error--permanent";
  error.textContent = message;

  const target = item.querySelector("#js--addtocart, .cart-item__actions");
  if (target) target.after(error);

  const removeErrors = () => {
    document.querySelectorAll(".cart-item__error--permanent").forEach((el) => el.remove());
    document.removeEventListener("click", removeErrors);
  };

  setTimeout(() => document.addEventListener("click", removeErrors), 100);
}

// Refactored
function isGiftCardItem(rootItem) {
  const itemTitle = rootItem.querySelector(".cart-item__title a")?.textContent || "";
  return itemTitle.toLowerCase().includes("gift card");
}

// Refactored
function isGiftCardProduct() {
  const productTitle = document.querySelector(".product-details__title")?.textContent || "";
  return productTitle.toLowerCase().includes("gift card");
}

// Refactored
async function getCartProductIds() {
  const productHandles = new Set();
  const links = document.querySelectorAll(".cart-item .cart-item__title a");

  const handles = Array.from(links)
    .map((link) => link.href.split("/products/")[1]?.split("?")[0])
    .filter(Boolean);

  handles.forEach((handle) => productHandles.add(handle));

  const productIds = new Set(
    await Promise.all(
      handles.map(async (handle) => {
        try {
          const res = await fetch(`/products/${handle}.js`);
          return res.ok ? (await res.json()).id : null;
        } catch {
          return null;
        }
      })
    ).then((ids) => ids.filter(Boolean))
  );

  return { productIds, productHandles };
}

// Refactored
function isProductInCart(product, cartProductIds, cartProductHandles) {
  if (cartProductIds.has(product.id) || cartProductHandles.has(product.handle)) {
    return true;
  }

  const hasVariantInCart = product.variants?.some((variant) => cartProductIds.has(variant.product_id));

  if (hasVariantInCart) return true;

  const handleFromUrl = product.url?.split("/products/")[1]?.split("?")[0];
  return handleFromUrl && cartProductHandles.has(handleFromUrl);
}

// Currently refactoring this
function addCartEventListeners() {
  document.querySelectorAll(".cart-item__quantity button").forEach((button) => {
    button.addEventListener("click", async () => {
      const rootItem = button.closest(".cart-item");
      const key = rootItem.getAttribute("data-line-item-key");
      const currentQuantity = Number(button.parentElement.querySelector("input").value);
      const isUp = button.classList.contains("cart-item__quantity-button--plus");

      if (isUp && !isGiftCardItem(rootItem)) {
        const inventoryLimit = parseInt(rootItem.getAttribute("data-inventory-quantity") || "Infinity", 10);
        const adjustedInventoryLimit = inventoryLimit === Infinity ? Infinity : Math.max(0, inventoryLimit - 5);

        if (currentQuantity >= adjustedInventoryLimit) {
          applyCartTotalLoaders();

          const actionsEl = rootItem.querySelector(".cart-item__actions");
          createLoadingPlaceholder(actionsEl);
          actionsEl.innerHTML = `
            <div class="placeholder-loader"></div>
            <div class="placeholder-remove"></div>
          `;
          actionsEl.querySelector(".placeholder-loader").appendChild(createAnimatedLoader());

          createLoadingPlaceholder(rootItem.querySelector(".cart-item__price"));

          await new Promise((resolve) => setTimeout(resolve, 800));
          await updateCartDrawer();

          const updatedRootItem = document.querySelector(`[data-line-item-key="${key}"]`);
          if (updatedRootItem) {
            addErrorWithTimeout(
              updatedRootItem,
              adjustedInventoryLimit === 0
                ? "Sorry, this item is out of stock."
                : `Sorry, only ${adjustedInventoryLimit} ${adjustedInventoryLimit === 1 ? "item" : "items"} available.`
            );
          }
          return;
        }
      }

      const newQuantity = isUp ? currentQuantity + 1 : currentQuantity - 1;

      if (newQuantity === 0) {
        const remainingItems = document.querySelectorAll(".cart-item").length;

        rootItem.style.display = "none";

        if (remainingItems === 1) {
          const shippingBar = document.querySelector(".cart__shipping");
          if (shippingBar) shippingBar.style.display = "none";
        }

        applyCartTotalLoaders();

        const remainingCartItems = document.querySelectorAll('.cart-item:not([style*="display: none"])');
        const remainingProductIds = [];

        remainingCartItems.forEach((item) => {
          const itemKey = item.getAttribute("data-line-item-key");
          if (itemKey !== key) {
            const link = item.querySelector(".cart-item__title a");
            if (link) {
              const url = link.getAttribute("href");
              const productHandle = url.split("/products/")[1]?.split("?")[0];
              if (productHandle) {
                remainingProductIds.push(productHandle);
              }
            }
          }
        });

        rebuildComplementarySlider(remainingProductIds);

        try {
          await fetch("/cart/update.js", {
            method: "post",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ updates: { [key]: 0 } }),
          });
          await updateCartDrawer();
        } catch (e) {
          console.error("Error removing item:", e);
          rootItem.style.display = "";
          if (remainingItems === 1) {
            const shippingBar = document.querySelector(".cart__shipping");
            if (shippingBar) shippingBar.style.display = "block";
          }
          await updateCartDrawer();
        }
        return;
      }

      try {
        applyCartTotalLoaders();

        const actionsEl = rootItem.querySelector(".cart-item__actions");
        createLoadingPlaceholder(actionsEl);
        actionsEl.innerHTML = `
          <div class="placeholder-loader"></div>
          <div class="placeholder-remove"></div>
        `;
        actionsEl.querySelector(".placeholder-loader").appendChild(createAnimatedLoader());

        createLoadingPlaceholder(rootItem.querySelector(".cart-item__price"));

        await fetch("/cart/update.js", {
          method: "post",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ updates: { [key]: newQuantity } }),
        });

        await updateCartDrawer(true);
      } catch (e) {
        console.error("Error updating quantity:", e);
        await updateCartDrawer();

        const updatedRootItem = document.querySelector(`[data-line-item-key="${key}"]`);
        if (updatedRootItem) {
          addErrorWithTimeout(updatedRootItem, "Could not update quantity. Please try again.");
        }
      }
    });
  });

  document.querySelectorAll(".cart-item__remove").forEach((button) => {
    button.addEventListener("click", async () => {
      const cartItem = button.closest(".cart-item");
      const key = cartItem.getAttribute("data-line-item-key");
      const remainingItems = document.querySelectorAll(".cart-item").length;

      cartItem.style.display = "none";

      if (remainingItems === 1) {
        const shippingBar = document.querySelector(".cart__shipping");
        if (shippingBar) shippingBar.style.display = "none";
      }

      applyCartTotalLoaders();

      const remainingCartItems = document.querySelectorAll('.cart-item:not([style*="display: none"])');
      const remainingProductIds = [];

      remainingCartItems.forEach((item) => {
        const itemKey = item.getAttribute("data-line-item-key");
        if (itemKey !== key) {
          const link = item.querySelector(".cart-item__title a");
          if (link) {
            const url = link.getAttribute("href");
            const productHandle = url.split("/products/")[1]?.split("?")[0];
            if (productHandle) {
              remainingProductIds.push(productHandle);
            }
          }
        }
      });

      rebuildComplementarySlider(remainingProductIds);

      try {
        await fetch("/cart/update.js", {
          method: "post",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ updates: { [key]: 0 } }),
        });
        await updateCartDrawer();
      } catch (e) {
        console.error("Error removing item:", e);
        cartItem.style.display = "";
        if (remainingItems === 1) {
          const shippingBar = document.querySelector(".cart__shipping");
          if (shippingBar) shippingBar.style.display = "block";
        }
        await updateCartDrawer();
      }
    });
  });

  document.querySelector(".cart__container")?.addEventListener("click", (e) => e.stopPropagation());
  document.querySelectorAll(".cart__close, .cart").forEach((el) => {
    el.addEventListener("click", closeCartDrawer);
  });
}

function handleAddToCart(form) {
  return async (e) => {
    e.preventDefault();

    const variantId = form.querySelector("#js--variant-id")?.value || "";
    const quantityInput = form.querySelector('input[name="quantity"]');
    const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

    const addButton = form.querySelector("#js--addtocart");
    if (!addButton || addButton.disabled) return;

    const originalText = addButton.innerHTML;
    addButton.innerHTML = `<span class="loader--spinner"></span>`;

    try {
      const inventoryQuantity = parseInt(
        document.querySelector("#js--variant-inventory-quantity")?.value || "Infinity",
        10
      );
      const adjustedInventoryQuantity = inventoryQuantity === Infinity ? Infinity : Math.max(0, inventoryQuantity - 5);
      const cart = await fetchCart();

      let existingItem = null;
      if (cart && cart.items) {
        existingItem = cart.items.find((item) => item.variant_id.toString() === variantId);
      }

      const totalRequestedQuantity = (existingItem ? existingItem.quantity : 0) + quantity;

      if (
        !isGiftCardProduct() &&
        adjustedInventoryQuantity !== Infinity &&
        totalRequestedQuantity > adjustedInventoryQuantity
      ) {
        addButton.innerHTML = originalText;
        showError(
          form,
          adjustedInventoryQuantity === 0
            ? "Sorry, this item is out of stock."
            : `Sorry, only ${adjustedInventoryQuantity} ${
                adjustedInventoryQuantity === 1 ? "item" : "items"
              } available.`
        );
        return;
      }

      openCartDrawer();
      applyOptimisticUI();

      await fetch("/cart/add.js", {
        method: "post",
        body: new FormData(form),
      });

      await updateCartDrawer();
    } catch (e) {
      console.error("Error adding to cart:", e);
      addButton.innerHTML = originalText;
      showError(form, "Could not add to cart. Please try again.");
    } finally {
      if (addButton.innerHTML !== originalText) {
        addButton.innerHTML = originalText;
      }
    }
  };
}

cartElements.forms.forEach((form) => {
  form.addEventListener("submit", handleAddToCart(form));
});

cartElements.cartLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    openCartDrawer();
    updateCartDrawer();
  });
});

async function fetchComplementaryProducts(productIds) {
  const limitedProductIds = productIds.slice(0, 4);
  const { productIds: cartProductIds, productHandles: cartProductHandles } = await getCartProductIds();
  const seenProductIds = new Set();
  const seenProductHandles = new Set();
  const finalProducts = [];

  const productPromises = limitedProductIds.map(async (productId) => {
    try {
      const productResponse = await fetch(`/products/${productId}.js`);
      if (!productResponse.ok) return { productId, products: [] };

      const productData = await productResponse.json();
      const actualProductId = productData.id;

      const response = await fetch(
        `/recommendations/products.json?product_id=${actualProductId}&limit=10&intent=related`
      );
      if (!response.ok) return { productId, products: [] };

      const data = await response.json();
      const products = data.products || [];

      return { productId, products };
    } catch (e) {
      console.error("Error fetching:", e);
      return { productId, products: [] };
    }
  });

  const allResults = await Promise.all(productPromises);

  for (const result of allResults) {
    if (!result.products || result.products.length === 0) continue;

    let productsAddedForThisItem = 0;

    for (const product of result.products) {
      if (productsAddedForThisItem >= 2) break;

      if (seenProductIds.has(product.id)) continue;
      if (seenProductHandles.has(product.handle)) continue;

      if (isProductInCart(product, cartProductIds, cartProductHandles)) continue;

      seenProductIds.add(product.id);
      seenProductHandles.add(product.handle);
      finalProducts.push(product);
      productsAddedForThisItem++;
    }
  }

  return finalProducts.slice(0, 8);
}

function hideComplementaryProducts() {
  const container = document.querySelector(".cart__complementary-products");
  if (container) {
    container.style.display = "none";
  }
}

async function updateComplementarySlider() {
  const container = document.querySelector(".cart__complementary-products");
  const loading = document.querySelector(".cart__complementary-products-loading");
  const content = document.querySelector(".cart__complementary-products-content");
  const splideList = document.querySelector(".cart__complementary-products .splide__list");

  if (!container || !loading || !content || !splideList) return;

  const cartItems = document.querySelectorAll(".cart-item");

  if (cartItems.length === 0) {
    hideComplementaryProducts();
    return;
  }

  const productIds = [];
  cartItems.forEach((item) => {
    const link = item.querySelector(".cart-item__title a");
    if (link) {
      const url = link.getAttribute("href");
      const productHandle = url.split("/products/")[1]?.split("?")[0];
      if (productHandle) {
        productIds.push(productHandle);
      }
    }
  });

  const currentProductIds = JSON.stringify(productIds.sort());

  container.style.display = "block";
  loading.style.display = "block";
  content.style.display = "none";

  const products = await fetchComplementaryProducts(productIds);
  renderComplementarySlider(products, currentProductIds);
}

function renderComplementarySlider(products, productIds = null) {
  const container = document.querySelector(".cart__complementary-products");
  const loading = document.querySelector(".cart__complementary-products-loading");
  const content = document.querySelector(".cart__complementary-products-content");
  const splideList = document.querySelector(".cart__complementary-products .splide__list");

  if (!container || !loading || !content || !splideList) return;

  if (products.length === 0) {
    hideComplementaryProducts();
    return;
  }

  if (productIds) {
  }

  if (window.complementarySlider) {
    window.complementarySlider.destroy();
    window.complementarySlider = null;
  }

  splideList.innerHTML = "";
  products.forEach((product) => {
    const slide = document.createElement("li");
    slide.className = "splide__slide";
    slide.innerHTML = `
      <a href="/products/${product.handle}">
        <div class="cart__complementary-products-image-wrapper">
          <img src="https:${product.featured_image}&width=300" alt="${
      product.title
    }" class="cart__complementary-products-image">
        </div>
        <h3 class="body--bold cart__complementary-products-title-product">${product.title}</h3>
        <p class="small cart__complementary-products-price">$${formatMoney(product.price)}</p>
      </a>
    `;
    splideList.appendChild(slide);
  });

  window.complementarySlider = new Splide(container.querySelector(".cart__complementary-products-slider"), {
    type: "slide",
    perPage: 2,
    gap: "var(--space-2xs)",
    arrows: true,
    pagination: false,
  }).mount();

  const arrows = container.querySelectorAll(".splide__arrow");
  if (products.length <= 2) {
    arrows.forEach((arrow) => (arrow.style.display = "none"));
  } else {
    arrows.forEach((arrow) => (arrow.style.display = "block"));
  }

  container.style.display = "block";
  loading.style.display = "none";
  content.style.display = "block";
}
