/* ============================================================
   MY DEVICE HUB
   A clean 2D personal device dashboard.
   Real data, or an honest statement of the limitation.
   Real-data policy: anything that cannot be read from the host
   platform is shown as an explicit limitation, never simulated.
   ============================================================ */

/* ---------------- tiny helpers ---------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const nowIso = () => new Date().toISOString();

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function nfmt(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-IN");
}
function pct(part, total) { return total > 0 ? clamp(Math.round((part / total) * 100), 0, 100) : 0; }

/* safe, manual escaping for href/src attributes - never interpolate raw user URLs into HTML */
function safeImg(src) {
  const s = String(src || "").trim();
  if (!/^data:image\/(png|jpe?g|gif|webp|avif|bmp);base64,[a-z0-9+/=\s]+$/i.test(s) && !/^https?:\/\/[^\s"'<>]+$/i.test(s)) return null;
  return s;
}
function safeUrl(u) {
  const s = String(u || "").trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(s) ? s : null;
}

/* dates */
const MS_DAY = 86400000;
function dayKey(d = new Date()) {
  const x = typeof d === "string" ? new Date(d) : d;
  if (isNaN(x.getTime())) return "";
  return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
}
const todayKey = () => dayKey(new Date());
/* Tolerant date coercion: legacy records may have no timestamp at all, and a
   missing date must render as a dash rather than crash a whole screen. */
function toDate(d) {
  if (d == null || d === "") return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  if (typeof d === "string" || typeof d === "number") {
    const x = new Date(d);
    return isNaN(x.getTime()) ? null : x;
  }
  return null;
}
function fmtDate(d, opts) {
  const x = toDate(d);
  if (!x) return "—";
  return x.toLocaleDateString(undefined, opts || { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(d) {
  const x = toDate(d);
  if (!x) return "—";
  return x.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function fmtDateTime(d) { const x = toDate(d); return x ? fmtDate(x) + " · " + fmtTime(x) : "—"; }
function fmtDurationSec(sec) { return mmss(sec); }
function relTime(d) {
  const x = toDate(d);
  if (!x) return "—";
  const diff = Date.now() - x.getTime();
  const a = Math.abs(diff), fut = diff < 0;
  const m = Math.round(a / 60000), h = Math.round(a / 3600000), dd = Math.round(a / MS_DAY);
  let s;
  if (a < 45000) s = "just now";
  else if (m < 60) s = m + " min";
  else if (h < 24) s = h + (h === 1 ? " hour" : " hours");
  else if (dd < 31) s = dd + (dd === 1 ? " day" : " days");
  else if (dd < 365) s = Math.round(dd / 30) + " mo";
  else s = Math.round(dd / 365) + " yr";
  if (s === "just now") return s;
  return fut ? "in " + s : s + " ago";
}
function mmss(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = n => String(n).padStart(2, "0");
  return (h > 0 ? h + ":" : "") + p(m) + ":" + p(s);
}
function fmtDur(mins) {
  mins = Math.max(0, Math.round(mins));
  if (mins < 60) return mins + " min";
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? h + "h " + m + "m" : h + "h";
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((d - t) / MS_DAY);
}

/* ---------------- icon set (minimal inline SVG, stroke-based) ---------------- */
const ICON_PATHS = {
  home: '<path d="M3 10.2 12 3.4l9 6.8"/><path d="M5.4 9.6V20h13.2V9.6"/><path d="M9.7 20v-5.4h4.6V20"/>',
  devices: '<rect x="3" y="3.6" width="12.8" height="9.4" rx="1.6"/><path d="M7.6 17h3.8"/><path d="M9.5 13v4"/><rect x="17.4" y="10.4" width="3.8" height="9.6" rx="1.4"/>',
  bluetooth: '<path d="M6.6 7.2 17.4 16.1 12 20.6V3.4l5.4 4.5L6.6 16.8"/>',
  wifi: '<path d="M2.6 8.9a14.5 14.5 0 0 1 18.8 0"/><path d="M5.9 12.5a9.9 9.9 0 0 1 12.2 0"/><path d="M9.1 16a5.2 5.2 0 0 1 5.8 0"/><circle cx="12" cy="19.5" r="1.25"/>',
  car: '<path d="M4.2 16.4V11l1.9-4.6A2 2 0 0 1 8 5h8a2 2 0 0 1 1.9 1.4L19.8 11v5.4"/><path d="M4.2 11h15.6"/><circle cx="7.4" cy="17.6" r="1.9"/><circle cx="16.6" cy="17.6" r="1.9"/><path d="M9.3 17.6h5.4"/>',
  focus: '<circle cx="12" cy="13" r="7.6"/><path d="M12 9.4V13l2.6 1.7"/><path d="M9 2.6h6"/><path d="M12 2.6v2.8"/>',
  tasks: '<path d="M4 6.4h1.9l1.2 1.4L10 5.2"/><path d="M4 15.4h1.9l1.2 1.4L10 14.2"/><path d="M13 6.6h7"/><path d="M13 15.6h7"/>',
  mystery: '<circle cx="11.4" cy="11.4" r="6.6"/><path d="m16.4 16.4 4.2 4.2"/><path d="M9.2 9.6a2.3 2.3 0 0 1 4.4.6c0 1.5-2.1 1.7-2.1 3.2"/><circle cx="11.5" cy="15.9" r=".9" fill="currentColor" stroke="none"/>',
  stats: '<path d="M4.2 20.2V13"/><path d="M9.8 20.2V5.6"/><path d="M15.4 20.2v-9.6"/><path d="M21 20.2V9"/>',
  settings: '<circle cx="12" cy="12" r="3.1"/><path d="M19.4 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5.2v13.6"/><path d="M5.2 12h13.6"/>',
  refresh: '<path d="M20.2 12a8.2 8.2 0 1 1-2.4-5.8"/><path d="M20.6 3.9v5.2h-5.2"/>',
  scan: '<path d="M3.4 8.6V5.6A2.2 2.2 0 0 1 5.6 3.4h3"/><path d="M15.4 3.4h3a2.2 2.2 0 0 1 2.2 2.2v3"/><path d="M20.6 15.4v3a2.2 2.2 0 0 1-2.2 2.2h-3"/><path d="M8.6 20.6h-3a2.2 2.2 0 0 1-2.2-2.2v-3"/><path d="M3.8 12h16.4"/>',
  link: '<path d="M10.6 13.4a3.9 3.9 0 0 0 5.6 0l2.6-2.6a4 4 0 0 0-5.6-5.6l-1 1"/><path d="M13.4 10.6a3.9 3.9 0 0 0-5.6 0l-2.6 2.6a4 4 0 0 0 5.6 5.6l1-1"/>',
  unlink: '<path d="M8.4 15.6 5.5 18.5"/><path d="M4 4l16 16"/><path d="M10.6 13.4a3.9 3.9 0 0 0 1.2.8"/><path d="M16.2 13.4l2.6-2.6a4 4 0 0 0-5.6-5.6l-.6.6"/><path d="M7.4 10.6 5.5 12.5"/>',
  trash: '<path d="M3.8 6.4h16.4"/><path d="M8.6 6.4V4.8A1.4 1.4 0 0 1 10 3.4h4a1.4 1.4 0 0 1 1.4 1.4v1.6"/><path d="M6.6 6.4 7.5 19.4a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l.9-13"/><path d="M10.4 10.6v6.4"/><path d="M13.6 10.6v6.4"/>',
  edit: '<path d="M4 20h4.2L19.6 8.6a2.2 2.2 0 0 0-3.2-3.2L5 16.8z"/><path d="M14.6 6.4 17.6 9.4"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  chevron: '<path d="m9 5.6 6.4 6.4L9 18.4"/>',
  back: '<path d="m15 5.6-6.4 6.4L15 18.4"/>',
  check: '<path d="M4.8 12.6 9.6 17.4 19.4 6.6"/>',
  info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11.2v5.4"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/>',
  warn: '<path d="M12 3.8 21 19.6H3z"/><path d="M12 9.6v4.6"/><circle cx="12" cy="17.2" r=".95" fill="currentColor" stroke="none"/>',
  shield: '<path d="M12 3.4 5 6.2v5.6c0 4.3 2.9 7.6 7 8.9 4.1-1.3 7-4.6 7-8.9V6.2z"/><path d="m9.4 12 1.9 1.9 3.6-3.9"/>',
  download: '<path d="M12 3.6v11.2"/><path d="m7.6 10.6 4.4 4.4 4.4-4.4"/><path d="M4.4 19.4h15.2"/>',
  upload: '<path d="M12 20.4V9.2"/><path d="m7.6 13.2 4.4-4.4 4.4 4.4"/><path d="M4.4 4.6h15.2"/>',
  bell: '<path d="M6.4 10.4a5.6 5.6 0 0 1 11.2 0c0 5 2 6.4 2 6.4H4.4s2-1.4 2-6.4"/><path d="M10.2 20a2 2 0 0 0 3.6 0"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 2.2"/>',
  calendar: '<rect x="3.6" y="5.4" width="16.8" height="15" rx="2.2"/><path d="M3.6 10h16.8"/><path d="M8.4 3.4v3.6"/><path d="M15.6 3.4v3.6"/>',
  image: '<rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2.2"/><circle cx="9" cy="10" r="1.7"/><path d="m4.6 17.6 4.4-4.2 3.2 3 3-2.8 4.2 4"/>',
  camera: '<path d="M4.4 8.6h2.9l1.5-2.2h6.4l1.5 2.2h2.9a1.6 1.6 0 0 1 1.6 1.6v8a1.6 1.6 0 0 1-1.6 1.6H4.4a1.6 1.6 0 0 1-1.6-1.6v-8a1.6 1.6 0 0 1 1.6-1.6z"/><circle cx="12" cy="13.6" r="3.2"/>',
  play: '<path d="M7.4 4.8 19 12 7.4 19.2z"/>',
  pause: '<path d="M9 4.8v14.4"/><path d="M15 4.8v14.4"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  flame: '<path d="M12 3s5.2 4.2 5.2 8.6a5.2 5.2 0 0 1-10.4 0C6.8 9 9 6.6 9 6.6s.6 1.6 1.6 2.2C11 7.4 12 5.4 12 3z"/>',
  target: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
  chart: '<path d="M4 19.2h16"/><path d="m5.6 15.4 4-4.6 3.4 2.8 5.4-6.2"/>',
  layers: '<path d="m12 3.4 8.4 4.4-8.4 4.4L3.6 7.8z"/><path d="m3.6 12.6 8.4 4.4 8.4-4.4"/>',
  key: '<circle cx="8.4" cy="15.6" r="3.6"/><path d="m11.2 13 8.4-8.4"/><path d="m16.4 7.8 2.2 2.2"/><path d="m14.2 10 2.2 2.2"/>',
  eye: '<path d="M2.6 12S6.4 5.6 12 5.6 21.4 12 21.4 12 17.6 18.4 12 18.4 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="3.1"/>',
  moons: '<path d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.6 8.6 0 1 0 10.4 10.4z"/>',
  sparkle: '<path d="M12 3.4l1.9 5.1 5.1 1.9-5.1 1.9L12 17.4l-1.9-5.1L5 10.4l5.1-1.9z"/><path d="M18.6 16.4l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/>',
  phone: '<rect x="6.6" y="2.6" width="10.8" height="18.8" rx="2.6"/><path d="M10.8 5.6h2.4"/><circle cx="12" cy="18.2" r="1" fill="currentColor" stroke="none"/>',
  monitor: '<rect x="2.8" y="4.4" width="18.4" height="12" rx="2.2"/><path d="M8.6 20.4h6.8"/><path d="M12 16.4v4"/>',
  laptop: '<rect x="3.6" y="5" width="16.8" height="10.4" rx="2"/><path d="M2.4 18.6h19.2l-1.4-3.2H3.8z"/>',
  headphones: '<path d="M4.4 15.4v-3.2a7.6 7.6 0 0 1 15.2 0v3.2"/><rect x="2.6" y="14.2" width="4" height="6.4" rx="1.8"/><rect x="17.4" y="14.2" width="4" height="6.4" rx="1.8"/>',
  speaker: '<rect x="5.6" y="2.8" width="12.8" height="18.4" rx="2.6"/><circle cx="12" cy="15.4" r="3"/><circle cx="12" cy="7.6" r="1.4"/>',
  watch: '<circle cx="12" cy="12" r="6.4"/><path d="M9.2 5.8 9.6 2.6h4.8l.4 3.2"/><path d="M9.2 18.2l.4 3.2h4.8l.4-3.2"/><path d="M12 9.6V12l1.8 1.4"/>',
  tv: '<rect x="3.4" y="4.4" width="17.2" height="11.4" rx="2.2"/><path d="M8.6 20.4 12 15.8l3.4 4.6"/>',
  gamepad: '<path d="M8.4 8.4h7.2a5.6 5.6 0 0 1 5.5 4.6l.4 2.6a2.9 2.9 0 0 1-5.3 1.7l-.9-1.5H8.7L7.8 17.3a2.9 2.9 0 0 1-5.3-1.7l.4-2.6A5.6 5.6 0 0 1 8.4 8.4z"/><path d="M6.6 12h2.2"/><path d="M7.7 10.9v2.2"/><circle cx="16.4" cy="11.6" r=".95" fill="currentColor" stroke="none"/><circle cx="18.2" cy="13.4" r=".95" fill="currentColor" stroke="none"/>',
  homeDevice: '<path d="M4 10.6 12 4.4l8 6.2V20H4z"/><path d="M12 20v-5.2"/><circle cx="15.4" cy="12.4" r="1.4"/>',
  box: '<path d="M4.4 7.6 12 3.6l7.6 4v8.8L12 20.4 4.4 16.4z"/><path d="M4.4 7.6 12 11.6l7.6-4"/><path d="M12 11.6v8.8"/>',
  fuel: '<path d="M4.4 20.4V5.6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14.8"/><path d="M3 20.4h12"/><path d="M13.4 10.4h2.6a2 2 0 0 1 2 2v4a1.8 1.8 0 0 0 3.6 0v-5.2l-2.2-2.6"/><path d="M6.4 7.4h5"/>',
  briefcase: '<rect x="3.4" y="7.4" width="17.2" height="12.6" rx="2.2"/><path d="M8.6 7.4V5.6a2 2 0 0 1 2-2h2.8a2 2 0 0 1 2 2v1.8"/><path d="M3.4 12.6h17.2"/>',
  waves: '<path d="M3.4 8.4c3 0 3-2.4 6-2.4s3 2.4 6 2.4 3-2.4 6-2.4"/><path d="M3.4 14c3 0 3-2.4 6-2.4s3 2.4 6 2.4 3-2.4 6-2.4"/><path d="M3.4 19.6c3 0 3-2.4 6-2.4s3 2.4 6 2.4 3-2.4 6-2.4"/>',
  globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.6 12h16.8"/><path d="M12 3.4c2.4 2.4 3.6 5.4 3.6 8.6s-1.2 6.2-3.6 8.6c-2.4-2.4-3.6-5.4-3.6-8.6S9.6 5.8 12 3.4z"/>',
  alert: '<path d="M12 4.4 3.6 19.2h16.8z"/><path d="M12 9.4v4"/><circle cx="12" cy="16.4" r=".9" fill="currentColor" stroke="none"/>',
  sliders: '<path d="M4.4 7.4h9"/><path d="M17.2 7.4h2.4"/><circle cx="15.2" cy="7.4" r="2"/><path d="M4.4 16.6h2.4"/><path d="M10.6 16.6h9"/><circle cx="8.6" cy="16.6" r="2"/>',
  filter: '<path d="M3.6 5.4h16.8l-6.4 7.6v6.4l-4-2.2v-4.2z"/>',
  trophy: '<path d="M7.6 4.4h8.8v5a4.4 4.4 0 0 1-8.8 0z"/><path d="M7.6 6.2H5a2.6 2.6 0 0 0 2.6 4.6"/><path d="M16.4 6.2H19a2.6 2.6 0 0 1-2.6 4.6"/><path d="M12 13.8v3.6"/><path d="M8.6 20.4h6.8l-.8-3H9.4z"/>',
  file: '<path d="M13.4 3.4H7.2a2 2 0 0 0-2 2v13.2a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V8.6z"/><path d="M13.4 3.4v5.2h5.4"/>',
  wand: '<path d="m4.4 19.6 10.8-10.8"/><path d="m13.6 6.4 2.8 2.8"/><path d="M17.6 3.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/><path d="M6.4 3.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9L4 6l1.9-.7z"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.4 15.4 4.2 4.2"/>',
  /* ── v2: vehicles, live data and integrations ── */
  gauge: '<path d="M12 13.6 16.4 8"/><circle cx="12" cy="13.6" r="1.4" fill="currentColor" stroke="none"/><path d="M3.6 17.4a9.4 9.4 0 1 1 16.8 0"/>',
  engine: '<path d="M5.4 9.6h2.2V7.4h6v2.2h2.2l2 2h3v5h-3l-2 2H9.6a4 4 0 0 1-4-4z"/><path d="M9.6 5.2h4"/>',
  thermo: '<path d="M13.4 14.2V5.6a2.2 2.2 0 0 0-4.4 0v8.6a4 4 0 1 0 4.4 0z"/><path d="M11.2 9.4v5.6"/>',
  tyre: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="3.4"/><path d="M12 3.4v5.2"/><path d="M12 15.4v5.2"/><path d="M3.4 12h5.2"/><path d="M15.4 12h5.2"/>',
  battery: '<rect x="2.6" y="7.4" width="16" height="9.2" rx="2.2"/><path d="M21.4 11v2"/><path d="M5.6 10.2v3.6"/><path d="M9 10.2v3.6"/>',
  pin: '<path d="M12 21s6.4-6.1 6.4-10.6A6.4 6.4 0 0 0 5.6 10.4C5.6 14.9 12 21 12 21z"/><circle cx="12" cy="10.2" r="2.4"/>',
  cloud: '<path d="M7.4 18.4h9.2a3.8 3.8 0 0 0 .5-7.6 5.4 5.4 0 0 0-10.3-1.3 4.2 4.2 0 0 0 .6 8.9z"/><path d="M12 11.6v4"/><path d="M10.2 13.4 12 11.6l1.8 1.8"/>',
  star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.7l5.8-.8z"/>',
  bike: '<circle cx="5.6" cy="17.2" r="3.2"/><circle cx="18.4" cy="17.2" r="3.2"/><path d="M8.8 17.2h4.4l2.2-5.6"/><path d="M13.2 11.6 15 8.4h3.2"/><path d="M6.6 11.6h4.4l1.4 3.2"/><path d="M11 8.4h3.2"/>',
  wrench: '<path d="M14.6 6.4a4 4 0 0 0 5 5L21 13.6l-2.4 2.4-2.2-2.2a4 4 0 0 0-5-5z"/><path d="m14 10 -8 8a2 2 0 0 0 2.8 2.8l8-8"/>',
  plug: '<path d="M9.4 3.6v4.8"/><path d="M14.6 3.6v4.8"/><path d="M6.4 8.4h11.2v3.4a5.6 5.6 0 0 1-11.2 0z"/><path d="M12 17.4v3"/>',
  satellite: '<path d="m8.4 8.4 7.2 7.2"/><path d="M5.6 11.2 3.4 9a1.6 1.6 0 0 1 0-2.2l3.4-3.4a1.6 1.6 0 0 1 2.2 0l2.2 2.2z"/><path d="m12.8 5.6 5.6 5.6"/><path d="m14.6 17.8 2.2 2.2a1.6 1.6 0 0 0 2.2 0l3.4-3.4a1.6 1.6 0 0 0 0-2.2l-2.2-2.2"/><circle cx="5" cy="19" r="2.2"/>',
  power: '<path d="M12 3.6v8.2"/><path d="M6.8 6.6a7.4 7.4 0 1 0 10.4 0"/>',
  ping: '<circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M7.4 7.4a6.4 6.4 0 0 0 0 9.2"/><path d="M16.6 16.6a6.4 6.4 0 0 0 0-9.2"/><path d="M4.4 4.4a10.8 10.8 0 0 0 0 15.2"/><path d="M19.6 19.6a10.8 10.8 0 0 0 0-15.2"/>',
  chip: '<rect x="7.4" y="7.4" width="9.2" height="9.2" rx="1.8"/><path d="M10 3.6v3.8"/><path d="M14 3.6v3.8"/><path d="M10 16.6v3.8"/><path d="M14 16.6v3.8"/><path d="M3.6 10h3.8"/><path d="M3.6 14h3.8"/><path d="M16.6 10h3.8"/><path d="M16.6 14h3.8"/>',
  history: '<path d="M3.6 12a8.4 8.4 0 1 0 2.5-6"/><path d="M3.6 4.6V10h5.4"/><path d="M12 8.4V12l2.8 1.8"/>',
  note: '<path d="M5.4 4.4h9.2l4.4 4.4v10a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8V6.2A1.8 1.8 0 0 1 5.4 4.4z"/><path d="M14.4 4.4V9h4.6"/><path d="M7.6 13h8"/><path d="M7.6 16.6h5"/>',
  fuelPump: '<path d="M4.4 20.4V5.6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14.8"/><path d="M3 20.4h12"/><path d="M13.4 10.4h2.6a2 2 0 0 1 2 2v4a1.8 1.8 0 0 0 3.6 0v-5.2l-2.2-2.6"/><path d="M6.4 7.4h5"/>'
};
function icon(name, size = 20, cls = "") {
  const p = ICON_PATHS[name] || ICON_PATHS.info;
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="' + cls + '" aria-hidden="true" focusable="false">' + p + "</svg>";
}

