(() => {
  const sectionId = document.currentScript.getAttribute("data-section-id")
  const productData = JSON.parse(document.currentScript.getAttribute("data-products"))
  const section = document.querySelector(`#shopify-section-${sectionId}`)
  const mainShopTheLookSliderItems = section.querySelectorAll(".shop-the-look__slide")

  const mainSlider = section.querySelector(`.shop-the-look__slider`);
  if (mainSlider) {
    new Splide(mainSlider, {
      perPage: 1,
      type: 'loop',
      gap: 'var(--space-m)',
      arrows: true,
      pagination: false,
      drag: true,
      snap: true,
    }).mount();
  }

  const modalOpenClassName = "shop-the-look__modal-container--open"
  const modalElem = section.querySelector(".shop-the-look__modal-container")
  const modalSlider = document.querySelectorAll(".shop-the-look__modal-slider")[0];

  const modalCloseBtns = modalElem.querySelectorAll(".shop-the-look__modal-close-button")
  const nextItemButtons = modalElem.querySelectorAll(".shop-the-look__switch-product-button--next")
  const prevItemButtons= modalElem.querySelectorAll(".shop-the-look__switch-product-button--prev")

  const productImageSliders = section.querySelectorAll(".buyable-product-wrapper .splide")
  let modalProductSplides = []

  let modalSplide = undefined;

  const isMobile = () => {
    return window.innerWidth < 1300;
  }

  /** Generates a splide instance for products in the shop-the-look section, outside the modal */
  const initialiseShopTheLoopSlider = (elem) => {
    new Splide(elem, {
      perPage: 1,
      type: 'loop',
      gap: 'var(--space-m)',
      arrows: false,
      direction: 'ttb',
      pagination: false,
      height: "100%",
      drag: true,
      snap: true,
    }).mount();
  }

  /** Generates a splide instance for all products inside the modal */
  const initialiseProductsInModalSlider = (startIdx = 0) => {
    return new Splide(modalSlider, {
      type: "fade",
      arrows: false,
      start: startIdx,
      drag: false,
      pagination: false,
    }).mount();
  }

  /** Generates a splide instance for all images for a product. If a scrollbar exists, it will initialise it too */
  const initialiseProductImagesSplide = (isMobile) => (element) => {
    const direction = isMobile ? "ltr" : "ttb"

    const newSplide = new Splide(element, {
      type: "slide",
      direction: direction,
      pagination: false,
      arrows: isMobile,
      height: "100%",
      drag: true,
      snap: true,
    })

    const progressBar = element.querySelector(".shop-the-look__product-images-progress > .shop-the-look__product-images-progress-bar")
    updateProductImageSliderHeight(newSplide, progressBar)

    return newSplide
  }

  const updateProductImageSliderHeight = (splideInstance, sliderElement) => {
    splideInstance.on("mounted move", function () {
      const end = splideInstance.Components.Controller.getEnd() + 1;
      const rate = Math.min((splideInstance.index + 1) / end, 1);

      if (isMobile()) {
        sliderElement.style.width = String(100 * rate) + "%";
        sliderElement.style.height = "100%";
      } else {
        sliderElement.style.height = String(100 * rate) + "%";
        sliderElement.style.width = "100%";
      }
    });
  }

  const openProductModal = (productId) => {
    if (!modalSplide) {
      const idx = productData.findIndex(p => p.id == productId)
      modalSplide = initialiseProductsInModalSlider(idx)
    }
    if (!modalElem.classList.contains(modalOpenClassName)) {
      modalElem.classList.add(modalOpenClassName)
    }

    if (modalProductSplides.length == 0) {
      refreshProductImageSplides()
    }
    const body = document.body
    if (!body.classList.contains("modal-open")) body.classList.add("modal-open")
  }

  const closeProductModal = () => {
    destroyProductImageSplides()

    if (modalSplide) {
      modalSplide.destroy();
      modalSplide = undefined;
    }
    if (modalElem.classList.contains(modalOpenClassName)) {
      modalElem.classList.remove(modalOpenClassName)
    }
    const body = document.body
    if (body.classList.contains("modal-open")) body.classList.remove("modal-open")
  }

  /**
   * @param listElement {Element}
   */
  const connectShopTheLookItemToModal = (listElement) => {
    const productId = listElement.getAttribute("data-product-id")
    if (!productId) {
      console.error("list element does not have data-product-id attribute: ", listElement)
      return
    }
    listElement.addEventListener("click", (_) => openProductModal(parseInt(productId)))
  }

  /**
   * @param elem {Event}
   */
  const onModalContainerClick = (ev) => {
    if (ev.target != modalElem) {
      return
    }

    closeProductModal()
  }

  /** calls `splide.destroy()` on all modalProductSplides, and sets it to undefined */
  const destroyProductImageSplides = () => {
    modalProductSplides.forEach(s => s.destroy())
    modalProductSplides = []
  }

  /** Loops through all product image sliders, and mounts a new splide for it */
  const refreshProductImageSplides = () => {
    productImageSliders.forEach(s => {
      const newSplide = initialiseProductImagesSplide(isMobile())(s)
      newSplide.mount()
      modalProductSplides.push(newSplide)
    })
  }

  mainShopTheLookSliderItems.forEach(connectShopTheLookItemToModal)
  modalElem.addEventListener("click", onModalContainerClick)
  modalCloseBtns.forEach(cb => cb.addEventListener("click", (_) => closeProductModal()))

  section.querySelectorAll(".shop-the-look__modal-images")
    .forEach(initialiseShopTheLoopSlider)

  section.querySelectorAll(".buyable-product-wrapper").forEach(p => {
    window.updateProductPurchaseDetails(p)
    window.setupModalOverlay(p)
  })
  window.addEventListener("resize", (_) => {
    destroyProductImageSplides()
    refreshProductImageSplides()
  }, true)

  nextItemButtons.forEach(b => b.addEventListener("click", () => {
    if (modalSplide) modalSplide.go(">");
  }))

  prevItemButtons.forEach(b => b.addEventListener("click", () => {
    if (modalSplide) modalSplide.go("<");
  }))

  /************
   TABS
   ************/

  /** @param elem {Element} */
  const swapTabClassNamesOnSelected = (selectedTabId, selectedClassName) => (tabElement) => {
    const tabButtonId = tabElement.getAttribute("data-tab")
    if (tabButtonId == selectedTabId) {
      if (!tabElement.classList.contains(selectedClassName)) {
        tabElement.classList.add(selectedClassName)
      }
    } else if (tabElement.classList.contains(selectedClassName))  {
      tabElement.classList.remove(selectedClassName)
    }
  }

  /**
   * @param tabCollections {NodeListOf<Element>}
   * @param tabButtons {NodeListOf<Element>}
   * @returns {(function(Event): void)|*}
   */
  const onTabButtonClick = (tabButtons, tabCollections) => (clickEvent) => {
    const tabElem = clickEvent.target
    const tabId = tabElem.getAttribute("data-tab")
    if (!tabId || tabId == "") return

    tabButtons.forEach(swapTabClassNamesOnSelected(tabId, "tab-collection__tab--active"))
    tabCollections.forEach(swapTabClassNamesOnSelected(tabId, "tab-collection__content--active"))
  }

  /**
   * @param elem {Element}
   */
  const initTabCollection = (elem) => {
    const tabButtons = elem.querySelectorAll(".tab-collection__tab")
    const tabCollections = elem.querySelectorAll(".tab-collection__content")

    tabButtons.forEach(tabButton => {
      tabButton.addEventListener("click", onTabButtonClick(tabButtons, tabCollections) )
    })
  }

  document.querySelectorAll(".tab-collection").forEach(initTabCollection)
})();