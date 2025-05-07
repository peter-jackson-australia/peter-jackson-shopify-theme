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
      const key = button.closest(".cart-item").getAttribute("data-line-item-key");
      try {
        await fetch("/cart/update.js", {
          method: "post",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ updates: { [key]: 0 } }),
        });
        updateCartDrawer();
      } catch (e) {
        console.error("Error removing item:", e);
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
        addButton.innerHTML = `<div style="width: var(--space-s); height: var(--space-s); margin: 0 auto;"><svg fill=#FFFFFFFF viewBox="0 0 20 20"xmlns=http://www.w3.org/2000/svg><defs><linearGradient id=RadialGradient8932><stop offset=0% stop-color=currentColor stop-opacity=1 /><stop offset=100% stop-color=currentColor stop-opacity=0.25 /></linearGradient></defs><style>@keyframes spin8932{to{transform:rotate(360deg)}}#circle8932{transform-origin:50% 50%;stroke:url(#RadialGradient8932);fill:none;animation:spin8932 .5s infinite linear}</style><circle cx=10 cy=10 id=circle8932 r=8 stroke-width=2 /></svg></div>`;
        
        try {
          await fetch("/cart/add", { method: "post", body: new FormData(form) });
          updateCartDrawer();
        } catch (e) {
          console.error("Error adding to cart:", e);
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