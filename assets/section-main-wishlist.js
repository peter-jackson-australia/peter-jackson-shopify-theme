(async () => {
    /** @param {HTMLElement} elem */
    const registerWishlistButton = (elem) => {
        const wishlistForm = elem.querySelector("wishlist-form")
        const productId = elem.getAttribute("data-product-id")

        wishlistForm.addEventListener("submit", (ev) => {
            /**
             * @param button {HTMLButtonElement}
             * @return {{
             *   setRemoveFromWishlist: () => void,
             *   setAddToWishlist: () => void,
             *   setLoading: () => void,
             * }}
             */
            const getWishlistButtonActions = (button) => {
                const buttonImageAdd = button.querySelector(".wishlist-button__icon-add-to-wishlist")
                const buttonImageRemove = button.querySelector(".wishlist-button__icon-remove-from-wishlist")
                const buttonImageLoad = button.querySelector(".wishlist-button__icon-loading")

                return {
                    setRemoveFromWishlist: () => {
                        buttonImageAdd.style.display = "none"
                        buttonImageRemove.style.display = "flex"
                        buttonImageLoad.style.display = "none"
                    },
                    setAddToWishlist: () => {
                        buttonImageAdd.style.display = "flex"
                        buttonImageRemove.style.display = "none"
                        buttonImageLoad.style.display = "none"
                    },
                    setLoading: () => {
                        buttonImageAdd.style.display = "none"
                        buttonImageRemove.style.display = "none"
                        buttonImageLoad.style.display = "flex"
                    }
                }
            }

        })
    }

    document.querySelectorAll(".product-card")
})()
