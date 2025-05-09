const cartElements = {
  indicators: document.querySelectorAll(".cart-indicator"),
  drawer: document.querySelector(".cart"),
  forms: document.querySelectorAll('form[action="/cart/add"]'),
  cartLinks: document.querySelectorAll('a[href="/cart"]')
};

window.addEventListener("load", () => {
  quicklink.listen();
  initCart();
});

function createAnimatedLoader() {
  const loader = document.createElement("div");
  loader.className = "animated-loader";
  
  loader.innerHTML = `<svg fill=#E7E7E7 style=height:4px;display:block viewBox="0 0 40 4"xmlns=http://www.w3.org/2000/svg><style>.react{animation:moving 1s ease-in-out infinite}@keyframes moving{0%{width:0%}50%{width:100%;transform:translate(0,0)}100%{width:0;right:0;transform:translate(100%,0)}}</style><rect class=react fill=#E7E7E7 height=4 width=40 /></svg>`;
  return loader;
}

function showProductError(form, message) {
  const existingError = form.querySelector('.product-error');
  if (existingError) {
    existingError.remove();
  }
  
  const errorElement = document.createElement('div');
  errorElement.className = 'product-error body';
  errorElement.textContent = message;
  errorElement.style.color = 'red';
  
  const addButton = form.querySelector('#js--addtocart');
  addButton.after(errorElement);
}

function applyCartTotalLoaders() {
  const footerValues = document.querySelectorAll(".cart__footer-value");
  footerValues.forEach(el => {
    el.innerHTML = "";
    el.appendChild(createAnimatedLoader());
  });
  
  const checkoutButton = document.querySelector(".cart__checkout");
  if (checkoutButton) {
    checkoutButton.innerHTML = '<span class="loader--spinner"></span>';
  }
}

function applyOptimisticUI() {
  const productTitle = document.querySelector(".product-details__title")?.textContent || "";
  const variantTitle = Array.from(document.querySelectorAll('.js--variant-option:checked'))
    .map(input => input.nextElementSibling?.textContent?.trim())
    .filter(Boolean)
    .join(' / ') || "";
  const productImage = document.querySelector(".splide__slide img")?.src || "";
  const variantId = document.querySelector('#js--variant-id')?.value || "";
  
  applyCartTotalLoaders();
  
  const isCartEmpty = document.querySelector(".cart__empty");
  if (isCartEmpty) {
    const cartForm = document.querySelector(".cart__form");
    isCartEmpty.remove();
    
    const itemsContainer = document.createElement("div");
    itemsContainer.className = "cart__items";
    cartForm.prepend(itemsContainer);
    
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
    if (priceElement) {
      priceElement.innerHTML = "";
      priceElement.appendChild(createAnimatedLoader());
    }
    
    const actionsEl = existingItem.querySelector(".cart-item__actions");
    if (actionsEl) {
      const oldHTML = actionsEl.innerHTML;
      
      actionsEl.innerHTML = `
        <div class="placeholder-loader"></div>
        <div class="placeholder-remove"></div>
      `;
      
      const loaderContainer = actionsEl.querySelector(".placeholder-loader");
      loaderContainer.appendChild(createAnimatedLoader());
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
              <p class="cart-item__variant small">${variantTitle ? variantTitle : 'One Size'}</p>
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
    
    const priceElement = cartItem.querySelector(".price-placeholder");
    priceElement.appendChild(createAnimatedLoader());
    
    const quantityElement = cartItem.querySelector(".placeholder-loader");
    quantityElement.appendChild(createAnimatedLoader());
    
    itemsContainer.prepend(cartItem);
  }
}

function openCartDrawer() {
  cartElements.drawer.classList.add("cart--active");
}

function closeCartDrawer() {
  cartElements.drawer.classList.remove("cart--active");
}

function updateCartIndicators(count) {
  cartElements.indicators.forEach(el => {
    el.style.visibility = "visible";
    if (count > 0) {
      el.classList.remove("hide");
    } else {
      el.classList.add("hide");
    }
  });
  localStorage.setItem("cartCount", count.toString());
}

async function fetchCart() {
  try {
    const res = await fetch("/cart.js");
    if (!res.ok) throw new Error("Failed to fetch cart");
    
    const cart = await res.json();
    updateCartIndicators(cart.item_count);
    return cart;
  } catch (e) {
    console.error("Error fetching cart:", e);
    return null;
  }
}

async function updateCartDrawer() {
  try {
    const [drawerRes, cartData] = await Promise.all([
      fetch("/?section_id=cart-drawer"),
      fetchCart()
    ]);
    
    const text = await drawerRes.text();
    const html = document.createElement("div");
    html.innerHTML = text;
    
    cartElements.drawer.innerHTML = html.querySelector(".cart").innerHTML;
    addCartEventListeners();
    return true;
  } catch (e) {
    console.error("Error updating cart drawer:", e);
    return false;
  }
}

function addCartEventListeners() {
  document.querySelectorAll(".cart-item__quantity button").forEach((button) => {
    button.addEventListener("click", async () => {
      const rootItem = button.closest(".cart-item");
      const key = rootItem.getAttribute("data-line-item-key");
      const currentQuantity = Number(button.parentElement.querySelector("input").value);
      const isUp = button.classList.contains("cart-item__quantity-button--plus");
      
      if (isUp) {
        const inventoryLimit = parseInt(rootItem.getAttribute("data-inventory-quantity") || "Infinity", 10);
        
        if (currentQuantity >= inventoryLimit) {
          applyCartTotalLoaders();
          
          const actionsEl = rootItem.querySelector(".cart-item__actions");
          const originalActionsHTML = actionsEl.innerHTML;
          
          const priceEl = rootItem.querySelector(".cart-item__price");
          const originalPriceHTML = priceEl.innerHTML;
          
          actionsEl.innerHTML = `
            <div class="placeholder-loader"></div>
            <div class="placeholder-remove"></div>
          `;
          actionsEl.querySelector(".placeholder-loader").appendChild(createAnimatedLoader());
          
          priceEl.innerHTML = "";
          priceEl.appendChild(createAnimatedLoader());
          
          await new Promise(resolve => setTimeout(resolve, 800));
          
          await updateCartDrawer();
          
          const updatedRootItem = document.querySelector(`[data-line-item-key="${key}"]`);
          if (updatedRootItem) {
            const existingError = updatedRootItem.querySelector('.cart-item__error');
            if (existingError) {
              existingError.remove();
            }
            
            const errorElement = document.createElement('div');
            errorElement.className = 'cart-item__error small cart-item__error--permanent';
            errorElement.textContent = `Sorry, only ${inventoryLimit} ${inventoryLimit === 1 ? 'item' : 'items'} available.`;
            
            const updatedActionsEl = updatedRootItem.querySelector(".cart-item__actions");
            updatedActionsEl.after(errorElement);
            
            const clearErrorOnClick = () => {
              const permanentErrors = document.querySelectorAll('.cart-item__error--permanent');
              permanentErrors.forEach(error => {
                error.classList.add('fade-out');
                setTimeout(() => error.remove(), 800);
              });
              
              document.removeEventListener('click', clearErrorOnClick);
            };
            
            setTimeout(() => {
              document.addEventListener('click', clearErrorOnClick);
            }, 100);
          }
          
          return;
        }
      }
      
      try {
        applyCartTotalLoaders();
        
        const actionsEl = rootItem.querySelector(".cart-item__actions");
        const originalActionsHTML = actionsEl.innerHTML;
        
        const priceEl = rootItem.querySelector(".cart-item__price");
        const originalPriceHTML = priceEl.innerHTML;
        
        actionsEl.innerHTML = `
          <div class="placeholder-loader"></div>
          <div class="placeholder-remove"></div>
        `;
        actionsEl.querySelector(".placeholder-loader").appendChild(createAnimatedLoader());
        
        priceEl.innerHTML = "";
        priceEl.appendChild(createAnimatedLoader());
        
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
          const existingError = updatedRootItem.querySelector('.cart-item__error');
          if (existingError) {
            existingError.remove();
          }
          
          const errorElement = document.createElement('div');
          errorElement.className = 'cart-item__error small cart-item__error--permanent';
          errorElement.textContent = "Could not update quantity. Please try again.";
          
          const updatedActionsEl = updatedRootItem.querySelector(".cart-item__actions");
          updatedActionsEl.after(errorElement);
          
          document.addEventListener('click', function clearError() {
            errorElement.classList.add('fade-out');
            setTimeout(() => errorElement.remove(), 800);
            document.removeEventListener('click', clearError);
          });
        }
      }
    });
  });

  document.querySelectorAll(".cart-item__remove").forEach((button) => {
    button.addEventListener("click", async () => {
      const cartItem = button.closest(".cart-item");
      const key = cartItem.getAttribute("data-line-item-key");
      
      cartItem.style.display = "none";
      
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
        updateCartDrawer();
      }
    });
  });

  document.querySelector(".cart__container").addEventListener("click", e => e.stopPropagation());
  document.querySelectorAll(".cart__close, .cart").forEach(el => {
    el.addEventListener("click", closeCartDrawer);
  });
}

function initCart() {
  const storedCount = localStorage.getItem("cartCount");
  if (storedCount && parseInt(storedCount) > 0) {
    updateCartIndicators(parseInt(storedCount));
  } else {
    fetchCart();
  }
  
  cartElements.forms.forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const variantId = form.querySelector('#js--variant-id')?.value || "";
      const quantityInput = form.querySelector('input[name="quantity"]');
      const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
      
      const addButton = form.querySelector("#js--addtocart");
      if (addButton && !addButton.disabled) {
        const existingError = form.querySelector('.product-error');
        if (existingError) {
          existingError.remove();
        }
        
        const originalText = addButton.innerHTML;
        addButton.innerHTML = `<span class="loader--spinner"></span>`;
        
        try {
          const inventoryQuantity = parseInt(document.querySelector('#js--variant-inventory-quantity')?.value || "Infinity", 10);
          
          const cart = await fetchCart();
          
          let existingItem = null;
          if (cart && cart.items) {
            existingItem = cart.items.find(item => item.variant_id.toString() === variantId);
          }
          
          const totalRequestedQuantity = (existingItem ? existingItem.quantity : 0) + quantity;
          
          if (inventoryQuantity !== Infinity && totalRequestedQuantity > inventoryQuantity) {
            addButton.innerHTML = originalText;
            showProductError(form, `Sorry, only ${inventoryQuantity} ${inventoryQuantity === 1 ? 'item' : 'items'} available.`);
            return;
          }
          
          openCartDrawer();
          applyOptimisticUI();
          
          await fetch("/cart/add", { 
            method: "post", 
            body: new FormData(form) 
          });
          await updateCartDrawer();
        } catch (e) {
          console.error("Error adding to cart:", e);
          addButton.innerHTML = originalText;
          showProductError(form, "Could not add to cart. Please try again.");
        } finally {
          if (addButton.innerHTML !== originalText) {
            addButton.innerHTML = originalText;
          }
        }
      }
    });
  });
  
  cartElements.cartLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openCartDrawer();
      updateCartDrawer();
    });
  });
  
  addCartEventListeners();
}

document.addEventListener("DOMContentLoaded", () => {
  addCartEventListeners();
  document.querySelectorAll(".cart-item").forEach(item => {
    addCartItemButtonListeners(item);
  });
});