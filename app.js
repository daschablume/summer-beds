// ========================================================
// ⚠️ FIREBASE CONFIGURATION
// ========================================================
const firebaseConfig = {

};

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

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderApp(); // Render immediately so the calendar is never blank!
  loadData();
});

// Load Data
function loadData() {
  if (isFirebaseConfigured) {
    // 1. Firebase Method (Real-time syncing using compat libraries)
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
      console.error("Firebase Read Error! Make sure your Security Rules are set to true. Error:", error);
      appData = JSON.parse(JSON.stringify(WEEKS_DATA));
      renderApp(); // Render anyway so UI doesn't disappear
      showToast("Could not connect to database. Check security rules.", true);
    });
  } else {
    // 2. LocalStorage Method (Fallback)
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

// Save Data (Update)
function saveData() {
  if (isFirebaseConfigured) {
    const bedsRef = database.ref('summer_beds_data');
    bedsRef.set(appData)
      .catch((error) => console.error("Firebase update failed:", error));
  } else {
    localStorage.setItem('summerBedsData', JSON.stringify(appData));
  }
}

// ========================================================
// UI RENDERING & LOGIC
// ========================================================

function renderApp() {
  const container = document.getElementById('calendar-container');
  container.innerHTML = '';

  // Wait! If appData isn't an array for some reason (maybe malformed Firebase snapshot), safeguard it:
  if (!Array.isArray(appData)) {
    appData = JSON.parse(JSON.stringify(WEEKS_DATA));
  }

  appData.forEach(week => {
    const weekEl = document.createElement('section');
    weekEl.className = 'week-section';
    weekEl.id = week.id;

    const weekHeader = document.createElement('div');
    weekHeader.className = 'week-header';
    weekHeader.innerHTML = `
      <h2 class="week-title">Week ${week.weekNum}</h2>
      <span class="week-dates">${week.dateRange}</span>
    `;

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

      if (!day.beds) day.beds = new Array(8).fill(null); // Safety check in case Firebase drops empty arrays

      for (let idx = 0; idx < 8; idx++) {
        const bookerName = day.beds[idx] || null;
        const bedSlot = document.createElement('div');
        bedSlot.dataset.dayId = day.id;
        bedSlot.dataset.slotIdx = idx;
        bedSlot.dataset.dateText = `${day.name}, ${day.date}`;

        if (bookerName) {
          bedSlot.className = 'bed-slot bed-booked';
          bedSlot.dataset.booker = bookerName;
          bedSlot.innerHTML = `
            <div class="bed-content">
              <i data-feather="user" class="bed-booked-icon"></i>
              <span class="bed-booked-name" title="${bookerName}">${bookerName}</span>
            </div>
          `;
          bedSlot.addEventListener('click', handleCancelClick);
        } else {
          bedSlot.className = 'bed-slot bed-available';
          bedSlot.innerHTML = 'Available';
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
  });

  if (window.feather) {
    feather.replace();
  }
}

const bookingModal = document.getElementById('booking-modal');
const cancelModal = document.getElementById('cancel-modal');
const bookerNameInput = document.getElementById('booker-name');

function handleBookClick(e) {
  const slot = e.currentTarget;
  const dayId = slot.dataset.dayId;
  const slotIdx = slot.dataset.slotIdx;
  const dateText = slot.dataset.dateText;

  document.getElementById('modal-date').textContent = dateText;
  document.getElementById('booking-day-id').value = dayId;
  document.getElementById('booking-slot-idx').value = slotIdx;

  bookerNameInput.value = '';
  bookingModal.classList.add('active');

  setTimeout(() => bookerNameInput.focus(), 100);
}

function handleCancelClick(e) {
  const slot = e.currentTarget;
  const dayId = slot.dataset.dayId;
  const slotIdx = slot.dataset.slotIdx;
  const dateText = slot.dataset.dateText;
  const bookerName = slot.dataset.booker;

  document.getElementById('cancel-name').textContent = bookerName;
  document.getElementById('cancel-date-text').textContent = dateText;
  document.getElementById('cancel-day-id').value = dayId;
  document.getElementById('cancel-slot-idx').value = slotIdx;

  cancelModal.classList.add('active');
}

function closeModal(modalElement) {
  modalElement.classList.remove('active');
}

function setupEventListeners() {
  document.getElementById('close-modal').addEventListener('click', () => closeModal(bookingModal));
  document.getElementById('close-cancel-modal').addEventListener('click', () => closeModal(cancelModal));
  document.getElementById('btn-keep-booking').addEventListener('click', () => closeModal(cancelModal));

  window.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeModal(bookingModal);
    if (e.target === cancelModal) closeModal(cancelModal);
  });

  document.getElementById('booking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('booker-name').value.trim();
    if (!name) return;

    const dayId = document.getElementById('booking-day-id').value;
    const slotIdx = parseInt(document.getElementById('booking-slot-idx').value, 10);

    if (updateBedStatus(dayId, slotIdx, name)) {
      closeModal(bookingModal);
      showToast(`Bed successfully booked for ${name}!`);
    } else {
      showToast(`Failed to book. Slot might be taken.`, true);
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

function updateBedStatus(dayId, slotIdx, newStatus) {
  for (let w = 0; w < appData.length; w++) {
    const week = appData[w];
    for (let d = 0; d < week.days.length; d++) {
      const day = week.days[d];
      if (day.id === dayId) {
        if (newStatus !== null && day.beds[slotIdx] !== null) return false;

        day.beds[slotIdx] = newStatus;
        saveData(); // Syncs to Firebase (or LocalStorage)

        if (!isFirebaseConfigured) renderApp();

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
