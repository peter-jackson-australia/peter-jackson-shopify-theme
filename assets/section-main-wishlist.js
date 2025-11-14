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

  /**
   * @return {{
   *   emptyState: () => void,
   *   notEmptyState: () => void,
   * }}
   */
  const getWishlistPageActions = (page) => {
    const emptyElem = page.querySelector(".wishlist__state wishlist__state--empty")
    const notEmptyElem = page.querySelector(".wishlist__state wishlist__state--not-empty")

    return {
      emptyState: () => {
        emptyElem.style.display = "flex"
        notEmptyElem.style.display = "none"
      },
      notEmptyState: () => {
        emptyElem.style.display = "none"
        notEmptyElem.style.display = "flex"
      }
    }
  }

  const initWishlistForm = async (pageActions) => (elem) => {
    const wishlistForm = elem.querySelector(".wishlist-form")
    const wishlistButton = wishlistForm.querySelector(".wishlist-button")
    const productId = elem.getAttribute("data-product-id")
    const wishlistButtonActions = getWishlistButtonActions(wishlistButton)
  
    wishlistForm.addEventListener("submit", async (ev) => {
      ev.preventDefault()
      if (isLoading) return

      isLoading = true
      wishlistButtonActions.setLoading()

      const response = await removeFromWishlist(productId)
      if (response instanceof Error) {
        console.error(response)
        wishlistButtonActions.setRemoveFromWishlist()
        if (document.querySelectorAll(".product-card").length == 0) pageActions.emptyState()
      } else if (response.status === 200 || response.status === 201) {
        // won't be visible, but worth adding in case of delay while deleting wishlist item from u
        wishlistButtonActions.setAddToWishlist()
        elem.remove()
      } else {
        console.warn("Could not remove from cart: ", response.status, await response.text())
        wishlistButtonActions.setRemoveFromWishlist()
      }

      isLoading = false
    })
  }

    console.log(document.currentScript.getAttribute("data-section-id"))
  const section = document.querySelector(`#${document.currentScript.getAttribute("data-section-id")}`)
    console.log(section)
  const pageActions = getWishlistPageActions(section)
  document.querySelectorAll(".product-card").forEach(initWishlistForm(pageActions))
})()
