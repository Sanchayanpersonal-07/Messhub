/* ─────────────────────────────────────────────────────────
   mealTimeWindow.js
   Meal attendance এর time window check করার utility।

   Meal windows (±15 min buffer):
     Breakfast : 7:30 – 9:00  → open 7:15  – 9:15
     Lunch     : 12:30 – 2:00 → open 12:15 – 2:15
     Dinner    : 7:30 – 9:00  → open 7:15  – 9:15  (PM)
───────────────────────────────────────────────────────── */

const BUFFER_MINUTES = 15;

// Minutes from midnight
const MEAL_WINDOWS = {
  breakfast: { start: 7 * 60 + 30,  end: 9 * 60 },       // 7:30 – 9:00
  lunch:     { start: 12 * 60 + 30, end: 14 * 60 },       // 12:30 – 14:00
  dinner:    { start: 19 * 60 + 30, end: 21 * 60 },       // 19:30 – 21:00
};

/**
 * Returns true if current time is within the allowed window for the meal.
 * Window = meal_start - BUFFER  to  meal_end + BUFFER
 */
export function isMealWindowOpen(meal_type) {
  const window = MEAL_WINDOWS[meal_type];
  if (!window) return false;

  const now   = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const openAt  = window.start - BUFFER_MINUTES;  // 15 min before start
  const closeAt = window.end   + BUFFER_MINUTES;  // 15 min after end

  return nowMin >= openAt && nowMin <= closeAt;
}

/**
 * Returns window info for a meal — used for error messages & frontend display.
 * Returns: { openAt: "7:15 AM", closeAt: "9:15 AM", isOpen: bool }
 */
export function getMealWindowInfo(meal_type) {
  const window = MEAL_WINDOWS[meal_type];
  if (!window) return null;

  const nowMin  = new Date().getHours() * 60 + new Date().getMinutes();
  const openAt  = window.start - BUFFER_MINUTES;
  const closeAt = window.end   + BUFFER_MINUTES;

  return {
    openAt:  formatTime(openAt),
    closeAt: formatTime(closeAt),
    isOpen:  nowMin >= openAt && nowMin <= closeAt,
  };
}

/**
 * Returns window info for ALL meals — used by frontend status API.
 */
export function getAllMealWindows() {
  return Object.fromEntries(
    Object.keys(MEAL_WINDOWS).map((meal) => [meal, getMealWindowInfo(meal)])
  );
}

/* ── Helper: minutes from midnight → "7:15 AM" ── */
function formatTime(totalMinutes) {
  const h   = Math.floor(totalMinutes / 60);
  const m   = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}