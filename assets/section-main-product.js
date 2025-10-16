window.Shopify = window.Shopify || {};
Shopify.money_format = shopify_money_format;

document.addEventListener("DOMContentLoaded", () => {
  const productElement = document.querySelector("#product")
  if (productElement) {
    registerBuyableProduct(true)(productElement)
    setupModalOverlay(productElement)
    initStickyCartBar(productElement);
  }
})

window.setupModalOverlay = (containerElement) => {
  const sizeGuideButton = containerElement.querySelector(".size-guide-button");
  const modalOverlayElem = document.querySelector(".modal-overlay")
  const modalClose = modalOverlayElem.querySelector(".modal-close");

  if (sizeGuideButton && modalOverlayElem) {
    sizeGuideButton.addEventListener("click", function () {
      modalOverlayElem.classList.add("is-active");
      document.body.classList.add("modal-open");
    });

    modalOverlayElem.addEventListener("click", function (e) {
      if (e.target === modalOverlayElem) {
        modalOverlayElem.classList.remove("is-active");
        document.body.classList.remove("modal-open");
      }
    });

    if (modalClose) {
      modalClose.addEventListener("click", function () {
        modalOverlayElem.classList.remove("is-active");
        document.body.classList.remove("modal-open");
      });
    }
  }

}

const registerBuyableProduct = (isMainElement) => (elementWrapper) => {
  if (typeof Alpine === "undefined") {
    console.warn("Alpine.js is required for the size guide modal");
  }

  if (isMainElement) {
    if (typeof Splide !== "undefined") {
      initializeProductSlider(elementWrapper);
    } else {
      window.addEventListener("load", function () {
        initializeProductSlider(elementWrapper);
      });
    }
  }

  /** @param elementWrapper {HTMLElement} */
  function initializeProductSlider(elementWrapper) {
    let splideInstance = null;
    const container = elementWrapper.querySelector(".product-images-container");
    const progressBar = elementWrapper.querySelector(".product-images-progress__bar");

    function initSlider() {
      if (splideInstance) {
        splideInstance.destroy();
      }

      const isMobile = window.innerWidth < 1100;

      const options = {
        direction: "ttb",
        height: product_image_height * ((window.innerWidth * 0.5) / product_image_width),
        wheel: true,
        waitForTransition: true,
        arrows: false,
        pagination: false,
        speed: 300,
        drag: true,
        breakpoints: {
          1100: {
            type: "loop",
            direction: "ltr",
            height: product_image_height * ((window.innerWidth * 1) / product_image_width),
            arrows: true,
            perPage: 1,
            pagination: false,
            rewind: false,
            wheel: false,
            drag: true,
            speed: 300,
            waitForTransition: true,
          },
        },
      };

      splideInstance = new Splide(".product-images-splide", options);

      splideInstance.on("mounted move", function () {
        const end = splideInstance.Components.Controller.getEnd() + 1;
        const rate = Math.min((splideInstance.index + 1) / end, 1);

        if (isMobile) {
          progressBar.style.width = String(100 * rate) + "%";
        } else {
          progressBar.style.height = String(100 * rate) + "%";
        }
      });

      splideInstance.mount();
      if (splideInstance.length <= 1) {
        elementWrapper.querySelector(".product-images-progress").style.display = "none";
        if (isMobile) {
          elementWrapper.querySelector(".splide__arrows").style.display = "none";
        }
      } else {
        elementWrapper.querySelector(".product-images-progress").style.display = "";
        if (isMobile) {
          elementWrapper.querySelector(".splide__arrows").style.display = "";
        }
      }

      if (isMobile) {
        container.classList.add("product-images-container--mobile");
      } else {
        container.classList.remove("product-images-container--mobile");
      }

      const progress = elementWrapper.querySelector(".product-images-progress");
      if (isMobile) {
        progress.classList.add("product-images-progress--mobile");
      } else {
        progress.classList.remove("product-images-progress--mobile");
      }
    }

    initSlider();

    let resizeTimeout;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(initSlider, 250);
    });
  }

  const tabButtons = elementWrapper.querySelectorAll(".product-tabs__tab");
  const tabContents = elementWrapper.querySelectorAll(".product-tabs__content");

  if (tabButtons.length > 0) {
    const descriptionTab = elementWrapper.querySelector('[data-tab="description"]');
    if (descriptionTab) {
      descriptionTab.classList.add("is-active");
      const descriptionContent = elementWrapper.querySelector('[data-content="description"]');
      if (descriptionContent) {
        descriptionContent.classList.add("is-active");
      }
    } else if (tabButtons[0]) {
      tabButtons[0].classList.add("is-active");
      const firstTabContent = elementWrapper.querySelector(`[data-content="${tabButtons[0].dataset.tab}"]`);
      if (firstTabContent) {
        firstTabContent.classList.add("is-active");
      }
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const tabName = this.dataset.tab;

        tabButtons.forEach((tab) => tab.classList.remove("is-active"));
        tabContents.forEach((content) => content.classList.remove("is-active"));

        this.classList.add("is-active");
        const activeContent = elementWrapper.querySelector(`[data-content="${tabName}"]`);

        if (activeContent) {
          activeContent.classList.add("is-active");
        }
      });
    });
  }
};

/** @param elementWrapper {HTMLElement} */
function initStickyCartBar(elementWrapper) {
  const originalButton = document.querySelector("#js--addtocart");
  const stickyBar = document.querySelector(".sticky-cart-bar");
  const stickyContainer = document.querySelector(".sticky-cart-bar__container");

  if (!originalButton || !stickyBar || !stickyContainer) {
    console.warn(`sticky bar not being initialised because: ${!originalButton}, ${!stickyBar}, ${!stickyContainer}`)
    return;
  }

  const clonedButton = originalButton.cloneNode(true);
  stickyContainer.appendChild(clonedButton);

  function isDesktop() {
    return window.innerWidth >= 1100;
  }

  function syncButtons() {
    const originalNotifyButton = elementWrapper.querySelector("#js--notify-me");
    const klaviyoForm = elementWrapper.querySelector(".klaviyo-form-WMidEs");

    const isNotifyMeVisible = originalNotifyButton && originalNotifyButton.style.display !== "none";
    const isKlaviyoVisible = klaviyoForm && klaviyoForm.style.display !== "none" && klaviyoForm.style.display !== "";

    if (product_has_only_default_variant) {
      if (isNotifyMeVisible || isKlaviyoVisible) {
        clonedButton.textContent = "Notify Me";
        clonedButton.disabled = false;
        clonedButton.className = originalButton.className;
        const originalStyle = originalButton.getAttribute("style");
        if (originalStyle) {
          clonedButton.setAttribute("style", originalStyle);
        }
        clonedButton.style.display = "flex";
      } else {
        clonedButton.disabled = originalButton.disabled;
        clonedButton.innerHTML = originalButton.innerHTML;
        clonedButton.className = originalButton.className;
        clonedButton.type = originalButton.type;
        clonedButton.name = originalButton.name;
        clonedButton.value = originalButton.value;

        Array.from(originalButton.attributes).forEach((attr) => {
          if (attr.name !== "id") {
            clonedButton.setAttribute(attr.name, attr.value);
          }
        });

        const originalStyle = originalButton.getAttribute("style");
        if (originalStyle) {
          clonedButton.setAttribute("style", originalStyle);
        }
      }
    } else {
      if (isNotifyMeVisible || isKlaviyoVisible) {
        clonedButton.textContent = "Notify Me";
        clonedButton.disabled = false;
        clonedButton.className = originalButton.className;
        const originalStyle = originalButton.getAttribute("style");
        if (originalStyle) {
          clonedButton.setAttribute("style", originalStyle);
        }
        clonedButton.style.display = "flex";
      } else {
        if (product_is_gift_card) {
          clonedButton.textContent = "Select Card Amount";
        } else {
          clonedButton.textContent = "Select Your Size";
        }
        clonedButton.disabled = false;
        clonedButton.className = originalButton.className;
        const originalStyle = originalButton.getAttribute("style");
        if (originalStyle) {
          clonedButton.setAttribute("style", originalStyle);
        }
      }
    }
  }

  function syncAll() {
    syncButtons();
    updateStickyProductInfo();
    updateStickyPrices();
  }

  clonedButton.addEventListener("click", function (e) {
    e.preventDefault();
    const originalNotifyButton = elementWrapper.querySelector("#js--notify-me");
    const klaviyoForm = elementWrapper.querySelector(".klaviyo-form-WMidEs");

    const isNotifyMeVisible = originalNotifyButton && originalNotifyButton.style.display !== "none";
    const isKlaviyoVisible = klaviyoForm && klaviyoForm.style.display !== "none" && klaviyoForm.style.display !== "";

    if (isNotifyMeVisible || isKlaviyoVisible) {
      scrollToVariantForm(elementWrapper);
      if (isNotifyMeVisible) {
        setTimeout(() => {
          if (originalNotifyButton) {
            originalNotifyButton.click();
          }
        }, 300);
      }
    } else if (!product_has_only_default_variant) {
      scrollToVariantForm(elementWrapper);
    } else {
      originalButton.click();
    }
  });

  function checkButtonPosition() {
    const originalNotifyButton = elementWrapper.querySelector("#js--notify-me");
    const klaviyoForm = elementWrapper.querySelector(".klaviyo-form-WMidEs");
    const addToCartButton = elementWrapper.querySelector("#js--addtocart");

    const isNotifyMeVisible = originalNotifyButton && originalNotifyButton.style.display !== "none";
    const isKlaviyoVisible = klaviyoForm && klaviyoForm.style.display !== "none" && klaviyoForm.style.display !== "";
    const isAddToCartVisible = addToCartButton && addToCartButton.style.display !== "none";

    let buttonRect;
    if (isKlaviyoVisible) {
      buttonRect = klaviyoForm.getBoundingClientRect();
    } else if (isNotifyMeVisible) {
      buttonRect = originalNotifyButton.getBoundingClientRect();
    } else if (isAddToCartVisible) {
      buttonRect = addToCartButton.getBoundingClientRect();
    } else {
      buttonRect = originalButton.getBoundingClientRect();
    }

    const buttonBottom = buttonRect.bottom;

    if (buttonBottom < 0) {
      stickyBar.classList.add("is-visible");
    } else {
      stickyBar.classList.remove("is-visible");
    }
  }

  const variantOptions = elementWrapper.querySelectorAll(".js--variant-option");
  variantOptions.forEach(function (option) {
    option.addEventListener("change", function () {
      setTimeout(syncAll, 10);
    });
  });

  window.addEventListener("scroll", checkButtonPosition);

  drag: false,
    window.addEventListener("resize", function () {
      checkButtonPosition();
      syncAll();
    });

  const mutationObserver = new MutationObserver(syncAll);
  mutationObserver.observe(originalButton, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  const notifyButton = elementWrapper.querySelector("#js--notify-me");
  if (notifyButton) {
    const notifyMutationObserver = new MutationObserver(syncAll);
    notifyMutationObserver.observe(notifyButton, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  checkButtonPosition();
  syncAll();
}

/** @param elementWrapper {HTMLElement} */
function getSelectedVariantOptions(elementWrapper) {
  const selectedOptions = [];
  const optionInputs = elementWrapper.querySelectorAll(".js--variant-option:checked");

  optionInputs.forEach(function (input) {
    let value = input.value;
    if (input.name === "option1" && value.includes(".0")) {
      value = value.replace(".0", "");
    }
    selectedOptions.push(value);
  });

  return selectedOptions;
}

/** @param elementWrapper {HTMLElement} */
function getCurrentVariant(elementWrapper) {
  const selectedOptions = [];
  const optionInputs = elementWrapper.querySelectorAll(".js--variant-option:checked");

  optionInputs.forEach(function (input) {
    selectedOptions.push(input.value);
  });

  return (
    variants.find(function (variant) {
      return variant.option1 === selectedOptions[0] && variant.option2 === selectedOptions[1] && variant.option3 === selectedOptions[2];
    }) || current_variant
  );
}

function updateStickyProductInfo(elementWrapper) {
  const stickyInfo = elementWrapper.querySelector(".js--sticky-product-info");
  if (!stickyInfo) return;

  const selectedOptions = getSelectedVariantOptions();
  const mainPrice = elementWrapper.querySelector(".js--variant-price");

  let variantString = "";
  if (selectedOptions.length > 0) {
    variantString = " " + selectedOptions.join(" / ");
  }

  const priceString = mainPrice ? " - " + mainPrice.textContent.trim() : "";

  stickyInfo.innerHTML = '<span class="heading--l">' + product_title + ":</span>" + variantString + priceString;
}

function updateStickyPrices(elementWrapper) {
  const currentVar = getCurrentVariant();
  const stickyPrice = elementWrapper.querySelector(".js--sticky-price");
  const stickyComparePrice = elementWrapper.querySelector(".js--sticky-compare-price");
  const stickyComparePriceContainer = stickyComparePrice ? stickyComparePrice.parentElement : null;

  const stickyMobilePrice = elementWrapper.querySelector(".js--sticky-mobile-price");
  const stickyMobileComparePrice = elementWrapper.querySelector(".js--sticky-mobile-compare-price");

  const mainPrice = elementWrapper.querySelector(".js--variant-price");
  const mainComparePrice = elementWrapper.querySelector(".js--variant-compareatprice");

  if (stickyPrice && mainPrice) {
    stickyPrice.textContent = mainPrice.textContent;
  }

  if (stickyComparePrice && stickyComparePriceContainer) {
    if (mainComparePrice && mainComparePrice.textContent.trim() !== "") {
      stickyComparePrice.textContent = mainComparePrice.textContent;
      stickyComparePrice.style.display = "inline";
    } else {
      stickyComparePrice.style.display = "none";
    }
  }

  if (stickyMobilePrice && mainPrice) {
    stickyMobilePrice.textContent = mainPrice.textContent;
  }

  if (stickyMobileComparePrice) {
    if (mainComparePrice && mainComparePrice.textContent.trim() !== "") {
      stickyMobileComparePrice.textContent = mainComparePrice.textContent;
      stickyMobileComparePrice.style.display = "inline";
    } else {
      stickyMobileComparePrice.style.display = "none";
    }
  }
}

function scrollToVariantForm(elementWrapper) {
  const productDetails = elementWrapper.querySelector("#product-details");
  const fixedHeader = elementWrapper.querySelector(".header-fixed");

  if (productDetails) {
    const rect = productDetails.getBoundingClientRect();
    const headerHeight = fixedHeader ? fixedHeader.offsetHeight : 0;
    const targetPosition = window.pageYOffset + rect.top - headerHeight + 1;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  }
}