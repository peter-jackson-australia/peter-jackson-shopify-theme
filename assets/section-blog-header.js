(function () {
  const currentUrl = window.location.href;
  const links = document.querySelectorAll('.blog-header__link');

  links.forEach((link) => {
    if (currentUrl.includes(link.getAttribute('href'))) {
      link.style.borderBottom = '1px solid var(--neutral-950)';
    }
  });

  if (window.innerWidth < 1000) return;

  const header = document.querySelector('#site-header');
  const blogHeader = document.querySelector('.blog-header');
  if (!header || !blogHeader) return;

  const spacer = document.createElement('div');
  const blogHeaderHeight = blogHeader.offsetHeight;
  spacer.style.height = blogHeaderHeight + 'px';
  spacer.style.display = 'none';
  blogHeader.parentNode.insertBefore(spacer, blogHeader.nextSibling);

  const blogHeaderTop = blogHeader.offsetTop;
  const headerHeight = header.offsetHeight;
  let isFixed = false;

  window.addEventListener('scroll', function () {
    if (window.innerWidth < 1000) return;
    if (
      document.body.classList.contains('menu-open') ||
      document.body.classList.contains('cart-open') ||
      document.body.classList.contains('search-open') ||
      document.body.classList.contains('filter-open') ||
      document.body.classList.contains('search-filter-open')
    )
      return;

    const scrollY = window.scrollY;
    const triggerPoint = blogHeaderTop - headerHeight;

    if (scrollY >= triggerPoint && !isFixed) {
      isFixed = true;
      blogHeader.style.position = 'fixed';
      blogHeader.style.top = headerHeight - 1 + 'px';
      blogHeader.style.left = '0';
      blogHeader.style.right = '0';
      blogHeader.style.height = blogHeaderHeight + 'px';
      blogHeader.style.zIndex = '40';
      blogHeader.style.backgroundColor = 'var(--white)';
      blogHeader.style.borderTop = 'none';
      spacer.style.display = 'block';
    } else if (scrollY < triggerPoint && isFixed) {
      isFixed = false;
      blogHeader.style.position = '';
      blogHeader.style.top = '';
      blogHeader.style.left = '';
      blogHeader.style.right = '';
      blogHeader.style.height = '';
      blogHeader.style.zIndex = '';
      blogHeader.style.borderTop = '';
      spacer.style.display = 'none';
    }
  });
})()