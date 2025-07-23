// Define a convenience method and use it like
// ready(() => {...});
var ready = (callback) => {
  if (document.readyState != "loading") callback();
  else document.addEventListener("DOMContentLoaded", callback);
};

/*
 * HISTORY STATE
 * Check if window.history is supported
 */
function historyState() {
  return window.history && window.history.replaceState;
}

/*
 * GET URL PARAMETER
 * Checks for url parameter called `name`.
 */
function getParam(name) {
  if ("URLSearchParams" in window) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  } else {
    // Polyfill for IE11
    var params = new RegExp("[?&]" + name + "=([^&#]*)").exec(window.location.href);
    if (params == null) {
      return null;
    } else {
      return decodeURI(params[1]) || 0;
    }
  }
}

/*
 * FORMAT MONEY
 * Formats the passed value as money with currency symbol.
 * Referenced from https://gist.github.com/stewartknapman/8d8733ea58d2314c373e94114472d44c
 */
var Shopify = Shopify || {};
Shopify.money_format = "${{amount}}";
Shopify.formatMoney = function (cents, format) {
  if (typeof cents == "string") {
    cents = cents.replace(".", "");
  }
  var value = "";
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return typeof opt == "undefined" ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ",");
    decimal = defaultOption(decimal, ".");

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split("."),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands),
      cents = parts[1] ? decimal + parts[1] : "";

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

/*
 * OPTION SELECTOR
 * Works the variant option dropdowns used on the
 * product page template.
 */
ready(function () {
  var variant;
  var options = [];
  options[1] = null;
  options[2] = null;
  options[3] = null;

  function updateButtonAndForm(v, inventoryQuantity) {
    var addToCartButton = document.querySelector("#js--addtocart");
    var klaviyoForm = document.querySelector(".klaviyo-form-WMidEs");

    console.log('Updating button and form:', {
      variant: v,
      inventory: inventoryQuantity,
      available: v.available,
      buttonExists: !!addToCartButton,
      formExists: !!klaviyoForm
    });

    if (v.available === false || (inventoryQuantity <= 5 && !v.name.includes("Digital Gift Card"))) {
      if (addToCartButton) {
        addToCartButton.style.display = "none";
      }
      if (klaviyoForm) {
        klaviyoForm.style.display = "block";
        klaviyoForm.style.visibility = "visible";
      }
    } else {
      if (addToCartButton) {
        addToCartButton.disabled = false;
        addToCartButton.style.display = "block";
        var buttonText =
          show_low_stock_warning &&
          inventoryQuantity >= 6 &&
          inventoryQuantity <= 10 &&
          !product_title.includes("Gift Card")
            ? "Low In Stock - Add To Cart"
            : "Add To Cart";
        addToCartButton.innerText = buttonText;
      }
      if (klaviyoForm) {
        klaviyoForm.style.display = "none";
      }
    }
  }

  // Initial setup for current variant
  if (typeof current_variant !== 'undefined' && current_variant) {
    var variantIndex = variants.findIndex((variant) => variant.id === current_variant.id);
    var inventoryQuantity = variant_inventory_quantities[variantIndex];
    updateButtonAndForm(current_variant, inventoryQuantity);
  }

  var variantOptions = document.querySelectorAll(".js--variant-option");
  variantOptions.forEach(function (el) {
    el.addEventListener("change", function (event) {
      // Disable non-existent variant options.
      checkVariants();

      // Set the chosen options.
      variantOptions.forEach(function (opt) {
        if (opt.tagName.toLowerCase() == "input" && opt.checked == true) {
          var optionName = opt.getAttribute("name");
          var optionPos = parseInt(optionName.replace("option", ""));
          var optionValue = opt.value;
          options[optionPos] = optionValue;
        }
      });

      // Loop through the variants and get the selected one.
      variants.filter(function (v) {
        if (v.option1 == options[1] && v.option2 == options[2] && v.option3 == options[3]) {
          variant = v;

          // Update variant id and prices
          document.querySelector("input#js--variant-id").value = v.id;
          // The following is used for the "purchase together" feature.
          document.querySelectorAll('input[type="checkbox"].js--variant-id').forEach(function (el) {
            el.value = v.id;
            el.setAttribute("data-price", v.price);
            if (v.available == true) {
              el.checked = true;
              el.disabled = false;
            } else {
              el.checked = false;
              el.disabled = true;
            }
          });
          document.querySelectorAll(".js--variant-price").forEach(function (el) {
            el.innerHTML = Shopify.formatMoney(v.price);
          });

          if (v.compare_at_price > v.price) {
            document.querySelectorAll(".js--variant-compareatprice").forEach(function (el) {
              el.innerText = Shopify.formatMoney(v.compare_at_price);
            });
          } else {
            document.querySelectorAll(".js--variant-compareatprice").forEach(function (el) {
              el.innerText = "";
            });
          }

          // Update SKU
          document.querySelectorAll(".js--variant-sku").forEach(function (el) {
            el.innerText = variant.sku;
          });

          if (document.querySelector(".js--pants-size")) {
            document.querySelector(".js--pants-size").textContent = v.option1 - 12;
          }

          // Disable the buy button if product is unavailable
          var variantIndex = variants.findIndex((variant) => variant.id === v.id);
          var inventoryQuantity = variant_inventory_quantities[variantIndex];

          updateButtonAndForm(v, inventoryQuantity);

          // Update the hidden inventory quantity input
          document.querySelector("#js--variant-inventory-quantity").value = inventoryQuantity;

          // Append the variant ID as a url parameter
          if (v != undefined) {
            if (historyState()) {
              window.history.replaceState({}, document.title, "?variant=" + v.id);
            }
          }
        }
      });
    });
  });
});

/*
 * CHECK VARIANT EXISTS
 * This checks if the variant actually exists - e.g you may have small, medium,
 * and large in blue and black, but blue/medium is not a variant. Disables the
 * related inputs.
 */
function checkVariants() {
  let $this = event.target;
  if ($this !== undefined) {
    let availableVariants = new Set();
    variants.filter(function (variant, k) {
      if (variant[$this.name] == $this.value) {
        availableVariants.add(variant);
      }
    });

    // Loop through the array above to create an array containing available
    // option values.
    let optionGroups = {};
    availableVariants.forEach(function (variant) {
      let options = Object.entries(variant);
      for (const [key, value] of options) {
        if (value != null) {
          if (optionGroups[key] == undefined) {
            optionGroups[key] = [];
          }
          if (optionGroups[key].includes(value) == false) {
            optionGroups[key].push(value);
          }
        }
      }
    });

    // Then, loop through each input and check if its value is in the optionGroups
    // array created above, ignoring the clicked option group.
    document.querySelectorAll(".js--variant-option").forEach(function (input) {
      if (input.name != $this.name) {
        if (optionGroups[input.name].includes(input.value) == false) {
          input.disabled = true;
          input.checked = false;
        } else {
          input.disabled = false;
        }
      }
    });
  }

  // Check a valid option is selected for each group.
  document.querySelectorAll(".js--variant-options").forEach(function (group) {
    let firstAvailable = null;
    let checkedOptions = group.querySelectorAll(".js--variant-option:checked").length;
    if (checkedOptions == 0) {
      firstAvailable = group.querySelectorAll(".js--variant-option:not(:disabled)")[0];
    }
    if (firstAvailable != null) {
      firstAvailable.checked = true;
    }
  });
}

// Fixed header & filtering
document.addEventListener('DOMContentLoaded', function() {
  const header = document.querySelector('#site-header');
  const spacer = document.querySelector('#header-spacer');
  const collectionControls = document.querySelector('.collection-controls');
  const searchControls = document.querySelector('.search-controls');
  const controls = collectionControls || searchControls; 
  const productsGrid = document.querySelector('.products-grid');
  const headerOffsetTop = header.offsetTop;
  let isFixed = false;
  let isControlsFixed = false;
  let ticking = false;
  let productsGridOffsetTop = 0;
  let controlsSpacer = null;

  if (controls && productsGrid) {
    productsGridOffsetTop = productsGrid.offsetTop;
    controlsSpacer = document.createElement('div');
    controlsSpacer.id = 'controls-spacer';
    controlsSpacer.className = 'hide';
    controlsSpacer.style.height = controls.offsetHeight + 'px';
    controls.parentNode.insertBefore(controlsSpacer, controls.nextSibling);
  }

  function checkScroll() {
    if (document.body.classList.contains('menu-open') || 
    document.body.classList.contains('cart-open') || 
    document.body.classList.contains('search-open') || 
    document.body.classList.contains('filter-open') ||
    document.body.classList.contains('search-filter-open')) {
      ticking = false;
      return;
    }

    const scrollY = window.scrollY;
    
    if (scrollY >= headerOffsetTop && !isFixed) {
      isFixed = true;
      header.classList.add('header-fixed');
      spacer.classList.remove('hide');
    } else if (scrollY < headerOffsetTop && isFixed) {
      isFixed = false;
      header.classList.remove('header-fixed');
      spacer.classList.add('hide');
    }

    if (controls && controlsSpacer && productsGrid) {
      const headerHeight = header.offsetHeight;
      const triggerPoint = productsGridOffsetTop - headerHeight;
      
      if (scrollY >= triggerPoint && !isControlsFixed) {
        isControlsFixed = true;
        controls.classList.add('controls-fixed');
        controlsSpacer.classList.remove('hide');
      } else if (scrollY < triggerPoint && isControlsFixed) {
        isControlsFixed = false;
        controls.classList.remove('controls-fixed');
        controlsSpacer.classList.add('hide');
        controls.classList.add('sliding-up');
        setTimeout(() => {
          controls.classList.remove('sliding-up');
        }, 300);
      }
    }
    
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(checkScroll);
      ticking = true;
    }
  });
});