function applyFilters() {
  const button = document.querySelector('.search-filter__apply-button');
  button.innerHTML = `<span class="loader--spinner"></span>`;

  const url = new URL(window.location);

  const searchQuery = url.searchParams.get('q');
  const type = url.searchParams.get('type');

  const selectedSort = document.querySelector('input[name="sort_by"]:checked');
  const sortValue = selectedSort ? selectedSort.value : '';

  url.search = '';
  if (searchQuery) {
    url.searchParams.set('q', searchQuery);
  }
  if (type) {
    url.searchParams.set('type', type);
  }
  if (sortValue) {
    url.searchParams.set('sort_by', sortValue);
  }

  window.location.href = url.toString();
}

function closeFilter() {
  if (window.closeFilter) {
    window.closeFilter();
  }
}