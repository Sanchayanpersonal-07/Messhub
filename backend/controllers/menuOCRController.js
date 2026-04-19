import fs from "fs/promises";
import Meal from "../models/Meal.js";
import dayjs from "dayjs";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const MEALS = ["breakfast", "lunch", "dinner"];

function isMonday(dateStr) {
  return dayjs(dateStr).day() === 1;
}

// Returns array of all Mondays from startMonday up to and including the week that contains endDate
function getAllMondaysInRange(startMonday, endDate) {
  const mondays = [];
  let current = dayjs(startMonday);
  const end = dayjs(endDate);

  while (current.isBefore(end) || current.isSame(end, "day")) {
    mondays.push(current.format("YYYY-MM-DD"));
    current = current.add(7, "day");
  }

  return mondays;
}

const PROMPT = `You are parsing a weekly mess/cafeteria menu chart image.

Extract every food item for each day (Monday–Sunday) and each meal (breakfast, lunch, dinner).

For breakfast: combine Hot Beverage + Main + Add On rows.
For lunch: combine Roti + Rice + Dal + Veg-1 + Veg-2 + Add On + Salad rows.
For dinner: combine Roti + Rice + Dal + Non Veg + Veg + Add On rows.

Return ONLY a valid JSON object — no explanation, no markdown fences:
{
  "monday":    { "breakfast": ["item1","item2"], "lunch": ["item1","item2"], "dinner": ["item1","item2"] },
  "tuesday":   { "breakfast": [...], "lunch": [...], "dinner": [...] },
  "wednesday": { "breakfast": [...], "lunch": [...], "dinner": [...] },
  "thursday":  { "breakfast": [...], "lunch": [...], "dinner": [...] },
  "friday":    { "breakfast": [...], "lunch": [...], "dinner": [...] },
  "saturday":  { "breakfast": [...], "lunch": [...], "dinner": [...] },
  "sunday":    { "breakfast": [...], "lunch": [...], "dinner": [...] }
}

Rules:
- Keep food names exactly as written in the image.
- Each item should be a single string (e.g. "Moong Dal Fry").
- If a cell is empty or "-" use an empty array [].
- Return ONLY the JSON object.`;

const FREE_MODELS = [
  "openrouter/auto",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
];

async function callOpenRouterVision(apiKey, base64Image, mimeType) {
  let lastError = null;

  for (const model of FREE_MODELS) {
    const body = {
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      temperature: 0.1,
    };

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "MessHub",
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      lastError = networkErr;
      continue;
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = errBody?.error?.message || `HTTP ${response.status}`;
      lastError = new Error(msg);
      if (response.status === 401) throw lastError;
      console.error(`✗ ${model} failed: ${msg}`);
      continue;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      lastError = new Error("Empty response from model");
      continue;
    }

    console.log(`✓ OpenRouter: used ${model}`);
    return text;
  }

  throw lastError || new Error(
    "All free OpenRouter models failed. Check your API key at openrouter.ai/keys"
  );
}

export const uploadMenuChart = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Menu image required" });
    }

    const { weekStartDate, weekEndDate } = req.body;

    // Validate start date
    if (!weekStartDate) {
      return res.status(400).json({ msg: "weekStartDate is required" });
    }
    if (!dayjs(weekStartDate, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ msg: "weekStartDate must be YYYY-MM-DD" });
    }
    if (!isMonday(weekStartDate)) {
      return res.status(400).json({ msg: "weekStartDate must be a Monday" });
    }

    // Validate end date
    if (!weekEndDate) {
      return res.status(400).json({ msg: "weekEndDate is required" });
    }
    if (!dayjs(weekEndDate, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ msg: "weekEndDate must be YYYY-MM-DD" });
    }
    if (dayjs(weekEndDate).isBefore(dayjs(weekStartDate))) {
      return res.status(400).json({ msg: "weekEndDate must be after weekStartDate" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ msg: "OPENROUTER_API_KEY not set in .env" });
    }

    // Extract menu from image ONCE
    const imageBuffer = await fs.readFile(req.file.path);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const rawText = await callOpenRouterVision(apiKey, base64Image, mimeType);
    const clean = rawText.replace(/```json|```/g, "").trim();

    let menuData;
    try {
      menuData = JSON.parse(clean);
    } catch {
      return res.status(422).json({
        msg: "Could not parse menu from image. Please ensure it clearly shows a Mon–Sun meal table.",
        raw: clean.slice(0, 300),
      });
    }

    const hasData = DAYS.some((d) =>
      MEALS.some((m) => (menuData[d]?.[m]?.length ?? 0) > 0),
    );
    if (!hasData) {
      return res.status(422).json({
        msg: "Extraction succeeded but no meal items found. Check image quality.",
      });
    }

    // Get all Mondays in the date range
    const allMondays = getAllMondaysInRange(weekStartDate, weekEndDate);
    let totalInserted = 0;

    // Save the same menu for every week in range
    for (const monday of allMondays) {
      for (let i = 0; i < DAYS.length; i++) {
        const day = DAYS[i];
        const date = dayjs(monday).add(i, "day").format("YYYY-MM-DD");
        const dayData = menuData[day] || {};

        for (const meal of MEALS) {
          const items = (dayData[meal] || []).filter((item) => item?.trim());
          if (!items.length) continue;

          await Meal.findOneAndUpdate(
            { date, meal_type: meal },
            { date, meal_type: meal, items, created_by: req.user.id },
            { upsert: true, new: true },
          );
          totalInserted++;
        }
      }
    }

    // Build preview of extracted menu (just once, for display)
    const extracted = DAYS.map((day, i) => {
      const dayData = menuData[day] || {};
      return {
        day,
        breakfast: (dayData.breakfast || []).join(", "),
        lunch: (dayData.lunch || []).join(", "),
        dinner: (dayData.dinner || []).join(", "),
      };
    });

    res.json({
      msg: `Menu saved for ${allMondays.length} week(s) — ${weekStartDate} to ${weekEndDate}`,
      weekStartDate,
      weekEndDate,
      weeksCount: allMondays.length,
      weeksApplied: allMondays,
      totalInserted,
      extracted,
    });
  } catch (err) {
    next(err);
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }
};