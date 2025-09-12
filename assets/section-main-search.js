(() => {
  if (document.querySelector("#AjaxinateContainer")) {
    var endlessScroll = new Ajaxinate({
      method: "scroll",
      container: "#AjaxinateContainer",
      pagination: "#AjaxinatePagination",
      offset: "100",
      loadingText:
        '<div style="margin: auto 0; display:flex;justify-content:center;align-items:center;padding:var(--space-m) 0;width:100%;height:1px;overflow:hidden"><svg fill=#E7E7E7 height=1 style=max-width:300px viewBox="0 0 100 1"width=100% xmlns=http://www.w3.org/2000/svg><style>.react{animation:moving 1s ease-in-out infinite;transform-origin:0 50%}@keyframes moving{0%{width:0%}50%{width:100%;transform:translateX(0)}100%{width:0;transform:translateX(100%)}}</style><rect class=react fill=#E7E7E7 height=1 width=100% /></svg></div>',
    });
  }

  document.addEventListener(
    "click",
    function (event) {
      if (event.target.closest(".splide__arrow")) {
        event.preventDefault();
      }
    },
    true
  );

  document.querySelectorAll("[x-data]").forEach((el) => {
    if (el.hasAttribute("x-data") && el.__x) {
      if (el.__x.$data.hasOwnProperty("isMobile")) {
        el.__x.$data.isMobile = window.innerWidth < 768;
      }
    }
  });
})();
