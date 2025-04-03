document.addEventListener('alpine:init', () => {
    Alpine.data('menuDrawer', () => ({
      isOpen: false,
      currentLevel: 1,
      menuTitle: '',
      subMenuTitle: '',
      submenu: [],
      subSubmenu: [],
      menuData: [],
      currentParentIndex: 0,
      featuredImageUrl: '',
      featuredImageAlt: '',
      imageLoaded: false,
      isImageLoading: false,
      activeLevel1Index: null,
      activeLevel2Index: null,
      filteredArticles: [],
      splideSlider: null,
      currentChildIndex: null,
  
      init() {
        const headerHeight = document.querySelector('header')?.offsetHeight || 60;
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
  
        // Use the global data instead of Liquid
        this.menuData = window.menuConfig.menuData;
  
        window.toggleNav = () => {
          this.isOpen ? this.closeMenu() : this.openMenu();
        };
      },
  
      decodeEntities(text) {
        if (!text) return '';
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
      },
  
      openMenu() {
        this.isOpen = true;
        this.currentLevel = 1;
        document.body.classList.add('menu-open');
        document.querySelector('.hamburger-menu').classList.add('nav-open');
      },
  
      closeMenu() {
        this.isOpen = false;
        document.body.classList.remove('menu-open');
        document.querySelector('.hamburger-menu').classList.remove('nav-open');
  
        if (this.splideSlider) {
          this.splideSlider.destroy(); 
          this.splideSlider = null; 
        }
  
        this.filteredArticles = []; 
      },
  
      refreshSliderContent() {
        const track = this.$refs.splideSlider?.querySelector('.splide__list');
        
        if (track) {
          track.innerHTML = '';
          
          this.filteredArticles.forEach(article => {
            const slideHTML = `
              <li class="splide__slide">
                <article class="menu-drawer__article">
                  <div class="menu-drawer__article-content">
                    ${article.image ? `<img src="${article.image}" alt="${article.title}" class="menu-drawer__article-image" width="100" height="100">` : ''}
                    <p class="menu-drawer__article-tag small">${article.tag}</p>
                    <header class="menu-drawer__article-header">
                      <h2 class="menu-drawer__article-title body--bold">${article.title}</h2>
                    </header>
                    <a class="menu-drawer__article-link body" href="${article.url}">Read The Article <span><svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.6 1L10.6 5M10.6 5L6.6 9M10.6 5L1 5" stroke="#A0A0A0" stroke-width="0.75" stroke-linecap="square"/>
                    </svg>
                    </span></a>
                  </div>
                </article>
              </li>
            `;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = slideHTML.trim();
            track.appendChild(tempDiv.firstElementChild);
          });
        }
      },
  
      initSplideSlider() {
        if (this.splideSlider) {
          this.splideSlider.destroy();
          this.splideSlider = null;
        }
        
        this.$nextTick(() => {
          if (this.filteredArticles.length > 0 && window.Splide && this.$refs.splideSlider) {
            this.splideSlider = new Splide(this.$refs.splideSlider, {
              perPage: 1,
              gap: '20px',
              autoplay: false,
              type: 'loop',
              arrows: false,
              pagination: false,
              breakpoints: {
                1200: {
                  perPage: 3
                }, 
                768: {
                  perPage: 2
                }
              }
            }).mount();
          }
        });
      },
  
      openLevel(level, title, parentIndex, featuredImage, featuredImageAlt, childIndex) {
        if (level === 2 && this.activeLevel1Index === parentIndex && this.currentLevel > 1) {
          this.currentLevel = 1;
          this.activeLevel1Index = null;
          this.activeLevel2Index = null;
          this.featuredImageUrl = '';
          this.featuredImageAlt = '';
          return;
        }
        
        const isSameLevel2Item = level === 2 && this.currentLevel === 2 && this.currentParentIndex === parentIndex;
        const isSameLevel3Item = level === 3 && this.currentLevel === 3 && this.currentChildIndex === childIndex;
        
        if (isSameLevel2Item || isSameLevel3Item) {
          this.backLevel();
          return;
        }
        
        this.currentLevel = level;
  
        if (level === 2) {
          this.activeLevel1Index = parentIndex;
          this.activeLevel2Index = null;
          this.menuTitle = title;
          this.currentParentIndex = parentIndex;
          this.submenu = this.menuData[parentIndex].links;
          
          const prevUrl = this.featuredImageUrl;
          const newUrl = featuredImage || (this.menuData[parentIndex] ? this.menuData[parentIndex].featuredImage : '');
          const collectionId = this.menuData[parentIndex].collectionId;
  
          this.filteredArticles = this.getAllArticles().filter(article => 
            article.relatedIds.includes(collectionId)
          );      
  
          this.$nextTick(() => {
            this.refreshSliderContent();
            this.initSplideSlider();
          });
          
          if (prevUrl !== newUrl) {
            this.isImageLoading = true;
            this.imageLoaded = false;
  
            if (featuredImage) {
              this.featuredImageUrl = featuredImage;
              this.featuredImageAlt = featuredImageAlt || title;
            } 
            else if (this.menuData[parentIndex]) {
              this.featuredImageUrl = this.menuData[parentIndex].featuredImage;
              this.featuredImageAlt = this.menuData[parentIndex].featuredImageAlt || title;
            }
          }
        } else if (level === 3) {
          this.activeLevel2Index = childIndex;
          this.subMenuTitle = title;
          this.currentChildIndex = childIndex; 
          this.subSubmenu = this.menuData[this.currentParentIndex].links[childIndex].links;
        }
      }, 
  
      backLevel() {
        if (this.currentLevel > 1) {
          this.currentLevel--;
          
          if (this.currentLevel === 1) {
            this.featuredImageUrl = '';
            this.featuredImageAlt = '';
            this.filteredArticles = []; 
            if (this.splideSlider) {
              this.splideSlider.destroy();
              this.splideSlider = null; 
            }
          } else if (this.currentLevel === 2) {
            this.$nextTick(() => {
              this.refreshSliderContent();
              this.initSplideSlider();
            });
          }
        }
      },
  
      getAllArticles() {
        // Use the global data instead of Liquid
        return window.menuConfig.articles;
      },
      
      generateSrcset(baseUrl) {
        if (!baseUrl) return '';
        
        const urlParts = baseUrl.split('_1200x');
        if (urlParts.length !== 2) return baseUrl;
        
        const baseUrlWithoutSize = urlParts[0];
        const extension = urlParts[1];
        
        return [
          `${baseUrlWithoutSize}_400x${extension} 400w`,
          `${baseUrlWithoutSize}_800x${extension} 800w`,
          `${baseUrlWithoutSize}_1200x${extension} 1200w`
        ].join(', ');
      },
    }));
  });