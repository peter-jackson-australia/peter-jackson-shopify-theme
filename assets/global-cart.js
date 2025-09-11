// Constants & configuration
const cartDOMElements = {
  cartCountBadges: document.querySelectorAll(".cart-count-indicator"),
  cartDrawerElement: document.querySelector(".cart"),
  addToCartForms: document.querySelectorAll('form[action="/cart/add"]'),
  cartIconButtons: document.querySelectorAll(".js-cart-icon"),
};

const animatedLoadingBarSVG = `<svg fill=#E7E7E7 style=height:4px;display:block viewBox="0 0 40 4"xmlns=http://www.w3.org/2000/svg><style>.react{animation:moving 1s ease-in-out infinite}@keyframes moving{0%{width:0%}50%{width:100%;transform:translate(0,0)}100%{width:0;right:0;transform:translate(100%,0)}}</style><rect class=react fill=#E7E7E7 height=4 width=40 /></svg>`;
const jsonRequestHeaders = { Accept: "application/json", "Content-Type": "application/json" };

// Utility/helper functions
function createLoadingBarElement() {
  const loadingBarContainer = document.createElement("div");
  loadingBarContainer.innerHTML = animatedLoadingBarSVG;
  return loadingBarContainer;
}

function replaceContentWithLoader(targetElement) {
  const originalContent = targetElement.innerHTML;
  targetElement.replaceChildren(createLoadingBarElement());
  return originalContent;
}

function displayErrorMessage(containerElement, errorText, cssClassName = "product-error body") {
  containerElement.querySelectorAll('[class*="error"]').forEach((errorElement) => errorElement.remove());
  const errorElement = document.createElement("div");
  errorElement.className = cssClassName;
  errorElement.textContent = errorText;
  containerElement.querySelector("#js--addtocart, .cart-item__actions")?.after(errorElement);
}

function displayTemporaryError(itemElement, errorText) {
  const errorElement = document.createElement("div");
  errorElement.className = "cart-item__error small cart-item__error--permanent";
  errorElement.textContent = errorText;

  const actionButton = itemElement.querySelector("#js--addtocart, .cart-item__actions");
  if (actionButton) actionButton.after(errorElement);

  const removeAllErrors = () => {
    document.querySelectorAll(".cart-item__error--permanent").forEach((errorElement) => errorElement.remove());
    document.removeEventListener("click", removeAllErrors);
  };
  setTimeout(() => document.addEventListener("click", removeAllErrors), 100);
}

// Product type checks
function isGiftCardCartItem(cartItemElement) {
  const productTitle = cartItemElement.querySelector(".cart-item__title a")?.textContent || "";
  return productTitle.toLowerCase().includes("gift card");
}

function isCurrentProductGiftCard() {
  const pageProductTitle = document.querySelector(".product-details__title")?.textContent || "";
  return pageProductTitle.toLowerCase().includes("gift card");
}

function validateInventoryAvailability(maxInventory, currentQuantity, requestedQuantity) {
  const availableLimit = maxInventory === Infinity ? Infinity : Math.max(0, maxInventory - 5);
  const totalRequested = currentQuantity + requestedQuantity;

  if (availableLimit === Infinity || totalRequested <= availableLimit) return { isAllowed: true };

  return {
    isAllowed: false,
    availableLimit: availableLimit,
    errorMessage:
      availableLimit === 0
        ? "Sorry, this item is out of stock."
        : `Sorry, only ${availableLimit} ${availableLimit === 1 ? "item" : "items"} available.`,
  };
}

// Cart data management
async function fetchCurrentCartData() {
  try {
    const response = await fetch("/cart.js");
    const cartData = await response.json();
    localStorage.setItem(
      "cartData",
      JSON.stringify({
        count: cartData.item_count,
        items: cartData.items,
        total: cartData.total_price,
      })
    );
    updateCartCountBadges(cartData.item_count);
    return cartData;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return null;
  }
}

// Cart UI updates
function showCartDrawer() {
  if (window.openCart) return window.openCart();
  cartDOMElements.cartDrawerElement.classList.add("cart--active");
  document.body.classList.add("cart-open");
}

function hideCartDrawer() {
  cartDOMElements.cartDrawerElement.classList.remove("cart--active");
  document.body.classList.remove("cart-open");
}

// Product Secondary Sidebar Drawer
const showProductDrawer = async (productHandle) => {
  const productDrawer = document.querySelector('.product-drawer');
  const productData = document.querySelector('.product-drawer__data');
  
  if (!productDrawer || !productData) return;
  
  productData.textContent = 'Loading...';
  productDrawer.style.display = 'block';
  
  try {
    const response = await fetch(`/products/${productHandle}.js`);
    const product = await response.json();
    
    console.log('Product Object:', product);
    productData.textContent = 'Product data logged to console (open DevTools)';
      
  } catch (error) {
    productData.textContent = 'Error loading product data: ' + error.message;
  }
};

const hideProductDrawer = () => {
  const productDrawer = document.querySelector('.product-drawer');
  if (productDrawer) {
    productDrawer.style.display = 'none';
  }
};

function updateCartCountBadges(itemCount) {
  cartDOMElements.cartCountBadges.forEach((badge) => {
    badge.style.visibility = "visible";
    badge.classList.toggle("hide", itemCount <= 0);
  });
  localStorage.setItem("cartCount", itemCount.toString());
}

function showCartTotalsLoading() {
  document.querySelectorAll(".cart__footer-value").forEach((valueElement) => replaceContentWithLoader(valueElement));
  const checkoutBtn = document.querySelector(".cart__checkout");
  if (checkoutBtn) checkoutBtn.innerHTML = '<span class="loader--spinner"></span>';
}

async function refreshCartDrawerContent() {
  try {
    const currentProgressBar = document.querySelector(".cart__shipping-progress");
    const currentProgressWidth = currentProgressBar ? currentProgressBar.style.width || "0%" : "0%";
    const [drawerHTMLResponse, latestCartData] = await Promise.all([
      fetch("/?section_id=cart-drawer"),
      fetchCurrentCartData(),
    ]);
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = await drawerHTMLResponse.text();

    document.querySelectorAll(".cart__shipping--loading").forEach((loadingElement) => loadingElement.remove());

    const newShippingSection = tempContainer.querySelector(".cart__shipping");
    const existingShippingSection = document.querySelector(".cart__shipping");
    if (newShippingSection && existingShippingSection) {
      const hasCartItems = tempContainer.querySelector(".cart-item");
      if (hasCartItems) {
        newShippingSection.style.display = "block";
        newShippingSection.style.height = "93px";
        const freeShippingThreshold = 9900;
        const shippingTextElement = newShippingSection.querySelector(".cart__shipping-text");
        const progressBarElement = newShippingSection.querySelector(".cart__shipping-progress");

        if (latestCartData && shippingTextElement && progressBarElement) {
          if (latestCartData.total_price >= freeShippingThreshold) {
            shippingTextElement.textContent = "Your Order Has Free Shipping!";
          } else {
            const amountRemaining = Shopify.formatMoney(freeShippingThreshold - latestCartData.total_price);
            shippingTextElement.textContent = `${amountRemaining} Away From Free Shipping`;
          }
          progressBarElement.style.width = currentProgressWidth;
        }
      }
      existingShippingSection.replaceWith(newShippingSection);
    }

    const replaceElementIfExists = (cssSelector) => {
      const newElement = tempContainer.querySelector(cssSelector);
      const existingElement = document.querySelector(cssSelector);
      if (newElement && existingElement) existingElement.replaceWith(newElement);
    };

    replaceElementIfExists(".cart__items");
    replaceElementIfExists(".cart__footer");

    const newEmptyStateElement = tempContainer.querySelector(".cart__empty-state");
    const existingEmptyState = document.querySelector(".cart__empty-state");
    const cartFormElement = document.querySelector(".cart__form");

    if (newEmptyStateElement && !existingEmptyState && cartFormElement) {
      cartFormElement.innerHTML = "";
      cartFormElement.appendChild(newEmptyStateElement);
    } else if (!newEmptyStateElement && existingEmptyState) {
      existingEmptyState.remove();
    }

    attachCartInteractionListeners();

    const updatedCart = await fetchCurrentCartData();
    if (updatedCart) {
      setTimeout(() => {
        const progressBar = document.querySelector(".cart__shipping-progress");
        if (!progressBar) return;
        const freeShippingThreshold = 9900;
        progressBar.style.width = `${Math.min((updatedCart.total_price / freeShippingThreshold) * 100, 100)}%`;
      }, 100);
    }

    return true;
  } catch (error) {
    console.error("Error updating cart drawer:", error);
    return false;
  }
}

// Complementary products slider
let isSliderUpdateInProgress = false;

function generateComplementarySliderHTML() {
  return `
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
}

function createSliderContainerIfMissing() {
  if (document.querySelector(".cart__complementary-products")) return;

  const cartFormElement = document.querySelector(".cart__form");
  const footerElement = document.querySelector(".cart__footer");
  if (!cartFormElement || !footerElement) return;

  const sliderContainer = document.createElement("div");
  sliderContainer.className = "cart__complementary-products";
  sliderContainer.style.display = "none";
  sliderContainer.innerHTML = generateComplementarySliderHTML();
  sliderContainer.querySelector(".cart__complementary-products-loading").appendChild(createLoadingBarElement());
  cartFormElement.insertBefore(sliderContainer, footerElement);
}

function removeComplementarySlider() {
  window.complementarySlider?.destroy();
  window.complementarySlider = null;
  const sliderContainer = document.querySelector(".cart__complementary-products");
  if (sliderContainer) sliderContainer.style.display = "none";
}

function hideComplementarySection() {
  const sliderContainer = document.querySelector(".cart__complementary-products");
  if (sliderContainer) sliderContainer.style.display = "none";
}

async function loadRecommendedProducts(productHandles) {
  const cartProductHandles = new Set(productHandles);
  const processedHandles = new Set([...cartProductHandles]);
  const recommendedProducts = [];

  const fetchProductRecommendations = async (productHandle) => {
    try {
      const productResponse = await fetch(`/products/${productHandle}.js`);
      if (!productResponse.ok) return [];
      const productData = await productResponse.json();
      const recommendationsResponse = await fetch(
        `/recommendations/products.json?product_id=${productData.id}&limit=10&intent=related`
      );
      if (!recommendationsResponse.ok) return [];
      const recommendationsData = await recommendationsResponse.json();
      return recommendationsData.products || [];
    } catch {
      return [];
    }
  };

  const allProductRecommendations = await Promise.all(productHandles.slice(0, 4).map(fetchProductRecommendations));

  for (const productList of allProductRecommendations) {
    let addedFromCurrentProduct = 0;
    for (const product of productList) {
      if (addedFromCurrentProduct >= 2) break;
      if (!processedHandles.has(product.handle)) {
        processedHandles.add(product.handle);
        recommendedProducts.push(product);
        addedFromCurrentProduct++;
        if (recommendedProducts.length >= 8) return recommendedProducts;
      }
    }
  }
  return recommendedProducts;
}

async function recreateComplementarySlider(productHandles) {
  if (isSliderUpdateInProgress) return;
  isSliderUpdateInProgress = true;

  removeComplementarySlider();

  const sliderContainer = document.querySelector(".cart__complementary-products");
  const loadingElement = document.querySelector(".cart__complementary-products-loading");
  const contentElement = document.querySelector(".cart__complementary-products-content");
  const sliderListElement = sliderContainer?.querySelector(".splide__list");

  if (!sliderContainer || !loadingElement || !contentElement || !sliderListElement || productHandles.length === 0) {
    if (sliderContainer) sliderContainer.style.display = "none";
    isSliderUpdateInProgress = false;
    return;
  }

  sliderContainer.style.display = "block";
  loadingElement.style.display = "block";
  contentElement.style.display = "none";

  try {
    const recommendedProducts = await loadRecommendedProducts(productHandles);

    if (!isSliderUpdateInProgress || recommendedProducts.length === 0) {
      sliderContainer.style.display = "none";
      isSliderUpdateInProgress = false;
      return;
    }

    sliderListElement.innerHTML = recommendedProducts
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
          <p class="small cart__complementary-products-price">${Shopify.formatMoney(product.price)}</p>
        </a>
      </li>
    `
      )
      .join("");

    window.complementarySlider = new Splide(sliderContainer.querySelector(".cart__complementary-products-slider"), {
      type: "slide",
      perPage: 2,
      gap: "var(--space-2xs)",
      arrows: true,
      pagination: false,
    }).mount();

    const arrowButtonsContainer = sliderContainer.querySelector(".splide__arrows");
    if (arrowButtonsContainer) arrowButtonsContainer.style.display = recommendedProducts.length <= 2 ? "none" : "flex";

    loadingElement.style.display = "none";
    contentElement.style.display = "block";
  } catch (error) {
    console.error("Error rebuilding slider:", error);
    sliderContainer.style.display = "none";
  } finally {
    isSliderUpdateInProgress = false;
  }
}

function initializeSliderBasedOnCart() {
  const allCartItems = document.querySelectorAll(".cart-item");
  if (!allCartItems.length) {
    hideComplementarySection();
    return;
  }

  createSliderContainerIfMissing();

  const productHandles = Array.from(allCartItems)
    .map((item) => item.querySelector(".cart-item__title a")?.href?.split("/products/")[1]?.split("?")[0])
    .filter(Boolean);

  if (productHandles.length) recreateComplementarySlider(productHandles);
}

function refreshSliderWithCartProducts() {
  const currentProductHandles = Array.from(document.querySelectorAll(".cart-item .cart-item__title a"))
    .map((link) => link.href.split("/products/")[1]?.split("?")[0])
    .filter(Boolean);

  if (currentProductHandles.length > 0) {
    setTimeout(() => recreateComplementarySlider(currentProductHandles), 100);
  } else {
    setTimeout(initializeSliderBasedOnCart, 100);
  }
}

// Optimistic UI for add to cart
function getSelectedVariantOptions() {
  const selectedOptions = [];
  document.querySelectorAll(".js--variant-options:checked").forEach((checkedInput) => {
    const optionGroup = checkedInput.closest(".js--variant-options");
    const optionNameElement = optionGroup?.querySelector("legend");
    const optionValueElement = checkedInput.nextElementSibling;

    if (optionNameElement && optionValueElement) {
      const optionName = optionNameElement.textContent.replace(":", "").trim();
      const optionValue = optionValueElement.textContent.trim();
      if (optionName && optionValue) selectedOptions.push(`${optionName}: ${optionValue}`);
    }
  });
  return selectedOptions.length > 0 ? selectedOptions.join(", ") : "One Size";
}

function getCurrentProductImage() {
  const featuredSlide = document.querySelector(`[data-imageid="${default_image}"] img`);
  if (featuredSlide?.src) return featuredSlide.src;
}

function initializeEmptyCartStructure(emptyStateElement) {
  const cartFormElement = document.querySelector(".cart__form");
  emptyStateElement.remove();

  const sliderHTMLContent = generateComplementarySliderHTML();
  const shippingHTML = document.querySelector(".cart__shipping") ? `
    <div class="cart__shipping cart__shipping--loading" style="display: block; height: 93px;">
      <p class="cart__shipping-text small">${createLoadingBarElement().outerHTML}</p>
      <div class="cart__shipping-bar">
        <div class="cart__shipping-progress"></div>
      </div>
    </div>
  ` : '';

  cartFormElement.innerHTML = `
    ${shippingHTML}
    <div class="cart__items"></div>
    <div class="cart__complementary-products" style="display: block;">
      ${sliderHTMLContent}
    </div>
    <footer class="cart__footer">
      <div class="cart__footer-row">
        <h3 class="cart__footer-label body">Subtotal</h3>
        <span class="cart__footer-value body--bold">${createLoadingBarElement().outerHTML}</span>
      </div>
      <button type="submit" name="checkout" class="cart__checkout body">
        <span class="loader--spinner"></span>
      </button>
    </footer>
  `;

  const loadingContainer = cartFormElement.querySelector(".cart__complementary-products-loading");
  if (loadingContainer && !loadingContainer.firstChild) loadingContainer.appendChild(createLoadingBarElement());
}

function showExistingItemLoading(cartItemElement) {
  const priceContainer = cartItemElement.querySelector(".cart-item__price");
  if (priceContainer) replaceContentWithLoader(priceContainer);

  const actionsContainer = cartItemElement.querySelector(".cart-item__actions");
  if (actionsContainer) {
    actionsContainer.innerHTML = `
      <div class="placeholder-loader">${createLoadingBarElement().outerHTML}</div>
      <div class="placeholder-remove"></div>
    `;
  }
}

function insertNewCartItem(itemsContainer, variantId, imageUrl, productName, variantOptions) {
  const newCartItem = document.createElement("article");
  newCartItem.className = "cart-item";
  newCartItem.setAttribute("data-line-item-key", `temp-${variantId}`);

  newCartItem.innerHTML = `
    <div class="cart-item__image">
      <img src="${imageUrl}" alt="${productName}" width="100" height="150">
    </div>
    <div class="cart-item__content">
      <div class="cart-item__row">
        <div class="cart-item__details">
          <h3 class="cart-item__title body--bold">
            <a href="${window.location.pathname}">${productName}</a>
          </h3>
          <div class="cart-item__specifics">
            <div class="cart-item__variant small" style="display: flex; align-items: center; height: auto;">${
              createLoadingBarElement().outerHTML
            }</div>
            <div class="cart-item__price">
              <div class="price-placeholder">${createLoadingBarElement().outerHTML}</div>
            </div>
          </div>
          <div class="cart-item__actions">
            <div class="placeholder-loader">${createLoadingBarElement().outerHTML}</div>
            <div class="placeholder-remove"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  itemsContainer.prepend(newCartItem);
}

function showOptimisticCartUpdate() {
  const currentProductName = document.querySelector(".product-details__title")?.textContent || "";
  const selectedVariantId = document.querySelector("#js--variant-id")?.value || "";
  const selectedOptions = getSelectedVariantOptions();
  const productImageUrl = getCurrentProductImage();

  showCartTotalsLoading();
  createSliderContainerIfMissing();

  const emptyCartElement = document.querySelector(".cart__empty-state");
  if (emptyCartElement) initializeEmptyCartStructure(emptyCartElement);

  const cartItemsContainer = document.querySelector(".cart__items");
  if (!cartItemsContainer) return;

  const existingVariantItem = document.querySelector(`.cart-item[data-line-item-key*="${selectedVariantId}"]`);

  if (existingVariantItem) {
    showExistingItemLoading(existingVariantItem);
  } else {
    insertNewCartItem(cartItemsContainer, selectedVariantId, productImageUrl, currentProductName, selectedOptions);
  }

  refreshSliderWithCartProducts();
}

// Event handlers
function createAddToCartHandler(formElement) {
  return async (submitEvent) => {
    submitEvent.preventDefault();

    const submitButton = formElement.querySelector("#js--addtocart");
    if (!submitButton?.enabled === false) return;

    const variantId = formElement.querySelector("#js--variant-id")?.value || "";
    const requestedQuantity = parseInt(formElement.querySelector('input[name="quantity"]')?.value || "1", 10);
    const originalButtonContent = submitButton.innerHTML;

    submitButton.innerHTML = `<span class="loader--spinner"></span>`;

    try {
      if (!isCurrentProductGiftCard()) {
        const availableInventory = parseInt(
          document.querySelector("#js--variant-inventory-quantity")?.value || "Infinity",
          10
        );
        const currentCart = await fetchCurrentCartData();
        const existingCartItem = currentCart?.items?.find((item) => item.variant_id.toString() === variantId);
        const currentItemQuantity = existingCartItem?.quantity || 0;
        const inventoryValidation = validateInventoryAvailability(
          availableInventory,
          currentItemQuantity,
          requestedQuantity
        );

        if (!inventoryValidation.isAllowed) {
          submitButton.innerHTML = originalButtonContent;
          displayErrorMessage(formElement, inventoryValidation.errorMessage);
          return;
        }
      }

      showCartDrawer();
      showOptimisticCartUpdate();

      await fetch("/cart/add.js", {
        method: "post",
        body: new FormData(formElement),
      });

      await refreshCartDrawerContent();
      submitButton.innerHTML = originalButtonContent;
    } catch (error) {
      console.error("Error adding to cart:", error);
      submitButton.innerHTML = originalButtonContent;
      displayErrorMessage(formElement, "Could not add to cart. Please try again.");
    }
  };
}

function attachCartInteractionListeners() {
  // Add product drawer listeners FIRST
  document.querySelectorAll('.cart-item__title-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const productHandle = button.getAttribute('data-product-handle');
      if (productHandle) {
        showProductDrawer(productHandle);
      }
    });
  });

  const closeBtn = document.querySelector('.product-drawer__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideProductDrawer);
  }

  const showItemLoadingState = (cartItemElement) => {
    const actionsSection = cartItemElement.querySelector(".cart-item__actions");
    const priceSection = cartItemElement.querySelector(".cart-item__price");
    const loadingBarHTML = createLoadingBarElement().outerHTML;

    if (actionsSection) {
      actionsSection.innerHTML = `
        <div class="placeholder-loader">${loadingBarHTML}</div>
        <div class="placeholder-remove"></div>
      `;
    }
    if (priceSection) replaceContentWithLoader(priceSection);
  };

  const getOtherProductHandles = (excludeItemKey) => {
    return Array.from(document.querySelectorAll('.cart-item:not([style*="display: none"])'))
      .filter((item) => item.getAttribute("data-line-item-key") !== excludeItemKey)
      .map((item) => item.querySelector(".cart-item__title a")?.href?.split("/products/")[1]?.split("?")[0])
      .filter(Boolean);
  };

  const deleteCartItem = async (itemElement, itemKey) => {
    const totalItemCount = document.querySelectorAll(".cart-item").length;
    itemElement.style.display = "none";
  
    if (totalItemCount === 1) {
      const shippingBar = document.querySelector(".cart__shipping");
      if (shippingBar) shippingBar.style.display = "none";
    }
  
    showCartTotalsLoading();
    recreateComplementarySlider(getOtherProductHandles(itemKey));
  
    try {
      await fetch("/cart/update.js", {
        method: "post",
        headers: jsonRequestHeaders,
        body: JSON.stringify({ updates: { [itemKey]: 0 } }),
      });
      await refreshCartDrawerContent();
    } catch (error) {
      console.error("Error removing item:", error);
      itemElement.style.display = "";
      if (totalItemCount === 1) {
        const shippingBar = document.querySelector(".cart__shipping");
        if (shippingBar) shippingBar.style.display = "block";
      }
      await refreshCartDrawerContent();
    }
  };

  document.querySelectorAll(".cart-item__quantity button").forEach((quantityButton) => {
    quantityButton.addEventListener("click", async () => {
      const parentItem = quantityButton.closest(".cart-item");
      const itemKey = parentItem.getAttribute("data-line-item-key");
      const quantityInput = quantityButton.parentElement.querySelector("input");
      const currentQuantity = Number(quantityInput.value);
      const isIncreaseButton = quantityButton.classList.contains("cart-item__quantity-button--plus");

      if (isIncreaseButton && !isGiftCardCartItem(parentItem)) {
        const maxInventory = parseInt(parentItem.getAttribute("data-inventory-quantity") || "Infinity", 10);
        const inventoryValidation = validateInventoryAvailability(maxInventory, currentQuantity, 1);

        if (!inventoryValidation.isAllowed) {
          showCartTotalsLoading();
          showItemLoadingState(parentItem);
          await new Promise((resolve) => setTimeout(resolve, 800));
          await refreshCartDrawerContent();
          const updatedItem = document.querySelector(`[data-line-item-key="${itemKey}"]`);
          if (updatedItem) displayTemporaryError(updatedItem, inventoryValidation.errorMessage);
          return;
        }
      }

      const newQuantity = isIncreaseButton ? currentQuantity + 1 : currentQuantity - 1;

      if (newQuantity === 0) {
        await deleteCartItem(parentItem, itemKey);
        return;
      }

      try {
        showCartTotalsLoading();
        showItemLoadingState(parentItem);

        await fetch("/cart/update.js", {
          method: "post",
          headers: jsonRequestHeaders,
          body: JSON.stringify({ updates: { [itemKey]: newQuantity } }),
        });

        await refreshCartDrawerContent();
      } catch (error) {
        console.error("Error updating quantity:", error);
        await refreshCartDrawerContent();
        const updatedItem = document.querySelector(`[data-line-item-key="${itemKey}"]`);
        if (updatedItem) displayTemporaryError(updatedItem, "Could not update quantity. Please try again.");
      }
    });
  });

  document.querySelectorAll(".cart-item__remove").forEach((removeButton) => {
    removeButton.addEventListener("click", async () => {
      const parentItem = removeButton.closest(".cart-item");
      const itemKey = parentItem.getAttribute("data-line-item-key");
      await deleteCartItem(parentItem, itemKey);
    });
  });

  document.querySelector(".cart__container")?.addEventListener("click", (clickEvent) => clickEvent.stopPropagation());
  document.querySelectorAll(".cart__close, .cart").forEach((closeElement) => {
    closeElement.addEventListener("click", hideCartDrawer);
  });
}

// Initialisation
function loadCartFromLocalStorage() {
  const storedCartData = localStorage.getItem("cartData");
  if (storedCartData) {
    const parsedCartData = JSON.parse(storedCartData);
    if (parsedCartData.count > 0) updateCartCountBadges(parsedCartData.count);
  }

  fetchCurrentCartData().then((latestCart) => {
    refreshCartDrawerContent().then(() => {
      if (latestCart?.item_count > 0) initializeSliderBasedOnCart();
    });
  });
}

// Main initialisation & event binding
document.addEventListener("DOMContentLoaded", () => {
  loadCartFromLocalStorage();
  attachCartInteractionListeners();

  cartDOMElements.addToCartForms.forEach((formElement) => {
    formElement.addEventListener("submit", createAddToCartHandler(formElement));
  });

  cartDOMElements.cartIconButtons.forEach((iconButton) => {
    iconButton.addEventListener("click", (clickEvent) => {
      clickEvent.preventDefault();
      showCartDrawer();
      refreshCartDrawerContent();
    });
  });
});