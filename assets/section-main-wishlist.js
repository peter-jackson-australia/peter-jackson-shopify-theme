(async () => {
    /** @param {HTMLElement} elem */
    const registerWishlistButton = (elem) => {
        const wishlistForm = elem.querySelector("wishlist-form")
        const productId = elem.getAttribute("data-product-id")
        if (!productId || productId == "") {
            console.warn("Element ", elem, " does not have data-product-id attribute, will not link wishlist button")
            return
        }

        
    }

    document.querySelectorAll(".product-card")
})()
