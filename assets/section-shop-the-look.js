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

  let stateScrollY = undefined;
  let modalProductSplides = []
  let modalSplide = undefined;

  const modalOpenClassName = "shop-the-look__modal-container--open"
  const modalElem = section.querySelector(".shop-the-look__modal-container")
  const modalSlider = document.querySelectorAll(".shop-the-look__modal-slider")[0];
  const siteHeader = document.querySelector("#site-header")

  const modalCloseBtns = modalElem.querySelectorAll(".shop-the-look__modal-close-button")
  const nextItemButtons = modalElem.querySelectorAll(".shop-the-look__switch-product-button--next")
  const prevItemButtons= modalElem.querySelectorAll(".shop-the-look__switch-product-button--prev")

  const productImageSliders = section.querySelectorAll(".buyable-product-wrapper .splide")

  const isMobile = () => {
    return window.innerWidth < 1300;
  }

  /**----------------------------------------------------
   *                 GENERIC UTILS
   * Should be refactored into other files at some point
   *----------------------------------------------------*/

  /**
   * Freezes the document's height for modals, by setting the main body element's position to `"fixed"`. Will also set
   * navbar's position to `"fixed"`, to ensure it doesn't disappear.
   * @param siteHeader {HTMLElement|undefined} Header element. If set, it will set it's `position` property to `fixed`.
   * @return {number} the scroll position of the document before freezing. To be used with `unfreezeDocumentHeight`
   */
  const freezeDocumentHeight = (siteHeader) => {
    const scroll = document.body.style.position === "fixed" ? Math.abs(parseInt(document.body.style.top || "0")) : window.scrollY;

    if (document.body.style.position !== "fixed") {
      if (!document.body.classList.contains("modal-open")) document.body.classList.add("modal-open")
      Object.assign(document.body.style, {
        position: "fixed",
        top: `-${scroll}px`,
        width: "100%",
      });
    }

    if (siteHeader) {
      Object.assign(siteHeader.style, {
        position: "fixed",
        top: "0",
      })
    }

    return scroll
  }

  /**
   * Will unfreeze the document height, by removing/resetting all properties changed via `freezeDocumentHeight`.
   * @param siteHeader {HTMLElement|undefined} Header element. If set, it will remove any changes made by `freezeDocumentHeight`.
   * @param scrollHeight {number|undefined} Optional scroll height property, when provided, will snap the page to that
   *                                        position after removing all properties
   */
  const unfreezeDocumentHeight = (scrollHeight, siteHeader) => {
    if (siteHeader) {
      Object.assign(siteHeader.style, {
        position: "",
        top: "",
      })
    }

    if (document.body.classList.contains("modal-open")) document.body.classList.remove("modal-open")

    Object.assign(document.body.style, { position: "", top: "", width: "" });
    window.scrollTo({
      top: scrollHeight ?? 0,
      left: 0,
      behavior: "instant"
    })
  }

  /**
   * If `tabElement` contains the property `data-tab`, and is equal to `selectedTabId`, it will add `selectedClassName`
   * to it's class list. If it is not equal,
   * @param selectedTabId {string}
   * @param selectedClassName {string}
   * @param tabElement {Element}
   */
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
   * Using the `data-tab` attribute of `clickEvent.target`, this will set any button/content with the same `data-tab`
   * as the target to `tab-collection__tab/content--active`.
   * @param tabContentContainers {NodeListOf<Element>} All tab content elements of the tab container
   * @param tabButtons {NodeListOf<Element>} All tab buttons of the tab container
   * @returns {(function(Event): void)|*}
   */
  const onTabButtonClick = (tabButtons, tabContentContainers) => (clickEvent) => {
    const tabElem = clickEvent.target
    const tabId = tabElem.getAttribute("data-tab")
    if (!tabId || tabId == "") return

    tabButtons.forEach(swapTabClassNamesOnSelected(tabId, "tab-collection__tab--active"))
    tabContentContainers.forEach(swapTabClassNamesOnSelected(tabId, "tab-collection__content--active"))
  }

  /**
   * Initialises all tab buttons and content together.
   * @param rootTabCollection {Element} The root tab collection element, which contains one of each
   *                                    `.tab-collection__tab` and `tab-collection__content` classes
   */
  const initTabCollection = (rootTabCollection) => {
    const tabButtons = rootTabCollection.querySelectorAll(".tab-collection__tab")
    const tabCollections = rootTabCollection.querySelectorAll(".tab-collection__content")

    tabButtons.forEach(tabButton => {
      tabButton.addEventListener("click", onTabButtonClick(tabButtons, tabCollections) )
    })
  }

  /**---------------------------------------------------------
   *                SHOP THE LOOK FUNCTIONS
   * Used primarily by this code. Do not move from this file
   *---------------------------------------------------------*/

  /** Generates a splide instance for products in the shop-the-look section, outside the modal */
  const initialiseShopTheLoopSlider = (elem) => {
    new Splide(elem, {
      perPage: 1,
      type: 'loop',
      gap: 'var(--space-m)',
      direction: 'ttb',
      pagination: false,
      height: "100%",
      drag: true,
      snap: true,
      wheel: true,
      waitForTransition: true,
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
      type: "loop",
      direction: direction,
      pagination: false,
      arrows: isMobile,
      height: "100%",
      drag: true,
      snap: true,
      wheel: true,
      waitForTransition: true,
    })

    const progressBar = element.querySelector(".shop-the-look__product-images-progress > .shop-the-look__product-images-progress-bar")
    updateProductImageSliderHeight(newSplide, progressBar)

    return newSplide
  }

  /** Manages the width/height of the progress bar for image slides in the modal */
  const updateProductImageSliderHeight = (splideInstance, sliderElement) => {
    splideInstance.on("mounted move", () => {
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
    stateScrollY = freezeDocumentHeight(siteHeader)

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
  }

  const closeProductModal = () => {
    unfreezeDocumentHeight(stateScrollY, siteHeader)

    destroyProductImageSplides()

    if (modalSplide) {
      modalSplide.destroy();
      modalSplide = undefined;
    }
    if (modalElem.classList.contains(modalOpenClassName)) {
      modalElem.classList.remove(modalOpenClassName)
    }
  }

  /**
   * @param listElement {HTMLElement}
   */
  const connectShopTheLookItemToModal = (listElement) => {
    const productId = listElement.getAttribute("data-product-id")
    if (!productId) {
      console.error("list element does not have data-product-id attribute: ", listElement)
      return
    }
    const linkAnchor = listElement.querySelector(".shop-the-look__product-link")
    if (linkAnchor) {
      linkAnchor.addEventListener("click", (_) => openProductModal(parseInt(productId)))
    }
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

  document.querySelectorAll(".tab-collection").forEach(initTabCollection)
})();