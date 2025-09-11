(() => {
  class ShopifyTimezoneHandler {
    constructor() {
      this.timezones = {
        NSW: 'Australia/Sydney',
        VIC: 'Australia/Melbourne',
        QLD: 'Australia/Brisbane',
        SA: 'Australia/Adelaide',
        WA: 'Australia/Perth',
        TAS: 'Australia/Hobart',
        NT: 'Australia/Darwin',
        ACT: 'Australia/Sydney',
      };
      this.dstStates = ['NSW', 'VIC', 'SA', 'TAS', 'ACT'];
      this.init();
    }

    init() {
      this.updateLocationTime();
      setInterval(() => this.updateLocationTime(), 60000);
    }

    getStateTime(state) {
      if (!this.timezones[state]) {
        console.error(`Unknown state: ${state}`);
        return null;
      }

      const timezone = this.timezones[state];
      const now = new Date();

      const formatter = new Intl.DateTimeFormat('en-AU', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'long',
      });

      const parts = formatter.formatToParts(now);
      const timeData = {};
      parts.forEach((part) => (timeData[part.type] = part.value));

      const offsetFormatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'longOffset',
      });
      const currentOffset = offsetFormatter.formatToParts(now).find((part) => part.type === 'timeZoneName').value;

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
      return new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'longOffset',
      })
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName').value;
    }

    checkOpeningStatus(timeData, openingHours) {
      if (!timeData || !openingHours) return null;

      const hoursLines = openingHours.split('\n');
      const currentDay = timeData.day;
      const currentTime = timeData.time;

      for (let line of hoursLines) {
        if (line.includes(currentDay)) {
          const parts = line.split(': ');
          if (parts.length < 2) continue;

          const todayHours = parts[1].trim();

          if (todayHours === 'Closed') {
            return {
              isOpen: false,
              status: 'Closed today',
              hours: todayHours,
            };
          }

          const timeRange = todayHours.split(' - ');
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
        status: 'Hours not available',
        hours: 'Unknown',
      };
    }

    timeToMinutes(timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    }

    updateLocationTime() {
      const locationHero = document.querySelector('.location-hero');
      if (!locationHero) return;

      const state = locationHero.getAttribute('data-state');
      if (!state) {
        console.error('No state found in data-state attribute');
        return;
      }

      const timeData = this.getStateTime(state);
      if (!timeData) return;

      const openingHoursElement = document.getElementById('opening-hours-display');
      const openingHours = openingHoursElement ? openingHoursElement.textContent : '';

      const openingStatus = this.checkOpeningStatus(timeData, openingHours);

      const statusDot = document.getElementById('location-status-dot');
      if (statusDot && openingStatus) {
        if (openingStatus.isOpen) {
          statusDot.classList.remove('location-hero__status-dot--closed');
        } else {
          statusDot.classList.add('location-hero__status-dot--closed');
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    new ShopifyTimezoneHandler();
  })
})();