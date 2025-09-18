const cartElements = {
  countBadges: () => document.querySelectorAll(".cart-count-indicator"),
  drawer: () => document.querySelector(".cart"),
  addToCartForms: () => document.querySelectorAll('form[action="/cart/add"]'),
  cartIcons: () => document.querySelectorAll(".js-cart-icon"),
};

const loadingSVG = `<svg style=height:4px;display:block viewBox="0 0 40 4" xmlns=http://www.w3.org/2000/svg><style>.react{animation:moving 1s ease-in-out infinite}@keyframes moving{0%{width:0}50%{width:100%;transform:translate(0,0)}100%{width:0;right:0;transform:translate(100%,0)}}</style><rect class=react fill=#E7E7E7 height=4 width=40 /></svg>`;

let cartState = { isOpen: false, scrollY: 0 };

const createLoader = () => {
  const div = document.createElement("div");
  div.innerHTML = loadingSVG;
  return div;
};

const showLoader = (element) => {
  const original = element.innerHTML;
  element.replaceChildren(createLoader());
  return original;
};

const showError = (container, text, permanent = false) => {
  container.querySelectorAll('[class*="error"]').forEach((el) => el.remove());
  const error = document.createElement("div");
  error.className = permanent ? "cart-item__error small cart-item__error--permanent" : "product-error body";
  error.textContent = text;
  container.querySelector("#js--addtocart, .cart-item__actions")?.after(error);

  if (permanent) {
    const cleanup = () => {
      document.querySelectorAll(".cart-item__error--permanent").forEach((el) => el.remove());
      document.removeEventListener("click", cleanup);
    };
    setTimeout(() => document.addEventListener("click", cleanup), 100);
  }
};

const isGiftCard = (element) => {
  const title = element?.querySelector?.(".cart-item__title a, .product-details__title")?.textContent || "";
  return title.toLowerCase().includes("gift card");
};

const validateInventory = (maxInventory, currentQty, requestedQty) => {
  const availableLimit = maxInventory === Infinity ? Infinity : Math.max(0, maxInventory - 5);
  const totalRequested = currentQty + requestedQty;

  if (availableLimit === Infinity || totalRequested <= availableLimit) {
    return { isAllowed: true };
  }

  return {
    isAllowed: false,
    availableLimit,
    errorMessage:
      availableLimit === 0
        ? "Sorry, this item is out of stock."
        : `Sorry, only ${availableLimit} ${availableLimit === 1 ? "item" : "items"} available.`,
  };
};

const fetchCartData = async () => {
  try {
    const response = await fetch("/cart.js");
    const cartData = await response.json();
    const simplifiedData = {
      count: cartData.item_count,
      items: cartData.items,
      total: cartData.total_price,
    };
    localStorage.setItem("cartData", JSON.stringify(simplifiedData));
    updateCartBadges(cartData.item_count);
    return cartData;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return null;
  }
};

const toggleCartDrawer = (show = true) => {
  const body = document.body;
  const drawer = cartElements.drawer();

  if (show && !cartState.isOpen) {
    if (body.style.position !== "fixed") {
      cartState.scrollY = window.scrollY;
      Object.assign(body.style, {
        position: "fixed",
        top: `-${cartState.scrollY}px`,
        width: "100%",
      });
    } else {
      cartState.scrollY = Math.abs(parseInt(body.style.top || "0"));
    }

    cartState.isOpen = true;
    body.classList.add("cart-open");
    drawer.classList.add("cart--active");
    window.closeMenu?.(true);
  } else if (!show && cartState.isOpen) {
    cartState.isOpen = false;
    body.classList.remove("cart-open");
    drawer.classList.remove("cart--active");

    if (body.style.position === "fixed") {
      const scrollY = cartState.scrollY || Math.abs(parseInt(body.style.top || "0"));
      document.documentElement.style.scrollBehavior = "auto";
      Object.assign(body.style, { position: "", top: "", width: "" });
      window.scrollTo(0, scrollY);
      document.documentElement.style.scrollBehavior = "";
    }
  }
};

const updateCartBadges = (count) => {
  cartElements.countBadges().forEach((badge) => {
    badge.style.visibility = "visible";
    badge.classList.toggle("hide", count <= 0);
  });
  localStorage.setItem("cartCount", count.toString());
};

const showCartLoading = () => {
  document.querySelectorAll(".cart__footer-value").forEach(showLoader);
  const checkoutBtn = document.querySelector(".cart__checkout");
  if (checkoutBtn) checkoutBtn.innerHTML = '<span class="loader--spinner"></span>';
};

let sliderUpdateInProgress = false;

const sliderHTML = () => `
  <div class="cart__complementary-products-loading">${loadingSVG}</div>
  <div class="cart__complementary-products-content" style="display: none;">
    <h3 class="cart__complementary-products-title heading--l">Complement Your Look</h3>
    <div class="cart__complementary-products-slider splide">
      <div class="splide__arrows">
        <button class="splide__arrow splide__arrow--prev" type="button">
          <svg width="7" height="12" viewBox="0 0 7 12" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1L1 6L6 11" stroke="#0F0F0F" stroke-linecap="square"/>
          </svg>
        </button>
        <button class="splide__arrow splide__arrow--next" type="button">
          <svg width="7" height="12" viewBox="0 0 7 12" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L6 6L1 11" stroke="#0F0F0F" stroke-linecap="square"/>
          </svg>
        </button>
      </div>
      <div class="splide__track"><ul class="splide__list"></ul></div>
    </div>
  </div>`;

const createSliderContainer = () => {
  if (document.querySelector(".cart__complementary-products")) return;

  const cartForm = document.querySelector(".cart__form");
  const footer = document.querySelector(".cart__footer");
  if (!cartForm || !footer) return;

  const container = document.createElement("div");
  container.className = "cart__complementary-products";
  container.style.display = "none";
  container.innerHTML = sliderHTML();
  cartForm.insertBefore(container, footer);
};

const hideSlider = () => {
  window.complementarySlider?.destroy();
  window.complementarySlider = null;
  const container = document.querySelector(".cart__complementary-products");
  if (container) container.style.display = "none";
};

const fetchRecommendations = async (productHandles) => {
  const recommendations = [];
  const processed = new Set(productHandles);

  const getProductRecs = async (handle) => {
    try {
      const productRes = await fetch(`/products/${handle}.js`);
      if (!productRes.ok) return [];
      const product = await productRes.json();
      const recsRes = await fetch(`/recommendations/products.json?product_id=${product.id}&limit=10&intent=related`);
      if (!recsRes.ok) return [];
      const data = await recsRes.json();
      return data.products || [];
    } catch {
      return [];
    }
  };

  const allRecs = await Promise.all(productHandles.slice(0, 4).map(getProductRecs));

  for (const products of allRecs) {
    let added = 0;
    for (const product of products) {
      if (added >= 2 || recommendations.length >= 8) break;
      if (!processed.has(product.handle)) {
        processed.add(product.handle);
        recommendations.push(product);
        added++;
      }
    }
  }
  return recommendations;
};

const updateSlider = async (productHandles) => {
  if (sliderUpdateInProgress) return;
  if (!productHandles?.length) {
    hideSlider();
    return;
  }
  sliderUpdateInProgress = true;

  hideSlider();

  const container = document.querySelector(".cart__complementary-products");
  const loading = container?.querySelector(".cart__complementary-products-loading");
  const content = container?.querySelector(".cart__complementary-products-content");
  const list = container?.querySelector(".splide__list");

  if (!container || !loading || !content || !list) {
    sliderUpdateInProgress = false;
    return;
  }

  container.style.display = "block";
  loading.style.display = "block";
  content.style.display = "none";
  if (!loading.innerHTML.trim()) loading.innerHTML = loadingSVG;

  try {
    const products = await fetchRecommendations(productHandles);
    if (!sliderUpdateInProgress || !products.length) {
      container.style.display = "none";
      return;
    }

    list.innerHTML = products
      .map(
        (p) => `
      <li class="splide__slide">
        <a href="/products/${p.handle}">
          <div class="cart__complementary-products-image-wrapper">
            <img src="https:${p.featured_image}&width=300" alt="${p.title}" class="cart__complementary-products-image">
          </div>
          <h3 class="body--bold cart__complementary-products-title-product">${p.title}</h3>
          <p class="small cart__complementary-products-price">${Shopify.formatMoney(p.price)}</p>
        </a>
      </li>`
      )
      .join("");

    window.complementarySlider = new Splide(container.querySelector(".cart__complementary-products-slider"), {
      type: "slide",
      perPage: 2,
      gap: "var(--space-2xs)",
      arrows: true,
      pagination: false,
    }).mount();

    const arrows = container.querySelector(".splide__arrows");
    if (arrows) arrows.style.display = products.length <= 2 ? "none" : "flex";

    loading.style.display = "none";
    content.style.display = "block";
  } catch (error) {
    console.error("Error updating slider:", error);
    container.style.display = "none";
  } finally {
    sliderUpdateInProgress = false;
  }
};

const initSlider = () => {
  const cartItems = document.querySelectorAll(".cart-item");
  if (!cartItems.length) {
    hideSlider();
    return;
  }

  createSliderContainer();
  const handles = Array.from(cartItems)
    .map((item) => item.querySelector(".cart-item__title a")?.href?.split("/products/")[1]?.split("?")[0])
    .filter(Boolean);

  if (handles.length) updateSlider(handles);
};

const refreshCartContent = async () => {
  try {
    const currentProgressWidth = document.querySelector(".cart__shipping-progress")?.style.width || "0%";
    const [drawerRes, cartData] = await Promise.all([fetch("/?section_id=cart-drawer"), fetchCartData()]);

    const temp = document.createElement("div");
    temp.innerHTML = await drawerRes.text();

    document.querySelectorAll(".cart__shipping--loading").forEach((el) => el.remove());

    const newShipping = temp.querySelector(".cart__shipping");
    const existingShipping = document.querySelector(".cart__shipping");
    if (newShipping && existingShipping) {
      const hasItems = temp.querySelector(".cart-item");
      if (hasItems) {
        Object.assign(newShipping.style, { display: "block", height: "93px" });
        const threshold = 9900;
        const textEl = newShipping.querySelector(".cart__shipping-text");
        const progressEl = newShipping.querySelector(".cart__shipping-progress");

        if (cartData && textEl && progressEl) {
          textEl.textContent =
            cartData.total_price >= threshold
              ? "Your Order Has Free Shipping!"
              : `${Shopify.formatMoney(threshold - cartData.total_price)} Away From Free Shipping`;
          progressEl.style.width = currentProgressWidth;
        }
      }
      existingShipping.replaceWith(newShipping);
    }

    const replaceElement = (selector) => {
      const newEl = temp.querySelector(selector);
      const existing = document.querySelector(selector);
      if (newEl && existing) existing.replaceWith(newEl);
    };

    const optimisticImages = new Map();
    document.querySelectorAll(".cart-item--optimistic").forEach((item) => {
      const key = item.getAttribute("data-line-item-key");
      const img = item.querySelector(".cart-item__image img");
      if (img) optimisticImages.set(key, img.cloneNode(true));
    });

    replaceElement(".cart__items");

    optimisticImages.forEach((img, tempKey) => {
      const variantId = tempKey.replace("temp-", "");
      const newItem = document.querySelector(`[data-line-item-key*="${variantId}"]`);
      const newImg = newItem?.querySelector(".cart-item__image img");
      if (newImg) newImg.replaceWith(img);
    });

    replaceElement(".cart__footer");

    const newEmpty = temp.querySelector(".cart__empty-state");
    const existingEmpty = document.querySelector(".cart__empty-state");
    const cartForm = document.querySelector(".cart__form");

    if (newEmpty && !existingEmpty && cartForm) {
      cartForm.innerHTML = "";
      cartForm.appendChild(newEmpty);
    } else if (!newEmpty && existingEmpty) {
      existingEmpty.remove();
    }

    attachEventListeners();

    if (cartData) {
      setTimeout(() => {
        const progressBar = document.querySelector(".cart__shipping-progress");
        if (progressBar) {
          progressBar.style.width = `${Math.min((cartData.total_price / 9900) * 100, 100)}%`;
        }
      }, 100);
    }

    return true;
  } catch (error) {
    console.error("Error updating cart:", error);
    return false;
  }
};

const getCurrentProductImage = () => {
  const slide = document.querySelector(`[data-imageid="${default_image}"] img`);
  if (slide) {
    const clone = slide.cloneNode(true);
    clone.width = 100;
    clone.height = 150;
    return clone;
  }
  return null;
};

const initEmptyCart = (emptyEl) => {
  const cartForm = document.querySelector(".cart__form");
  emptyEl.remove();

  const shippingHTML = document.querySelector(".cart__shipping")
    ? `<div class="cart__shipping cart__shipping--loading" style="display: block; height: 93px;">
         <p class="cart__shipping-text small">${createLoader().outerHTML}</p>
         <div class="cart__shipping-bar"><div class="cart__shipping-progress"></div></div>
       </div>`
    : "";

  cartForm.innerHTML = `
    ${shippingHTML}
    <div class="cart__items"></div>
    <div class="cart__complementary-products" style="display: block;">${sliderHTML()}</div>
    <footer class="cart__footer">
      <div class="cart__footer-row">
        <h3 class="cart__footer-label body">Subtotal</h3>
        <span class="cart__footer-value body--bold">${createLoader().outerHTML}</span>
      </div>
      <button type="submit" name="checkout" class="cart__checkout body">
        <span class="loader--spinner"></span>
      </button>
    </footer>`;
};

const showItemLoading = (item) => {
  const price = item.querySelector(".cart-item__price");
  if (price) showLoader(price);

  const actions = item.querySelector(".cart-item__actions");
  if (actions) {
    actions.innerHTML = `<div class="placeholder-loader">${
      createLoader().outerHTML
    }</div><div class="placeholder-remove"></div>`;
  }
};

const addOptimisticItem = (container, variantId, image, name) => {
  const item = document.createElement("article");
  item.className = "cart-item cart-item--optimistic";
  item.setAttribute("data-line-item-key", `temp-${variantId}`);

  const imageDiv = document.createElement("div");
  imageDiv.className = "cart-item__image";
  if (image) imageDiv.appendChild(image);

  item.innerHTML = `
    <div class="cart-item__content">
      <div class="cart-item__details">
        <h3 class="cart-item__title body--bold">
          <a href="${window.location.pathname}">${name}</a>
        </h3>
        <div class="cart-item__specifics">
          <div class="cart-item__variant small" style="display: flex; align-items: center; height: auto;">${
            createLoader().outerHTML
          }</div>
          <div class="cart-item__price"><div class="price-placeholder">${createLoader().outerHTML}</div></div>
        </div>
        <div class="cart-item__actions">
          <div class="placeholder-loader">${createLoader().outerHTML}</div>
          <div class="placeholder-remove"></div>
        </div>
      </div>
    </div>`;

  item.insertBefore(imageDiv, item.firstChild);
  container.prepend(item);
};

const showOptimisticUpdate = () => {
  const productName = document.querySelector(".product-details__title")?.textContent || "";
  const variantId = document.querySelector("#js--variant-id")?.value || "";
  const image = getCurrentProductImage();

  showCartLoading();
  createSliderContainer();

  const emptyCart = document.querySelector(".cart__empty-state");
  if (emptyCart) initEmptyCart(emptyCart);

  const container = document.querySelector(".cart__items");
  if (!container) return;

  const existing = document.querySelector(`.cart-item[data-line-item-key*="${variantId}"]`);

  if (existing) {
    showItemLoading(existing);
  } else {
    addOptimisticItem(container, variantId, image, productName);
  }

  setTimeout(() => {
    const handles = Array.from(document.querySelectorAll(".cart-item .cart-item__title a"))
      .map((link) => link.href.split("/products/")[1]?.split("?")[0])
      .filter(Boolean);
    if (handles.length) updateSlider(handles);
  }, 100);
};

const createAddToCartHandler = (form) => async (e) => {
  e.preventDefault();

  const btn = form.querySelector("#js--addtocart");
  if (!btn?.enabled === false) return;

  const variantId = form.querySelector("#js--variant-id")?.value || "";
  const qty = parseInt(form.querySelector('input[name="quantity"]')?.value || "1", 10);
  const originalContent = btn.innerHTML;

  btn.innerHTML = '<span class="loader--spinner"></span>';

  try {
    if (!isGiftCard()) {
      const inventory = parseInt(document.querySelector("#js--variant-inventory-quantity")?.value || "Infinity", 10);
      const currentCart = await fetchCartData();
      const existingItem = currentCart?.items?.find((item) => item.variant_id.toString() === variantId);
      const currentQty = existingItem?.quantity || 0;
      const validation = validateInventory(inventory, currentQty, qty);

      if (!validation.isAllowed) {
        btn.innerHTML = originalContent;
        showError(form, validation.errorMessage);
        return;
      }
    }

    toggleCartDrawer(true);
    showOptimisticUpdate();

    await fetch("/cart/add.js", { method: "post", body: new FormData(form) });
    await refreshCartContent();
    btn.innerHTML = originalContent;
  } catch (error) {
    console.error("Error adding to cart:", error);
    btn.innerHTML = originalContent;
    showError(form, "Could not add to cart. Please try again.");
  }
};

const attachEventListeners = () => {
  const getOtherHandles = (excludeKey) =>
    Array.from(document.querySelectorAll('.cart-item:not([style*="display: none"])'))
      .filter((item) => item.getAttribute("data-line-item-key") !== excludeKey)
      .map((item) => item.querySelector(".cart-item__title a")?.href?.split("/products/")[1]?.split("?")[0])
      .filter(Boolean);

  const deleteItem = async (item, key) => {
    const totalItems = document.querySelectorAll(".cart-item").length;
    item.style.display = "none";

    if (totalItems === 1) {
      const shipping = document.querySelector(".cart__shipping");
      if (shipping) shipping.style.display = "none";
    }

    showCartLoading();
    updateSlider(getOtherHandles(key));

    try {
      await fetch("/cart/update.js", {
        method: "post",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ updates: { [key]: 0 } }),
      });
      await refreshCartContent();
    } catch (error) {
      console.error("Error removing item:", error);
      item.style.display = "";
      if (totalItems === 1) {
        const shipping = document.querySelector(".cart__shipping");
        const slider = document.querySelector(".cart__complementary-products");
        if (shipping) shipping.style.display = "block";
        if (slider) slider.style.display = "block";
      }
      await refreshCartContent();
    }
  };

  document.querySelectorAll(".cart-item__quantity button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const item = btn.closest(".cart-item");
      const key = item.getAttribute("data-line-item-key");
      const input = btn.parentElement.querySelector("input");
      const currentQty = Number(input.value);
      const isPlus = btn.classList.contains("cart-item__quantity-button--plus");

      if (isPlus && !isGiftCard(item)) {
        const maxInventory = parseInt(item.getAttribute("data-inventory-quantity") || "Infinity", 10);
        const validation = validateInventory(maxInventory, currentQty, 1);

        if (!validation.isAllowed) {
          showCartLoading();
          showItemLoading(item);
          await new Promise((resolve) => setTimeout(resolve, 800));
          await refreshCartContent();
          const updated = document.querySelector(`[data-line-item-key="${key}"]`);
          if (updated) showError(updated, validation.errorMessage, true);
          return;
        }
      }

      const newQty = isPlus ? currentQty + 1 : currentQty - 1;

      if (newQty === 0) {
        await deleteItem(item, key);
        return;
      }

      try {
        showCartLoading();
        showItemLoading(item);

        await fetch("/cart/update.js", {
          method: "post",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ updates: { [key]: newQty } }),
        });

        await refreshCartContent();
      } catch (error) {
        console.error("Error updating quantity:", error);
        await refreshCartContent();
        const updated = document.querySelector(`[data-line-item-key="${key}"]`);
        if (updated) showError(updated, "Could not update quantity. Please try again.", true);
      }
    });
  });

  document.querySelectorAll(".cart-item__remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const item = btn.closest(".cart-item");
      const key = item.getAttribute("data-line-item-key");
      await deleteItem(item, key);
    });
  });

  document.querySelector(".cart__container")?.addEventListener("click", (e) => e.stopPropagation());
  document.querySelector(".cart__close")?.addEventListener("click", () => toggleCartDrawer(false));
  document.querySelector(".cart")?.addEventListener("click", (e) => {
    if (e.target.classList.contains("cart")) toggleCartDrawer(false);
  });
};

const loadFromStorage = () => {
  const stored = localStorage.getItem("cartData");
  if (stored) {
    const data = JSON.parse(stored);
    if (data.count > 0) updateCartBadges(data.count);
  }

  fetchCartData().then((cart) => {
    refreshCartContent().then(() => {
      if (cart?.item_count > 0) initSlider();
    });
  });
};

window.openCart = () => toggleCartDrawer(true);
window.closeCart = () => toggleCartDrawer(false);

document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  attachEventListeners();

  cartElements.addToCartForms().forEach((form) => {
    form.addEventListener("submit", createAddToCartHandler(form));
  });

  cartElements.cartIcons().forEach((icon) => {
    icon.addEventListener("click", (e) => {
      e.preventDefault();
      toggleCartDrawer(true);
      refreshCartContent();
    });
  });
});
