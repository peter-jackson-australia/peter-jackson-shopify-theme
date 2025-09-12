(() => {
  const productHandle = document.currentScript.getAttribute('data-product-handle')
  const templateIsProduct = document.currentScript.getAttribute('data-template-is-product') === "true"

  /*
  * GET RECENTLY VIEWED ITEMS
  * Returns list of recently viewed items from local storage.
  */
  function _getRecentlyViewed() {
    let recentlyViewed = localStorage.getItem("recentlyViewed");
    let items = JSON.parse(recentlyViewed);
    if (items !== null && items[0] !== undefined) {
      let sortedItems = items.sort(function (a, b) {
        return a.timestamp - b.timestamp;
      });
      return sortedItems;
    } else {
      return [];
    }
  };

  /*
  * SAVE RECENTLY VIEWED ITEM
  * Saves item to local storage data.
  * @param $handle (string) - Product handle
  */
  function saveRecentlyViewedProduct(handle) {
    let recentlyViewed = _getRecentlyViewed();
    let exists = false;
    let maxItemsToSave = 4;
    recentlyViewed.forEach(function (item, index) {
      if (item.handle == handle) {
        exists = true;
      }
    });

    if (exists === false) {
      recentlyViewed.splice(maxItemsToSave);
      recentlyViewed.unshift({
        handle: handle,
        date: Date.now(),
      });
      localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
    }

    _getRecentlyViewed();
  };

  /*
  * DISPLAYS RECENTLY VIEWED ITEMS
  * Displays the items on the page. This looks for .js--recently_viewed.
  */
  function displayRecentlyViewed() {
    let items = _getRecentlyViewed();
    const limit = 4;
    const el = document.getElementById("js--recently_viewed");
    if (document.getElementById("recently-viewed") != null) {
      if (items.length > 0) {
        items.forEach(function (item, index) {
          if ((index + 1) <= limit) {
            let url = `/products/${item.handle}?view=card`;
            fetch(url, {
              method: "GET",
              redirect: "error",
            })
              .then(function (response) {
                if (response.status == 200) {
                  return response.text();
                } else {
                  let cleanUpArray = items.filter((i) => i.handle != item.handle);
                  localStorage.setItem("recentlyViewed", JSON.stringify(cleanUpArray));
                  return "";
                }
              })
              .then(function (card) {
                el.insertAdjacentHTML("beforeend", card);
              })
              .catch(function (error) {
                let cleanUpArray = items.filter((i) => i.handle != item.handle);
                localStorage.setItem("recentlyViewed", JSON.stringify(cleanUpArray));
              });
          }
        });
      } else {
        document.getElementById("recently-viewed").style.display = "none";
      }
    }
  };

  var ready = (callback) => {
    if (document.readyState != 'loading') callback();
    else document.addEventListener('DOMContentLoaded', callback);
  };

  ready(function () {
    displayRecentlyViewed();
    if (templateIsProduct) {
      saveRecentlyViewedProduct(productHandle);
    }

    document.addEventListener(
      'click',
      function (event) {
        if (event.target.closest('.splide__arrow')) {
          event.preventDefault();
        }
      },
      true
    );
  });
})()