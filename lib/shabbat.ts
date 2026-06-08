// Shabbat & Yom Tov guard for all outbound messaging.
//
// The system must never send WhatsApp / SMS / push / email to people on
// Shabbat or Yom Tov. Times are computed for Israel using candle-lighting
// 40 minutes before sunset and Havdalah 72 minutes after sunset (Rabbeinu
// Tam — the safe, machmir window, aligned with Chabad custom). This means a
// message is suppressed from Friday candle-lighting until Motzaei Shabbat/Chag
// everywhere in Israel. Chol HaMoed and fast days are NOT blocked.
//
// Uses @hebcal/core — pure JS, fully offline, no external API.
import { HebrewCalendar, Location } from '@hebcal/core'

// Jerusalem: earliest candle-lighting in Israel, so this yields the widest
// (safest) rest window for a nationwide system.
const ISRAEL = new Location(31.76904, 35.21633, true, 'Asia/Jerusalem', 'Jerusalem', 'IL')

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * True when `now` falls within Shabbat or a Yom Tov (candle-lighting → Havdalah),
 * computed for Israel. Used to suppress all automated outbound messaging.
 */
export function isShabbatOrChag(now: Date = new Date()): boolean {
  // Look back far enough to catch the candle-lighting that opened a multi-day
  // Yom Tov adjacent to Shabbat (up to ~3 days), plus margin.
  const events = HebrewCalendar.calendar({
    start: new Date(now.getTime() - 5 * DAY_MS),
    end: new Date(now.getTime() + 1 * DAY_MS),
    location: ISRAEL,
    candlelighting: true,
    candleLightingMins: 40,
    havdalahMins: 72,
    il: true,
  })

  // Walk the candle-lighting / Havdalah toggles up to `now`. If the most recent
  // one before `now` was a candle-lighting, we are inside Shabbat/Yom Tov.
  // (Chanukah candles use a different description and are correctly ignored.)
  const toggles = events
    .map((ev) => {
      const t = (ev as { eventTime?: Date }).eventTime
      return { time: t ? t.getTime() : undefined, desc: ev.getDesc() }
    })
    .filter(
      (e) =>
        e.time !== undefined &&
        e.time <= now.getTime() &&
        (e.desc === 'Candle lighting' || e.desc === 'Havdalah'),
    )
    .sort((a, b) => (a.time as number) - (b.time as number))

  const last = toggles[toggles.length - 1]
  return last ? last.desc === 'Candle lighting' : false
}

/**
 * True when the Israel clock time is outside the allowed sending window (08:00–20:00).
 * All automated messaging is suppressed during quiet hours.
 */
export function isQuietHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = parseInt(parts.find((p) => p.type === 'hour')!.value, 10)
  return hour < 8 || hour >= 20
}
