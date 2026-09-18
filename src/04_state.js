/* ============================================================
   CATEGORIES
   ============================================================ */
/* ── Device categories (exactly the supported set) ──
   "car" and "smart" are kept renderable so data saved by older versions of
   the hub still displays correctly, but they are no longer offered as new
   device categories: vehicles now live in their own dedicated section. */
const CATEGORIES = [
  { id: "phone",     label: "Phone",         emoji: "📱", icon: "phone" },
  { id: "pc",        label: "PC",            emoji: "💻", icon: "monitor" },
  { id: "laptop",    label: "Laptop",        emoji: "💻", icon: "laptop" },
  { id: "headphones",label: "Headphones",    emoji: "🎧", icon: "headphones" },
  { id: "speaker",   label: "Speaker",       emoji: "🔊", icon: "speaker" },
  { id: "watch",     label: "Smartwatch",    emoji: "⌚", icon: "watch" },
  { id: "tv",        label: "TV",            emoji: "📺", icon: "tv" },
  { id: "gaming",    label: "Gaming Device", emoji: "🎮", icon: "gamepad" },
  { id: "other",     label: "Other",         emoji: "📦", icon: "box" }
];
const LEGACY_CATEGORIES = [
  { id: "car",   label: "Car (legacy profile)",  emoji: "🚗", icon: "car", legacy: true },
  { id: "smart", label: "Smart Device (legacy)", emoji: "🏠", icon: "homeDevice", legacy: true }
];
const catOf = id => CATEGORIES.find(c => c.id === id) || LEGACY_CATEGORIES.find(c => c.id === id)
  || CATEGORIES[CATEGORIES.length - 1];

/* ── Connection types ── */
const CONN_TYPES = [
  { id: "bluetooth", label: "Bluetooth" },
  { id: "wifi",      label: "Wi-Fi" },
  { id: "other",     label: "Other" }
];
const LEGACY_CONN_LABELS = { usb: "USB / Cable", cellular: "Cellular", none: "No wireless", unknown: "Other" };
const connLabel = id => (CONN_TYPES.find(c => c.id === id) || { label: LEGACY_CONN_LABELS[id] || "Other" }).label;

/* ── Vehicles: only two types, unlimited records ── */
const VEHICLE_TYPES = [
  { id: "car",  label: "Car",  singular: "Car",  emoji: "🚗", icon: "car",  fuel: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid", "LPG", "Other"] },
  { id: "bike", label: "Bike", singular: "Bike", emoji: "🏍️", icon: "bike", fuel: ["Petrol", "Electric", "Other"] }
];
const vehType = id => VEHICLE_TYPES.find(v => v.id === id) || VEHICLE_TYPES[0];
const fuelOptions = typeId => (vehType(typeId).fuel || []).slice();

const SERVICE_CATALOG = [
  { id: "engine-oil",   label: "Engine oil & filter",  interval: "every 10,000 km", types: ["car", "bike"] },
  { id: "air-filter",   label: "Air filter",           interval: "every 15,000 km", types: ["car", "bike"] },
  { id: "brake-pads",   label: "Brake pads",           interval: "every 25,000 km", types: ["car", "bike"] },
  { id: "tyres",        label: "Tyre rotation",        interval: "every 8,000 km",  types: ["car"] },
  { id: "chain",        label: "Chain lube & tension", interval: "every 800 km",    types: ["bike"] },
  { id: "battery",      label: "Battery check",        interval: "every 6 months",  types: ["car", "bike"] },
  { id: "coolant",      label: "Coolant / fluids",     interval: "every 20,000 km", types: ["car"] },
  { id: "ac-service",   label: "AC service",           interval: "every 12 months", types: ["car"] },
  { id: "insurance",    label: "Insurance renewal",    interval: "yearly",          types: ["car", "bike"] },
  { id: "puc",          label: "PUC / emission test",  interval: "every 6 months",  types: ["car", "bike"] },
  { id: "custom",       label: "Custom reminder",      interval: "you decide",      types: ["car", "bike"] }
];
const serviceLabel = id => (SERVICE_CATALOG.find(x => x.id === id) || { label: "Service" }).label;
const catalogFor = typeId => SERVICE_CATALOG.filter(x => x.types.indexOf(typeId) > -1);

/* ── Live vehicle data fields ──
   Each field is listed on every vehicle dashboard, but its value is only ever
   rendered when a supported integration has actually delivered one. */
const VEHICLE_FIELDS = [
  { id: "speed",    label: "Speed",              unit: "km/h", icon: "gauge",   group: "fast",
    reason: "No integration connected", obd: "OBD-II PID 0x0D" },
  { id: "rpm",      label: "RPM",                unit: "rpm",  icon: "engine",  group: "fast",
    reason: "No integration connected", obd: "OBD-II PID 0x0C (engine RPM)" },
  { id: "fuel",     label: "Fuel / Battery",     unit: "%",    icon: "fuel",    group: "slow",
    reason: "No integration connected", obd: "OBD-II PID 0x2F (fuel level)" },
  { id: "engine",   label: "Engine status",      unit: "",     icon: "engine",  group: "fast",
    reason: "No integration connected", obd: "Derived from live RPM (0x0C) + MIL status (0x01)" },
  { id: "odometer", label: "Odometer",           unit: "km",   icon: "target",  group: "slow",
    reason: "No integration connected", obd: "OBD-II PID 0x31 (distance since codes cleared)" },
  { id: "coolant",  label: "Engine temperature", unit: "°C",   icon: "thermo",  group: "fast",
    reason: "No integration connected", obd: "OBD-II PID 0x05 (coolant temperature)" },
  { id: "tyres",    label: "Tyre pressure",      unit: "bar",  icon: "tyre",    group: "slow",
    reason: "Not part of standard OBD-II", obd: "Needs a manufacturer-specific UDS PID or a telematics endpoint" },
  { id: "location", label: "Location",           unit: "",     icon: "pin",     group: "slow",
    reason: "No location source enabled", obd: "Host-device GPS (only when you switch it on) or a telematics endpoint" },
  { id: "voltage",  label: "Battery voltage",    unit: "V",    icon: "battery", group: "fast",
    reason: "No integration connected", obd: "OBD-II PID 0x42 (control module voltage)" }
];
/* ============================================================
   VEHICLE CONNECTION STATES
   The five states the dashboard may display. Each one is derived
   from a real integration state — never a decorative label:
     not_connected → nothing is linked
     waiting       → an integration is linked but no values arrived yet
     live          → values actually received and still fresh
     lost          → a linked integration stopped answering
     unsupported   → this runtime has no way to reach a vehicle at all
   ============================================================ */
const CONN_STATES = {
  not_connected: {
    id: "not_connected", label: "NOT CONNECTED", dot: true, kind: "",
    short: "Not connected",
    message: "No live vehicle data is currently available."
  },
  waiting: {
    id: "waiting", label: "CONNECTED — WAITING FOR VEHICLE DATA", dot: true, kind: "accent",
    short: "Waiting for data",
    message: "The integration is linked. Nothing has been reported yet — values appear the moment the vehicle sends them."
  },
  live: {
    id: "live", label: "RECEIVING LIVE DATA", dot: true, kind: "ok",
    short: "Receiving live data",
    message: "Real values are arriving from the connected integration."
  },
  lost: {
    id: "lost", label: "CONNECTION LOST", dot: true, kind: "bad",
    short: "Connection lost",
    message: "The integration stopped answering. Reconnect it to resume live data."
  },
  unsupported: {
    id: "unsupported", label: "UNSUPPORTED", dot: false, kind: "warn",
    short: "Unsupported",
    message: "Vehicle integration is not available in this version. Vehicle profile and reminders are still available."
  }
};
const CONN_ORDER = ["not_connected", "waiting", "live", "lost", "unsupported"];

/* Resolves the state to display for a vehicle. Reads stored connection data,
   the live session's freshness and this runtime's real capabilities. */
function vehicleConnState(v) {
  const raw = (v && v.connection && v.connection.status) || "not_connected";
  if (raw === "lost") return CONN_STATES.lost;
  const fresh = (typeof VehicleLive !== "undefined" && VehicleLive.freshCount) ? VehicleLive.freshCount(v.id) : 0;
  /* Real, still-fresh readings are the strongest evidence there is: if data
     is arriving, the honest state is RECEIVING LIVE DATA whatever a stored
     flag says. */
  if (fresh > 0) return CONN_STATES.live;
  if (raw === "connected" || raw === "partial") return CONN_STATES.waiting;
  /* Nothing linked: the honest verdict depends on whether this runtime has
     any usable method at all — "not connected" when it does, "unsupported"
     when the browser genuinely cannot reach a vehicle. */
  const anyWay = (typeof Integrations !== "undefined" && Integrations.anyMethodAvailable) ? Integrations.anyMethodAvailable() : false;
  if (raw === "unsupported" || raw === "unavailable" || raw === "not_connected") {
    return anyWay ? CONN_STATES.not_connected : CONN_STATES.unsupported;
  }
  return CONN_STATES.not_connected;
}

const fieldDef = id => VEHICLE_FIELDS.find(f => f.id === id) || { id, label: id, unit: "", icon: "info" };
const FIELD_ORDER = VEHICLE_FIELDS.map(f => f.id);

/* Freshness windows — a value stops being called live once it goes stale. */
const FRESH_MS = { speed: 6000, rpm: 6000, engine: 6000, coolant: 12000, voltage: 12000, fuel: 60000, odometer: 120000, tyres: 120000, location: 60000 };

/* ============================================================
   STORE — everything user-created is persisted in localStorage
   ============================================================ */
const STORE_KEY = "mydevicehub.v1";

// Status is NEVER assumed. "none" = saved profile only, no live connection.
const USER_STATUS = { none: "Saved profile", connected: "Connected", disconnected: "Disconnected", unknown: "Unknown" };

const ACTIVITY_ACTIONS = {
  device_add:          { l: "Device added",            d: "You added a device profile to the hub.",                 k: "add"  },
  device_edit:         { l: "Device edited",           d: "You updated a saved device profile.",                    k: "edit" },
  device_delete:       { l: "Device deleted",          d: "You removed a device profile from the hub.",             k: "del"  },
  device_connect:      { l: "Connection opened",       d: "A real connection was established via the browser API.",  k: "live" },
  device_disconnect:   { l: "Disconnection detected",  d: "A live device link ended or was closed by you.",          k: "warn" },
  device_linked:       { l: "Live device linked",      d: "A real device was tied to this saved profile.",           k: "add"  },
  device_import:       { l: "Device imported",         d: "A device profile was restored from a backup.",            k: "add"  },
  vehicle_add:         { l: "Vehicle added",           d: "You created a vehicle profile.",                         k: "add"  },
  vehicle_edit:        { l: "Vehicle updated",         d: "You edited a vehicle profile.",                           k: "edit" },
  vehicle_delete:      { l: "Vehicle deleted",         d: "You removed a vehicle profile from the hub.",            k: "del"  },
  vehicle_connect:     { l: "Vehicle connected",       d: "A real vehicle integration started reporting data.",      k: "live" },
  vehicle_disconnect:  { l: "Vehicle disconnected",    d: "A vehicle integration stopped reporting data.",           k: "warn" },
  vehicle_primary:     { l: "Primary vehicle changed", d: "The primary vehicle shown on Home was changed.",          k: "edit" },
  service_add:         { l: "Service reminder created",d: "You added a service or document reminder.",              k: "add"  },
  service_done:        { l: "Service completed",       d: "A service item was marked as done.",                      k: "add"  },
  service_due:         { l: "Service reminder due",    d: "A maintenance or document reminder became due.",          k: "warn" },
  integration_connect: { l: "Integration connected",   d: "A supported vehicle adapter was connected.",              k: "live" },
  integration_fail:    { l: "Integration failed",      d: "A vehicle adapter could not deliver data.",               k: "warn" },
  integration_config:  { l: "Integration configured",  d: "Vehicle adapter settings were changed.",                  k: "edit" },
  live_sample:         { l: "Live data received",      d: "Real values arrived from a connected vehicle adapter.",   k: "live" },
  task_add:            { l: "Task created",            d: "You added a task.",                                        k: "add"  },
  task_edit:           { l: "Task edited",             d: "You updated a task.",                                      k: "edit" },
  task_done:           { l: "Task completed",          d: "You completed a task.",                                    k: "add"  },
  task_reopen:         { l: "Task reopened",           d: "A completed task was moved back to pending.",              k: "edit" },
  task_delete:         { l: "Task deleted",            d: "You deleted a task.",                                      k: "del"  },
  focus_start:         { l: "Focus session started",   d: "A focus timer was started.",                               k: "live" },
  focus_complete:      { l: "Focus session completed", d: "A focus session finished and time was credited.",          k: "add"  },
  focus_cancel:        { l: "Focus session cancelled", d: "A focus session was stopped before the target time.",      k: "warn" },
  mystery_solve:       { l: "Mystery case solved",     d: "You closed a case and earned XP.",                         k: "add"  },
  mystery_answer:      { l: "Mystery answer submitted",d: "A quiz answer was submitted for a case.",                  k: "edit" },
  mystery_reset:       { l: "Mystery progress reset",  d: "Case progress was cleared.",                               k: "del"  },
  settings_change:     { l: "Settings changed",        d: "App preferences were updated.",                            k: "edit" },
  data_clear:          { l: "All data cleared",        d: "The hub was reset to an empty state.",                     k: "del"  },
  data_import:         { l: "Data imported",           d: "A backup file was restored into the hub.",                 k: "add"  },
  security_notice:     { l: "Security notice",         d: "A blocked link was prevented from loading.",               k: "warn" }
};

function defaultState() {
  return {
    version: 2,
    createdAt: nowIso(),
    devices: [],
    vehicles: [],
    primaryVehicleId: null,
    tasks: [],
    focus: { sessions: [], totalSeconds: 0, config: { minutes: 25, breakMinutes: 5 } },
    mystery: { xp: 0, progress: {} },
    activity: [],
    settings: {
      accent: "cyan",
      background: "navy",
      glow: "soft",
      motion: true,
      fontScale: 1,
      reduceEffects: false,
      notify: { toasts: true, focus: true, reminders: true, mystery: false },
      prefs: {
        showSavedBadge: true, defaultConn: "bluetooth", confirmDelete: true, imageMaxKb: 512,
        dailyFocusGoal: 120, defaultVehicleType: "car", keepLiveSnapshot: true, livePollSeconds: 2
      },
      autoScanBluetooth: false,
      autoScanNetwork: false,
      density: "comfortable"
    },
    meta: { lastBackupAt: null, lastImportAt: null, lastOpenAt: nowIso(), migratedFrom: null, seenIntro: false }
  };
}

const Store = {
  data: defaultState(),
  available: true,
  externalConflict: false,
  _persistTimer: null,

  load() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORE_KEY);
      localStorage.setItem(STORE_KEY + ".probe", "1");
      localStorage.removeItem(STORE_KEY + ".probe");
    } catch (e) {
      this.available = false;
      console.warn("[My Device Hub] localStorage is unavailable; data will live in memory only.", e);
      return;
    }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      this.data = this.migrate(parsed);
    } catch (e) {
      console.warn("[My Device Hub] Saved data could not be parsed; starting from a clean state.", e);
      this.data = defaultState();
      this.persist();
    }
  },

  /* Upgrades an older save in place. Nothing the user created is discarded:
     the single v1 car profile becomes the first vehicle, and legacy device
     categories/connection types keep their original label for display. */
  migrate(p) {
    const base = defaultState();
    if (!p || typeof p !== "object") return base;
    /* Copy into a fresh object and merge every nested group against the pristine
       defaults, so an older save that is missing a whole settings/notify/prefs
       block still ends up complete instead of overwriting the defaults. */
    const d = Object.assign({}, base, p);
    const def = base;                       /* untouched defaults, never mutated */
    d.settings = Object.assign({}, def.settings, p.settings || {});
    d.settings.notify = Object.assign({}, def.settings.notify, (p.settings && p.settings.notify) || {});
    d.settings.prefs  = Object.assign({}, def.settings.prefs,  (p.settings && p.settings.prefs)  || {});
    d.focus = Object.assign({}, def.focus, p.focus || {});
    d.focus.config = Object.assign({}, def.focus.config, (p.focus && p.focus.config) || {});
    d.mystery = Object.assign({}, def.mystery, p.mystery || {});
    d.mystery.progress = (d.mystery.progress && typeof d.mystery.progress === "object") ? d.mystery.progress : {};
    d.meta = Object.assign({}, def.meta, p.meta || {});
    d.devices = Array.isArray(d.devices) ? d.devices : [];
    d.tasks = Array.isArray(d.tasks) ? d.tasks : [];
    d.activity = Array.isArray(d.activity) ? d.activity : [];
    d.focus.sessions = Array.isArray(d.focus.sessions) ? d.focus.sessions : [];
    d.vehicles = Array.isArray(d.vehicles) ? d.vehicles : [];
    if (!Array.isArray(d.devices)) d.devices = [];

    /* ── v1 → v2 ── */
    if (!d.version || d.version < 2) {
      d.devices.forEach(dev => {
        if (dev.category === "car" || dev.category === "smart") { dev.legacyCategory = dev.category; dev.category = "other"; }
        if (["usb", "cellular", "none", "unknown"].indexOf(dev.connection) > -1) { dev.legacyConnection = dev.connection; dev.connection = "other"; }
        if (!dev.live) dev.live = { linkedName: null, linkedAt: null, lastConnectedAt: null, lastDisconnectedAt: null, lastError: null, gattServices: null };
      });
      const oldCar = p.car;
      if (oldCar && typeof oldCar === "object") {
        d.vehicles.push(this.normalizeVehicle({
          id: oldCar.id && oldCar.id !== "car_primary" ? oldCar.id : uid("veh"),
          type: "car",
          nickname: oldCar.nickname || "My Car",
          brand: oldCar.brand || "", model: oldCar.model || "", year: oldCar.year || "",
          fuel: oldCar.fuel || "Petrol", photo: oldCar.photo || null,
          plate: oldCar.plate || "", color: oldCar.color || "", vin: oldCar.vin || "",
          odometerKm: oldCar.odometerKm == null ? null : oldCar.odometerKm,
          notes: oldCar.notes || "",
          serviceReminders: oldCar.serviceReminders || [], insurance: oldCar.insurance || null,
          importantDates: oldCar.importantDates || [],
          history: Array.isArray(oldCar.history) ? oldCar.history : [],
          createdAt: oldCar.createdAt || nowIso(), updatedAt: oldCar.updatedAt || nowIso()
        }));
        d.primaryVehicleId = d.vehicles[0].id;
      }
      /* try to link the migrated profile to the built-in database */
      if (d.vehicles[0]) {
        const mig = VehicleDB.match(d.vehicles[0].brand, d.vehicles[0].model, d.vehicles[0].year, "car");
        if (mig) {
          const keep = d.vehicles[0];
          this.attachSpec(keep.id, mig);
          d.vehicles[0] = this.getVehicle(keep.id) || keep;
        }
      }
      delete d.car;
      d.version = 2;
      d.meta.migratedFrom = "v1";
    }

    /* ── repair / normalise ── */
    d.vehicles = d.vehicles.map(v => this.normalizeVehicle(v));
    if (d.primaryVehicleId && !d.vehicles.some(v => v.id === d.primaryVehicleId)) d.primaryVehicleId = null;
    if (!d.primaryVehicleId && d.vehicles.length) d.primaryVehicleId = d.vehicles[0].id;
    return d;
  },

  normalizeVehicle(v) {
    const out = Object.assign({
      id: uid("veh"), type: "car", nickname: "My Vehicle", brand: "", model: "", year: "",
      fuel: "Petrol", photo: null, plate: "", color: "", vin: "", odometerKm: null, notes: "",
      serviceReminders: [], insurance: null, importantDates: [], history: [],
      createdAt: nowIso(), updatedAt: nowIso(),
      connection: { status: "not_connected", adapterId: null, adapterName: null, since: null, lastConnectedAt: null, lastDisconnectedAt: null, lastError: null, lastLostAt: null },
      integration: { activeAdapterId: null, config: {} },
      live: null,
      odometerSource: "user",
      spec: null
    }, v || {});
    if (out.type !== "car" && out.type !== "bike") out.type = "car";
    out.connection = Object.assign({ status: "not_connected", adapterId: null, adapterName: null, since: null, lastConnectedAt: null, lastDisconnectedAt: null, lastError: null, lastLostAt: null }, out.connection || {});
    out.integration = Object.assign({ activeAdapterId: null, config: {} }, out.integration || {});
    out.integration.config = out.integration.config || {};
    const legacyStatus = { unavailable: "unsupported", disconnected: "not_connected" };
    if (legacyStatus[out.connection.status]) out.connection.status = legacyStatus[out.connection.status];
    out.serviceReminders = Array.isArray(out.serviceReminders) ? out.serviceReminders : [];
    out.history = Array.isArray(out.history) ? out.history : [];
    out.importantDates = Array.isArray(out.importantDates) ? out.importantDates : [];
    return out;
  },

  persist() {
    if (!this.available) return false;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
      this.externalConflict = false;
      return true;
    } catch (e) {
      this.externalConflict = true;
      console.warn("[My Device Hub] Could not save.", e);
      if (window.UI) UI.toast("Storage full or blocked", "Free up space in data management, or export a backup.", "warn");
      return false;
    }
  },
  persistSoon() {
    clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => this.persist(), 250);
  },

  /* -------- activity log (real user/system events only) -------- */
  log(action, detail, entity) {
    const a = ACTIVITY_ACTIONS[action] || { l: action, d: "", k: "" };
    this.data.activity.unshift({
      id: uid("act"), ts: nowIso(), action,
      label: a.l, detail: detail || a.d, kind: a.k,
      entity: entity ? { type: entity.type, id: entity.id, name: entity.name } : null
    });
    if (this.data.activity.length > 600) this.data.activity.length = 600;
    this.persist();
  },

  /* -------- devices -------- */
  addDevice(dev) {
    const d = Object.assign({
      id: uid("dev"), name: "Untitled device", brand: "", model: "", category: "other",
      image: null, connection: "unknown", status: "none",
      notes: "", serial: "", createdAt: nowIso(), updatedAt: nowIso(),
      lastSeen: null, btDeviceId: null, btDeviceName: null,
      live: { linkedName: null, linkedAt: null, lastConnectedAt: null, lastDisconnectedAt: null, lastError: null, gattServices: null }
    }, dev);
    this.data.devices.unshift(d);
    this.log("device_add", "Added “" + d.name + "” to the hub as a " + catOf(d.category).label.toLowerCase() + " profile (saved only, not connected).", { type: "device", id: d.id, name: d.name });
    this.persist();
    return d;
  },
  getDevice(id) { return this.data.devices.find(d => d.id === id) || null; },
  updateDevice(id, patch) {
    const d = this.getDevice(id);
    if (!d) return null;
    Object.assign(d, patch, { updatedAt: nowIso() });
    this.log("device_edit", "Updated the profile for “" + d.name + "”.", { type: "device", id: d.id, name: d.name });
    this.persist();
    return d;
  },
  deleteDevice(id) {
    const d = this.getDevice(id);
    if (!d) return;
    this.data.devices = this.data.devices.filter(x => x.id !== id);
    this.log("device_delete", "Deleted “" + d.name + "” from the hub.", { type: "device", id: d.id, name: d.name });
    this.persist();
  },
  setDeviceStatus(id, status, extra) {
    const d = this.getDevice(id);
    if (!d) return;
    d.status = status;
    d.updatedAt = nowIso();
    if (status === "connected") d.lastSeen = nowIso();
    if (extra && extra.live) d.live = Object.assign({}, d.live, extra.live);
    if (extra && extra.log) this.log(extra.log.action, extra.log.detail, { type: "device", id: d.id, name: d.name });
    this.persist();
  },

  /* -------- vehicles (unlimited cars and bikes) -------- */
  getVehicle(id) { return this.data.vehicles.find(v => v.id === id) || null; },
  vehicleCount() { return this.data.vehicles.length; },
  primaryVehicle() {
    const v = this.getVehicle(this.data.primaryVehicleId);
    return v || this.data.vehicles[0] || null;
  },
  vehiclesOfType(type) { return this.data.vehicles.filter(v => v.type === type); },

  addVehicle(input) {
    const v = this.normalizeVehicle(Object.assign({}, input, { createdAt: nowIso(), updatedAt: nowIso() }));
    this.data.vehicles.unshift(v);
    if (!this.data.primaryVehicleId) {
      this.data.primaryVehicleId = v.id;
      this.log("vehicle_primary", "“" + v.nickname + "” became your primary vehicle because it was the first one added.", { type: "vehicle", id: v.id, name: v.nickname });
    }
    this.log("vehicle_add", "Added the " + vehType(v.type).singular.toLowerCase() + " “" + v.nickname + "”" +
      ([v.brand, v.model].filter(Boolean).length ? " (" + [v.brand, v.model, v.year].filter(Boolean).join(" ") + ")" : "") +
      " as a profile. No telemetry is read until you connect a real integration.", { type: "vehicle", id: v.id, name: v.nickname });
    this.persist();
    return v;
  },

  updateVehicle(id, patch, logIt) {
    const v = this.getVehicle(id);
    if (!v) return null;
    const merged = this.normalizeVehicle(Object.assign({}, v, patch, { updatedAt: nowIso() }));
    merged.id = v.id;
    merged.createdAt = v.createdAt;
    merged.connection = v.connection;
    merged.integration = Object.assign({}, v.integration, patch && patch.integration ? patch.integration : {});
    const i = this.data.vehicles.indexOf(v);
    this.data.vehicles[i] = merged;
    if (logIt !== false) {
      this.log("vehicle_edit", "Updated the profile for “" + merged.nickname + "”.", { type: "vehicle", id: merged.id, name: merged.nickname });
      this.persist();
    }
    return merged;
  },

  deleteVehicle(id) {
    const v = this.getVehicle(id);
    if (!v) return;
    this.data.vehicles = this.data.vehicles.filter(x => x.id !== id);
    if (this.data.primaryVehicleId === id) {
      this.data.primaryVehicleId = this.data.vehicles.length ? this.data.vehicles[0].id : null;
      if (this.data.primaryVehicleId) {
        const nx = this.getVehicle(this.data.primaryVehicleId);
        this.log("vehicle_primary", "“" + nx.nickname + "” became the primary vehicle after a deletion.", { type: "vehicle", id: nx.id, name: nx.nickname });
      }
    }
    this.log("vehicle_delete", "Deleted the vehicle profile “" + v.nickname + "”.", { type: "vehicle", id: v.id, name: v.nickname });
    this.persist();
  },

  setPrimaryVehicle(id) {
    const v = this.getVehicle(id);
    if (!v) return;
    this.data.primaryVehicleId = id;
    this.log("vehicle_primary", "“" + v.nickname + "” is now your primary vehicle and appears on Home.", { type: "vehicle", id: v.id, name: v.nickname });
    this.persist();
  },

  setVehicleConnection(id, status, patch, logAction, logDetail) {
    const v = this.getVehicle(id);
    if (!v) return;
    v.connection = Object.assign({}, v.connection, patch || {}, { status });
    if (status === "connected" || status === "partial") { v.connection.since = nowIso(); v.connection.lastConnectedAt = nowIso(); v.connection.lastError = null; v.connection.lastLostAt = null; }
    if (status === "lost") v.connection.lastLostAt = nowIso();
    if (status === "not_connected" || status === "unsupported") v.connection.lastDisconnectedAt = nowIso();
    v.updatedAt = nowIso();
    if (logAction) this.log(logAction, logDetail || "", { type: "vehicle", id: v.id, name: v.nickname });
    this.persist();
  },

  setVehicleIntegration(id, adapterId, config) {
    const v = this.getVehicle(id);
    if (!v) return;
    v.integration = v.integration || { activeAdapterId: null, config: {} };
    if (adapterId !== undefined) v.integration.activeAdapterId = adapterId;
    if (config) v.integration.config = Object.assign({}, v.integration.config, config);
    if (adapterId === null) v.connection = Object.assign({}, v.connection, { status: "unavailable", adapterId: null, adapterName: null });
    v.updatedAt = nowIso();
    this.persist();
  },

  /* live data snapshots are kept so a dashboard still shows the last real
     reading (clearly timestamped) after a reload — never a fabricated one */
  saveVehicleSnapshot(id, snapshot) {
    const v = this.getVehicle(id);
    if (!v) return;
    v.live = snapshot;
    this.persistSoon();
  },
  clearVehicleLive(id) {
    const v = this.getVehicle(id);
    if (!v) return;
    v.live = null;
    this.persist();
  },

  /* -------- vehicle information (built-in database) -------- */

  /* Attaches a database entry to a profile. Only the fields the entry really
     documents are copied across; anything it does not list stays absent so
     the UI can say "Information unavailable" instead of inventing it. */
  attachSpec(id, sel) {
    const v = this.getVehicle(id);
    if (!v || !sel) return null;
    const entry = VehicleDB.entry(sel.brandId, sel.modelId, sel.variantIndex || 0);
    if (!entry) return null;
    const year = sel.year || (entry.model.to || new Date().getFullYear());
    const info = VehicleDB.infoRows(entry, year);
    const val = label => { const r = info.rows.find(x => x.label === label); return r && r.known ? r.value : null; };
    v.spec = {
      source: "builtin",
      dbId: entry.brand.id + "/" + entry.model.id + "/" + (sel.variantIndex || 0),
      brandId: entry.brand.id, modelId: entry.model.id, variantIndex: sel.variantIndex || 0,
      brand: entry.brand.name, model: entry.model.name, gen: entry.model.gen || null,
      variant: entry.variant.name, year,
      body: entry.model.body || null,
      fields: {
        fuel: entry.variant.fuel || null,
        engineCc: entry.variant.cc || null,
        engine: entry.variant.engine || null,
        transmission: entry.variant.trans || null,
        power: entry.variant.power || null,
        torque: entry.variant.torque || null,
        seats: entry.variant.seats || null,
        dimensions: entry.variant.dims || null,
        extras: entry.variant.extra || []
      },
      note: entry.model.note || null,
      attachedAt: nowIso()
    };
    /* keep the profile's own identity fields in step with the database entry */
    v.brand = entry.brand.name;
    v.model = entry.model.name + (entry.model.gen ? " " + entry.model.gen : "");
    v.year = String(year);
    if (entry.variant.fuel) v.fuel = entry.variant.fuel;
    v.updatedAt = nowIso();
    this.persist();
    return v.spec;
  },

  detachSpec(id) {
    const v = this.getVehicle(id);
    if (!v) return false;
    v.spec = null;
    v.updatedAt = nowIso();
    this.persist();
    return true;
  },

  /* The rows the dashboard shows. A missing value is reported as missing. */
  specInfo(v) {
    if (!v) return null;
    if (!v.spec) {
      return { linked: false, rows: [
        ["Brand", v.brand || null], ["Model", v.model || null], ["Variant", null],
        ["Model year", v.year || null], ["Fuel type", v.fuel || null],
        ["Engine capacity", null], ["Engine", null], ["Transmission", null],
        ["Power", null], ["Torque", null], ["Seating capacity", null],
        ["Dimensions (L × W × H)", null], ["Image", null]
      ].map(r => ({ label: r[0], value: r[1] || "Information unavailable", known: !!r[1] })), extras: [], missing: "Information unavailable" };
    }
    const entry = VehicleDB.entry(v.spec.brandId, v.spec.modelId, v.spec.variantIndex);
    const info = VehicleDB.infoRows(entry, v.spec.year);
    return Object.assign({ linked: true, spec: v.spec }, info);
  },

  /* -------- vehicle service: reminders, insurance, history -------- */
  addServiceReminder(vehicleId, rem) {
    const v = this.getVehicle(vehicleId);
    if (!v) return null;
    const item = Object.assign({ id: uid("rem"), type: "custom", label: "", dueDate: "", dueKm: null, notes: "",
      done: false, doneAt: null, doneKm: null, createdAt: nowIso() }, rem);
    v.serviceReminders.push(item);
    v.updatedAt = nowIso();
    this.log("service_add", "Added the reminder “" + (item.label || serviceLabel(item.type)) + "” to “" + v.nickname + "”" +
      (item.dueDate ? " for " + fmtDate(item.dueDate) : "") + (item.dueKm ? " at " + item.dueKm + " km" : "") + ".",
      { type: "vehicle", id: v.id, name: v.nickname });
    this.persist();
    return item;
  },
  completeServiceReminder(vehicleId, reminderId, extra) {
    const v = this.getVehicle(vehicleId);
    if (!v) return null;
    const r = v.serviceReminders.find(x => x.id === reminderId);
    if (!r) return null;
    r.done = true; r.doneAt = nowIso();
    r.doneKm = (extra && extra.km != null) ? extra.km : (v.odometerKm || null);
    if (extra && extra.notes) r.notes = extra.notes;
    const entry = Object.assign({
      id: uid("hist"), reminderId: r.id, label: r.label || serviceLabel(r.type), type: r.type,
      date: r.doneAt, km: r.doneKm, notes: r.notes || "", cost: extra && extra.cost ? extra.cost : null
    });
    v.history.unshift(entry);
    v.updatedAt = nowIso();
    this.log("service_done", "Completed “" + entry.label + "” on “" + v.nickname + "”" + (entry.km ? " at " + nfmt(entry.km) + " km" : "") + ".",
      { type: "vehicle", id: v.id, name: v.nickname });
    this.persist();
    return entry;
  },
  addHistoryEntry(vehicleId, entry) {
    const v = this.getVehicle(vehicleId);
    if (!v) return null;
    const e = Object.assign({ id: uid("hist"), label: "Service", date: nowIso(), km: null, notes: "", cost: null, type: "custom" }, entry);
    v.history.unshift(e);
    v.updatedAt = nowIso();
    this.log("service_done", "Logged “" + e.label + "” in the service history of “" + v.nickname + "”.", { type: "vehicle", id: v.id, name: v.nickname });
    this.persist();
    return e;
  },
  deleteReminder(vehicleId, reminderId) {
    const v = this.getVehicle(vehicleId);
    if (!v) return;
    const r = v.serviceReminders.find(x => x.id === reminderId);
    v.serviceReminders = v.serviceReminders.filter(x => x.id !== reminderId);
    this.log("vehicle_edit", "Removed the reminder “" + ((r && (r.label || serviceLabel(r.type))) || "item") + "” from “" + v.nickname + "”.", { type: "vehicle", id: v.id, name: v.nickname });
    this.persist();
  },
  setInsurance(vehicleId, insurance) {
    const v = this.getVehicle(vehicleId);
    if (!v) return;
    v.insurance = insurance;
    v.updatedAt = nowIso();
    const d = insurance && insurance.expiresOn ? daysUntil(insurance.expiresOn) : null;
    this.log("vehicle_edit", "Updated insurance details for “" + v.nickname + "”" +
      (insurance && insurance.expiresOn ? "; policy expires " + fmtDate(insurance.expiresOn) + (d != null ? " (" + (d < 0 ? Math.abs(d) + " days ago" : "in " + d + " days") + ")" : "") : "") + ".",
      { type: "vehicle", id: v.id, name: v.nickname });
    this.persist();
  },
  vehicleReminders(vehicleId) { const v = this.getVehicle(vehicleId); return v ? v.serviceReminders : []; },

  /* -------- tasks -------- */
  addTask(t) {
    const task = Object.assign({
      id: uid("task"), title: "Untitled task", notes: "", priority: "medium",
      due: "", done: false, createdAt: nowIso(), completedAt: null, deviceId: null
    }, t);
    this.data.tasks.unshift(task);
    this.log("task_add", "Added “" + task.title + "” with " + task.priority + " priority.", { type: "task", id: task.id, name: task.title });
    this.persist();
    return task;
  },
  getTask(id) { return this.data.tasks.find(t => t.id === id) || null; },
  updateTask(id, patch) {
    const t = this.getTask(id);
    if (!t) return null;
    Object.assign(t, patch);
    if (patch.done === true && !t.completedAt) { t.completedAt = nowIso(); t.done = true; this.log("task_done", "Completed “" + t.title + "”.", { type: "task", id: t.id, name: t.title }); }
    else if (patch.done === false) { t.completedAt = null; this.log("task_reopen", "Reopened “" + t.title + "”.", { type: "task", id: t.id, name: t.title }); }
    else this.log("task_edit", "Updated the task “" + t.title + "”.", { type: "task", id: t.id, name: t.title });
    this.persist();
    return t;
  },
  deleteTask(id) {
    const t = this.getTask(id);
    if (!t) return;
    this.data.tasks = this.data.tasks.filter(x => x.id !== id);
    this.log("task_delete", "Deleted the task “" + t.title + "”.", { type: "task", id: t.id, name: t.title });
    this.persist();
  },

  /* -------- focus -------- */
  addSession(s) {
    // extra real life-time is recorded so totals never depend on the timer UI
    this.data.focus.sessions.unshift(s);
    this.data.focus.totalSeconds = (this.data.focus.totalSeconds || 0) + (s.seconds || 0);
    this.persist();
  },
  sessionsForDay(key) { return this.data.focus.sessions.filter(s => dayKey(s.endedAt || s.startedAt) === key); },
  secondsForDay(key) { return this.sessionsForDay(key).reduce((a, s) => a + (s.seconds || 0), 0); },
  streak() {
    let n = 0;
    const d = new Date();
    for (let i = 0; i < 400; i++) {
      const k = dayKey(d);
      if (this.secondsForDay(k) > 0) { n++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return n;
  },

  reset() {
    this.data = defaultState();
    this.persist();
  }
};

/* ============================================================
   ROUTER
   ============================================================ */
const TABS = [
  { id: "home",      label: "Home",      icon: "home" },
  { id: "devices",   label: "Devices",   icon: "devices" },
  { id: "bluetooth", label: "Bluetooth", icon: "bluetooth" },
  { id: "wifi",      label: "Wi-Fi",     icon: "wifi" },
  { id: "vehicles",  label: "Vehicles",  icon: "car" },
  { id: "focus",     label: "Focus",     icon: "focus" },
  { id: "tasks",     label: "Tasks",     icon: "tasks" },
  { id: "mystery",   label: "Mystery",   icon: "mystery" },
  { id: "stats",     label: "Stats",     icon: "stats" }
];
const ROUTES = {};
function defRoute(name, def) {
  ROUTES[name] = Object.assign({ title: "My Device Hub", render: () => UI.emptyState("No view", "This section is not available.") }, def);
}
const Router = {
  current: "home",
  params: {},
  go(name, params, opts) {
    if (typeof name === "object" && name) { params = name.params || {}; opts = opts || {}; name = name.name || "home"; }
    if (!ROUTES[name]) name = "home";
    if (name !== "settings" && TABS.some(t => t.id === name)) Store._lastTab = name;
    this.current = name;
    this.params = params || {};
    if (!params || params.__keepScroll !== true) {
      // reset scroll on primary navigation only
    }
    UI.render();
    if (!(opts && opts.keepScroll)) window.scrollTo({ top: 0, behavior: Store.data.settings.motion ? "smooth" : "auto" });
    UI.syncNav();
    if (ROUTES[name].onEnter) ROUTES[name].onEnter(this.params);
  }
};

/* ============================================================
   UI CORE (toast, modal, render engine)
   ============================================================ */
const UI = {
  modalStack: [],
  _imgCb: null,

  toast(title, msg, kind) {
    if (!Store.data.settings.notify.toasts && kind !== "bad") return;
    const root = $("#toastRoot");
    const el = document.createElement("div");
    el.className = "toast " + (kind || "");
    const ic = kind === "ok" ? "check" : kind === "bad" ? "alert" : kind === "warn" ? "warn" : "info";
    el.innerHTML =
      '<span class="ti">' + icon(ic, 19) + "</span>" +
      '<div class="tx"><div class="tt">' + esc(title) + "</div>" + (msg ? '<div class="ts2">' + esc(msg) + "</div>" : "") + "</div>" +
      '<button class="tclose" aria-label="Dismiss">' + icon("close", 16) + "</button>";
    $(".tclose", el).addEventListener("click", () => remove());
    root.appendChild(el);
    let gone = false;
    function remove() {
      if (gone) return; gone = true;
      el.classList.add("out");
      setTimeout(() => el.remove(), 240);
    }
    setTimeout(remove, kind === "bad" ? 7000 : 4200);
  },

  modal(opts) {
    const wrap = document.createElement("div");
    wrap.className = "backdrop";
    const sheet = document.createElement("div");
    sheet.className = "sheet" + (opts.wide ? " wide" : "");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.innerHTML = '<div class="grabber"></div>' + (opts.body || "");
    wrap.appendChild(sheet);
    const prevFocus = document.activeElement;
    const entry = { wrap, sheet, onClose: opts.onClose };
    this.modalStack.push(entry);
    $("#modalRoot").appendChild(wrap);
    document.body.style.overflow = "hidden";

    function close() {
      const i = UI.modalStack.indexOf(entry);
      if (i > -1) UI.modalStack.splice(i, 1);
      wrap.remove();
      if (!UI.modalStack.length) document.body.style.overflow = "";
      if (opts.onClose) opts.onClose();
      if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) {}
    }
    entry.close = close;
    wrap.addEventListener("mousedown", e => { if (e.target === wrap && opts.dismissable !== false) close(); });
    $$("[data-close]", sheet).forEach(b => b.addEventListener("click", close));
    if (opts.onMount) opts.onMount(sheet, close);
    setTimeout(() => {
      const f = sheet.querySelector("input:not([type=hidden]),select,textarea,button");
      if (f && !("ontouchstart" in window)) f.focus();
    }, 120);
    return close;
  },

  confirm(opts) {
    return new Promise(resolve => {
      let answered = false;
      const danger = opts.danger !== false;
      const body =
        '<div class="sheet-head"><div class="card-ico ' + (danger ? "" : "") + '" style="' + (danger ? "color:var(--bad);background:rgba(248,113,113,.12);border-color:rgba(248,113,113,.3)" : "") + '">' + icon(danger ? "warn" : "info", 19) + "</div>" +
        "<div><h3>" + esc(opts.title || "Are you sure?") + "</h3>" +
        '<div class="sub">' + (opts.html || esc(opts.message || "")) + "</div></div></div>" +
        '<div class="sheet-foot">' +
        '<button class="btn btn-ghost" data-close>' + esc(opts.cancelText || "Cancel") + "</button>" +
        '<button class="btn ' + (danger ? "btn-danger" : "btn-primary") + '" data-yes>' + esc(opts.confirmText || "Confirm") + "</button></div>";
      const close = UI.modal({
        body,
        onMount(sheet, done) {
          $("[data-yes]", sheet).addEventListener("click", () => { answered = true; resolve(true); done(); });
        },
        onClose: () => { if (!answered) resolve(false); }
      });
      return close;
    });
  },

  prompt(opts) {
    return new Promise(resolve => {
      const body =
        '<div class="sheet-head"><div><h3>' + esc(opts.title || "Enter a value") + "</h3>" +
        (opts.message ? '<div class="sub">' + esc(opts.message) + "</div>" : "") + "</div></div>" +
        '<div class="field"><label>Value</label><input class="input" id="promptInput" value="' + esc(opts.value || "") + '" placeholder="' + esc(opts.placeholder || "") + '"></div>' +
        '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-ok>OK</button></div>';
      let closed = false;
      UI.modal({
        body,
        onMount(sheet, done) {
          const inp = $("#promptInput", sheet);
          const ok = () => { closed = true; const v = inp.value; done(); resolve(v); };
          $("[data-ok]", sheet).addEventListener("click", ok);
          inp.addEventListener("keydown", e => { if (e.key === "Enter") ok(); });
          setTimeout(() => inp.focus(), 100);
        },
        onClose: () => { if (!closed) resolve(null); }
      });
    });
  },

  emptyState(title, msg, btnLabel, btnAttr, iconName) {
    return '<div class="empty"><div class="ei">' + icon(iconName || "box", 24) + "</div><h4>" + esc(title) + "</h4>" +
      (msg ? "<p>" + msg + "</p>" : "") +
      (btnLabel ? '<button class="btn btn-primary btn-sm" ' + (btnAttr || "") + ">" + icon("plus", 15) + " " + esc(btnLabel) + "</button>" : "") + "</div>";
  },
  notice(html, kind, iconName) {
    return '<div class="notice ' + (kind || "") + '"><span class="ni">' + icon(iconName || (kind === "warn" ? "warn" : kind === "ok" ? "check" : "info"), 18) + "</span><div>" + html + "</div></div>";
  },
  pill(text, kind, dot, live) {
    return '<span class="pill ' + (kind || "") + (live ? " live" : "") + '">' + (dot !== false ? '<span class="dot"></span>' : "") + esc(text) + "</span>";
  },
  kv(k, v, mono) {
    return '<div class="kv"><span class="k">' + esc(k) + '</span><span class="v' + (mono === false ? " plain" : "") + '">' + v + "</span></div>";
  },
  avatarHtml(item, size) {
    const cls = "avatar" + (size ? " " + size : "");
    const img = safeImg(item && item.image);
    if (img) return '<div class="' + cls + '"><img src="' + esc(img) + '" alt=""></div>';
    const cat = catOf(item && item.category);
    return '<div class="' + cls + '">' + (cat.emoji || "📦") + "</div>";
  },

  /* ---- image picker (downscales to keep storage small) ---- */
  pickImage(cb) {
    const input = $("#imgPicker");
    this._imgCb = cb;
    input.value = "";
    input.click();
  },
  handleImageFile(file) {
    const cb = this._imgCb; this._imgCb = null;
    if (!file) return;
    if (!/^image\//.test(file.type)) { this.toast("Unsupported file", "Please choose an image file.", "warn"); return; }
    const maxKb = Store.data.settings.prefs.imageMaxKb || 512;
    const reader = new FileReader();
    reader.onerror = () => this.toast("Could not read image", "The file could not be loaded.", "bad");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => this.toast("Could not decode image", "That image format is not supported by this browser.", "bad");
      img.onload = () => {
        const maxSide = 720;
        let w = img.naturalWidth, h = img.naturalHeight;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#0b1424"; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        let q = 0.82, out = "";
        for (let i = 0; i < 7; i++) {
          out = c.toDataURL("image/jpeg", q);
          const kb = Math.round((out.length * 0.75) / 1024);
          if (kb <= maxKb || q <= 0.35) break;
          q -= 0.1;
        }
        if (cb) cb(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  },

  /* ---- top bar + tabs ---- */
  syncTopbar() {
    const isSettings = Router.current === "settings";
    $("#topbarRight").innerHTML =
      '<button class="icon-btn' + (isSettings ? " active" : "") + '" id="btnSettings" aria-label="Settings" title="Settings">' + icon("settings", 20) + "</button>";
    $("#btnSettings").addEventListener("click", () => Router.go(isSettings ? Store._lastTab || "home" : "settings"));
  },
  syncNav() {
    const bar = $("#tabbar");
    bar.innerHTML = TABS.map(t => {
      const on = Router.current === t.id;
      const dot = t.id === "bluetooth" && BT.lastError ? '<span class="tdot"></span>' : "";
      return '<button class="tab' + (on ? " on" : "") + '" data-tab="' + t.id + '" aria-current="' + (on ? "page" : "false") + '">' +
        dot + icon(t.icon, 21) + "<span>" + t.label + "</span></button>";
    }).join("");
    $$("[data-tab]", bar).forEach(b => b.addEventListener("click", () => {
      if (Router.current === "settings") Store._lastTab = b.dataset.tab;
      Router.go(b.dataset.tab);
    }));
  },
  syncFooter() {
    const s = Store.data;
    const size = s.available === false ? "" : (() => {
      try { const raw = localStorage.getItem(STORE_KEY) || ""; return (raw.length / 1024).toFixed(1) + " KB stored locally"; } catch (e) { return ""; }
    })();
    $("#appFooter").innerHTML =
      "<div>MY DEVICE HUB · v1.0.0 · a clean 2D dashboard · real data only</div>" +
      "<div>" + (Store.available ? (size ? size + " · " : "") + "everything stays on this device" : "storage unavailable — session-only mode") + "</div>";
  },

  render() {
    const route = ROUTES[Router.current] || ROUTES.home;
    const el = $("#view");
    this.clearTickers();
    el.innerHTML = route.render(Router.params) || "";
    el.scrollTop = 0;
    this.syncTopbar();
    this.syncFooter();
    if (route.afterRender) route.afterRender(el, Router.params);
  },
  refresh() {
    const y = window.scrollY;
    this.render();
    this.syncNav();
    window.scrollTo({ top: y, behavior: "auto" });
  },

  /* small SVG donut / sparkline / bar-chart builders (pure 2D, no libraries) */
  donut(parts, size, thickness, centerTop, centerBot) {
    size = size || 168; thickness = thickness || 15;
    const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0);
    const r = (size - thickness) / 2, c = 2 * Math.PI * r;
    let off = 0;
    const segs = parts.map(p => {
      const frac = total > 0 ? Math.max(0, p.value) / total : 0;
      const len = frac * c;
      const s = '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + p.color + '" stroke-width="' + thickness +
        '" stroke-dasharray="' + len + " " + (c - len) + '" stroke-dashoffset="' + (-off) + '" stroke-linecap="butt" transform="rotate(-90 ' + size / 2 + " " + size / 2 + ')"/>';
      off += len;
      return s;
    }).join("");
    return '<div style="position:relative;width:' + size + "px;height:" + size + 'px;flex:0 0 auto">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" aria-hidden="true">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="rgba(126,180,255,.10)" stroke-width="' + thickness + '"/>' +
      (total > 0 ? segs : "") + "</svg>" +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">' +
      (centerTop ? '<div style="font-size:' + Math.round(size * 0.2) + "px;font-weight:750;font-variant-numeric:tabular-nums;font-family:var(--mono)\">" + centerTop + "</div>" : "") +
      (centerBot ? '<div style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700">' + centerBot + "</div>" : "") +
      "</div></div>";
  },
  bars(labels, values, opts) {
    opts = opts || {};
    const w = 100, n = Math.max(1, values.length);
    const step = w / n;
    const bw = Math.min(11, step * 0.56);
    const max = Math.max(1, ...values);
    const h = 56;
    const barsHtml = values.map((v, i) => {
      const bh = Math.max(v > 0 ? 2.5 : 1, (v / max) * (h - 8));
      const x = i * step + (step - bw) / 2;
      const y = h - bh;
      const fill = opts.colorFor ? opts.colorFor(i, v) : "url(#barGrad)";
      const dim = (opts.highlight != null && opts.highlight !== i) ? ' opacity=".38"' : "";
      return '<rect class="bar" x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + bw.toFixed(2) + '" height="' + bh.toFixed(2) + '" rx="' + (bw / 2).toFixed(2) + '" fill="' + fill + '"' + dim + "><title>" + esc(labels[i]) + ": " + v + "</title></rect>";
    }).join("");
    return '<svg class="chart" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" style="height:112px" aria-hidden="true">' +
      '<defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent-2)" stop-opacity=".45"/></linearGradient></defs>' +
      barsHtml + "</svg>";
  },
  sparkline(values, opts) {
    opts = opts || {};
    const n = Math.max(2, values.length);
    const max = Math.max(1, ...values);
    const W = 100, H = 30;
    const pts = values.map((v, i) => [(i / (n - 1)) * W, H - (v / max) * (H - 4) - 2]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ");
    const area = line + " L" + W + " " + H + " L0 " + H + " Z";
    return '<svg class="spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".42"/><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#sparkGrad)"/>' +
      '<path d="' + line + '" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  },
  ring(value01, label, sub) {
    const r = 96, c = 2 * Math.PI * r;
    const off = c * (1 - clamp(value01, 0, 1));
    return '<div class="ring"><svg viewBox="0 0 220 220" aria-hidden="true">' +
      '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent-2)"/></linearGradient></defs>' +
      '<circle cx="110" cy="110" r="' + r + '" fill="none" stroke="rgba(126,180,255,.12)" stroke-width="12"/>' +
      '<circle class="rc" cx="110" cy="110" r="' + r + '" fill="none" stroke="url(#ringGrad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      "</svg>" +
      '<div class="ring-in"><div class="ring-time" id="ringTime">' + label + "</div>" + (sub ? '<div class="ring-lab">' + sub + "</div>" : "") + "</div></div>";
  },
  miniRing(value01, text) {
    const r = 25, c = 2 * Math.PI * r;
    const off = c * (1 - clamp(value01, 0, 1));
    return '<div class="mini-ring"><svg viewBox="0 0 60 60" aria-hidden="true">' +
      '<circle cx="30" cy="30" r="' + r + '" fill="none" stroke="rgba(126,180,255,.14)" stroke-width="6"/>' +
      '<circle cx="30" cy="30" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      '</svg><div class="v">' + esc(text) + "</div></div>";
  },

  /* delegated click helper */
  on(el, sel, evt, fn) {
    $$(sel, el).forEach(n => n.addEventListener(evt, e => fn(e, n)));
  }
};

