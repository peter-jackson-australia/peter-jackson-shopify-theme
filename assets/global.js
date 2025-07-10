window.addEventListener("load", () => {
  quicklink.listen();
});

const cartElements = {
  indicators: document.querySelectorAll(".cart-indicator"),
  drawer: document.querySelector(".cart"),
  forms: document.querySelectorAll('form[action="/cart/add"]'),
  cartLinks: document.querySelectorAll(".js-cart-icon"),
};

document.addEventListener("DOMContentLoaded", () => {
  initCartFromStorage();
  addCartEventListeners();
});

function initCartFromStorage() {
  const storedCartData = localStorage.getItem("cartData");

  if (storedCartData) {
    try {
      const cartData = JSON.parse(storedCartData);

      if (cartData.count > 0) {
        updateCartIndicators(cartData.count);
      }

      if (cartData.items && cartData.items.length > 0) {
        prePopulateCartDrawer(cartData);
      }
    } catch (e) {
      console.error("Error parsing stored cart data:", e);
    }
  }

  fetchCart().then((cart) => {
    if (cart) updateCartDrawer();
  });
}

function prePopulateCartDrawer(cartData) {
  const cartEmpty = document.querySelector(".cart__empty-state");
  if (!cartEmpty) return;

  cartEmpty.remove();
  const cartForm = document.querySelector(".cart__form");

  const shippingBar = document.createElement("div");
  shippingBar.className = "cart__shipping";
  shippingBar.style.display = "block";
  shippingBar.innerHTML = `
    <p class="cart__shipping-text small"></p>
    <div class="cart__shipping-bar">
      <div class="cart__shipping-progress"></div>
    </div>
  `;
  cartForm.appendChild(shippingBar);

  const itemsContainer = document.createElement("div");
  itemsContainer.className = "cart__items";
  cartForm.appendChild(itemsContainer);

  cartData.items.forEach((item) => {
    const cartItem = document.createElement("article");
    cartItem.className = "cart-item";
    cartItem.setAttribute("data-line-item-key", item.key);
    if (item.variant && item.variant.inventory_quantity !== undefined) {
      cartItem.setAttribute("data-inventory-quantity", item.variant.inventory_quantity);
    }

    let variantInfo = "One Size";
    if (item.variant_title && item.variant_title !== "Default Title") {
      if (item.options_with_values && Array.isArray(item.options_with_values)) {
        try {
          const parts = item.options_with_values.map(
            (opt) => `${opt.name}: ${(opt.value || "").toString().replace(".0", "")}`
          );
          if (parts.length > 0) {
            variantInfo = parts.join(", ");
          }
        } catch (e) {
          console.error("Error formatting variant info:", e);
          variantInfo = item.variant_title.replace(".0", "");
        }
      } else {
        variantInfo = item.variant_title.replace(".0", "");
      }
    }

    cartItem.innerHTML = `
      <div class="cart-item__image">
        <img
          src="${item.image}"
          alt="${item.title}"
          width="100"
          height="auto"
        >
      </div>
      <div class="cart-item__content">
        <div class="cart-item__row">
          <div class="cart-item__details">
            <h3 class="cart-item__title body--bold">
              <a href="${item.url}">${item.product_title || item.title}</a>
            </h3>
            <div class="cart-item__specifics">
              <p class="cart-item__variant small">${variantInfo}</p>
              <div class="cart-item__price">
                <p class="small">${formatMoney(item.line_price)}</p>
              </div>
            </div>
            <div class="cart-item__actions">
              <div class="cart-item__quantity">
                <button
                  class="cart-item__quantity-button cart-item__quantity-button--minus body"
                  type="button"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="text"
                  class="cart-item__quantity-input small"
                  readonly
                  value="${item.quantity}"
                  aria-label="Quantity"
                >
                <button
                  class="cart-item__quantity-button cart-item__quantity-button--plus body"
                  type="button"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button type="button" class="cart-item__remove small">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;

    itemsContainer.appendChild(cartItem);
  });

  if (!document.querySelector(".cart__footer")) {
    const footer = document.createElement("footer");
    footer.className = "cart__footer";
    footer.innerHTML = `
      <div class="cart__footer-row">
        <h3 class="cart__footer-label body">Subtotal</h3>
        <span class="cart__footer-value body--bold">${formatMoney(cartData.total)}</span>
      </div>
      <button type="submit" name="checkout" class="cart__checkout body" style="height: var(--space-xl);">Checkout</button>
    `;
    cartForm.appendChild(footer);
  }

  updateFreeShippingBar(cartData.total);
}

function formatMoney(cents) {
  const format = "{{amount_with_comma_separator}}";
  if (typeof cents === "string") {
    cents = cents.replace(".", "");
  }
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = (format || "{{amount}}").match(placeholderRegex)[1];

  function formatWithDelimiters(number, precision = 2, thousands = ",", decimal = ".") {
    if (isNaN(number) || number == null) return 0;
    number = (number / 100.0).toFixed(precision);
    const parts = number.split(".");
    const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`);
    const centsAmount = parts[1] ? decimal + parts[1] : "";
    return dollarsAmount + centsAmount;
  }

  switch (formatString) {
    case "amount":
      return formatWithDelimiters(cents, 2);
    case "amount_with_comma_separator":
      return formatWithDelimiters(cents, 2, ".", ",");
    case "amount_no_decimals":
      return formatWithDelimiters(cents, 0);
    case "amount_with_space_separator":
      return formatWithDelimiters(cents, 2, " ", ",");
    default:
      return formatWithDelimiters(cents, 2);
  }
}

function createAnimatedLoader() {
  const loader = document.createElement("div");
  loader.className = "animated-loader";
  loader.innerHTML = `<svg fill=#E7E7E7 style=height:4px;display:block viewBox="0 0 40 4"xmlns=http://www.w3.org/2000/svg><style>.react{animation:moving 1s ease-in-out infinite}@keyframes moving{0%{width:0%}50%{width:100%;transform:translate(0,0)}100%{width:0;right:0;transform:translate(100%,0)}}</style><rect class=react fill=#E7E7E7 height=4 width=40 /></svg>`;
  return loader;
}

function showError(container, message, className = "product-error body") {
  const existingError = container.querySelector(`.${className.split(" ")[0]}`);
  if (existingError) existingError.remove();

  const errorElement = document.createElement("div");
  errorElement.className = className;
  errorElement.textContent = message;

  const target = container.querySelector("#js--addtocart") || container.querySelector(".cart-item__actions");
  if (target) target.after(errorElement);
  return errorElement;
}

function createLoadingPlaceholder(element) {
  const originalHTML = element.innerHTML;
  element.innerHTML = "";
  element.appendChild(createAnimatedLoader());
  return originalHTML;
}

function applyCartTotalLoaders() {
  document.querySelectorAll(".cart__footer-value").forEach((el) => createLoadingPlaceholder(el));

  const checkoutButton = document.querySelector(".cart__checkout");
  if (checkoutButton) checkoutButton.innerHTML = '<span class="loader--spinner"></span>';
}

function openCartDrawer() {
  cartElements.drawer.classList.add("cart--active");
  document.body.classList.add("cart-open");
}

function closeCartDrawer() {
  cartElements.drawer.classList.remove("cart--active");
  document.body.classList.remove("cart-open");
}

function updateCartIndicators(count) {
  cartElements.indicators.forEach((el) => {
    el.style.visibility = "visible";
    el.classList.toggle("hide", count <= 0);
  });
  localStorage.setItem("cartCount", count.toString());
}

async function fetchCart() {
  try {
    const res = await fetch("/cart.js");
    if (!res.ok) throw new Error("Failed to fetch cart");

    const cart = await res.json();

    localStorage.setItem(
      "cartData",
      JSON.stringify({
        count: cart.item_count,
        items: cart.items,
        total: cart.total_price,
        timestamp: Date.now(),
        hasItems: cart.item_count > 0,
      })
    );

    updateCartIndicators(cart.item_count);
    return cart;
  } catch (e) {
    console.error("Error fetching cart:", e);
    return null;
  }
}

async function updateCartDrawer() {
  try {
    // Store current progress state BEFORE updating
    const currentProgress = document.querySelector(".cart__shipping-progress");
    const currentWidth = currentProgress ? currentProgress.style.width || "0%" : "0%";
    
    const [drawerRes, cartData] = await Promise.all([fetch("/?section_id=cart-drawer"), fetchCart()]);

    const text = await drawerRes.text();
    const html = document.createElement("div");
    html.innerHTML = text;

    const images = html.querySelectorAll(".cart-item__image img");
    await Promise.all(
      Array.from(images).map((img) => {
        return new Promise((resolve) => {
          const preloadImg = new Image();
          preloadImg.onload = resolve;
          preloadImg.onerror = resolve;
          preloadImg.src = img.src;
        });
      })
    );

    // CRITICAL: Prepare the shipping bar in the new HTML before replacing
    const newShippingBar = html.querySelector(".cart__shipping");
    const hasItems = html.querySelector(".cart-item");

    if (newShippingBar && hasItems) {
      // Pre-configure the shipping bar with the correct content and visibility
      newShippingBar.style.display = "block";
      newShippingBar.style.height = "93px";

      const threshold = 9900;
      const newText = newShippingBar.querySelector(".cart__shipping-text");
      const newProgress = newShippingBar.querySelector(".cart__shipping-progress");

      if (cartData && newText && newProgress) {
        // Set the text and preserve current width for animation
        if (cartData.total_price >= threshold) {
          newText.textContent = "Your order has free shipping!";
        } else {
          const remaining = formatMoney(threshold - cartData.total_price);
          newText.textContent = `${remaining} away from free shipping`;
        }
        // Start from current width, not 0%
        newProgress.style.width = currentWidth;
      }
    }

    // Now replace the cart content - shipping bar will start at current state
    cartElements.drawer.innerHTML = html.querySelector(".cart").innerHTML;
    addCartEventListeners();

    // IMPORTANT: Trigger animation after DOM update
    const cart = await fetchCart();
    if (cart) {
      // Small delay to ensure DOM is ready, then animate from current to new
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

function updateFreeShippingBar(cartTotal) {
  const shipping = document.querySelector(".cart__shipping");
  const text = document.querySelector(".cart__shipping-text");
  const progress = document.querySelector(".cart__shipping-progress");

  if (!shipping) return;

  shipping.classList.remove("cart__shipping--loading");

  const threshold = 9900;
  const hasItems = document.querySelector(".cart-item");

  if (!hasItems) {
    shipping.style.display = "none";
    return;
  }

  shipping.style.height = "93px";
  if (shipping.style.display === "none") {
    shipping.style.display = "block";
  }

  if (cartTotal >= threshold) {
    text.textContent = "Your order has free shipping!";
    progress.style.width = "100%";
  } else {
    const remaining = formatMoney(threshold - cartTotal);
    text.textContent = `${remaining} away from free shipping`;
    progress.style.width = `${(cartTotal / threshold) * 100}%`;
  }
}

function animateShippingProgress(cartTotal) {
  const progress = document.querySelector(".cart__shipping-progress");
  if (!progress) return;

  const threshold = 9900;
  const targetPercent = cartTotal >= threshold ? 100 : (cartTotal / threshold) * 100;

  // Get current width (it should already be set from before the update)
  const currentWidth = progress.style.width || "0%";
  const currentPercent = parseFloat(currentWidth) || 0;

  // Only animate if there's a meaningful difference
  if (Math.abs(targetPercent - currentPercent) > 1) {
    // Force reflow to ensure starting position is rendered
    progress.offsetWidth;
    
    // Now animate to target
    progress.style.width = `${targetPercent}%`;
  } else {
    // No significant change, just set it
    progress.style.width = `${targetPercent}%`;
  }
}

function applyOptimisticUI() {
  const productTitle = document.querySelector(".product-details__title")?.textContent || "";

  let variantSelections = "One Size";

  try {
    const options = [];
    document.querySelectorAll(".js--variant-options").forEach((optGroup) => {
      const legend = optGroup.querySelector("legend");
      if (!legend) return;

      const optionName = legend.textContent.replace(":", "").trim();
      const selectedInput = optGroup.querySelector(".js--variant-option:checked");
      if (!selectedInput) return;

      const label = selectedInput.nextElementSibling;
      if (!label) return;

      const optionValue = label.textContent.trim();
      if (optionName && optionValue) {
        options.push(`${optionName}: ${optionValue}`);
      }
    });

    if (options.length > 0) {
      variantSelections = options.join(", ");
    }
  } catch (e) {
    console.error("Error formatting variant selections:", e);
    variantSelections =
      Array.from(document.querySelectorAll(".js--variant-option:checked"))
        .map((input) => input.nextElementSibling?.textContent?.trim())
        .filter(Boolean)
        .join(" / ") || "One Size";
  }

  // More reliable image selection - try multiple selectors
  let productImage = "";
  
  // Try to get the featured/main product image first
  const selectors = [
    ".splide__slide.is-active img", // Active slide first
    ".splide__slide:first-child img", // First slide as fallback
    ".product-gallery img:first-child", // Alternative gallery structure
    ".product-image img", // Simple product image
    ".splide__slide img" // Original selector as last resort
  ];
  
  for (const selector of selectors) {
    const img = document.querySelector(selector);
    if (img && img.src) {
      productImage = img.src;
      break;
    }
  }
  
  // If still no image, try getting the main product image from meta or data attributes
  if (!productImage) {
    const metaImage = document.querySelector('meta[property="og:image"]');
    if (metaImage) {
      productImage = metaImage.content;
    }
  }

  const variantId = document.querySelector("#js--variant-id")?.value || "";

  applyCartTotalLoaders();

  const isCartEmpty = document.querySelector(".cart__empty-state");
  if (isCartEmpty) {
    const cartForm = document.querySelector(".cart__form");
    isCartEmpty.remove();

    const itemsContainer = document.createElement("div");
    itemsContainer.className = "cart__items";
    cartForm.prepend(itemsContainer);

    const shippingBar = document.createElement("div");
    shippingBar.className = "cart__shipping cart__shipping--loading";
    shippingBar.style.display = "block";
    shippingBar.style.height = "93px";
    shippingBar.innerHTML = `
      <p class="cart__shipping-text small"></p>
      <div class="cart__shipping-bar">
        <div class="cart__shipping-progress"></div>
      </div>
    `;
    cartForm.insertBefore(shippingBar, itemsContainer);

    const textLoader = shippingBar.querySelector(".cart__shipping-text");
    textLoader.appendChild(createAnimatedLoader());

    if (!document.querySelector(".cart__footer")) {
      const footer = document.createElement("footer");
      footer.className = "cart__footer";
      footer.innerHTML = `
        <div class="cart__footer-row">
          <h3 class="cart__footer-label body">Subtotal</h3>
          <span class="cart__footer-value body--bold"></span>
        </div>
        <button type="submit" name="checkout" class="cart__checkout body"></button>
      `;
      cartForm.appendChild(footer);

      const newCheckoutButton = footer.querySelector(".cart__checkout");
      newCheckoutButton.innerHTML = '<span class="loader--spinner"></span>';

      const footerValue = footer.querySelector(".cart__footer-value");
      footerValue.appendChild(createAnimatedLoader());
    }
  }

  const itemsContainer = document.querySelector(".cart__items");
  if (!itemsContainer) return;

  const existingItem = document.querySelector(`.cart-item[data-line-item-key*="${variantId}"]`);

  if (existingItem) {
    const priceElement = existingItem.querySelector(".cart-item__price");
    if (priceElement) createLoadingPlaceholder(priceElement);

    const actionsEl = existingItem.querySelector(".cart-item__actions");
    if (actionsEl) {
      actionsEl.innerHTML = `
        <div class="placeholder-loader"></div>
        <div class="placeholder-remove"></div>
      `;
      actionsEl.querySelector(".placeholder-loader").appendChild(createAnimatedLoader());
    }
  } else {
    const cartItem = document.createElement("article");
    cartItem.className = "cart-item";
    cartItem.setAttribute("data-line-item-key", `temp-${variantId}`);

    cartItem.innerHTML = `
      <div class="cart-item__image">
        <img src="${productImage}" alt="${productTitle}" width="100" height="150">
      </div>
      <div class="cart-item__content">
        <div class="cart-item__row">
          <div class="cart-item__details">
            <h3 class="cart-item__title body--bold">
              <a href="${window.location.pathname}">${productTitle}</a>
            </h3>
            <div class="cart-item__specifics">
              <p class="cart-item__variant small">${variantSelections}</p>
              <div class="cart-item__price">
                <div class="price-placeholder"></div>
              </div>
            </div>
            <div class="cart-item__actions">
              <div class="placeholder-loader"></div>
              <div class="placeholder-remove"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    cartItem.querySelector(".price-placeholder").appendChild(createAnimatedLoader());
    cartItem.querySelector(".placeholder-loader").appendChild(createAnimatedLoader());

    itemsContainer.prepend(cartItem);
  }
}

function addErrorWithTimeout(item, message) {
  const errorElement = showError(item, message, "cart-item__error small cart-item__error--permanent");

  const clearErrorOnClick = () => {
    const permanentErrors = document.querySelectorAll(".cart-item__error--permanent");
    permanentErrors.forEach((error) => {
      error.classList.add("fade-out");
      setTimeout(() => error.remove(), 800);
    });
    document.removeEventListener("click", clearErrorOnClick);
  };

  setTimeout(() => {
    document.addEventListener("click", clearErrorOnClick);
  }, 100);
}

function isGiftCardItem(rootItem) {
  const itemTitle = rootItem.querySelector(".cart-item__title a")?.textContent || "";
  return itemTitle.toLowerCase().includes("gift card");
}

function isGiftCardProduct() {
  const productTitle = document.querySelector(".product-details__title")?.textContent || "";
  return productTitle.toLowerCase().includes("gift card");
}

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
          body: JSON.stringify({ updates: { [key]: isUp ? currentQuantity + 1 : currentQuantity - 1 } }),
        });

        await updateCartDrawer();
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

      try {
        await fetch("/cart/update.js", {
          method: "post",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ updates: { [key]: 0 } }),
        });
        updateCartDrawer();
      } catch (e) {
        console.error("Error removing item:", e);
        cartItem.style.display = "";
        if (remainingItems === 1) {
          const shippingBar = document.querySelector(".cart__shipping");
          if (shippingBar) shippingBar.style.display = "block";
        }
        updateCartDrawer();
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