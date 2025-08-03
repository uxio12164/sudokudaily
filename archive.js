const difficulties = ['easy', 'medium', 'hard'];
const archiveStartDate = new Date('2025-05-24');
const today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

function pad(n) { return n < 10 ? '0' + n : n; }

function renderArchiveGrid() {
  const grid = document.getElementById('archive-grid');
  const monthLabel = document.getElementById('archive-month');
  grid.innerHTML = '';

  // Set month label
  const monthDate = new Date(currentYear, currentMonth, 1);
  monthLabel.textContent = monthDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  // Find first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Find what day of week the first day is (0=Sun, 1=Mon, ...)
  let startDay = firstDay.getDay();

  // Fill grid: 6x6 (36 days)
  let dayNum = 1;
  for (let i = 0; i < 36; i++) {
    const col = document.createElement('div');
    col.className = 'col archive-day';

    if (i >= startDay && dayNum <= daysInMonth) {
      // Show all days for demo (remove archiveStartDate check)
      const thisDate = new Date(currentYear, currentMonth, dayNum);
      const dateStr = `${thisDate.getFullYear()}-${(thisDate.getMonth() + 1).toString().padStart(2, '0')}-${thisDate.getDate().toString().padStart(2, '0')}`;
      col.innerHTML = `
  <div class="date-label">${thisDate.getDate()}</div>
  <div class="d-flex flex-column gap-1 mt-1">
    <a href="index.html?date=${dateStr}&difficulty=easy" class="btn btn-outline-primary btn-sm" title="Easy">Easy</a>
    <a href="index.html?date=${dateStr}&difficulty=medium" class="btn btn-outline-warning btn-sm" title="Medium">Medium</a>
    <a href="index.html?date=${dateStr}&difficulty=hard" class="btn btn-outline-danger btn-sm" title="Hard">Hard</a>
  </div>
      `;
      dayNum++;
    } else {
      col.classList.add('empty-cell');
      col.innerHTML = '';
      col.style.background = 'transparent';
      col.style.border = 'none';
      col.style.cursor = 'default';
      col.style.boxShadow = 'none';
    }
    grid.appendChild(col);
  }
}


document.getElementById('prev-month').onclick = function() {
  if (currentMonth === 0) {
    currentMonth = 11;
    currentYear--;
  } else {
    currentMonth--;
  }
  renderAndUpdate();
};
document.getElementById('next-month').onclick = function() {
  if (currentMonth === 11) {
    currentMonth = 0;
    currentYear++;
  } else {
    currentMonth++;
  }
  renderAndUpdate();
};

function updateNavButtons() {
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  const firstOfMonth = new Date(currentYear, currentMonth, 1);
  const lastOfMonth = new Date(currentYear, currentMonth + 1, 0);

  prevBtn.disabled = firstOfMonth <= archiveStartDate;
  nextBtn.disabled = lastOfMonth >= today;
}

function renderAndUpdate() {
  renderArchiveGrid();
  updateNavButtons();
}

function updateNavButtons() {
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  const firstOfMonth = new Date(currentYear, currentMonth, 1);
  const lastOfMonth = new Date(currentYear, currentMonth + 1, 0);

  // Set button text to month names
  let prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  let prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  let nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  let nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  prevBtn.innerHTML = `<i class="bi bi-chevron-left"></i> ${getMonthName(prevMonth, prevYear)}`;
  nextBtn.innerHTML = `${getMonthName(nextMonth, nextYear)} <i class="bi bi-chevron-right"></i>`;

  prevBtn.disabled = firstOfMonth <= archiveStartDate;
  nextBtn.disabled = lastOfMonth >= today;
}

function getMonthName(monthIndex, year) {
  return new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long' });
}
document.addEventListener('DOMContentLoaded', renderAndUpdate);