import { addMonths } from "./_snowpack/pkg/date-fns.js";
import renderMonth, { fixEventOverflow } from "./renderMonth.js";
import { getAllEvents } from "./events.js";
import { getEventsForDay } from "./events.js";
import createEventElement from "./createEventElement.js";
import createDayElement from "./createDayElement.js";

let selectedMonth = Date.now();
document.querySelector("[data-next-month-btn").addEventListener("click", () => {
  selectedMonth = addMonths(selectedMonth, 1);
  renderMonth(selectedMonth);
});

document.querySelector("[data-prev-month-btn").addEventListener("click", () => {
  selectedMonth = addMonths(selectedMonth, -1);
  renderMonth(selectedMonth);
});

document.querySelector("[data-today-btn").addEventListener("click", () => {
  selectedMonth = Date.now();
  renderMonth(selectedMonth);
});

let resizeTimeout;
window.addEventListener("resize", () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    document.querySelectorAll("[data-date-wrapper]").forEach(fixEventOverflow);
  }, 100);
});

renderMonth(selectedMonth);

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDarkMode = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);
}

function initDarkMode() {
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  }
}

function switchView(view) {
  const calendar = document.querySelector(".calendar");
  const buttons = document.querySelectorAll(".view-switcher button");

  // Remove 'active' class from all buttons
  buttons.forEach((button) => {
    button.classList.remove("active");
  });

  // Set the active class on the selected button
  const activeButton = document.querySelector(
    `.view-switcher button[data-view="${view}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }

  // Update the calendar view
  calendar.className = `calendar ${view}-view`;
  renderCurrentView();
}

function selectDay(date) {
  console.log("Selected date:", date); // Log the input date
  selectedMonth = new Date(date);

  renderCurrentView();
}

function renderCurrentView() {
  const calendar = document.querySelector(".calendar");
  if (calendar.classList.contains("month-view")) {
    renderMonth(selectedMonth);
  } else if (calendar.classList.contains("week-view")) {
    renderWeek(selectedMonth);
  } else if (calendar.classList.contains("day-view")) {
    let selectedDay = Date.now();

    renderDay(selectedDay);
  }
}

// for search
document.querySelector(".search-bar input").addEventListener("input", (e) => {
  searchEvents(e.target.value);
});

export function searchEvents(query) {
  const events = getAllEvents();
  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(query.toLowerCase()),
  );
  displaySearchResults(filteredEvents);
}

function displaySearchResults(events) {
  const searchResultsContainer = document.querySelector(".search-results");
  searchResultsContainer.innerHTML = "";
  events.forEach((event) => {
    const eventElement = createEventElement(event);
    searchResultsContainer.appendChild(eventElement);
  });
}

// Add event listeners
document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();

  const darkModeToggle = document.querySelector(".dark-mode-toggle");
  darkModeToggle.addEventListener("click", toggleDarkMode);

  const viewSwitcher = document.querySelector(".view-switcher");
  viewSwitcher.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const view = e.target.dataset.view;
      switchView(view);
    }
  });

  const searchInput = document.querySelector(".search-bar input");
  searchInput.addEventListener("input", (e) => {
    searchEvents(e.target.value);
  });
});

// render week and other
import {
  startOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  startOfDay,
  endOfDay,
} from "./_snowpack/pkg/date-fns.js";

export function renderWeek(date) {
  const startDate = startOfWeek(date);
  const calendarDays = document.querySelector(".days");
  calendarDays.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const day = addDays(startDate, i);
    const dayElement = createDayElement(day, {
      isCurrentMonth: isSameMonth(day, date),
      isCurrentDay: isSameDay(day, new Date()),
      showWeekName: true,
      onClick: () => selectDay(day), // Ensure this passes a valid date
    });
    calendarDays.appendChild(dayElement);
  }
}

// export function renderDay(date) {
//   const calendarDays = document.querySelector(".days");
//   calendarDays.innerHTML = "";

//   const dayElement = createDayElement(date, {
//     isCurrentMonth: true,
//     isCurrentDay: isSameDay(date, new Date()),
//     showWeekName: true,
//   });

//   // Extend the day element to show more details
//   const eventsContainer = dayElement.querySelector("[data-event-container]");
//   eventsContainer.innerHTML = "";

//   const events = getEventsForDay(date);
//   events.forEach((event) => {
//     const eventElement = createEventElement(event);
//     eventsContainer.appendChild(eventElement);
//   });

//   calendarDays.appendChild(dayElement);
// }

export function renderDay(date) {
  // Check if date is a valid Date object
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("Invalid date provided to renderDay:", date);
    return;
  }

  const calendarDays = document.querySelector(".days");
  if (!calendarDays) {
    console.error('Could not find element with class "days"');
    return;
  }

  calendarDays.innerHTML = "";

  const dayElement = createDayElement(date, {
    isCurrentMonth: true,
    isCurrentDay: isSameDay(date, new Date()),
    showWeekName: true,
  });

  const eventsContainer = dayElement.querySelector("[data-event-container]");
  if (!eventsContainer) {
    console.error("Could not find event container in day element");
    return;
  }

  eventsContainer.innerHTML = "";

  const events = getEventsForDay(date);
  events.forEach((event) => {
    const eventElement = createEventElement(event);
    eventsContainer.appendChild(eventElement);
  });

  calendarDays.appendChild(dayElement);
}

// Add event listeners
// document.addEventListener("DOMContentLoaded", () => {
//   initDarkMode();

//   const darkModeToggle = document.querySelector(".dark-mode-toggle");
//   darkModeToggle.addEventListener("click", toggleDarkMode);

//   const viewSwitcher = document.querySelector(".view-switcher");
//   viewSwitcher.addEventListener("click", (e) => {
//     if (e.target.tagName === "BUTTON") {
//       const view = e.target.dataset.view;
//       switchView(view);
//     }
//   });
// });

// Updated switchView function
