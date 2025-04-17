// Quicklink provides faster subsequent page-loads by prefetching in-viewport links during idle time
window.addEventListener("load", () => {
  quicklink.listen();
  setupSimpleCart();
  function setupSimpleCart() {
    // Redirect cart links to open the drawer instead
    document.querySelectorAll('a[href="{{ routes.cart_url }}"]').forEach((link) => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        openSimpleCart();
      });
    });

    // Make drawer close when ESC key is pressed
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeSimpleCart();
      }
    });

    // Listen for AJAX cart events
    document.addEventListener('liquid-ajax-cart:request-end', function (event) {
      const { requestState } = event.detail;

      // Open cart drawer after adding an item
      if (requestState.requestType === 'add' && requestState.responseData?.ok) {
        openSimpleCart();
      }

      // Close drawer when cart becomes empty
      if (requestState.responseData?.item_count === 0) {
        // Keep drawer open so the user can see it's empty, but release scroll lock
        document.body.style.overflow = '';
      }
    });

    // Make sure any existing cart button in product.liquid opens the drawer
    const addToCartForms = document.querySelectorAll('ajax-cart-product-form form');
    addToCartForms.forEach((form) => {
      form.addEventListener('submit', function (e) {
        // Let Liquid AJAX Cart handle the form submission
        // It will trigger the 'liquid-ajax-cart:request-end' event later
      });
    });

    // Expose global cart functions
    window.openSimpleCart = openSimpleCart;
    window.closeSimpleCart = closeSimpleCart;
  }

  function openSimpleCart() {
    const drawer = document.getElementById('simple-cart-drawer');
    const overlay = document.getElementById('simple-cart-overlay');

    drawer.classList.add('is-active');
    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    // Force a cart refresh to ensure data is current
    fetch('/cart?view=ajax')
      .then((response) => response.text())
      .catch((error) => {
        console.error('Error refreshing cart:', error);
      });
  }

  function closeSimpleCart() {
    const drawer = document.getElementById('simple-cart-drawer');
    const overlay = document.getElementById('simple-cart-overlay');

    drawer.classList.remove('is-active');
    overlay.classList.remove('is-active');
    document.body.style.overflow = '';
  }
});

