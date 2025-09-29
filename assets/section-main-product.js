window.Shopify = window.Shopify || {};
Shopify.money_format = shopify_money_format;

document.addEventListener("DOMContentLoaded", function () {
  if (typeof Alpine === "undefined") {
    console.warn("Alpine.js is required for the size guide modal");
  }

  const sizeGuideButton = document.querySelector(".size-guide-button");
  const modalOverlay = document.querySelector(".modal-overlay");
  const modalClose = document.querySelector(".modal-close");

  if (sizeGuideButton && modalOverlay) {
    sizeGuideButton.addEventListener("click", function () {
      modalOverlay.classList.add("is-active");
      document.body.classList.add("modal-open");
    });

    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove("is-active");
        document.body.classList.remove("modal-open");
      }
    });

    if (modalClose) {
      modalClose.addEventListener("click", function () {
        modalOverlay.classList.remove("is-active");
        document.body.classList.remove("modal-open");
      });
    }
  }

  if (typeof Splide !== "undefined") {
    initializeProductSlider();
  } else {
    window.addEventListener("load", function () {
      initializeProductSlider();
    });
  }

  function initializeProductSlider() {
    let splideInstance = null;
    const container = document.querySelector(".product-images-container");
    const progressBar = document.querySelector(".product-images-progress__bar");

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
        document.querySelector(".product-images-progress").style.display = "none";
        if (isMobile) {
          document.querySelector(".splide__arrows").style.display = "none";
        }
      } else {
        document.querySelector(".product-images-progress").style.display = "";
        if (isMobile) {
          document.querySelector(".splide__arrows").style.display = "";
        }
      }

      if (isMobile) {
        container.classList.add("product-images-container--mobile");
      } else {
        container.classList.remove("product-images-container--mobile");
      }

      const progress = document.querySelector(".product-images-progress");
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

  const tabButtons = document.querySelectorAll(".product-tabs__tab");
  const tabContents = document.querySelectorAll(".product-tabs__content");

  if (tabButtons.length > 0) {
    const descriptionTab = document.querySelector('[data-tab="description"]');
    if (descriptionTab) {
      descriptionTab.classList.add("is-active");
      const descriptionContent = document.querySelector('[data-content="description"]');
      if (descriptionContent) {
        descriptionContent.classList.add("is-active");
      }
    } else if (tabButtons[0]) {
      tabButtons[0].classList.add("is-active");
      const firstTabContent = document.querySelector(`[data-content="${tabButtons[0].dataset.tab}"]`);
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
        const activeContent = document.querySelector(`[data-content="${tabName}"]`);

        if (activeContent) {
          activeContent.classList.add("is-active");
        }
      });
    });
  }

  function getSelectedVariantOptions() {
    const selectedOptions = [];
    const optionInputs = document.querySelectorAll(".js--variant-option:checked");

    optionInputs.forEach(function (input) {
      let value = input.value;
      if (input.name === "option1" && value.includes(".0")) {
        value = value.replace(".0", "");
      }
      selectedOptions.push(value);
    });

    return selectedOptions;
  }

  function getCurrentVariant() {
    const selectedOptions = [];
    const optionInputs = document.querySelectorAll(".js--variant-option:checked");

    optionInputs.forEach(function (input) {
      selectedOptions.push(input.value);
    });

    return (
      variants.find(function (variant) {
        return variant.option1 === selectedOptions[0] && variant.option2 === selectedOptions[1] && variant.option3 === selectedOptions[2];
      }) || current_variant
    );
  }

  function updateStickyProductInfo() {
    const stickyInfo = document.querySelector(".js--sticky-product-info");
    if (!stickyInfo) return;

    const selectedOptions = getSelectedVariantOptions();
    const mainPrice = document.querySelector(".js--variant-price");

    let variantString = "";
    if (selectedOptions.length > 0) {
      variantString = " " + selectedOptions.join(" / ");
    }

    const priceString = mainPrice ? " - " + mainPrice.textContent.trim() : "";

    stickyInfo.innerHTML = '<span class="heading--l">' + product_title + ":</span>" + variantString + priceString;
  }

  function updateStickyPrices() {
    const currentVar = getCurrentVariant();
    const stickyPrice = document.querySelector(".js--sticky-price");
    const stickyComparePrice = document.querySelector(".js--sticky-compare-price");
    const stickyComparePriceContainer = stickyComparePrice ? stickyComparePrice.parentElement : null;

    const stickyMobilePrice = document.querySelector(".js--sticky-mobile-price");
    const stickyMobileComparePrice = document.querySelector(".js--sticky-mobile-compare-price");

    const mainPrice = document.querySelector(".js--variant-price");
    const mainComparePrice = document.querySelector(".js--variant-compareatprice");

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

  function scrollToVariantForm() {
    const productDetails = document.querySelector("#product-details");
    const fixedHeader = document.querySelector(".header-fixed");

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

  function initStickyCartBar() {
    const originalButton = document.querySelector("#js--addtocart");
    const stickyBar = document.querySelector(".sticky-cart-bar");
    const stickyContainer = document.querySelector(".sticky-cart-bar__container");

    if (!originalButton || !stickyBar || !stickyContainer) return;

    const clonedButton = originalButton.cloneNode(true);
    stickyContainer.appendChild(clonedButton);

    function isDesktop() {
      return window.innerWidth >= 1100;
    }

    function syncButtons() {
      const originalNotifyButton = document.querySelector("#js--notify-me");
      const klaviyoForm = document.querySelector(".klaviyo-form-WMidEs");

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
      const originalNotifyButton = document.querySelector("#js--notify-me");
      const klaviyoForm = document.querySelector(".klaviyo-form-WMidEs");

      const isNotifyMeVisible = originalNotifyButton && originalNotifyButton.style.display !== "none";
      const isKlaviyoVisible = klaviyoForm && klaviyoForm.style.display !== "none" && klaviyoForm.style.display !== "";

      if (isNotifyMeVisible || isKlaviyoVisible) {
        scrollToVariantForm();
        if (isNotifyMeVisible) {
          setTimeout(() => {
            if (originalNotifyButton) {
              originalNotifyButton.click();
            }
          }, 300);
        }
      } else if (!product_has_only_default_variant) {
        scrollToVariantForm();
      } else {
        originalButton.click();
      }
    });

    function checkButtonPosition() {
      const originalNotifyButton = document.querySelector("#js--notify-me");
      const klaviyoForm = document.querySelector(".klaviyo-form-WMidEs");
      const addToCartButton = document.querySelector("#js--addtocart");

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

    const variantOptions = document.querySelectorAll(".js--variant-option");
    variantOptions.forEach(function (option) {
      option.addEventListener("change", function () {
        setTimeout(syncAll, 10);
      });
    });

    window.addEventListener("scroll", checkButtonPosition);
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

    const notifyButton = document.querySelector("#js--notify-me");
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

  initStickyCartBar();
});
