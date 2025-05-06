window.addEventListener("load", () => {
  quicklink.listen();

  document.querySelectorAll(".js--cart-counter").forEach((el) => {
    el.style.visibility = "hidden";
  });

  syncCartFromStorage().then(() => {
    document.querySelectorAll(".js--cart-counter").forEach((el) => {
      el.style.visibility = "visible";
    });
  });
});

function openCartDrawer() {
  document.querySelector(".cart-drawer").classList.add("cart-drawer--active");
}

function closeCartDrawer() {
  document.querySelector(".cart-drawer").classList.remove("cart-drawer--active");
}

function updateCartItemCounts(count) {
  document.querySelectorAll(".js--cart-counter").forEach((el) => {
    el.textContent = count;
    if (count > 0) {
      el.classList.remove("hide");
    } else {
      el.classList.add("hide");
    }
  });
  localStorage.setItem("cartCount", count.toString());
}

async function syncCartFromStorage() {
  const storedCartCount = localStorage.getItem("cartCount");
  if (storedCartCount !== null) {
    updateCartItemCounts(parseInt(storedCartCount, 10));
  }

  const cartState = localStorage.getItem("cartState");
  if (cartState) {
    try {
      const lastCartUpdate = localStorage.getItem("lastCartUpdate");
      const currentTime = new Date().getTime();

      if (!lastCartUpdate || currentTime - parseInt(lastCartUpdate, 10) > 3600000) {
        await fetchAndUpdateCart();
      }
    } catch (e) {
      await fetchAndUpdateCart();
    }
  } else {
    await fetchAndUpdateCart();
  }
}

async function fetchAndUpdateCart() {
  try {
    const res = await fetch("/cart.js");
    const cart = await res.json();
    updateCartItemCounts(cart.item_count);
    localStorage.setItem("cartState", JSON.stringify(cart));
    localStorage.setItem("lastCartUpdate", new Date().getTime().toString());
    return cart;
  } catch (e) {
    console.error("Error fetching cart:", e);
    return null;
  }
}

async function updateCartDrawer(fetchCart = true) {
  try {
    const res = await fetch("/?section_id=cart-drawer");
    const text = await res.text();
    const html = document.createElement("div");
    html.innerHTML = text;

    const newBox = html.querySelector(".cart-drawer").innerHTML;
    document.querySelector(".cart-drawer").innerHTML = newBox;

    if (fetchCart) {
      const cartRes = await fetch("/cart.js");
      const cart = await cartRes.json();

      updateCartItemCounts(cart.item_count);
      localStorage.setItem("cartState", JSON.stringify(cart));
      localStorage.setItem("lastCartUpdate", new Date().getTime().toString());
    }

    addCartDrawerListeners();
  } catch (e) {
    console.error("Error updating cart drawer:", e);
  }
}

function addCartDrawerListeners() {
  document.querySelectorAll(".cart-drawer-quantity-selector button").forEach((button) => {
    button.addEventListener("click", async () => {
      const rootItem = button.closest(".cart-drawer-item");
      const key = rootItem.getAttribute("data-line-item-key");
      const currentQuantity = Number(button.parentElement.querySelector("input").value);
      const isUp = button.classList.contains("cart-drawer-quantity-selector-plus");

      if (isUp) {
        const inventoryLimit = parseInt(rootItem.getAttribute("data-inventory-quantity") || "Infinity", 10);
        if (currentQuantity >= inventoryLimit) {
          const quantityInput = button.parentElement.querySelector("input");
          quantityInput.style.backgroundColor = "#ffeeee";
          setTimeout(() => {
            quantityInput.style.backgroundColor = "";
          }, 820);
          return;
        }
      }

      const newQuantity = isUp ? currentQuantity + 1 : currentQuantity - 1;

      try {
        const res = await fetch("/cart/update.js", {
          method: "post",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ updates: { [key]: newQuantity } }),
        });
        const cart = await res.json();

        updateCartItemCounts(cart.item_count);
        localStorage.setItem("cartState", JSON.stringify(cart));
        localStorage.setItem("lastCartUpdate", new Date().getTime().toString());

        updateCartDrawer();
      } catch (e) {
        console.error("Error updating quantity:", e);
      }
    });
  });

  document.querySelectorAll(".cart-drawer-item-remove").forEach((button) => {
    button.addEventListener("click", async () => {
      const rootItem = button.closest(".cart-drawer-item");
      
      rootItem.style.display = 'none';
      
      const key = rootItem.getAttribute("data-line-item-key");

      try {
        const res = await fetch("/cart/update.js", {
          method: "post",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ updates: { [key]: 0 } }),
        });
        const cart = await res.json();

        updateCartItemCounts(cart.item_count);
        localStorage.setItem("cartState", JSON.stringify(cart));
        localStorage.setItem("lastCartUpdate", new Date().getTime().toString());

        updateCartDrawer();
      } catch (e) {
        rootItem.style.display = '';
        console.error("Error removing item:", e);
      }
    });
  });

  document.querySelector(".cart-drawer-box").addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.querySelectorAll(".cart-drawer-header-right-close, .cart-drawer").forEach((el) => {
    el.addEventListener("click", () => {
      closeCartDrawer();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  addCartDrawerListeners();

  document.querySelectorAll('form[action="/cart/add"]').forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      openCartDrawer();
      
      const addToCartButton = form.querySelector("#js--addtocart");
      if (addToCartButton && !addToCartButton.disabled) {
        const cartDrawer = document.querySelector(".cart-drawer-form");
        if (cartDrawer) {
          const productTitle = document.querySelector('.product-details__title').innerText;
          const productPrice = document.querySelector('.product-details__price-actual').innerText;
          
          let productImage = '';
          
          const productImages = document.querySelectorAll('.product-images-splide .splide__slide img');
          if (productImages.length > 0) {
            productImage = productImages[0].src;
          }
          
          const variantOptionGroups = document.querySelectorAll('.js--variant-options');
          let variantSelections = [];
          
          if (variantOptionGroups.length > 0) {
            variantOptionGroups.forEach(optionGroup => {
              const selectedOption = optionGroup.querySelector('input[type="radio"]:checked');
              if (selectedOption) {
                let optionValue = selectedOption.value.replace('.0', '');
                variantSelections.push(optionValue);
              }
            });
          }
          
          const variantTitle = variantSelections.length > 0 ? variantSelections.join(' / ') : '';
          
          if (document.querySelector('.cart-drawer-empty')) {
            cartDrawer.innerHTML = `
              <div class="cart-drawer-items">
                <div class="cart-drawer-item placeholder-item" style="cursor: not-allowed;">
                  <div class="cart-drawer-item-image">
                    <img src="${productImage}" alt="${productTitle}">
                  </div>
                  <div class="cart-drawer-item-main">
                    <div class="cart-drawer-item-main-flex">
                      <div class="cart-drawer-item-main-flex-left">
                        <h3><a href="#">${productTitle}</a></h3>
                        ${variantTitle ? `<span>${variantTitle}</span>` : ''}
                        <div class="cart-drawer-item-actions">
                          <div class="cart-drawer-quantity-selector">
                            <button class="cart-drawer-quantity-selector-minus" type="button">-</button>
                            <input type="text" readonly value="1">
                            <button class="cart-drawer-quantity-selector-plus" type="button">+</button>
                          </div>
                          <button type="button" class="cart-drawer-item-remove">Remove</button>
                        </div>
                      </div>
                      <div class="cart-drawer-item-main-flex-right">
                        <span>${productPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <footer class="cart-drawer-footer">
                <div class="cart-drawer-footer-row">
                  <h3>Subtotal</h3>
                  <span>${productPrice}</span>
                </div>
                <button type="submit" name="checkout" class="cart-drawer-button">Checkout</button>
              </footer>
            `;
          } else {
            const cartItems = document.querySelector('.cart-drawer-items');
            if (cartItems) {
              const placeholderItem = document.createElement('div');
              placeholderItem.className = 'cart-drawer-item placeholder-item';
              placeholderItem.style.cursor = 'not-allowed';
              placeholderItem.innerHTML = `
                <div class="cart-drawer-item-image">
                  <img src="${productImage}" alt="${productTitle}">
                </div>
                <div class="cart-drawer-item-main">
                  <div class="cart-drawer-item-main-flex">
                    <div class="cart-drawer-item-main-flex-left">
                      <h3><a href="#">${productTitle}</a></h3>
                      ${variantTitle ? `<span>${variantTitle}</span>` : ''}
                      <div class="cart-drawer-item-actions">
                        <div class="cart-drawer-quantity-selector">
                          <button class="cart-drawer-quantity-selector-minus" type="button">-</button>
                          <input type="text" readonly value="1">
                          <button class="cart-drawer-quantity-selector-plus" type="button">+</button>
                        </div>
                        <button type="button" class="cart-drawer-item-remove">Remove</button>
                      </div>
                    </div>
                    <div class="cart-drawer-item-main-flex-right">
                      <span>${productPrice}</span>
                    </div>
                  </div>
                </div>
              `;
              cartItems.prepend(placeholderItem);
            }
          }
        }
        
        const originalText = addToCartButton.innerHTML;
        addToCartButton.innerHTML = `<div style="width: var(--space-s); height: var(--space-s); margin: 0 auto;"><svg fill=#FFFFFFFF viewBox="0 0 20 20"xmlns=http://www.w3.org/2000/svg><defs><linearGradient id=RadialGradient8932><stop offset=0% stop-color=currentColor stop-opacity=1 /><stop offset=100% stop-color=currentColor stop-opacity=0.25 /></linearGradient></defs><style>@keyframes spin8932{to{transform:rotate(360deg)}}#circle8932{transform-origin:50% 50%;stroke:url(#RadialGradient8932);fill:none;animation:spin8932 .5s infinite linear}</style><circle cx=10 cy=10 id=circle8932 r=8 stroke-width=2 /></svg></div>`;
  
        try {
          await fetch("/cart/add", {
            method: "post",
            body: new FormData(form),
          });
          
          await fetchAndUpdateCart();
          
          const refreshDrawer = () => {
            updateCartDrawer();
          };
          
          setTimeout(refreshDrawer, 2000);
          
        } catch (e) {
          console.error("Error adding to cart:", e);
        } finally {
          addToCartButton.innerHTML = originalText;
        }
      }
    });
  });

  document.querySelectorAll('a[href="/cart"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();

      openCartDrawer();

      fetchAndUpdateCart().then(() => {
        updateCartDrawer(false);
      });
    });
  });
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    document.querySelectorAll(".js--cart-counter").forEach((el) => {
      el.style.visibility = "hidden";
    });

    syncCartFromStorage().then(() => {
      document.querySelectorAll(".js--cart-counter").forEach((el) => {
        el.style.visibility = "visible";
      });
    });
  }
});