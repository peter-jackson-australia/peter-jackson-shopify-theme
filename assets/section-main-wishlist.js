(async () => {
  /**
   * Removes a product by its ID from the logged in customer's wishlist
   * @param productId {String}
   * @returns {Promise<Response|Error>}
   */
  const removeFromWishlist = async (productId) => {
    const params = new URLSearchParams({
      productid: productId,
    })

    const endpoint = `/apps/wishlist?${params.toString()}`

    try {
      return await fetch(endpoint, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      })
    } catch(e) {
      return e
    }
  }

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

  /** @param {Number} productId */
  const removeWishlistItemFromUI = (productId) => {
    
  }

  /** @param {HTMLElement} elem */
  const registerWishlistButton = (elem) => {
    let isLoading = false

    const wishlistForm = elem.querySelector("wishlist-form")
    const wishlistButton = wishlistForm.querySelector("wishlist-button")
    const productId = elem.getAttribute("data-product-id")
    const wishlistActions = getWishlistButtonActions(wishlistButton)
  
    wishlistForm.addEventListener("submit", (ev) => {
      if (isLoading) return

      isLoading = true
      wishlistActions.setLoading()

      const response = removeFromWishlist(productId)
      if (response instanceof Error) {
        console.error(response)
        wishlistActions.setRemoveFromWishlist()
      } else {
        // won't be visible, but worth adding in case of delay while deleting wishlist item from u
        wishlistActions.setAddToWishlist()
        removeWishlistItemFromUI(productId)
      }

      isLoading = false
    }
  }

    document.querySelectorAll(".product-card")
})()
