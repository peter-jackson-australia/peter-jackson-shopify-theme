(async () => {
    /** @param {HTMLElement} elem */
    const registerWishlistButton = (elem) => {
        const productId = elem.getAttribute("data-product-id")
        if (!productId || productId == "") {
            console.warn("Element ", productId, " does not have data-product-id attribute, will not link wishlist button")
        }
    }

    document.querySelectorAll(".product-card")
})()
