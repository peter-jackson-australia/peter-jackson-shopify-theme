const dataLocations = JSON.parse(document.currentScript.getAttribute("data-locations"));
const dataLocationUrls = JSON.parse(document.currentScript.getAttribute("data-location-urls"));

class StoreLocator {
  constructor() {
    this.searchTerm = "";
    this.selectedState = "";
    this.markers = [];
    this.map = null;
    this.timezoneHandler = null;
    this.searchInput = document.getElementById("searchInput");
    this.stateSelect = document.getElementById("stateSelect");
    this.autocomplete = document.getElementById("autocomplete");
    this.searchTimeout = null;

    this.init();
  }

  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const querySearch = urlParams.get("search");

    if (querySearch) {
      this.searchTerm = querySearch;
      this.searchInput.value = querySearch;
      this.selectedState = "";
    }

    const queryState = urlParams.get("state");
    const storedState = sessionStorage.getItem("selectedState");

    if (!querySearch) {
      if (queryState && ["WA", "NT", "SA", "QLD", "NSW", "VIC", "ACT", "TAS", ""].includes(queryState)) {
        this.selectedState = queryState;
        this.stateSelect.value = queryState;
        sessionStorage.setItem("selectedState", queryState);
      } else if (storedState && ["WA", "NT", "SA", "QLD", "NSW", "VIC", "ACT", "TAS", ""].includes(storedState)) {
        this.selectedState = storedState;
        this.stateSelect.value = storedState;
      }
    }

    this.timezoneHandler = new ShopifyTimezoneHandler();

    this.searchInput.addEventListener("input", () => {
      this.handleSearch();
    });

    this.stateSelect.addEventListener("change", () => {
      this.selectedState = this.stateSelect.value;
      this.filterLocations();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#searchInput") && !e.target.closest("#autocomplete")) {
        this.hideAutocomplete();
      }
    });

    this.waitForLeafletAndInit();
  }

  waitForLeafletAndInit() {
    if (typeof L !== "undefined") {
      this.initMap();
      this.filterLocations();
      this.updateAllLocationTimes();
      setInterval(() => this.updateAllLocationTimes(), 60000);
    } else {
      setTimeout(() => this.waitForLeafletAndInit(), 50);
    }
  }

  initMap() {
    const isMobile = window.innerWidth < 1000;
    const zoomLevel = isMobile ? 3 : 5;

    this.map = L.map("map").setView([-25.2744, 133.7751], zoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(this.map);

    const storeIcon = L.icon({
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    for (let i = 0; i < dataLocations.length; i++) {
      const currentLocation = dataLocations[i];
      const currentLocationUrl = dataLocationUrls[i + 1];

      if (!currentLocation.latitude || !currentLocation.longitude) continue;

      const marker = L.marker([currentLocation.latitude, currentLocation.longitude], { icon: storeIcon }).bindPopup(`
          <div class="location-item__header">
            <h3 class="location-item__title heading--xl">${currentLocation.location_name}</h3>
          </div>
          <div class="location-item__address body">
            <a href="${currentLocation.google_maps_link}">${currentLocation.street_address}</a>
          </div>
          <div class="location-item__contact body">
            <a href="mailto:${currentLocation.email_address}">${currentLocation.email_address}</a><br>
            <a href="tel:${currentLocation.phone_number}">${currentLocation.phone_number}</a>
          </div>
          <div class="location-item__hours body">
            <a href="${currentLocationUrl}">View Location Details</a>
          </div>
          <div>
            <a href="mailto:${currentLocation.email_address}" class="location-item__contact-button body">Contact Store</a>
          </div>
        `);

      marker.locationData = {
        name: currentLocation.location_name,
        address: currentLocation.street_address ?? "",
        state: currentLocation.location_state ?? "",
      };
      this.markers.push(marker);
      marker.addTo(this.map);
    }
  }

  handleSearch() {
    clearTimeout(this.searchTimeout);

    const currentInput = this.searchInput.value;

    if (!currentInput) {
      this.searchTerm = "";
      this.filterLocations();
      this.hideAutocomplete();
      return;
    }

    this.showLoader();

    const is4DigitPostcode = /^\d{4}$/.test(currentInput.trim());

    if (is4DigitPostcode) {
      this.findNearestByPostcode(currentInput.trim());
    } else {
      this.searchTimeout = setTimeout(() => {
        this.showTextSearchResults(currentInput);
      }, 300);
    }
  }

  showLoader() {
    this.autocomplete.innerHTML = `
      <div class="store-locator__autocomplete-loader">
        <svg style="height:4px;display:block" viewBox="0 0 40 4" xmlns="http://www.w3.org/2000/svg">
          <style>.react{animation:moving 1s ease-in-out infinite}@keyframes moving{0%{width:0}50%{width:100%;transform:translate(0,0)}100%{width:0;right:0;transform:translate(100%,0)}}</style>
          <rect class="react" fill="#E7E7E7" height="4" width="40" />
        </svg>
      </div>
    `;
    this.showAutocomplete();
  }

  showAutocomplete() {
    this.autocomplete.style.display = "block";
    setTimeout(() => {
      this.autocomplete.classList.add("store-locator__autocomplete--visible");
    }, 10);
  }

  hideAutocomplete() {
    this.autocomplete.classList.remove("store-locator__autocomplete--visible");
    setTimeout(() => {
      this.autocomplete.style.display = "none";
    }, 300);
  }

  showTextSearchResults(searchValue) {
    const searchLower = searchValue.toLowerCase();
    
    const matches = Array.from(document.querySelectorAll(".location-item[data-lat]"))
      .filter((item) => {
        const name = item.dataset.name.toLowerCase();
        const address = item.dataset.address.toLowerCase();
        const state = item.dataset.state;
        const stateLower = state.toLowerCase();
        
        const matchesSearch = name.includes(searchLower) || address.includes(searchLower) || stateLower.includes(searchLower);
        const matchesState = !this.selectedState || state === this.selectedState;
        
        return matchesSearch && matchesState;
      })
      .slice(0, 5);

    if (!matches.length) {
      this.showNoResults(searchValue);
      return;
    }

    const html = matches
      .map((item) => `<div class="store-locator__autocomplete-item" data-name="${item.dataset.name}">${item.dataset.name} - ${item.dataset.address}</div>`)
      .join("");

    this.autocomplete.innerHTML = html;

    this.autocomplete.querySelectorAll(".store-locator__autocomplete-item").forEach((div) => {
      div.onclick = () => {
        this.searchInput.value = div.dataset.name;
        this.searchTerm = div.dataset.name;
        this.filterLocations();
        this.hideAutocomplete();
      };
    });

    this.showAutocomplete();
  }

  showNoResults(searchValue) {
    this.autocomplete.innerHTML = `
      <div class="store-locator__autocomplete-error">
        <p class="body">Sorry, your search for "<span>${searchValue}</span>" returned zero results, please try search by state or postcode.</p>
      </div>
    `;
    this.showAutocomplete();
  }

  async findNearestByPostcode(postcode) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${postcode}&country=australia&format=json&limit=1`);
      const data = await response.json();

      if (!data.length) {
        this.autocomplete.innerHTML = `
          <div class="store-locator__autocomplete-error">
            <p class="body">Invalid postcode</p>
          </div>
        `;
        this.showAutocomplete();
        return;
      }

      const userLocation = L.latLng(data[0].lat, data[0].lon);

      const locations = Array.from(document.querySelectorAll(".location-item[data-lat]"))
        .filter((item) => {
          const state = item.dataset.state;
          return !this.selectedState || state === this.selectedState;
        })
        .map((item) => ({
          element: item,
          name: item.dataset.name,
          postcode: item.dataset.postcode,
          distance: userLocation.distanceTo(L.latLng(item.dataset.lat, item.dataset.lng)) / 1000,
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      const html =
        '<div class="store-locator__autocomplete-header heading--xl">5 Nearest Stores</div>' +
        locations
          .map((loc) => {
            const distanceText = loc.postcode === postcode ? "" : ` - ${loc.distance.toFixed(1)} km away`;
            return `<div class="store-locator__autocomplete-item" data-name="${loc.name}"><strong>${loc.name}</strong>${distanceText}</div>`;
          })
          .join("");

      this.autocomplete.innerHTML = html;

      this.autocomplete.querySelectorAll(".store-locator__autocomplete-item").forEach((div) => {
        div.onclick = () => {
          this.searchInput.value = div.dataset.name;
          this.searchTerm = div.dataset.name;
          this.filterLocations();
          this.hideAutocomplete();
        };
      });

      this.showAutocomplete();
    } catch (error) {
      console.error("Error finding nearest stores:", error);
      this.autocomplete.innerHTML = `
        <div class="store-locator__autocomplete-error">
          <p class="body">Error finding nearest stores</p>
        </div>
      `;
      this.showAutocomplete();
    }
  }

  isLocationVisible(name, address, state) {
    const searchLower = this.searchTerm.toLowerCase();
    const matchesSearch = !this.searchTerm || name.toLowerCase().includes(searchLower) || address.toLowerCase().includes(searchLower) || state.toLowerCase().includes(searchLower);

    const matchesState = !this.selectedState || state === this.selectedState;

    return matchesSearch && matchesState;
  }

  filterLocations() {
    sessionStorage.setItem("selectedState", this.selectedState);

    this.markers.forEach((marker) => {
      const data = marker.locationData;
      if (this.isLocationVisible(data.name, data.address, data.state)) {
        marker.addTo(this.map);
      } else {
        marker.remove();
      }
    });

    const locations = document.querySelectorAll(".location-item[data-lat]");
    locations.forEach((item) => {
      const name = item.getAttribute("data-name");
      const address = item.getAttribute("data-address");
      const state = item.getAttribute("data-state") || "";

      if (this.isLocationVisible(name, address, state)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });

    this.updateAllLocationTimes();
  }

  updateAllLocationTimes() {
    const locationItems = document.querySelectorAll(".location-item[data-state]");
    locationItems.forEach((item) => {
      const state = item.getAttribute("data-state");
      const hours = item.getAttribute("data-hours");

      if (state && hours) {
        const timeData = this.timezoneHandler.getStateTime(state);
        const openingStatus = this.timezoneHandler.checkOpeningStatus(timeData, hours);

        const statusDot = item.querySelector(".location-item__status-dot");
        if (statusDot && openingStatus) {
          if (openingStatus.isOpen) {
            statusDot.classList.remove("location-item__status-dot--closed");
          } else {
            statusDot.classList.add("location-item__status-dot--closed");
          }
        }

        const todayHoursElement = item.querySelector("[data-today-hours]");
        if (todayHoursElement && openingStatus) {
          todayHoursElement.textContent = openingStatus.hours || "Hours not available";
        }
      }
    });
  }
}

class ShopifyTimezoneHandler {
  constructor() {
    this.timezones = {
      NSW: "Australia/Sydney",
      VIC: "Australia/Melbourne",
      QLD: "Australia/Brisbane",
      SA: "Australia/Adelaide",
      WA: "Australia/Perth",
      TAS: "Australia/Hobart",
      NT: "Australia/Darwin",
      ACT: "Australia/Sydney",
    };
    this.dstStates = ["NSW", "VIC", "SA", "TAS", "ACT"];
  }

  getStateTime(state) {
    if (!this.timezones[state]) {
      console.error(`Unknown state: ${state}`);
      return null;
    }

    const timezone = this.timezones[state];
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-AU", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      weekday: "long",
    });

    const parts = formatter.formatToParts(now);
    const timeData = {};
    parts.forEach((part) => (timeData[part.type] = part.value));

    const offsetFormatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    const currentOffset = offsetFormatter.formatToParts(now).find((part) => part.type === "timeZoneName").value;

    const isDSTActive = this.isDSTActive(timezone, now);

    return {
      state: state,
      time: `${timeData.hour}:${timeData.minute}`,
      day: timeData.weekday,
      date: `${timeData.day}/${timeData.month}/${timeData.year}`,
      offset: currentOffset,
      isDST: isDSTActive,
      observesDST: this.dstStates.includes(state),
    };
  }

  isDSTActive(timezone, date = new Date()) {
    const january = new Date(date.getFullYear(), 0, 15);
    const july = new Date(date.getFullYear(), 6, 15);

    const janOffset = this.getOffset(timezone, january);
    const julOffset = this.getOffset(timezone, july);
    const currentOffset = this.getOffset(timezone, date);

    return janOffset !== julOffset && currentOffset === janOffset;
  }

  getOffset(timezone, date) {
    return new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName").value;
  }

  checkOpeningStatus(timeData, openingHours) {
    if (!timeData || !openingHours) return null;

    const hoursLines = openingHours.split("\n");
    const currentDay = timeData.day;
    const currentTime = timeData.time;

    for (let line of hoursLines) {
      if (line.includes(currentDay)) {
        const parts = line.split(": ");
        if (parts.length < 2) continue;

        const todayHours = parts[1].trim();

        if (todayHours === "Closed") {
          return {
            isOpen: false,
            status: "Closed today",
            hours: todayHours,
          };
        }

        const timeRange = todayHours.split(" - ");
        if (timeRange.length !== 2) continue;

        const [openTime, closeTime] = timeRange;

        const currentMinutes = this.timeToMinutes(currentTime);
        const openMinutes = this.timeToMinutes(openTime);
        const closeMinutes = this.timeToMinutes(closeTime);

        const isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;

        return {
          isOpen: isOpen,
          status: isOpen ? `Open until ${closeTime}` : `Closed (opens at ${openTime})`,
          hours: todayHours,
          openTime: openTime,
          closeTime: closeTime,
        };
      }
    }

    return {
      isOpen: false,
      status: "Hours not available",
      hours: "Unknown",
    };
  }

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new StoreLocator());
} else {
  new StoreLocator();
}