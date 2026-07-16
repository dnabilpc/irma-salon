import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Keys yang boleh diakses publik
const PUBLIC_KEYS = [
  "vto_limit_default",
  "vto_reset_interval_days",
  "salon_name",
  "salon_whatsapp",
  "salon_instagram",
  "salon_facebook",
  "salon_tiktok",
  "salon_email",
  "salon_address",
  "salon_maps_url",
  "qris_payload",
];

function formatOpeningHours(rows: any[]) {
  if (!rows || rows.length === 0) {
    return "Tutup";
  }
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayTranslation: Record<string, string> = {
    'monday': 'Senin', 'tuesday': 'Selasa', 'wednesday': 'Rabu',
    'thursday': 'Kamis', 'friday': 'Jumat', 'saturday': 'Sabtu', 'sunday': 'Minggu'
  };

  const cleanTime = (t: string) => {
    if (!t) return '';
    const parts = t.split('+')[0].split(':');
    return `${parts[0]}.${parts[1]}`;
  };

  const activeDays = rows.map(r => ({
    day: r.day_of_week,
    order: dayOrder.indexOf(r.day_of_week),
    open: cleanTime(r.open_time),
    close: cleanTime(r.close_time)
  })).filter(r => r.order !== -1).sort((a, b) => a.order - b.order);

  if (activeDays.length === 0) {
    return "Tutup";
  }

  const groups: Array<{ days: typeof activeDays; timeStr: string }> = [];
  let currentGroup: { days: typeof activeDays; timeStr: string } | null = null;

  for (const dayInfo of activeDays) {
    const timeStr = `${dayInfo.open} – ${dayInfo.close} WIB`;
    if (!currentGroup) {
      currentGroup = {
        days: [dayInfo],
        timeStr
      };
    } else {
      const lastDay = currentGroup.days[currentGroup.days.length - 1];
      if (dayInfo.order === lastDay.order + 1 && timeStr === currentGroup.timeStr) {
        currentGroup.days.push(dayInfo);
      } else {
        groups.push(currentGroup);
        currentGroup = {
          days: [dayInfo],
          timeStr
        };
      }
    }
  }
  if (currentGroup) {
    groups.push(currentGroup);
  }

  const parts = groups.map(g => {
    const startName = dayTranslation[g.days[0].day];
    if (g.days.length === 1) {
      return `${startName} (${g.timeStr})`;
    } else if (g.days.length === 2) {
      const endName = dayTranslation[g.days[1].day];
      return `${startName} & ${endName} (${g.timeStr})`;
    } else {
      const endName = dayTranslation[g.days[g.days.length - 1].day];
      return `${startName} – ${endName} (${g.timeStr})`;
    }
  });

  return parts.join(', ');
}

export async function GET() {
  try {
    // 1. Fetch settings from settings table
    const result = await db.query(
      `SELECT key, value FROM settings WHERE key = ANY($1)`,
      [PUBLIC_KEYS]
    );

    const settings: Record<string, any> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    // 2. Fetch opening_time and format dynamic description
    const openRes = await db.query(`SELECT day_of_week, open_time::text, close_time::text FROM opening_time`);
    settings.salon_open_description = formatOpeningHours(openRes.rows);

    // 3. Fetch active/upcoming closing times
    const closingRes = await db.query(
      `SELECT id, start_datetime::text, end_datetime::text, reason 
       FROM closing_time 
       WHERE end_datetime >= NOW() 
       ORDER BY start_datetime ASC`
    );
    settings.upcoming_holidays = closingRes.rows;

    return NextResponse.json(settings);
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
