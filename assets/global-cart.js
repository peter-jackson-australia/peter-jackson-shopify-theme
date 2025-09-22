const cartElements = {
  countBadges: () => document.querySelectorAll(".cart-count-indicator"),
  drawer: () => document.querySelector(".cart"),
  addToCartForms: () => document.querySelectorAll('form[action="/cart/add"]'),
  cartIcons: () => document.querySelectorAll(".js-cart-icon"),
};

const loadingSVG = `<svg style=height:4px;display:block viewBox="0 0 40 4" xmlns=http://www.w3.org/2000/svg><style>.react{animation:moving 1s ease-in-out infinite}@keyframes moving{0%{width:0}50%{width:100%;transform:translate(0,0)}100%{width:0;right:0;transform:translate(100%,0)}}</style><rect class=react fill=#E7E7E7 height=4 width=40 /></svg>`;

let cartState = { isOpen: false, scrollY: 0, sliderUpdateInProgress: false };

const utils = {
  createLoader: () => Object.assign(document.createElement("div"), { innerHTML: loadingSVG }),
  showLoader: (element) => element.replaceChildren(utils.createLoader()),
  showError: (container, text, delay = 3000) => {
    container.querySelector("#js--addtocart, .cart-item__actions")?.insertAdjacentHTML("afterend", `<div class="product-error body">${text}</div>`);
    setTimeout(() => container.querySelector(".product-error")?.remove(), delay);
  },
  isGiftCard: (element) => element?.querySelector?.(".cart-item__title a, .product-details__title")?.textContent.toLowerCase().includes("gift card"),
  applyStyles: (element, styles) => Object.assign(element.style, styles),
  replaceElements: (selectors, sourceContainer = document) => {
    const temp = sourceContainer;
    selectors.forEach((selector) => {
      const [newEl, existing] = [temp.querySelector(selector), document.querySelector(selector)];
      if (newEl && existing) existing.replaceWith(newEl);
    });
  },
};

const cartAPI = {
  async fetch() {
    try {
      const response = await fetch("/cart.js");
      const cartData = await response.json();
      const simplified = { count: cartData.item_count, items: cartData.items, total: cartData.total_price };
      localStorage.setItem("cartData", JSON.stringify(simplified));
      this.updateBadges(cartData.item_count);
      return cartData;
    } catch (error) {
      console.error("Error fetching cart:", error);
      return null;
    }
  },

  async update(updates) {
    return fetch("/cart/update.js", {
      method: "post",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
  },

  async add(formData) {
    return fetch("/cart/add.js", { method: "post", body: formData });
  },

  updateBadges(count) {
    cartElements.countBadges().forEach((badge) => {
      badge.style.visibility = "visible";
      badge.classList.toggle("hide", count <= 0);
    });
    localStorage.setItem("cartCount", count.toString());
  },
};

const validateInventory = (maxInventory, currentQty, requestedQty) => {
  const availableLimit = maxInventory === Infinity ? Infinity : Math.max(0, maxInventory - 5);
  const totalRequested = currentQty + requestedQty;
  return availableLimit === Infinity || totalRequested <= availableLimit ? { isAllowed: true } : { isAllowed: false, availableLimit, errorMessage: availableLimit === 0 ? "Sorry, this item is out of stock." : `Sorry, only ${availableLimit} ${availableLimit === 1 ? "item" : "items"} available.` };
};

const cartDrawer = {
  toggle(show = true) {
    const body = document.body;
    const drawer = cartElements.drawer();

    if (show && !cartState.isOpen) {
      cartState.scrollY = body.style.position === "fixed" ? Math.abs(parseInt(body.style.top || "0")) : window.scrollY;
      utils.applyStyles(body, { position: "fixed", top: `-${cartState.scrollY}px`, width: "100%" });
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
        utils.applyStyles(body, { position: "", top: "", width: "" });
        window.scrollTo(0, scrollY);
        document.documentElement.style.scrollBehavior = "";
      }
    }
  },

  showLoading() {
    document.querySelectorAll(".cart__footer-value").forEach(utils.showLoader);
    const checkoutBtn = document.querySelector(".cart__checkout");
    if (checkoutBtn) checkoutBtn.innerHTML = '<span class="loader--spinner"></span>';
  },
};

const templates = {
  slider: () => `<div class="cart__complementary-products-loading">${loadingSVG}</div><div class="cart__complementary-products-content" style="display: none;"><h3 class="cart__complementary-products-title heading--l">Complement Your Look</h3><div class="cart__complementary-products-slider splide"><div class="splide__arrows"><button class="splide__arrow splide__arrow--prev" type="button"><svg width="7" height="12" viewBox="0 0 7 12" xmlns="http://www.w3.org/2000/svg"><path d="M6 1L1 6L6 11" stroke="#0F0F0F" stroke-linecap="square"/></svg></button><button class="splide__arrow splide__arrow--next" type="button"><svg width="7" height="12" viewBox="0 0 7 12" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L6 6L1 11" stroke="#0F0F0F" stroke-linecap="square"/></svg></button></div><div class="splide__track"><ul class="splide__list"></ul></div></div></div>`,
  productSlide: (p) => `<li class="splide__slide"><a href="/products/${p.handle}"><div class="cart__complementary-products-image-wrapper"><img src="https:${p.featured_image}&width=300" alt="${p.title}" class="cart__complementary-products-image"></div><h3 class="body--bold cart__complementary-products-title-product">${p.title}</h3><p class="small cart__complementary-products-price">${Shopify.formatMoney(p.price)}</p></a></li>`,
  emptyCartContent: (shippingHTML) => `${shippingHTML}<div class="cart__items"></div><div class="cart__complementary-products" style="display: block;">${templates.slider()}</div><footer class="cart__footer"><div class="cart__footer-row"><h3 class="cart__footer-label body">Subtotal</h3><span class="cart__footer-value body--bold">${utils.createLoader().outerHTML}</span></div><button type="submit" name="checkout" class="cart__checkout body"><span class="loader--spinner"></span></button></footer>`,
  optimisticItem: (variantId, name) => `<div class="cart-item__content"><div class="cart-item__details"><h3 class="cart-item__title body--bold"><a href="${window.location.pathname}">${name}</a></h3><div class="cart-item__specifics"><div class="cart-item__variant small" style="display: flex; align-items: center; height: auto;">${utils.createLoader().outerHTML}</div><div class="cart-item__price"><div class="price-placeholder">${utils.createLoader().outerHTML}</div></div></div><div class="cart-item__actions"><div class="placeholder-loader">${utils.createLoader().outerHTML}</div><div class="placeholder-remove"></div></div></div></div>`,
};

const slider = {
  container: null,

  create() {
    if (document.querySelector(".cart__complementary-products")) return;
    const cartForm = document.querySelector(".cart__form");
    const footer = document.querySelector(".cart__footer");
    if (!cartForm || !footer) return;

    this.container = Object.assign(document.createElement("div"), {
      className: "cart__complementary-products",
      innerHTML: templates.slider(),
    });
    utils.applyStyles(this.container, { display: "none" });
    cartForm.insertBefore(this.container, footer);
  },

  hide() {
    window.complementarySlider?.destroy();
    window.complementarySlider = null;
    this.container = document.querySelector(".cart__complementary-products");
    if (this.container) utils.applyStyles(this.container, { display: "none" });
  },

  async fetchRecommendations(productHandles) {
    const recommendations = [];
    const processed = new Set(productHandles);

    const getProductRecs = async (handle) => {
      try {
        const [productRes, product] = [await fetch(`/products/${handle}.js`), null];
        if (!productRes.ok) return [];
        const productData = await productRes.json();
        const recsRes = await fetch(`/recommendations/products.json?product_id=${productData.id}&limit=10&intent=related`);
        return recsRes.ok ? (await recsRes.json()).products || [] : [];
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
  },

  async update(productHandles) {
    if (cartState.sliderUpdateInProgress || !productHandles?.length) {
      if (!productHandles?.length) this.hide();
      return;
    }

    cartState.sliderUpdateInProgress = true;
    this.hide();

    const container = document.querySelector(".cart__complementary-products");
    const [loading, content, list] = [container?.querySelector(".cart__complementary-products-loading"), container?.querySelector(".cart__complementary-products-content"), container?.querySelector(".splide__list")];

    if (!container || !loading || !content || !list) {
      cartState.sliderUpdateInProgress = false;
      return;
    }

    utils.applyStyles(container, { display: "block" });
    utils.applyStyles(loading, { display: "block" });
    utils.applyStyles(content, { display: "none" });
    if (!loading.innerHTML.trim()) loading.innerHTML = loadingSVG;

    try {
      const products = await this.fetchRecommendations(productHandles);
      if (!cartState.sliderUpdateInProgress || !products.length) {
        utils.applyStyles(container, { display: "none" });
        return;
      }

      list.innerHTML = products.map(templates.productSlide).join("");

      window.complementarySlider = new Splide(container.querySelector(".cart__complementary-products-slider"), {
        type: "slide",
        perPage: 2,
        gap: "var(--space-2xs)",
        arrows: true,
        pagination: false,
      }).mount();

      const arrows = container.querySelector(".splide__arrows");
      if (arrows) utils.applyStyles(arrows, { display: products.length <= 2 ? "none" : "flex" });

      utils.applyStyles(loading, { display: "none" });
      utils.applyStyles(content, { display: "block" });
    } catch (error) {
      console.error("Error updating slider:", error);
      utils.applyStyles(container, { display: "none" });
    } finally {
      cartState.sliderUpdateInProgress = false;
    }
  },

  init() {
    const cartItems = document.querySelectorAll(".cart-item");
    if (!cartItems.length) {
      this.hide();
      return;
    }

    this.create();
    const handles = [...cartItems].map((item) => item.querySelector(".cart-item__title a")?.href?.split("/products/")[1]?.split("?")[0]).filter(Boolean);
    if (handles.length) this.update(handles);
  },
};

const cart = {
  async refreshContent() {
    try {
      const currentProgressWidth = document.querySelector(".cart__shipping-progress")?.style.width || "0%";
      const [drawerRes, cartData] = await Promise.all([fetch("/?section_id=cart-drawer"), cartAPI.fetch()]);

      const temp = Object.assign(document.createElement("div"), { innerHTML: await drawerRes.text() });

      document.querySelectorAll(".cart__shipping--loading").forEach((el) => el.remove());

      const [newShipping, existingShipping] = [temp.querySelector(".cart__shipping"), document.querySelector(".cart__shipping")];
      if (newShipping && existingShipping) {
        const hasItems = temp.querySelector(".cart-item");
        if (hasItems) {
          utils.applyStyles(newShipping, { display: "block", height: "93px" });
          const threshold = 9900;
          const [textEl, progressEl] = [newShipping.querySelector(".cart__shipping-text"), newShipping.querySelector(".cart__shipping-progress")];

          if (cartData && textEl && progressEl) {
            textEl.textContent = cartData.total_price >= threshold ? "Your Order Has Free Shipping!" : `${Shopify.formatMoney(threshold - cartData.total_price)} Away From Free Shipping`;
            progressEl.style.width = currentProgressWidth;
          }
        }
        existingShipping.replaceWith(newShipping);
      }

      const optimisticImages = new Map();
      document.querySelectorAll(".cart-item--optimistic").forEach((item) => {
        const key = item.getAttribute("data-line-item-key");
        const img = item.querySelector(".cart-item__image img");
        if (img) optimisticImages.set(key, img.cloneNode(true));
      });

      utils.replaceElements([".cart__items", ".cart__footer"], temp);

      optimisticImages.forEach((img, tempKey) => {
        const variantId = tempKey.replace("temp-", "");
        const newItem = document.querySelector(`[data-line-item-key*="${variantId}"]`);
        const newImg = newItem?.querySelector(".cart-item__image img");
        if (newImg) newImg.replaceWith(img);
      });

      const [newEmpty, existingEmpty, cartForm] = [temp.querySelector(".cart__empty-state"), document.querySelector(".cart__empty-state"), document.querySelector(".cart__form")];

      if (newEmpty && !existingEmpty && cartForm) {
        cartForm.innerHTML = "";
        cartForm.appendChild(newEmpty);
      } else if (!newEmpty && existingEmpty) {
        existingEmpty.remove();
      }

      this.attachEventListeners();

      if (cartData) {
        setTimeout(() => {
          const progressBar = document.querySelector(".cart__shipping-progress");
          if (progressBar) progressBar.style.width = `${Math.min((cartData.total_price / 9900) * 100, 100)}%`;
        }, 100);
      }

      return true;
    } catch (error) {
      console.error("Error updating cart:", error);
      return false;
    }
  },

  showOptimisticUpdate() {
    const productName = document.querySelector(".product-details__title")?.textContent || "";
    const variantId = document.querySelector("#js--variant-id")?.value || "";
    const image = this.getCurrentProductImage();

    cartDrawer.showLoading();
    slider.create();

    const emptyCart = document.querySelector(".cart__empty-state");
    if (emptyCart) this.initEmptyCart(emptyCart);

    const container = document.querySelector(".cart__items");
    if (!container) return;

    const existing = document.querySelector(`.cart-item[data-line-item-key*="${variantId}"]`);

    if (existing) {
      this.showItemLoading(existing);
    } else {
      this.addOptimisticItem(container, variantId, image, productName);
    }

    setTimeout(() => {
      const handles = [...document.querySelectorAll(".cart-item .cart-item__title a")].map((link) => link.href.split("/products/")[1]?.split("?")[0]).filter(Boolean);
      if (handles.length) slider.update(handles);
    }, 100);
  },

  getCurrentProductImage() {
    const slide = document.querySelector(`[data-imageid="${default_image}"] img`);
    return slide ? Object.assign(slide.cloneNode(true), { width: 100, height: 150 }) : null;
  },

  initEmptyCart(emptyEl) {
    const cartForm = document.querySelector(".cart__form");
    emptyEl.remove();

    const shippingHTML = document.querySelector(".cart__shipping") ? `<div class="cart__shipping cart__shipping--loading" style="display: block; height: 93px;"><p class="cart__shipping-text small">${utils.createLoader().outerHTML}</p><div class="cart__shipping-bar"><div class="cart__shipping-progress"></div></div></div>` : "";

    cartForm.innerHTML = templates.emptyCartContent(shippingHTML);
  },

  showItemLoading(item) {
    const price = item.querySelector(".cart-item__price");
    if (price) utils.showLoader(price);

    const actions = item.querySelector(".cart-item__actions");
    if (actions) actions.innerHTML = `<div class="placeholder-loader">${utils.createLoader().outerHTML}</div><div class="placeholder-remove"></div>`;
  },

  addOptimisticItem(container, variantId, image, name) {
    const item = Object.assign(document.createElement("article"), {
      className: "cart-item cart-item--optimistic",
    });
    item.setAttribute("data-line-item-key", `temp-${variantId}`);

    const imageDiv = Object.assign(document.createElement("div"), { className: "cart-item__image" });
    if (image) imageDiv.appendChild(image);

    item.innerHTML = templates.optimisticItem(variantId, name);
    item.insertBefore(imageDiv, item.firstChild);
    container.prepend(item);
  },

  createAddToCartHandler(form) {
    return async (e) => {
      e.preventDefault();

      const btn = form.querySelector("#js--addtocart");
      if (!btn?.enabled === false) return;

      const [variantId, qty, originalContent] = [form.querySelector("#js--variant-id")?.value || "", parseInt(form.querySelector('input[name="quantity"]')?.value || "1", 10), btn.innerHTML];

      btn.innerHTML = '<span class="loader--spinner"></span>';

      try {
        if (!utils.isGiftCard(document)) {
          const inventory = parseInt(document.querySelector("#js--variant-inventory-quantity")?.value || "Infinity", 10);
          const currentCart = await cartAPI.fetch();
          const existingItem = currentCart?.items?.find((item) => item.variant_id.toString() === variantId);
          const validation = validateInventory(inventory, existingItem?.quantity || 0, qty);

          if (!validation.isAllowed) {
            btn.innerHTML = originalContent;
            utils.showError(form, validation.errorMessage);
            return;
          }
        }

        cartDrawer.toggle(true);
        this.showOptimisticUpdate();

        await cartAPI.add(new FormData(form));
        await this.refreshContent();
        btn.innerHTML = originalContent;
      } catch (error) {
        console.error("Error adding to cart:", error);
        btn.innerHTML = originalContent;
        utils.showError(form, "Could not add to cart. Please try again.");
      }
    };
  },

  attachEventListeners() {
    const getOtherHandles = (excludeKey) =>
      [...document.querySelectorAll('.cart-item:not([style*="display: none"])')]
        .filter((item) => item.getAttribute("data-line-item-key") !== excludeKey)
        .map((item) => item.querySelector(".cart-item__title a")?.href?.split("/products/")[1]?.split("?")[0])
        .filter(Boolean);

    const deleteItem = async (item, key) => {
      const totalItems = document.querySelectorAll(".cart-item").length;
      utils.applyStyles(item, { display: "none" });

      if (totalItems === 1) {
        const shipping = document.querySelector(".cart__shipping");
        if (shipping) utils.applyStyles(shipping, { display: "none" });
      }

      cartDrawer.showLoading();
      slider.update(getOtherHandles(key));

      try {
        await cartAPI.update({ [key]: 0 });
        await this.refreshContent();
      } catch (error) {
        console.error("Error removing item:", error);
        utils.applyStyles(item, { display: "" });
        if (totalItems === 1) {
          const [shipping, sliderEl] = [document.querySelector(".cart__shipping"), document.querySelector(".cart__complementary-products")];
          if (shipping) utils.applyStyles(shipping, { display: "block" });
          if (sliderEl) utils.applyStyles(sliderEl, { display: "block" });
        }
        await this.refreshContent();
      }
    };

    document.querySelectorAll(".cart-item__quantity button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const item = btn.closest(".cart-item");
        const [key, input, currentQty, isPlus] = [item.getAttribute("data-line-item-key"), btn.parentElement.querySelector("input"), Number(btn.parentElement.querySelector("input").value), btn.classList.contains("cart-item__quantity-button--plus")];

        if (isPlus && !utils.isGiftCard(item)) {
          const validation = validateInventory(parseInt(item.getAttribute("data-inventory-quantity") || "Infinity", 10), currentQty, 1);

          if (!validation.isAllowed) {
            cartDrawer.showLoading();
            this.showItemLoading(item);
            await new Promise((resolve) => setTimeout(resolve, 800));
            await this.refreshContent();
            const updated = document.querySelector(`[data-line-item-key="${key}"]`);
            if (updated) utils.showError(updated, validation.errorMessage);
            return;
          }
        }

        const newQty = isPlus ? currentQty + 1 : currentQty - 1;

        if (newQty === 0) {
          await deleteItem(item, key);
          return;
        }

        try {
          cartDrawer.showLoading();
          this.showItemLoading(item);
          await cartAPI.update({ [key]: newQty });
          await this.refreshContent();
        } catch (error) {
          console.error("Error updating quantity:", error);
          await this.refreshContent();
          const updated = document.querySelector(`[data-line-item-key="${key}"]`);
          if (updated) utils.showError(updated, "Could not update quantity. Please try again.");
        }
      });
    });

    document.querySelectorAll(".cart-item__remove").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const item = btn.closest(".cart-item");
        await deleteItem(item, item.getAttribute("data-line-item-key"));
      });
    });

    document.querySelector(".cart__container")?.addEventListener("click", (e) => e.stopPropagation());
    document.querySelector(".cart__close")?.addEventListener("click", () => cartDrawer.toggle(false));
    document.querySelector(".cart")?.addEventListener("click", (e) => {
      if (e.target.classList.contains("cart")) cartDrawer.toggle(false);
    });
  },

  loadFromStorage() {
    const stored = localStorage.getItem("cartData");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.count > 0) cartAPI.updateBadges(data.count);
    }

    cartAPI.fetch().then((cartData) => {
      this.refreshContent().then(() => {
        if (cartData?.item_count > 0) slider.init();
      });
    });
  },
};

window.openCart = () => cartDrawer.toggle(true);
window.closeCart = () => cartDrawer.toggle(false);

document.addEventListener("DOMContentLoaded", () => {
  cart.loadFromStorage();
  cart.attachEventListeners();

  cartElements.addToCartForms().forEach((form) => {
    form.addEventListener("submit", cart.createAddToCartHandler(form));
  });

  cartElements.cartIcons().forEach((icon) => {
    icon.addEventListener("click", (e) => {
      e.preventDefault();
      cartDrawer.toggle(true);
      cart.refreshContent();
    });
  });
});
