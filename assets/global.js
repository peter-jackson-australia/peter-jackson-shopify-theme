window.addEventListener("load", () => {
  quicklink.listen();

  document.querySelectorAll(".cart-indicator").forEach((el) => {
    el.style.visibility = "hidden";
  });

  const storedCount = localStorage.getItem("cartCount");
  if (storedCount !== null) {
    const count = parseInt(storedCount, 10);
    if (count > 0) {
      document.querySelectorAll(".cart-indicator").forEach((el) => {
        el.classList.remove("hide");
        el.style.visibility = "visible";
      });
    }
  }

  syncCartFromStorage().then(() => {
    document.querySelectorAll(".cart-indicator").forEach((el) => {
      el.style.visibility = "visible";
    });
  });
});

function openCartDrawer() {
  document.querySelector(".cart").classList.add("cart--active");
}

function closeCartDrawer() {
  document.querySelector(".cart").classList.remove("cart--active");
}

function updateCartItemCounts(count) {
  document.querySelectorAll(".cart-indicator").forEach((el) => {
    if (count > 0) {
      el.classList.remove("hide");
    } else {
      el.classList.add("hide");
    }
  });
  localStorage.setItem("cartCount", count.toString());
  
  localStorage.setItem("cartCountUpdated", new Date().getTime().toString());
}

async function syncCartFromStorage() {
  const storedCartCount = localStorage.getItem("cartCount");
  if (storedCartCount !== null) {
    updateCartItemCounts(parseInt(storedCartCount, 10));
  }

  const shouldRefreshCart = () => {
    const lastCartCountUpdate = localStorage.getItem("cartCountUpdated");
    if (!lastCartCountUpdate) return true;
    
    const currentTime = new Date().getTime();
    return currentTime - parseInt(lastCartCountUpdate, 10) > 300000;
  };

  if (!localStorage.getItem("cartState") || shouldRefreshCart()) {
    await fetchAndUpdateCart();
  }
}

async function fetchAndUpdateCart() {
  try {
    const res = await fetch("/cart.js");
    if (!res.ok) throw new Error("Failed to fetch cart");
    
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

    const newBox = html.querySelector(".cart").innerHTML;
    document.querySelector(".cart").innerHTML = newBox;

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
  document.querySelectorAll(".cart-item__quantity button").forEach((button) => {
    button.addEventListener("click", async () => {
      const rootItem = button.closest(".cart-item");
      const key = rootItem.getAttribute("data-line-item-key");
      const currentQuantity = Number(button.parentElement.querySelector("input").value);
      const isUp = button.classList.contains("cart-item__quantity-button--plus");

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

  document.querySelectorAll(".cart-item__remove").forEach((button) => {
    button.addEventListener("click", async () => {
      const rootItem = button.closest(".cart-item");
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
        console.error("Error removing item:", e);
      }
    });
  });

  document.querySelector(".cart__container").addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.querySelectorAll(".cart__close, .cart").forEach((el) => {
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
        const originalText = addToCartButton.innerHTML;
        addToCartButton.innerHTML = `<div style="width: var(--space-s); height: var(--space-s); margin: 0 auto;"><svg fill=#FFFFFFFF viewBox="0 0 20 20"xmlns=http://www.w3.org/2000/svg><defs><linearGradient id=RadialGradient8932><stop offset=0% stop-color=currentColor stop-opacity=1 /><stop offset=100% stop-color=currentColor stop-opacity=0.25 /></linearGradient></defs><style>@keyframes spin8932{to{transform:rotate(360deg)}}#circle8932{transform-origin:50% 50%;stroke:url(#RadialGradient8932);fill:none;animation:spin8932 .5s infinite linear}</style><circle cx=10 cy=10 id=circle8932 r=8 stroke-width=2 /></svg></div>`;

        try {
          await fetch("/cart/add", {
            method: "post",
            body: new FormData(form),
          });

          const cart = await fetchAndUpdateCart();
          await updateCartDrawer();
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
    document.querySelectorAll(".cart-indicator").forEach((el) => {
      el.style.visibility = "hidden";
    });
    
    const storedCount = localStorage.getItem("cartCount");
    if (storedCount !== null) {
      const count = parseInt(storedCount, 10);
      if (count > 0) {
        document.querySelectorAll(".cart-indicator").forEach((el) => {
          el.classList.remove("hide");
          el.style.visibility = "visible";
        });
      } else {
        document.querySelectorAll(".cart-indicator").forEach((el) => {
          el.classList.add("hide");
        });
      }
    }
    
    syncCartFromStorage().then(() => {
      document.querySelectorAll(".cart-indicator").forEach((el) => {
        el.style.visibility = "visible";
      });
    });
  }
});