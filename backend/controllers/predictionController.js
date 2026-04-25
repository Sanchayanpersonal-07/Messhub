import Attendance from "../models/Attendance.js";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday.js";
import isoWeek from "dayjs/plugin/isoWeek.js";

dayjs.extend(weekday);
dayjs.extend(isoWeek);

/* ─────────────────────────────────────────────────────────
   Ingredient ratios — কতজনের জন্য কতটুকু লাগবে।
   Unit: grams per person (manager চাইলে এটা customize করতে পারবে)
   এগুলো approximate — IIITG mess এর জন্য standard values।
───────────────────────────────────────────────────────── */
const INGREDIENT_RATIOS = {
  breakfast: {
    "Rice/Bread (g)": 150,
    "Dal (g)": 100,
    "Vegetables (g)": 120,
    "Oil (ml)": 15,
    "Spices (g)": 10,
  },
  lunch: {
    "Rice (g)": 250,
    "Dal (g)": 120,
    "Vegetables (g)": 150,
    "Roti (g)": 100,
    "Oil (ml)": 20,
    "Spices (g)": 15,
  },
  dinner: {
    "Rice (g)": 220,
    "Dal (g)": 110,
    "Vegetables (g)": 140,
    "Roti (g)": 100,
    "Oil (ml)": 18,
    "Spices (g)": 12,
  },
};

/* ─────────────────────────────────────────────────────────
   Weighted average helper
   সবচেয়ে recent সপ্তাহ সবচেয়ে বেশি weight পাবে।
   weights: [1, 2, 3, 4] → oldest to newest
   যদি data কম থাকে, available data দিয়েই calculate করবে।
───────────────────────────────────────────────────────── */
function weightedAverage(values) {
  if (!values.length) return 0;
  const n = values.length;
  // weights: 1, 2, 3... (newest = highest)
  const weights = values.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weighted = values.reduce((sum, val, i) => sum + val * weights[i], 0);
  return Math.round(weighted / totalWeight);
}

/* ─────────────────────────────────────────────────────────
   GET /prediction/next7days   [manager/warden]

   Algorithm:
   1. Last 8 সপ্তাহের attendance data নিই
   2. প্রতিটা weekday (0-6) + meal_type combination এর জন্য
      প্রতি সপ্তাহের count বের করি
   3. Weighted average নিই (recent = higher weight)
   4. পরের ৭ দিনের জন্য prediction দিই
   5. প্রতিটা prediction এর সাথে ingredient suggestion দিই
───────────────────────────────────────────────────────── */
export const getPrediction = async (req, res, next) => {
  try {
    const WEEKS_BACK = 8;
    const MEALS = ["breakfast", "lunch", "dinner"];

    // আজ থেকে WEEKS_BACK সপ্তাহ আগের date
    const fromDate = dayjs().subtract(WEEKS_BACK, "week").format("YYYY-MM-DD");
    const toDate = dayjs().subtract(1, "day").format("YYYY-MM-DD"); // আজকের আগ পর্যন্ত

    // সব historical attendance আনি
    const historical = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: { date: "$date", meal_type: "$meal_type" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // date+meal → count map বানাই
    const countMap = {};
    historical.forEach(({ _id, count }) => {
      countMap[`${_id.date}__${_id.meal_type}`] = count;
    });

    // weekday (0=Sun, 1=Mon...) + meal এর জন্য
    // last WEEKS_BACK সপ্তাহের counts collect করি
    const weeklyData = {}; // key: "weekday__meal" → [count_week1, count_week2, ...]

    for (let w = WEEKS_BACK; w >= 1; w--) {
      // এই সপ্তাহের সব দিন
      for (let d = 0; d < 7; d++) {
        const date = dayjs()
          .subtract(w, "week")
          .startOf("week")
          .add(d, "day")
          .format("YYYY-MM-DD");

        if (date > toDate) continue;

        const weekdayNum = dayjs(date).day(); // 0=Sun, 6=Sat

        MEALS.forEach((meal) => {
          const key = `${weekdayNum}__${meal}`;
          if (!weeklyData[key]) weeklyData[key] = [];
          const count = countMap[`${date}__${meal}`] || 0;
          weeklyData[key].push(count);
        });
      }
    }

    // পরের ৭ দিনের prediction তৈরি করি
    const predictions = [];

    for (let i = 1; i <= 7; i++) {
      const date = dayjs().add(i, "day");
      const dateStr = date.format("YYYY-MM-DD");
      const weekdayNum = date.day();
      const weekdayName = date.format("dddd"); // "Monday"

      const mealPredictions = {};

      MEALS.forEach((meal) => {
        const key = `${weekdayNum}__${meal}`;
        const values = weeklyData[key] || [];

        // Non-zero values দিয়ে average নেওয়া better
        const nonZero = values.filter((v) => v > 0);
        const predicted = nonZero.length > 0 ? weightedAverage(nonZero) : 0;

        // 10% buffer যোগ করি wastage এড়াতে (safety margin)
        const withBuffer = Math.ceil(predicted * 1.1);

        // Ingredient calculation
        const ingredients = {};
        if (predicted > 0) {
          const ratios = INGREDIENT_RATIOS[meal];
          Object.entries(ratios).forEach(([item, gPerPerson]) => {
            const total = withBuffer * gPerPerson;
            // kg/L তে convert করি যদি বড় হয়
            if (total >= 1000) {
              ingredients[item] =
                `${(total / 1000).toFixed(1)} ${item.includes("ml") ? "L" : "kg"}`;
            } else {
              ingredients[item] =
                `${total} ${item.includes("ml") ? "ml" : "g"}`;
            }
          });
        }

        // Historical data summary (কতটা confident)
        const dataPoints = nonZero.length;
        const confidence =
          dataPoints >= 6
            ? "high"
            : dataPoints >= 3
              ? "medium"
              : dataPoints >= 1
                ? "low"
                : "no_data";

        mealPredictions[meal] = {
          predicted_count: predicted,
          with_buffer: withBuffer,
          confidence,
          data_points: dataPoints,
          ingredients,
        };
      });

      predictions.push({
        date: dateStr,
        day: weekdayName,
        short_day: date.format("ddd"), // "Mon"
        meals: mealPredictions,
      });
    }

    // Total predicted meals for the week
    const weekTotal = predictions.reduce((sum, day) => {
      return (
        sum +
        Object.values(day.meals).reduce(
          (s, m) => s + (m.predicted_count || 0),
          0,
        )
      );
    }, 0);

    res.json({
      generated_at: new Date().toISOString(),
      based_on_weeks: WEEKS_BACK,
      from_date: fromDate,
      to_date: toDate,
      total_historical_records: historical.length,
      week_total_predicted: weekTotal,
      predictions,
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /prediction/history   [manager/warden]
   Prediction accuracy check করার জন্য —
   আগের সপ্তাহের predicted vs actual দেখাবে।
   (Manager দেখতে পারবে model কতটা accurate)
───────────────────────────────────────────────────────── */
export const getPredictionAccuracy = async (req, res, next) => {
  try {
    const MEALS = ["breakfast", "lunch", "dinner"];
    const WEEKS_CHECK = 4;

    const today = dayjs().format("YYYY-MM-DD");

    // ✅ FIX: single query for all actuals in the check window (was 28 queries)
    const checkFrom = dayjs()
      .subtract(WEEKS_CHECK, "week")
      .startOf("week")
      .format("YYYY-MM-DD");
    const historicalFrom = dayjs()
      .subtract(WEEKS_CHECK + 8, "week")
      .startOf("week")
      .format("YYYY-MM-DD");

    // One query: all attendance in check window + 8 weeks of history before it
    const allAttendance = await Attendance.aggregate([
      { $match: { date: { $gte: historicalFrom, $lt: today } } },
      {
        $group: {
          _id: { date: "$date", meal_type: "$meal_type" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a single map for everything
    const countMap = {};
    allAttendance.forEach(({ _id, count }) => {
      countMap[`${_id.date}__${_id.meal_type}`] = count;
    });

    const rows = [];

    for (let w = 1; w <= WEEKS_CHECK; w++) {
      for (let d = 0; d < 7; d++) {
        const date = dayjs().subtract(w, "week").startOf("week").add(d, "day");
        const dateStr = date.format("YYYY-MM-DD");

        if (dateStr >= today) continue;

        MEALS.forEach((meal) => {
          // Actual from our single map
          const actual = countMap[`${dateStr}__${meal}`] || 0;

          // Predict using 8 weeks of prior data
          const values = [];
          for (let pw = 1; pw <= 8; pw++) {
            const pastDate = date.subtract(pw, "week").format("YYYY-MM-DD");
            values.unshift(countMap[`${pastDate}__${meal}`] || 0);
          }
          const nonZero = values.filter((v) => v > 0);
          const predicted = nonZero.length > 0 ? weightedAverage(nonZero) : 0;

          if (predicted > 0 || actual > 0) {
            rows.push({
              date: dateStr,
              day: date.format("ddd"),
              meal_type: meal,
              predicted,
              actual,
              diff: actual - predicted,
              accuracy_pct:
                predicted > 0
                  ? Math.round(
                      (1 - Math.abs(actual - predicted) / predicted) * 100,
                    )
                  : null,
            });
          }
        });
      }
    }

    const withAccuracy = rows.filter((r) => r.accuracy_pct !== null);
    const avgAccuracy =
      withAccuracy.length > 0
        ? Math.round(
            withAccuracy.reduce((s, r) => s + r.accuracy_pct, 0) /
              withAccuracy.length,
          )
        : null;

    res.json({
      weeks_checked: WEEKS_CHECK,
      average_accuracy_pct: avgAccuracy,
      rows: rows.slice(0, 50),
    });
  } catch (err) {
    next(err);
  }
};
