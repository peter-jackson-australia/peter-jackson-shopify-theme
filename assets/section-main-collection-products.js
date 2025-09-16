(() => {
  const CollectionState = {
    columns: 4,
    isFilterOpen: false,
    scrollY: 0
  };

  const openFilter = () => {
    CollectionState.scrollY = window.scrollY;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${CollectionState.scrollY}px`;
    document.body.style.width = '100%';

    CollectionState.isFilterOpen = true;
    document.body.classList.add('filter-open');
    
    const filterContainer = document.querySelector('[data-filter-container]');
    if (filterContainer) {
      filterContainer.style.display = 'block';
    }
  };

  const closeFilter = () => {
    if (!CollectionState.isFilterOpen) return;

    const filterSidebar = document.querySelector('.filter-sidebar');
    if (filterSidebar) {
      filterSidebar.classList.add('closing');
    }

    setTimeout(() => {
      CollectionState.isFilterOpen = false;
      document.body.classList.remove('filter-open');
      if (filterSidebar) {
        filterSidebar.classList.remove('closing');
      }

      document.documentElement.style.scrollBehavior = 'auto';

      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, CollectionState.scrollY);

      document.documentElement.style.scrollBehavior = '';
      
      const filterContainer = document.querySelector('[data-filter-container]');
      if (filterContainer) {
        filterContainer.style.display = 'none';
      }
    }, 300);
  };

  const toggleGrid = () => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      CollectionState.columns = CollectionState.columns === 1 ? 2 : 1;
    } else {
      CollectionState.columns = CollectionState.columns === 4 ? 2 : 4;
    }
    
    updateGrid();
  };

  const updateGrid = () => {
    const grid = document.getElementById('AjaxinateContainer');
    const isMobile = window.innerWidth < 768;
    
    if (!grid) return;

    grid.classList.remove('products-grid--cols-1', 'products-grid--cols-2', 'products-grid--cols-4');
    
    if (isMobile) {
      if (CollectionState.columns === 1) {
        grid.classList.add('products-grid--cols-1');
      } else {
        grid.classList.add('products-grid--cols-2');
      }
    } else {
      if (CollectionState.columns === 4) {
        grid.classList.add('products-grid--cols-4');
      } else {
        grid.classList.add('products-grid--cols-2');
      }
    }

    document.querySelectorAll('.grid-toggle-btn span').forEach(span => {
      span.style.display = 'none';
    });

    if (isMobile) {
      if (CollectionState.columns === 1) {
        const icon = document.querySelector('[data-icon="grid-2"]');
        if (icon) icon.style.display = 'block';
      } else {
        const icon = document.querySelector('[data-icon="grid-1"]');
        if (icon) icon.style.display = 'block';
      }
    } else {
      if (CollectionState.columns === 4) {
        const icon = document.querySelector('[data-icon="grid-2"]');
        if (icon) icon.style.display = 'block';
      } else {
        const icon = document.querySelector('[data-icon="grid-4"]');
        if (icon) icon.style.display = 'block';
      }
    }
  };

  const initializeCollection = () => {
    const isMobile = window.innerWidth < 768;
    CollectionState.columns = isMobile ? 1 : 4;
    
    updateGrid();

    const filterOverlay = document.querySelector('.filter-sidebar__overlay');
    if (filterOverlay) {
      filterOverlay.addEventListener('click', closeFilter);
    }

    const filterCloseBtn = document.querySelector('.filter-close-btn');
    if (filterCloseBtn) {
      filterCloseBtn.addEventListener('click', closeFilter);
    }

    const filterOpenBtn = document.querySelector('.collection-controls__filter-button');
    if (filterOpenBtn) {
      filterOpenBtn.addEventListener('click', openFilter);
    }

    const gridToggleBtn = document.querySelector('.grid-toggle-btn');
    if (gridToggleBtn) {
      gridToggleBtn.addEventListener('click', toggleGrid);
    }

    window.addEventListener('resize', () => {
      const wasMobile = CollectionState.columns <= 2;
      const isMobile = window.innerWidth < 768;
      
      if (wasMobile !== isMobile) {
        CollectionState.columns = isMobile ? 1 : 4;
        updateGrid();
      }
    });

    document.addEventListener('menu-open', closeFilter);

    window.closeFilter = closeFilter;
  };

  window.addEventListener('load', function () {
    initializeCollection();

    var endlessScroll = new Ajaxinate({
      method: 'scroll',
      container: '#AjaxinateContainer',
      pagination: '#AjaxinatePagination',
      offset: '400',
      loadingText:
        '<div style="margin: auto 0; display:flex;justify-content:center;align-items:center;padding:var(--space-m) 0;width:100%;height:1px;overflow:hidden"><svg fill=#E7E7E7 height=1 style=max-width:300px viewBox="0 0 100 1"width=100% xmlns=http://www.w3.org/2000/svg><style>.react{animation:moving 1s ease-in-out infinite;transform-origin:0 50%}@keyframes moving{0%{width:0%}50%{width:100%;transform:translateX(0)}100%{width:0;transform:translateX(100%)}}</style><rect class=react fill=#E7E7E7 height=1 width=100% /></svg></div>',
    });

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
})();