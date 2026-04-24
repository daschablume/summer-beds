import { firebaseConfig } from './config.js';

// Check if Firebase is actually configured
const isFirebaseConfigured = !!firebaseConfig.apiKey;

let database = null;
if (isFirebaseConfigured) {
  firebase.initializeApp(firebaseConfig);
  database = firebase.database();
} else {
  console.warn("⚠️ Firebase is not configured yet! Falling back to LocalStorage.");
}

// Initial Data Structure (Used if database is empty)
const WEEKS_DATA = [
  {
    id: 'week-26', weekNum: 26, dateRange: 'June 22 - June 28, 2026',
    days: [
      { id: 'd26-1', name: 'Monday', date: 'June 22', beds: new Array(8).fill(null) },
      { id: 'd26-2', name: 'Tuesday', date: 'June 23', beds: new Array(8).fill(null) },
      { id: 'd26-3', name: 'Wednesday', date: 'June 24', beds: new Array(8).fill(null) },
      { id: 'd26-4', name: 'Thursday', date: 'June 25', beds: new Array(8).fill(null) },
      { id: 'd26-5', name: 'Friday', date: 'June 26', beds: new Array(8).fill(null) },
      { id: 'd26-6', name: 'Saturday', date: 'June 27', beds: new Array(8).fill(null) },
      { id: 'd26-7', name: 'Sunday', date: 'June 28', beds: new Array(8).fill(null) },
    ]
  },
  {
    id: 'week-27', weekNum: 27, dateRange: 'June 29 - July 5, 2026',
    days: [
      { id: 'd27-1', name: 'Monday', date: 'June 29', beds: new Array(8).fill(null) },
      { id: 'd27-2', name: 'Tuesday', date: 'June 30', beds: new Array(8).fill(null) },
      { id: 'd27-3', name: 'Wednesday', date: 'July 1', beds: new Array(8).fill(null) },
      { id: 'd27-4', name: 'Thursday', date: 'July 2', beds: new Array(8).fill(null) },
      { id: 'd27-5', name: 'Friday', date: 'July 3', beds: new Array(8).fill(null) },
      { id: 'd27-6', name: 'Saturday', date: 'July 4', beds: new Array(8).fill(null) },
      { id: 'd27-7', name: 'Sunday', date: 'July 5', beds: new Array(8).fill(null) },
    ]
  },
  {
    id: 'week-28', weekNum: 28, dateRange: 'July 6 - July 12, 2026',
    days: [
      { id: 'd28-1', name: 'Monday', date: 'July 6', beds: new Array(8).fill(null) },
      { id: 'd28-2', name: 'Tuesday', date: 'July 7', beds: new Array(8).fill(null) },
      { id: 'd28-3', name: 'Wednesday', date: 'July 8', beds: new Array(8).fill(null) },
      { id: 'd28-4', name: 'Thursday', date: 'July 9', beds: new Array(8).fill(null) },
      { id: 'd28-5', name: 'Friday', date: 'July 10', beds: new Array(8).fill(null) },
      { id: 'd28-6', name: 'Saturday', date: 'July 11', beds: new Array(8).fill(null) },
      { id: 'd28-7', name: 'Sunday', date: 'July 12', beds: new Array(8).fill(null) },
    ]
  }
];

let appData = JSON.parse(JSON.stringify(WEEKS_DATA));
let currentWeekIndex = 0;
let isMultiSelectMode = false;
let selectedBeds = [];

const bookingModal = document.getElementById('booking-modal');
const cancelModal = document.getElementById('cancel-modal');
const bookerNameInput = document.getElementById('booker-name');

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderApp();
  loadData();
});

// ========================================================
// DATA
// ========================================================

function loadData() {
  if (isFirebaseConfigured) {
    const bedsRef = database.ref('summer_beds_data');
    bedsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        appData = data;
      } else {
        appData = JSON.parse(JSON.stringify(WEEKS_DATA));
        bedsRef.set(appData).catch(err => console.warn("Could not seed data:", err));
      }
      renderApp();
    }, (error) => {
      console.error("Firebase Read Error:", error);
      appData = JSON.parse(JSON.stringify(WEEKS_DATA));
      renderApp();
      showToast("Could not connect to database. Check security rules.", true);
    });
  } else {
    const stored = localStorage.getItem('summerBedsData');
    if (stored) {
      try {
        appData = JSON.parse(stored);
      } catch (e) {
        appData = JSON.parse(JSON.stringify(WEEKS_DATA));
      }
    } else {
      appData = JSON.parse(JSON.stringify(WEEKS_DATA));
    }
    renderApp();
  }
}

function saveData() {
  if (isFirebaseConfigured) {
    database.ref('summer_beds_data').set(appData)
      .catch((error) => console.error("Firebase update failed:", error));
  } else {
    localStorage.setItem('summerBedsData', JSON.stringify(appData));
  }
}

// ========================================================
// RENDERING
// ========================================================

function renderApp() {
  const container = document.getElementById('calendar-container');
  container.innerHTML = '';

  if (!Array.isArray(appData)) {
    appData = JSON.parse(JSON.stringify(WEEKS_DATA));
  }

  const week = appData[currentWeekIndex];
  if (!week) return;

  const weekEl = document.createElement('section');
  weekEl.className = 'week-section';
  weekEl.id = week.id;

  const weekHeader = document.createElement('div');
  weekHeader.className = 'week-header';

  const prevBtnHTML = currentWeekIndex > 0
    ? `<button class="nav-btn" id="prev-week-btn" aria-label="Previous Week"><i data-feather="chevron-left"></i></button>`
    : `<div class="nav-btn-placeholder"></div>`;

  const nextBtnHTML = currentWeekIndex < appData.length - 1
    ? `<button class="nav-btn" id="next-week-btn" aria-label="Next Week"><i data-feather="chevron-right"></i></button>`
    : `<div class="nav-btn-placeholder"></div>`;

  weekHeader.innerHTML = `
    <div class="week-title-nav">
      ${prevBtnHTML}
      <h2 class="week-title">Week ${week.weekNum}</h2>
      <span class="week-dates">${week.dateRange}</span>
      ${nextBtnHTML}
    </div>
  `;

  const prevBtn = weekHeader.querySelector('#prev-week-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentWeekIndex--;
      renderApp();
    });
  }

  const nextBtn = weekHeader.querySelector('#next-week-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentWeekIndex++;
      renderApp();
    });
  }

  const daysGrid = document.createElement('div');
  daysGrid.className = 'days-grid';

  week.days.forEach(day => {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    dayCard.id = day.id;

    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    dayHeader.innerHTML = `
      <span class="day-name">${day.name}</span>
      <span class="day-date">${day.date}</span>
    `;

    const bedsGrid = document.createElement('div');
    bedsGrid.className = 'beds-grid';

    if (!day.beds) day.beds = new Array(8).fill(null);

    const selectedInDay = isMultiSelectMode ? selectedBeds.filter(b => b.dayId === day.id) : [];

    for (let idx = 0; idx < 8; idx++) {
      const bookerName = day.beds[idx] || null;
      const bedSlot = document.createElement('div');
      bedSlot.dataset.dayId = day.id;
      bedSlot.dataset.slotIdx = idx;
      bedSlot.dataset.dateText = `${day.name}, ${day.date}`;

      const isSelected = selectedInDay.some(b => b.slotIdx === idx);

      if (bookerName) {
        // Assign a distinct color to every booked bed based on its slot index
        const colorClass = ` bed-color-${idx % 10}`;
        bedSlot.className = isSelected ? `bed-slot bed-booked bed-selected${colorClass}` : `bed-slot bed-booked${colorClass}`;
        bedSlot.dataset.booker = bookerName;
        bedSlot.innerHTML = `
          <div class="bed-content">
            <i data-feather="user" class="bed-booked-icon"></i>
            <span class="bed-booked-name" title="${bookerName}">${bookerName}</span>
          </div>
        `;
        bedSlot.addEventListener('click', handleCancelClick);
      } else {
        // For available beds, only show color if actively selected
        const colorClass = isSelected ? ` bed-color-${idx % 10}` : '';
        bedSlot.className = isSelected ? `bed-slot bed-selected${colorClass}` : 'bed-slot bed-available';
        bedSlot.innerHTML = isSelected ? 'Selected' : 'Available';
        bedSlot.addEventListener('click', handleBookClick);
      }

      bedsGrid.appendChild(bedSlot);
    }

    dayCard.appendChild(dayHeader);
    dayCard.appendChild(bedsGrid);
    daysGrid.appendChild(dayCard);
  });

  weekEl.appendChild(weekHeader);
  weekEl.appendChild(daysGrid);
  container.appendChild(weekEl);

  if (window.feather) feather.replace();
}

// ========================================================
// EVENT HANDLERS
// ========================================================

function handleMultiSelectToggle(slot, isBooked) {
  const dayId = slot.dataset.dayId;
  const slotIdx = parseInt(slot.dataset.slotIdx, 10);
  const dateText = slot.dataset.dateText;

  // Enforce selecting only one type (booked vs unbooked) at a time
  if (selectedBeds.length > 0) {
    const existingTypeIsBooked = selectedBeds[0].isBooked;
    // Allow deselection by skipping error if they are clicking a bed they already selected
    const existingIndex = selectedBeds.findIndex(b => b.dayId === dayId && b.slotIdx === slotIdx);
    if (existingTypeIsBooked !== isBooked && existingIndex === -1) {
      showToast("You can only select either all available or all booked beds.", true);
      return;
    }
  }

  const existingIndex = selectedBeds.findIndex(b => b.dayId === dayId && b.slotIdx === slotIdx);
  
  if (existingIndex >= 0) {
    selectedBeds.splice(existingIndex, 1);
  } else {
    const sameDayIndex = selectedBeds.findIndex(b => b.dayId === dayId);
    if (sameDayIndex >= 0) {
      selectedBeds[sameDayIndex] = { dayId, slotIdx, dateText, isBooked };
    } else {
      selectedBeds.push({ dayId, slotIdx, dateText, isBooked });
    }
  }
  updateMultiSelectUI();
  renderApp();
}

function handleBookClick(e) {
  const slot = e.currentTarget;
  if (!isMultiSelectMode) {
    document.getElementById('modal-title').textContent = "Book a Bed";
    document.getElementById('modal-date').textContent = slot.dataset.dateText;
    document.getElementById('booking-day-id').value = slot.dataset.dayId;
    document.getElementById('booking-slot-idx').value = slot.dataset.slotIdx;
    bookerNameInput.value = '';
    bookingModal.classList.add('active');
    setTimeout(() => bookerNameInput.focus(), 100);
  } else {
    handleMultiSelectToggle(slot, false);
  }
}

function updateMultiSelectUI() {
  const defaultToolbar = document.getElementById('toolbar-default');
  const activeToolbar = document.getElementById('toolbar-active');
  const countSpan = document.getElementById('multi-select-count');
  const bookBtn = document.getElementById('btn-book-multi');
  const cancelBtnAction = document.getElementById('btn-cancel-multi-action');

  if (!defaultToolbar || !activeToolbar) return;

  if (isMultiSelectMode) {
    defaultToolbar.classList.add('hidden');
    activeToolbar.classList.remove('hidden');
    countSpan.textContent = `${selectedBeds.length} bed${selectedBeds.length === 1 ? '' : 's'} selected`;
    
    const hasAvailable = selectedBeds.some(b => !b.isBooked);
    const hasBooked = selectedBeds.some(b => b.isBooked);

    if (bookBtn) {
      if (hasAvailable) {
        bookBtn.classList.remove('hidden');
        bookBtn.disabled = false;
      } else {
        bookBtn.classList.add('hidden');
      }
    }

    if (cancelBtnAction) {
      if (hasBooked) {
        cancelBtnAction.classList.remove('hidden');
      } else {
        cancelBtnAction.classList.add('hidden');
      }
    }
  } else {
    defaultToolbar.classList.remove('hidden');
    activeToolbar.classList.add('hidden');
  }
}

function handleCancelClick(e) {
  const slot = e.currentTarget;
  if (!isMultiSelectMode) {
    document.getElementById('cancel-name').textContent = slot.dataset.booker;
    document.getElementById('cancel-date-text').textContent = slot.dataset.dateText;
    document.getElementById('cancel-day-id').value = slot.dataset.dayId;
    document.getElementById('cancel-slot-idx').value = slot.dataset.slotIdx;
    cancelModal.classList.add('active');
  } else {
    handleMultiSelectToggle(slot, true);
  }
}

function closeModal(modalElement) {
  modalElement.classList.remove('active');
}

function setupEventListeners() {
  document.getElementById('close-modal').addEventListener('click', () => closeModal(bookingModal));
  document.getElementById('close-cancel-modal').addEventListener('click', () => closeModal(cancelModal));
  document.getElementById('btn-keep-booking').addEventListener('click', () => closeModal(cancelModal));

  document.getElementById('btn-enable-multi').addEventListener('click', () => {
    isMultiSelectMode = true;
    selectedBeds = [];
    updateMultiSelectUI();
    renderApp();
  });
  
  document.getElementById('btn-cancel-multi').addEventListener('click', () => {
    isMultiSelectMode = false;
    selectedBeds = [];
    updateMultiSelectUI();
    renderApp();
  });

  document.getElementById('btn-book-multi').addEventListener('click', () => {
    const availableBeds = selectedBeds.filter(b => !b.isBooked);
    if (availableBeds.length === 0) return;
    document.getElementById('modal-title').textContent = `Book ${availableBeds.length} Beds`;
    document.getElementById('modal-date').textContent = "Multiple Dates Selected";
    bookerNameInput.value = '';
    bookingModal.classList.add('active');
    setTimeout(() => bookerNameInput.focus(), 100);
  });

  const cancelMultiBtn = document.getElementById('btn-cancel-multi-action');
  if (cancelMultiBtn) {
    cancelMultiBtn.addEventListener('click', () => {
      const bookedBeds = selectedBeds.filter(b => b.isBooked);
      if (bookedBeds.length === 0) return;
      
      let successCount = 0;
      for (const bed of bookedBeds) {
        if (updateBedStatus(bed.dayId, bed.slotIdx, null, true)) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        saveData();
        if (!isFirebaseConfigured) renderApp();
        showToast(`Successfully cancelled ${successCount} beds!`);
        isMultiSelectMode = false;
        selectedBeds = [];
        updateMultiSelectUI();
        renderApp();
      } else {
        showToast(`Failed to cancel selected beds.`, true);
      }
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeModal(bookingModal);
    if (e.target === cancelModal) closeModal(cancelModal);
  });

  document.getElementById('booking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = bookerNameInput.value.trim();
    if (!name) return;

    if (isMultiSelectMode) {
      let successCount = 0;
      const availableBeds = selectedBeds.filter(b => !b.isBooked);
      for (const bed of availableBeds) {
        if (updateBedStatus(bed.dayId, bed.slotIdx, name, true)) {
          successCount++;
        }
      }
      if (successCount > 0) {
        saveData();
        if (!isFirebaseConfigured) renderApp();
        showToast(`Successfully booked ${successCount} beds!`);
        isMultiSelectMode = false;
        selectedBeds = [];
        updateMultiSelectUI();
        closeModal(bookingModal);
      } else {
        showToast(`Failed to book selected beds.`, true);
      }
    } else {
      const dayId = document.getElementById('booking-day-id').value;
      const slotIdx = parseInt(document.getElementById('booking-slot-idx').value, 10);

      if (updateBedStatus(dayId, slotIdx, name)) {
        closeModal(bookingModal);
        showToast(`Bed successfully booked for ${name}!`);
      } else {
        showToast(`Failed to book. Slot might be taken.`, true);
      }
    }
  });

  document.getElementById('cancel-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const dayId = document.getElementById('cancel-day-id').value;
    const slotIdx = parseInt(document.getElementById('cancel-slot-idx').value, 10);

    if (updateBedStatus(dayId, slotIdx, null)) {
      closeModal(cancelModal);
      showToast(`Booking cancelled successfully.`);
    } else {
      showToast(`Failed to cancel booking.`, true);
    }
  });
}

// ========================================================
// UTILITIES
// ========================================================

function updateBedStatus(dayId, slotIdx, newStatus, skipSave = false) {
  for (let w = 0; w < appData.length; w++) {
    const week = appData[w];
    for (let d = 0; d < week.days.length; d++) {
      const day = week.days[d];
      if (day.id === dayId) {
        if (!day.beds) day.beds = new Array(8).fill(null);
        if (newStatus !== null && day.beds[slotIdx]) return false;
        day.beds[slotIdx] = newStatus;
        if (!skipSave) {
          saveData();
          if (!isFirebaseConfigured) renderApp();
        }
        return true;
      }
    }
  }
  return false;
}

function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : ''}`;

  const icon = isError ? 'alert-circle' : 'check-circle';
  toast.innerHTML = `
    <i data-feather="${icon}" style="color: var(--color-${isError ? 'danger' : 'success'})"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.feather) feather.replace();

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}