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

function createLoadingSpinner(color = "var(--neutral-100)") {
  const spinner = document.createElement("div");
  spinner.innerHTML = `<div style="width: var(--space-s); height: var(--space-s); margin: 0 auto;"><svg fill=${color} viewBox="0 0 20 20"xmlns=http://www.w3.org/2000/svg><defs><linearGradient id=RadialGradient8932><stop offset=0% stop-color=currentColor stop-opacity=1 /><stop offset=100% stop-color=currentColor stop-opacity=0.25 /></linearGradient></defs><style>@keyframes spin8932{to{transform:rotate(360deg)}}#circle8932{transform-origin:50% 50%;stroke:url(#RadialGradient8932);fill:none;animation:spin8932 .5s infinite linear}</style><circle cx=10 cy=10 id=circle8932 r=8 stroke-width=2 /></svg></div>`;
  return spinner;
}

function createAnimatedLoader() {
  const loader = document.createElement("div");
  loader.style.width = "100%";
  loader.style.height = "100%";
  loader.style.display = "flex";
  loader.style.alignItems = "center";
  loader.style.justifyContent = "flex-start";
  loader.style.padding = "0";
  loader.style.margin = "0";
  
  loader.innerHTML = `
    <svg fill="#E7E7E7" viewBox="0 0 40 4" xmlns="http://www.w3.org/2000/svg" style="height: 4px; display: block;">
      <style>
        .react{animation:moving 1s ease-in-out infinite}
        @keyframes moving{
          0%{width:0%}
          50%{width:100%;transform:translate(0,0)}
          100%{width:0;right:0;transform:translate(100%,0)}
        }
      </style>
      <rect class="react" fill="#E7E7E7" height="4" width="40" />
    </svg>
  `;
  return loader;
}

function applyCartTotalLoaders() {
  const footerValues = document.querySelectorAll(".cart__footer-value");
  footerValues.forEach(el => {
    el.innerHTML = "";
    el.appendChild(createAnimatedLoader());
  });
  
  const checkoutButton = document.querySelector(".cart__checkout");
  if (checkoutButton) {
    checkoutButton.innerHTML = "";
    checkoutButton.appendChild(createLoadingSpinner("var(--white)"));
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
      newCheckoutButton.appendChild(createLoadingSpinner("var(--white)"));
      
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
      const quantityEl = existingItem.querySelector(".cart-item__quantity");
      const height = quantityEl ? quantityEl.offsetHeight : 30;
      const width = quantityEl ? quantityEl.offsetWidth : 90;
      
      const oldHTML = actionsEl.innerHTML;
      
      actionsEl.innerHTML = `
        <div style="height: ${height}px; width: ${width}px; padding: 0; margin: 0; border: none; display: flex; justify-content: flex-start; align-items: center;"></div>
        <div style="width: 60px;"></div>
      `;
      
      const loaderContainer = actionsEl.querySelector("div:first-child");
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
              <p class="cart-item__variant small">${variantTitle}</p>
              <div class="cart-item__price">
                <div style="height: 18px; width: 80px;"></div>
              </div>
            </div>
            <div class="cart-item__actions">
              <div style="height: 30px; width: 90px; padding: 0; margin: 0; border: none; display: flex; justify-content: flex-start; align-items: center;">
              </div>
              <div style="width: 60px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const priceElement = cartItem.querySelector(".cart-item__price > div");
    priceElement.appendChild(createAnimatedLoader());
    
    const quantityElement = cartItem.querySelector(".cart-item__actions > div:first-child");
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
    localStorage.setItem("cartState", JSON.stringify(cart));
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
  } catch (e) {
    console.error("Error updating cart drawer:", e);
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
          const input = button.parentElement.querySelector("input");
          input.style.backgroundColor = "#ffeeee";
          setTimeout(() => { input.style.backgroundColor = ""; }, 820);
          return;
        }
      }
      
      try {
        await fetch("/cart/update.js", {
          method: "post",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ updates: { [key]: isUp ? currentQuantity + 1 : currentQuantity - 1 } }),
        });
        updateCartDrawer();
      } catch (e) {
        console.error("Error updating quantity:", e);
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
      openCartDrawer();
      
      const addButton = form.querySelector("#js--addtocart");
      if (addButton && !addButton.disabled) {
        const originalText = addButton.innerHTML;
        addButton.innerHTML = `<div style="width: var(--space-s); height: var(--space-s); margin: auto;"><svg fill=#FFFFFFFF viewBox="0 0 20 20"xmlns=http://www.w3.org/2000/svg><defs><linearGradient id=RadialGradient8932><stop offset=0% stop-color=currentColor stop-opacity=1 /><stop offset=100% stop-color=currentColor stop-opacity=0.25 /></linearGradient></defs><style>@keyframes spin8932{to{transform:rotate(360deg)}}#circle8932{transform-origin:50% 50%;stroke:url(#RadialGradient8932);fill:none;animation:spin8932 .5s infinite linear}</style><circle cx=10 cy=10 id=circle8932 r=8 stroke-width=2 /></svg></div>`;
        
        applyOptimisticUI();
        
        try {
          await fetch("/cart/add", { 
            method: "post", 
            body: new FormData(form) 
          });
          updateCartDrawer();
        } catch (e) {
          console.error("Error adding to cart:", e);
          updateCartDrawer();
        } finally {
          addButton.innerHTML = originalText;
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

document.addEventListener("DOMContentLoaded", addCartEventListeners);