
/* ============================================================
   VEHICLE LIVE DATA ENGINE
   ------------------------------------------------------------
   The single place real vehicle readings enter the app. A value
   can only appear on screen if an adapter actually delivered a
   finite number and a timestamp. Anything else renders as
   NOT AVAILABLE / INTEGRATION REQUIRED.
   ============================================================ */
const VehicleLive = {
  sessions: {},          // vehicleId -> { fields:{}, vin, source, startedAt }
  onChange: null,        // set by the vehicle dashboard for cheap DOM patching
  rejected: [],          // values refused because they were not usable data

  session(vehicleId) {
    if (!this.sessions[vehicleId]) this.sessions[vehicleId] = { fields: {}, vin: null, source: null, startedAt: nowIso() };
    return this.sessions[vehicleId];
  },

  /* Accepts either { speed: 62.4 } or { speed: { value: 62.4, unit: "km/h" } }.
     Non-finite, empty or unparsable values are dropped and recorded. */
  ingest(vehicleId, payload, source) {
    if (!vehicleId || !payload || typeof payload !== "object") return { accepted: 0, rejected: 0 };
    const s = this.session(vehicleId);
    let accepted = 0, rejected = 0;
    Object.keys(payload).forEach(key => {
      const def = VEHICLE_FIELDS.find(f => f.id === key);
      if (!def) { rejected++; this.rejected.unshift({ key, why: "unknown field", at: nowIso() }); return; }
      let raw = payload[key];
      let unit = def.unit, note = null, at = nowIso();
      if (raw && typeof raw === "object") {
        unit = raw.unit != null ? raw.unit : unit;
        note = raw.note || null;
        at = raw.at || at;
        raw = raw.value;
      }
      let value = raw;
      if (typeof value === "string") {
        const trimmed = value.trim();
        /* A string only becomes a number when the whole string is a number.
           "Running", "33 PSI" or whitespace must never be coerced to 0 — that
           would be inventing a reading, which this app refuses to do. */
        value = /^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(trimmed) ? Number(trimmed) : trimmed;
      }
      const isNum = typeof value === "number" && isFinite(value);
      const isText = typeof value === "string" && value.length > 0 && value.length <= 120;
      if (!isNum && !isText) { rejected++; this.rejected.unshift({ key, why: "not a finite value", at: nowIso() }); return; }
      s.fields[key] = {
        value: isNum ? Math.round(value * 100) / 100 : value,
        unit: isNum ? unit : "",
        at, source: source || "integration", note
      };
      accepted++;
    });
    if (accepted) {
      s.source = source || s.source;
      this.touch(vehicleId);
    }
    if (this.rejected.length > 40) this.rejected.length = 40;
    return { accepted, rejected };
  },

  /* Called whenever genuine values arrive. Records the integration that is
     actually feeding this vehicle, logs the connection once per session, and
     keeps a throttled last-known snapshot so a reload can show real readings
     with their original timestamps instead of an empty grid. */
  touch(vehicleId) {
    const s = this.sessions[vehicleId];
    if (s && !s.loggedConnect) {
      s.loggedConnect = true;
      const v = Store.getVehicle(vehicleId);
      if (v) {
        const isPartial = s.source === "host-gps";
        const before = v.connection.status;
        v.connection.status = isPartial ? "partial" : "connected";
        v.connection.adapterId = s.source;
        v.connection.adapterName = this.sourceLabel(s.source);
        v.connection.since = v.connection.since || nowIso();
        v.connection.lastConnectedAt = nowIso();
        v.updatedAt = nowIso();
        Store.persist();
        if (before !== v.connection.status) {
          Store.log("vehicle_connect", "Real data from " + this.sourceLabel(s.source) + " is arriving for “" + v.nickname + "”.",
            { type: "vehicle", id: v.id, name: v.nickname, adapter: s.source });
        }
      }
    }
    const now = Date.now();
    if (!this._lastSnap || now - this._lastSnap > 6000) {
      this._lastSnap = now;
      const v = Store.getVehicle(vehicleId);
      if (v && (!Store.data.settings.prefs || Store.data.settings.prefs.keepLiveSnapshot !== false)) this.snapshot(vehicleId);
    }
    if (typeof this.onChange === "function") { try { this.onChange(vehicleId); } catch (e) {} }
  },

  sourceLabel(id) {
    const a = typeof Adapters !== "undefined" && Adapters.byId ? Adapters.byId(id) : null;
    return a ? a.name : (id === "obd-ii" ? "OBD-II adapter" : id === "manufacturer" ? "Manufacturer API" : id === "native-android" ? "Native Android integration" : id === "host-gps" ? "Host device GPS" : id === "bluetooth" ? "Bluetooth interface" : id || "integration");
  },

  /* Fields with a freshness verdict for the UI. */
  fields(vehicleId) {
    const s = this.sessions[vehicleId];
    if (!s) return {};
    return s.fields;
  },
  getField(vehicleId, fieldId) {
    const s = this.sessions[vehicleId];
    return s && s.fields[fieldId] ? s.fields[fieldId] : null;
  },
  fieldState(vehicleId, fieldId) {
    const f = this.getField(vehicleId, fieldId);
    const def = fieldDef(fieldId);
    if (!f) return { state: "na", def, reason: null };
    const age = Date.now() - new Date(f.at).getTime();
    const limit = FRESH_MS[fieldId] || 60000;
    return { state: age > limit * 4 ? "na" : (age > limit ? "stale" : "live"), def, field: f, ageMs: age, note: f.note };
  },
  liveCount(vehicleId) {
    return FIELD_ORDER.filter(id => this.fieldState(vehicleId, id).state === "live").length;
  },
  anyValue(vehicleId) {
    const s = this.sessions[vehicleId];
    return !!(s && Object.keys(s.fields).length);
  },

  /* Restore the last real snapshot saved before a reload (labelled stale). */
  restore(vehicle) {
    if (!vehicle || !vehicle.live || !vehicle.live.fields) return false;
    const s = this.session(vehicle.id);
    if (Object.keys(s.fields).length) return false;
    s.fields = JSON.parse(JSON.stringify(vehicle.live.fields));
    s.vin = vehicle.live.vin || null;
    s.source = vehicle.live.source || null;
    s.restored = true;
    return true;
  },

  snapshot(vehicleId) {
    const s = this.sessions[vehicleId];
    if (!s || !Object.keys(s.fields).length) return;
    Store.saveVehicleSnapshot(vehicleId, { fields: JSON.parse(JSON.stringify(s.fields)), vin: s.vin, source: s.source, at: nowIso(), restored: false });
  },

  clear(vehicleId) {
    delete this.sessions[vehicleId];
    Store.clearVehicleLive(vehicleId);
    this.touch(vehicleId);
  },

  /* How many fields are currently fresh enough to be called live. */
  freshCount(vehicleId) {
    const s = this.sessions[vehicleId];
    if (!s) return 0;
    return FIELD_ORDER.filter(id => {
      const f = s.fields[id];
      if (!f) return false;
      return Date.now() - new Date(f.at).getTime() <= (FRESH_MS[id] || 60000);
    }).length;
  },

  /* The timestamp of the newest value actually received, or null. */
  lastUpdatedAt(vehicleId) {
    const s = this.sessions[vehicleId];
    if (!s || !Object.keys(s.fields).length) return null;
    return Object.keys(s.fields).map(k => s.fields[k].at).sort().pop();
  },

  status(vehicleId) {
    const s = this.sessions[vehicleId];
    const v = Store.getVehicle(vehicleId);
    const live = this.liveCount(vehicleId);
    return {
      connected: !!(v && v.connection && v.connection.status === "connected"),
      status: (v && v.connection && v.connection.status) || "unavailable",
      adapterId: v && v.connection ? v.connection.adapterId : null,
      adapterName: v && v.connection ? v.connection.adapterName : null,
      source: s ? s.source : null,
      lastAt: s && Object.keys(s.fields).length ? Object.keys(s.fields).map(k => s.fields[k].at).sort().pop() : null,
      liveFields: live,
      totalFields: FIELD_ORDER.length,
      vin: (s && s.vin) || (v && v.live && v.live.vin) || null
    };
  }
};

/* ============================================================
   CONNECTION METHODS REGISTRY
   The four methods the Connection Center may offer. Each one is
   probed on the current runtime; a method that is not implemented
   here is shown as unsupported with the real reason, and is never
   presented as if it could work.
   ============================================================ */
const Adapters = {
  list() { return [this.bluetooth, this.obd2, this.manufacturer, this.native]; },
  extras() { return [this.hostGps]; },

  /* Stored vehicles may still point at the ids used before the
     Connection Center existed; they keep working. */
  aliases: { "obd-ble": "obd-ii", "http": "manufacturer", "native": "native-android" },
  byId(id) {
    const real = this.aliases[id] || id;
    return this.list().concat(this.extras()).find(a => a.id === real) || null;
  },

  /* ── 1. BLUETOOTH — a supported Bluetooth vehicle interface ── */
  bluetooth: {
    id: "bluetooth",
    name: "Bluetooth",
    short: "Bluetooth",
    icon: "bluetooth",
    kind: "vehicle",
    blurb: "Connect a supported Bluetooth vehicle interface",
    detail: "Opens the browser's own Bluetooth chooser and links to the interface you pick. A Bluetooth link on its own does not mean vehicle data: this app only shows readings if the interface actually answers with them.",
    availability() {
      const c = Caps.webBluetooth;
      if (c.supported) return { ok: true, label: "Available", kind: "ok" };
      return { ok: false, label: "Unsupported", kind: "warn", reason: c.reason };
    },
    configured(v) { return !!(v.integration.config.ble && v.integration.config.ble.deviceName); },
    configSummary(v) {
      const c = v.integration.config.ble;
      return c && c.deviceName ? c.deviceName + (c.services ? " · " + c.services + " services" : "") : null;
    },
    async connect(vehicle) { return BleVehicle.connect(vehicle); },
    async disconnect(vehicleId) { return BleVehicle.disconnect(vehicleId); }
  },

  /* ── 2. OBD-II — a compatible OBD-II adapter ── */
  obd2: {
    id: "obd-ii",
    name: "OBD-II",
    short: "OBD-II",
    icon: "plug",
    kind: "vehicle",
    blurb: "Connect through a compatible OBD-II adapter",
    detail: "Speaks the ELM327 AT/PID protocol over a BLE adapter and reads the standard mode-01 PIDs the ECU actually answers — speed, RPM, coolant, fuel level, control-module voltage, plus the ECU's own VIN.",
    availability() {
      const c = Caps.webBluetooth;
      if (!c.supported) return { ok: false, label: "Unsupported", kind: "warn", reason: c.reason };
      if (!c.secure) return { ok: false, label: "Unsupported", kind: "warn", reason: "OBD-II communication is not available in this web version." };
      return { ok: true, label: "Available", kind: "ok" };
    },
    probed: true,
    configured(v) { return !!(v.integration.config.obd && v.integration.config.obd.btDeviceName); },
    configSummary(v) {
      const c = v.integration.config.obd;
      if (!c) return null;
      return (c.btDeviceName || "OBD adapter") + (c.protocol ? " · " + c.protocol : "");
    },
    async connect(vehicle) { return ObdBle.connect(vehicle); },
    async disconnect(vehicleId) { return ObdBle.disconnect(vehicleId); }
  },

  /* ── 3. MANUFACTURER API — an officially supported vehicle API ── */
  manufacturer: {
    id: "manufacturer",
    name: "Manufacturer API",
    short: "Manufacturer API",
    icon: "cloud",
    kind: "vehicle",
    blurb: "Use an officially supported vehicle API",
    detail: "Polls a manufacturer or telematics endpoint you are entitled to use. The app accepts only the fields that arrive in the payload — anything the API omits stays “Not available”.",
    availability() {
      const c = Caps.telemetryEndpoint;
      if (c.supported) return { ok: true, label: "Available", kind: "ok" };
      return { ok: false, label: "Unsupported", kind: "warn", reason: c.reason };
    },
    configured(v) { return !!(v.integration.config.http && v.integration.config.http.url); },
    configSummary(v) {
      const c = v.integration.config.http;
      if (!c || !c.url) return null;
      try { return new URL(c.url).host; } catch (e) { return c.url.slice(0, 42); }
    },
    async connect(vehicle) { return HttpTelemetry.connect(vehicle); },
    async disconnect(vehicleId) { return HttpTelemetry.disconnect(vehicleId); }
  },

  /* ── 4. NATIVE ANDROID — native vehicle/Bluetooth integration ── */
  native: {
    id: "native-android",
    name: "Native Android",
    short: "Native Android",
    icon: "chip",
    kind: "vehicle",
    blurb: "Use native Android vehicle/Bluetooth integration",
    detail: "Uses the platform's own Bluetooth/OBD APIs through the native bridge contract (window.MyDeviceHubNative). This web build ships no native shell, so it stays unsupported until the app is hosted inside one.",
    availability() {
      const d = Caps.nativeBridge;
      if (d.available) return { ok: true, label: "Available", kind: "ok" };
      return { ok: false, label: "Unsupported", kind: "", reason: d.reason || "No native Android bridge in this build." };
    },
    configured() { return false; },
    configSummary() { return null; },
    async connect(vehicle) { return NativeVehicle.connect(vehicle); },
    async disconnect(vehicleId) { return NativeVehicle.disconnect(vehicleId); }
  },

  /* ── Additional source: host-device GPS (location field only) ── */
  hostGps: {
    id: "host-gps",
    name: "Device GPS (location only)",
    short: "Device GPS",
    icon: "pin",
    kind: "source",
    blurb: "Fill the Location field from the phone or laptop you are carrying",
    detail: "This is the host device's own position, labelled as such — never presented as the vehicle's GPS. Needs your location permission and stops when you switch it off.",
    availability() {
      const c = Caps.geolocation;
      return c.supported ? { ok: true, label: "Available", kind: "ok" } : { ok: false, label: "Unsupported", kind: "warn", reason: c.reason };
    },
    configured(v) { return !!v.integration.config.gps; },
    configSummary() { return "enabled while open"; },
    async connect(vehicle) { return HostGps.enable(vehicle); },
    async disconnect(vehicleId) { return HostGps.disable(vehicleId); }
  }
};

/* ============================================================
   BLUETOOTH — a linked vehicle interface, and nothing more
   ------------------------------------------------------------
   This path opens the browser's real chooser, connects GATT and
   reports what the interface actually exposes. Linking is a real
   connection, but it is NOT vehicle telemetry: unless the device
   answers the standard OBD-II exchange, the app says so and keeps
   waiting rather than showing anything it did not receive.
   ============================================================ */
const BleVehicle = {
  device: null,
  server: null,
  vehicleId: null,
  services: [],

  async connect(vehicle) {
    if (!Caps.webBluetooth.supported) throw new Error(Caps.webBluetooth.reason || "Web Bluetooth is unavailable in this browser.");
    const cfg = vehicle.integration.config.ble || {};
    let device = null;
    if (cfg.deviceId && navigator.bluetooth.getDevices) {
      try { device = (await navigator.bluetooth.getDevices()).find(d => d.id === cfg.deviceId) || null; } catch (e) { device = null; }
    }
    if (!device) {
      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service", "device_information", "generic_access"].concat(ObdBle.SERVICES)
      });
    }

    Store.setVehicleConnection(vehicle.id, "not_connected", { adapterId: "bluetooth", adapterName: device.name || "Bluetooth interface", lastError: null });
    this.vehicleId = vehicle.id;
    this.device = device;

    if (!device.gatt) throw new Error("That device does not expose a GATT server, so nothing can be read from it.");
    try { this.server = await device.gatt.connect(); }
    catch (e) { throw new Error("Could not open a GATT connection to “" + (device.name || "the device") + "”. " + ((e && e.message) || "")); }

    let names = [];
    try {
      const list = await this.server.getPrimaryServices();
      names = list.map(s => s.uuid.replace(/-0000-1000-8000-00805f9b34fb/i, "").replace(/^0000/, ""));
      this.services = names;
    } catch (e) { this.services = []; }

    Store.setVehicleIntegration(vehicle.id, "bluetooth", {
      ble: { deviceId: device.id, deviceName: device.name || "Bluetooth interface", services: names.length, lastConnectAt: nowIso() }
    });
    Store.setVehicleConnection(vehicle.id, "connected",
      { adapterId: "bluetooth", adapterName: device.name || "Bluetooth interface", lastError: null },
      "integration_connect",
      "Linked the Bluetooth vehicle interface “" + (device.name || "unnamed") + "” to “" + vehicle.nickname + "”.");

    /* Probe whether this interface speaks the standard OBD-II exchange.
       A link alone is not telemetry, so this decides what the dashboard says. */
    let speaksObd = false;
    try { speaksObd = await ObdBle.probeHandshake(this.device, this.server); } catch (e) { speaksObd = false; }

    if (speaksObd) {
      Store.updateVehicle(vehicle.id, { notes: vehicle.notes }, false);
      if (typeof VehicleLive.onChange === "function") VehicleLive.onChange(vehicle.id);
      return { device: device.name, services: names, speaksObd: true };
    }

    if (typeof VehicleLive.onChange === "function") VehicleLive.onChange(vehicle.id);
    return { device: device.name, services: names, speaksObd: false };
  },

  async disconnect(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    try { if (this.device && this.device.gatt && this.device.gatt.connected) this.device.gatt.disconnect(); } catch (e) {}
    this.device = null; this.server = null; this.vehicleId = null; this.services = [];
    if (v) {
      Store.setVehicleConnection(vehicleId, "not_connected", { adapterId: null, adapterName: v.connection.adapterName, lastError: null },
        "vehicle_disconnect", "Unlinked the Bluetooth vehicle interface from “" + v.nickname + "”.");
    }
    if (typeof VehicleLive.onChange === "function") VehicleLive.onChange(vehicleId);
    return { ok: true };
  }
};

/* ============================================================
   OBD-II over Web Bluetooth — a real ELM327 client
   ------------------------------------------------------------
   Speaks the actual ELM327 AT/PID protocol over a BLE serial
   characteristic: AT handshake, then mode-01 PID requests with
   ISO-9141/CAN response parsing. If the ECU does not answer,
   the field stays empty and the reason is reported.
   ============================================================ */
const ObdBle = {
  device: null,
  rx: null, tx: null,
  buffer: "",
  pending: null,
  session: null,       // { vehicleId, timers: [], pids, tick }
  protocol: null,
  supported: null,     // PIDs the ECU reported in 0100
  customPids: [],

  /* BLE serial services used by ELM327 clones and generic UART bridges. */
  SERVICES: [
    "0000fff0-0000-1000-8000-00805f9b34fb",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
    "0000ffe5-0000-1000-8000-00805f9b34fb",
    "0000ff00-0000-1000-8000-00805f9b34fb",
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    "000018f0-0000-1000-8000-00805f9b34fb"
  ],
  KNOWN_PAIRS: [
    { svc: "0000fff0-0000-1000-8000-00805f9b34fb", tx: "0000fff2-0000-1000-8000-00805f9b34fb", rx: "0000fff1-0000-1000-8000-00805f9b34fb" },
    { svc: "0000ffe0-0000-1000-8000-00805f9b34fb", tx: "0000ffe1-0000-1000-8000-00805f9b34fb", rx: "0000ffe1-0000-1000-8000-00805f9b34fb" },
    { svc: "0000ffe5-0000-1000-8000-00805f9b34fb", tx: "0000ffe9-0000-1000-8000-00805f9b34fb", rx: "0000ffe4-0000-1000-8000-00805f9b34fb" },
    { svc: "6e400001-b5a3-f393-e0a9-e50e24dcca9e", tx: "6e400002-b5a3-f393-e0a9-e50e24dcca9e", rx: "6e400003-b5a3-f393-e0a9-e50e24dcca9e" },
    { svc: "0000ff00-0000-1000-8000-00805f9b34fb", tx: "0000ff02-0000-1000-8000-00805f9b34fb", rx: "0000ff01-0000-1000-8000-00805f9b34fb" },
    { svc: "000018f0-0000-1000-8000-00805f9b34fb", tx: "00002af0-0000-1000-8000-00805f9b34fb", rx: "00002af1-0000-1000-8000-00805f9b34fb" }
  ],

  /* PID table — every entry is a documented OBD-II mode 01/09 request. */
  PIDS: {
    engineLoad:  { cmd: "0104", mode: 0x41, pid: 0x04, unit: "%",     parse: b => Math.round(b[0] * 100 / 255) },
    coolant:     { cmd: "0105", mode: 0x41, pid: 0x05, unit: "°C",    parse: b => b[0] - 40 },
    rpm:         { cmd: "010C", mode: 0x41, pid: 0x0C, unit: "rpm",   parse: b => ((b[0] << 8) + b[1]) / 4, internal: true },
    speed:       { cmd: "010D", mode: 0x41, pid: 0x0D, unit: "km/h",  parse: b => b[0] },
    fuel:        { cmd: "012F", mode: 0x41, pid: 0x2F, unit: "%",     parse: b => Math.round(b[0] * 100 / 255) },
    odometer:    { cmd: "0131", mode: 0x41, pid: 0x31, unit: "km",    parse: b => (b[0] << 8) + b[1] },
    voltage:     { cmd: "0142", mode: 0x41, pid: 0x42, unit: "V",     parse: b => ((b[0] << 8) + b[1]) / 1000 },
    ambient:     { cmd: "0146", mode: 0x41, pid: 0x46, unit: "°C",    parse: b => b[0] - 40 },
    fuelType:    { cmd: "0151", mode: 0x41, pid: 0x51, unit: "",      parse: b => b[0], internal: true },
    mil:         { cmd: "0101", mode: 0x41, pid: 0x01, unit: "",      parse: b => b[0], internal: true },
    supported01: { cmd: "0100", mode: 0x41, pid: 0x00, unit: "",      parse: b => b.slice(0, 4), internal: true },
    vin:         { cmd: "0902", mode: 0x49, pid: 0x02, unit: "",      parse: b => b, internal: true }
  },

  /* ── device chooser ── */
  async pick(opts) {
    const nav = navigator.bluetooth;
    if (!nav) throw new Error("Web Bluetooth is not available in this browser.");
    opts = opts || {};
    const known = [
      { services: this.SERVICES },
      { namePrefix: "OBD" }, { namePrefix: "V-LINK" }, { namePrefix: "Vgate" },
      { namePrefix: "KONNWEI" }, { namePrefix: "KONNWEI" }, { namePrefix: "ELM327" },
      { namePrefix: "IOS-Vlink" }, { namePrefix: "OBDII" }
    ];
    let device;
    if (opts.allDevices) {
      device = await nav.requestDevice({ acceptAllDevices: true, optionalServices: this.SERVICES.concat(["battery_service", "device_information", "generic_access"]) });
    } else {
      device = await nav.requestDevice({ filters: known, optionalServices: this.SERVICES.concat(["battery_service", "device_information", "generic_access"]) });
    }
    return device;
  },

  /* ── GATT wiring ── */
  async open(device) {
    if (this._disconnectBound !== device) {
      this._disconnectBound = device;
      device.addEventListener("gattserverdisconnected", () => this.onDisconnected());
    }
    const server = await device.gatt.connect();
    let tx = null, rx = null;
    const services = await server.getPrimaryServices();

    /* 1. prefer a documented service/characteristic pair */
    for (const pair of this.KNOWN_PAIRS) {
      try {
        const svc = await server.getPrimaryService(pair.svc);
        const found = await svc.getCharacteristics();
        const t = found.find(c => c.uuid === pair.tx) || found.find(c => c.properties && (c.properties.write || c.properties.writeWithoutResponse));
        const r = found.find(c => c.uuid === pair.rx) || found.find(c => c.properties && (c.properties.notify || c.properties.indicate));
        if (t && r) { tx = t; rx = r; break; }
      } catch (e) { /* service not present on this adapter */ }
    }

    /* 2. fall back to any writable + notifiable pair the page was granted */
    if (!tx || !rx) {
      for (const svc of services) {
        let chars = [];
        try { chars = await svc.getCharacteristics(); } catch (e) { continue; }
        const t = chars.find(c => c.properties && (c.properties.write || c.properties.writeWithoutResponse));
        const r = chars.find(c => c.properties && (c.properties.notify || c.properties.indicate));
        if (t && r) { tx = t; rx = r; break; }
        if (t && t.properties && t.properties.notify) { tx = t; rx = rx || t; }
      }
    }
    if (!tx || !rx) throw new Error("This Bluetooth device does not expose a writable + notifiable serial characteristic, so it is not an ELM327-style OBD adapter.");

    this.device = device;
    this.tx = tx;
    this.rx = rx;
    this.buffer = "";
    this.rx.addEventListener("characteristicvaluechanged", ev => this.onData(ev));
    await this.rx.startNotifications();
    return { device, tx, rx, serviceCount: services.length };
  },

  onData(ev) {
    let text = "";
    try {
      const v = ev.target.value;
      text = new TextDecoder("utf-8").decode(v.buffer ? new Uint8Array(v.buffer) : new Uint8Array(v.buffer || []));
      if (!text || /[\uFFFD]/.test(text)) text = Array.from(new Uint8Array(v.buffer)).map(b => String.fromCharCode(b)).join("");
    } catch (e) { text = String(ev.target.value); }
    this.buffer += text;
    if (/[\r\n]?>/.test(this.buffer) && this.pending) {
      const full = this.buffer;
      const i = full.lastIndexOf(">");
      const resp = full.slice(0, i);
      this.buffer = full.slice(i + 1);
      const p = this.pending;
      this.pending = null;
      clearTimeout(p.timer);
      p.resolve(resp);
    }
  },

  onDisconnected() {
    const sess = this.session;
    this.rx = null; this.tx = null; this.device = null; this.pending = null;
    if (sess) {
      this.stopPolling();
      const v = Store.getVehicle(sess.vehicleId);
      if (v) {
        Store.setVehicleConnection(v.id, "lost",
          { adapterId: null, adapterName: v.connection.adapterName, lastError: "The adapter dropped the Bluetooth link (powered off, out of range, or the vehicle turned off)." },
          "vehicle_disconnect", "The OBD-II adapter “" + (v.connection.adapterName || "adapter") + "” disconnected from “" + v.nickname + "”.");
        VehicleLive.snapshot(v.id);
      }
      this.session = null;
      UI.toast("Vehicle adapter disconnected", "The Bluetooth link to the OBD-II adapter ended.", "warn");
      UI.refresh();
    }
  },

  /* ── ELM327 transport ── */
  async send(cmd, timeoutMs) {
    if (!this.tx) throw new Error("No adapter is connected.");
    timeoutMs = timeoutMs || 3500;
    this.buffer = "";
    const data = new TextEncoder().encode(cmd + "\r");
    const reply = new Promise((resolve, reject) => {
      this.pending = { resolve, reject, timer: setTimeout(() => { this.pending = null; reject(new Error("timeout")); }, timeoutMs) };
    });
    try {
      if (this.tx.properties && this.tx.properties.writeWithoutResponse && !this.tx.properties.write) await this.tx.writeValueWithoutResponse(data);
      else await this.tx.writeValue(data);
    } catch (e) {
      if (this.pending) { clearTimeout(this.pending.timer); this.pending = null; }
      throw new Error("The adapter refused the command: " + (e.message || e));
    }
    return reply;
  },

  clean(resp) {
    return String(resp || "")
      .replace(/[\r\n]+/g, " ")
      .replace(/SEARCHING\.*/gi, " ")
      .replace(/BUS INIT[^ ]*/gi, " ")
      .replace(/STOPPED/gi, " ")
      .trim()
      .toUpperCase();
  },
  isNoData(clean) { return !clean || /NO DATA|UNABLE TO CONNECT|CAN ERROR|BUS ERROR|\?|ERR/.test(clean); },

  hexBytes(clean, mode, pid) {
    /* keep only the response line for the requested mode/pid, then its data bytes */
    const tokens = clean.split(" ").filter(Boolean);
    const joined = tokens.join("");
    const head = mode.toString(16).padStart(2, "0").toUpperCase() + pid.toString(16).padStart(2, "0").toUpperCase();
    let idx = joined.indexOf(head);
    if (idx < 0) return null;
    const body = joined.slice(idx + head.length).replace(/[^0-9A-F]/g, "");
    const bytes = [];
    for (let i = 0; i + 1 < body.length; i += 2) bytes.push(parseInt(body.slice(i, i + 2), 16));
    return bytes.length ? bytes : null;
  },

  /* ── handshake ── */
  async handshake() {
    const steps = [];
    const at = async (cmd, wait, optional) => {
      try {
        const r = await this.send(cmd, wait || 3000);
        const c = this.clean(r);
        steps.push({ cmd, reply: c.slice(0, 42) || "(empty)" });
        return c;
      } catch (e) {
        steps.push({ cmd, reply: "no reply" });
        if (!optional) throw new Error("The adapter did not answer " + cmd + ". It may not be an ELM327-compatible device.");
        return "";
      }
    };
    await at("ATZ", 5000);            // reset
    await at("ATE0", 3000);           // echo off
    await at("ATL0", 3000);           // linefeeds off
    await at("ATS0", 3000);           // spaces off
    await at("ATH0", 3000, true);     // headers off (optional on some clones)
    await at("ATAT1", 3000, true);    // adaptive timing (optional)
    const proto = await at("ATSP0", 3000, true);   // automatic protocol search
    this.protocol = (proto && /OK/.test(proto)) ? "Automatic (ATSP0)" : "default";
    /* which PIDs does this ECU actually support? */
    try {
      const r = await this.send("0100", 4000);
      const b = this.hexBytes(this.clean(r), 0x41, 0x00);
      if (b) {
        const bitmap = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
        const has = n => n >= 1 && n <= 32 ? ((bitmap >> (32 - n)) & 1) === 1 : true;
        this.supported = { raw: b.map(x => x.toString(16).padStart(2, "0")).join(""), has };
      } else this.supported = null;
    } catch (e) { this.supported = null; }
    return steps;
  },

  supports(fieldId) {
    const map = { speed: 0x0D, coolant: 0x05, fuel: 0x2F, odometer: 0x31, voltage: 0x42, engineLoad: 0x04, ambient: 0x46, fuelType: 0x51 };
    if (!this.supported) return null;
    const n = map[fieldId];
    return n ? this.supported.has(n) : null;
  },

  /* ── one polling pass ── */
  async readPid(key) {
    const def = this.PIDS[key];
    if (!def) return null;
    try {
      const raw = await this.send(def.cmd, 3000);
      const clean = this.clean(raw);
      if (this.isNoData(clean)) return { key, ok: false, why: /NO DATA/.test(clean) ? "The ECU did not report this PID." : "The adapter returned: " + (clean || "no data") };
      const bytes = this.hexBytes(clean, def.mode, def.pid);
      if (!bytes) return { key, ok: false, why: "Unrecognised reply: " + clean.slice(0, 32) };
      const value = def.parse(bytes);
      return { key, ok: true, value, bytes };
    } catch (e) {
      return { key, ok: false, why: e.message === "timeout" ? "The adapter timed out on " + def.cmd + "." : (e.message || String(e)) };
    }
  },

  /* VIN: ISO-TP multi-frame, ASCII in the 49 02 payload */
  parseVin(clean) {
    const joined = clean.replace(/[^0-9A-F]/g, "");
    const idx = joined.indexOf("4902");
    if (idx < 0) return null;
    let start = idx + 4;
    let body = joined.slice(start);
    if (body.startsWith("01")) body = body.slice(2);
    const bytes = [];
    for (let i = 0; i + 1 < body.length && bytes.length < 20; i += 2) {
      const v = parseInt(body.slice(i, i + 2), 16);
      if (v === 0x20 || (v >= 0x30 && v <= 0x5A)) bytes.push(v);
    }
    const vin = String.fromCharCode.apply(null, bytes).trim();
    return /^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin) ? vin.slice(0, 17) : null;
  },

  async readVin() {
    try {
      const raw = await this.send("0902", 6000);
      const vin = this.parseVin(this.clean(raw));
      return vin;
    } catch (e) { return null; }
  },

  /* ── session lifecycle ── */
  async connect(vehicle) {
    if (!Caps.webBluetooth.supported) throw new Error(Caps.webBluetooth.reason || "Web Bluetooth is unavailable.");
    let device = null;
    /* reuse a previously granted adapter for this vehicle when possible */
    const savedId = vehicle.integration.config.obd && vehicle.integration.config.obd.btDeviceId;
    if (savedId && navigator.bluetooth.getDevices) {
      try {
        const list = await navigator.bluetooth.getDevices();
        device = list.find(d => d.id === savedId) || null;
      } catch (e) { device = null; }
    }
    if (!device) device = await this.pick({ allDevices: !!(vehicle.integration.config.obd && vehicle.integration.config.obd.showAll) });

    Store.setVehicleConnection(vehicle.id, "not_connected", { adapterId: "obd-ii", adapterName: device.name || "OBD-II adapter", lastError: null });
    const opened = await this.open(device);
    const steps = await this.handshake();

    this.session = { vehicleId: vehicle.id, timers: [], tick: 0, startedAt: nowIso() };
    this.customPids = (vehicle.integration.config.customPids || []).filter(p => p && p.request && p.field);

    const name = device.name || "OBD-II adapter";
    const vin = await this.readVin();
    const live = VehicleLive.session(vehicle.id);
    live.vin = vin || live.vin;
    live.source = "obd-ii";

    Store.setVehicleIntegration(vehicle.id, "obd-ii", {
      obd: { btDeviceId: device.id, btDeviceName: name, protocol: this.protocol, lastConnectAt: nowIso() }
    });
    Store.setVehicleConnection(vehicle.id, "connected",
      { adapterId: "obd-ii", adapterName: name, lastError: null },
      "integration_connect",
      "Connected the OBD-II adapter “" + name + "” to “" + vehicle.nickname + "”. Handshake: " + steps.length + " AT commands; protocol " + (this.protocol || "default") + (this.supported ? "; ECU supports PIDs up to 0x" + this.supported.raw.slice(0, 8) : "") + ".");

    /* read a real VIN into the profile if the vehicle has none */
    if (vin && !vehicle.vin) {
      Store.updateVehicle(vehicle.id, { vin }, false);
      Store.log("vehicle_edit", "The ECU reported VIN " + vin + " for “" + vehicle.nickname + "”, so it was saved to the profile.", { type: "vehicle", id: vehicle.id, name: vehicle.nickname });
    }
    if (typeof VehicleLive.onChange === "function") VehicleLive.onChange(vehicle.id);
    this.startPolling(vehicle.id);
    return { device: device.name, steps, vin, supported: this.supported };
  },

  /* Non-destructive probe: does this interface answer the standard OBD-II
     request at all? Used by the Bluetooth method, which must not assume
     that a link equals vehicle data. */
  async probeHandshake(device, server) {
    try {
      await this.open(device);
    } catch (e) { return false; }
    if (!this.tx || !this.rx) return false;
    try {
      const r = await this.send("0100", 4000);
      const b = this.hexBytes(this.clean(r), 0x41, 0x00);
      if (!b || b.length < 4) return false;
      const bitmap = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
      const has = n => n >= 1 && n <= 32 ? ((bitmap >> (32 - n)) & 1) === 1 : true;
      this.supported = { raw: b.map(x => x.toString(16).padStart(2, "0")).join(""), has };
      this.protocol = this.protocol || "default";
      return true;
    } catch (e) { return false; }
  },

  /* One explicit pass, used by [ REFRESH DATA ]. Reads what the ECU really
     answers and returns what happened — it can never create a value. */
  async pollOnce(vehicleId) {
    if (!this.tx || !this.rx) return { ok: false, reason: "The OBD-II adapter is not linked any more. Reconnect it." };
    const keys = ["rpm", "speed", "coolant", "voltage", "fuel", "odometer", "mil"];
    const results = {}, problems = [];
    for (const k of keys) {
      if (this.supports(k) === false) { problems.push(k + ": ECU says unsupported"); continue; }
      const r = await this.readPid(k);
      if (r && r.ok) results[k] = r.value;
      else if (r) problems.push(r.why);
    }
    const fields = this.mapResults(results, vehicleId);
    if (Object.keys(fields).length) {
      VehicleLive.ingest(vehicleId, fields, "obd-ii");
      VehicleLive.snapshot(vehicleId);
    }
    if (!Object.keys(fields).length && problems.length === keys.length) {
      return { ok: false, reason: "The adapter did not answer any request: " + problems.slice(0, 2).join("; ") };
    }
    return { ok: true, received: Object.keys(fields), reason: Object.keys(fields).length ? "Values received from the ECU." : "The adapter answered, but the ECU reported nothing for these PIDs." };
  },

  /* Converts raw PID results into dashboard fields. The only source of a
     number here is a byte the ECU actually sent. */
  mapResults(results, vehicleId) {
    const fields = {};
    if (results.speed != null) fields.speed = results.speed;
    if (results.rpm != null) fields.rpm = { value: Math.round(results.rpm), unit: "rpm" };
    if (results.coolant != null) fields.coolant = results.coolant;
    if (results.fuel != null) fields.fuel = results.fuel;
    if (results.odometer != null) fields.odometer = results.odometer;
    if (results.voltage != null) fields.voltage = results.voltage;
    if (results.rpm != null || results.mil != null) {
      const rpm = results.rpm;
      const mil = results.mil != null ? (results.mil & 0x80) === 0x80 : null;
      const text = rpm == null ? (mil ? "MIL on" : "MIL off")
                               : (rpm > 250 ? (rpm > 900 ? "Running" : "Idle") : "Ignition on, engine off");
      fields.engine = { value: text, unit: "", note: "live RPM " + (rpm == null ? "n/a" : Math.round(rpm)) + " · MIL " + (mil == null ? "n/a" : (mil ? "ON" : "OFF")) };
    }
    for (const cp of this.customPids) { /* filled by the polling loop */ }
    void vehicleId;
    return fields;
  },

  /* [ REFRESH DATA ] while a plain Bluetooth interface is linked: ask it
     whether it can produce telemetry at all, and say so if it cannot. */
  async probeTelemetry(vehicleId) {
    if (!this.tx || !this.rx) {
      return { ok: false, reason: "This Bluetooth interface exposes no readable vehicle channel, so the app cannot ask it for data." };
    }
    const r = await this.pollOnce(vehicleId);
    if (!r.ok) return r;
    if (!r.received || !r.received.length) {
      return { ok: true, updated: false, reason: "The interface answered but sent no field values, so nothing new is shown." };
    }
    return { ok: true, updated: true, at: VehicleLive.lastUpdatedAt(vehicleId), reason: "Values received from the connected interface." };
  },

  startPolling(vehicleId) {
    const fast = ["rpm", "speed", "coolant", "voltage", "engineLoad"];
    const slow = ["fuel", "odometer", "mil", "fuelType"];
    const every = clamp(Number(Store.data.settings.prefs.livePollSeconds) || 2, 1, 10) * 1000;
    const slowEvery = 5;

    const pass = async () => {
      if (!this.session || this.session.vehicleId !== vehicleId || !this.tx) return;
      const doSlow = (this.session.tick % slowEvery) === 0;
      const keys = fast.concat(doSlow ? slow : []);
      const results = {};
      const problems = [];
      for (const k of keys) {
        if (this.supports(k) === false) { problems.push(k + ": ECU says unsupported"); continue; }
        const r = await this.readPid(k);
        if (r && r.ok) results[k] = r.value;
        else if (r) problems.push(r.why);
        if (!this.session) return;
      }

      const fields = this.mapResults(results, vehicleId);

      /* user-configured manufacturer PIDs (e.g. TPMS on some models) */
      for (const cp of this.customPids) {
        try {
          const raw = await this.send(cp.request, 3000);
          const clean = this.clean(raw);
          if (this.isNoData(clean)) continue;
          const mode = parseInt(cp.mode || "62", 16), pid = parseInt(cp.pid || "0", 16);
          const bytes = this.hexBytes(clean, mode, pid);
          if (!bytes) continue;
          const width = clamp(Number(cp.len) || 1, 1, 4);
          const off = clamp(Number(cp.byte) || 0, 0, bytes.length - 1);
          let raw2 = 0;
          for (let n = 0; n < width; n++) raw2 = (raw2 << 8) | (bytes[off + n] || 0);
          const val = raw2 * (Number(cp.scale) || 1) + (Number(cp.offset) || 0);
          fields[cp.field] = { value: Math.round(val * 100) / 100, unit: cp.unit || fieldDef(cp.field).unit, note: cp.label || "Manufacturer PID " + cp.request };
        } catch (e) { /* a custom PID that does not answer simply contributes nothing */ }
      }

      if (this.session) this.session.tick++;
      if (Object.keys(fields).length) {
        VehicleLive.ingest(vehicleId, fields, "obd-ii");
        if (this.session && this.session.tick % 8 === 0) VehicleLive.snapshot(vehicleId);
        if (this.session) this.session.deadPasses = 0;
      }
      if (problems.length && this.session) {
        this.session.lastProblems = problems.slice(0, 6);
        /* The adapter is linked but the ECU answered none of the requests.
           After a few passes in a row the honest verdict is CONNECTION LOST. */
        if (!Object.keys(fields).length) {
          this.session.deadPasses = (this.session.deadPasses || 0) + 1;
          if (this.session.deadPasses === 1 && this.session.tick <= 1) {
            Store.setVehicleConnection(vehicleId, "connected", {
              lastError: "The adapter is linked but the ECU has not answered any request yet. Turn the ignition on (position II) and try REFRESH DATA."
            });
          }
          if (this.session.deadPasses >= 3) {
            const why = "The adapter stopped answering the ECU" + (problems[0] ? " (" + problems[0] + ")" : "") + ".";
            this.stopPolling();
            const v = Store.getVehicle(vehicleId);
            if (v) {
              Store.setVehicleConnection(vehicleId, "lost", { lastError: why, adapterName: v.connection.adapterName },
                "vehicle_disconnect", "Lost contact with the OBD-II adapter for “" + v.nickname + "”. " + why);
            }
            VehicleLive.snapshot(vehicleId);
            if (typeof VehicleLive.onChange === "function") VehicleLive.onChange(vehicleId);
            UI.toast("Vehicle connection lost", why, "warn");
            return;
          }
        } else {
          this.session.deadPasses = 0;
        }
      }
      if (this.session) this.session.timer = setTimeout(pass, every);
    };
    pass();
    this.session.timer = this.session.timer || null;
  },

  stopPolling() {
    if (this.session && this.session.timer) clearTimeout(this.session.timer);
    if (this.session) this.session.timer = null;
    if (this.session) this.session.stopped = true;
  },

  async disconnect(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    this.stopPolling();
    VehicleLive.snapshot(vehicleId);
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      try { this.device.gatt.disconnect(); } catch (e) {}
    }
    this.device = null; this.tx = null; this.rx = null; this.pending = null;
    this.session = null;
    if (v) {
      Store.setVehicleConnection(vehicleId, "not_connected",
        { adapterId: null, adapterName: v.connection.adapterName, lastError: null },
        "vehicle_disconnect", "You closed the OBD-II link for “" + v.nickname + "”. Last real readings stay visible, clearly timestamped.");
    }
    UI.toast("Vehicle adapter disconnected", "Live polling stopped. Snapshots keep their original timestamps.", "ok");
  }
};

/* ============================================================
   TELEMATICS / MANUFACTURER ENDPOINT
   Polls a JSON URL the user configures. Only keys that match the
   supported field list are used; the payload is validated, and a
   failed request yields an error message — never a placeholder.
   ============================================================ */
const HttpTelemetry = {
  session: null,

  async probe(url, headerName, token) {
    const headers = {};
    if (token && headerName) headers[headerName] = headerName.toLowerCase() === "authorization" && !/^bearer /i.test(token) ? "Bearer " + token : token;
    const res = await fetch(url, { method: "GET", headers, cache: "no-store", mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error("The endpoint replied HTTP " + res.status + " " + res.statusText + ".");
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); }
    catch (e) { throw new Error("The endpoint did not return JSON. Check that the URL points at a JSON telemetry feed."); }
    return json;
  },

  extract(payload) {
    /* Accept a flat object, or telemetry nested one level under a common key. */
    if (!payload || typeof payload !== "object") return {};
    const containers = [payload, payload.data, payload.vehicle, payload.telemetry, payload.state, payload.status];
    for (const c of containers) {
      if (c && typeof c === "object") {
        const hit = Object.keys(c).some(k => VEHICLE_FIELDS.some(f => f.id === k));
        if (hit) return c;
      }
    }
    return payload;
  },

  /* One explicit request, used by [ REFRESH DATA ]. */
  async pollOnce(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return { ok: false, reason: "Vehicle not found." };
    const c = (v.integration.config && v.integration.config.http) || {};
    if (!c.url) return { ok: false, reason: "No endpoint is configured for this vehicle yet." };
    try {
      const pl = await this.probe(c.url, c.headerName, c.token);
      const r = VehicleLive.ingest(vehicleId, this.extract(pl), "manufacturer");
      if (r.accepted) VehicleLive.snapshot(vehicleId);
      return { ok: true, accepted: r.accepted, reason: r.accepted ? "Endpoint answered." : "Endpoint answered with no supported fields." };
    } catch (e) {
      return { ok: false, reason: (e && e.message) || "The endpoint could not be reached." };
    }
  },

  async connect(vehicle) {
    const cfg = vehicle.integration.config.http || {};
    const url = safeUrl(cfg.url);
    if (!url) throw new Error("Enter a valid https:// endpoint URL first.");
    const payload = await this.probe(url, cfg.headerName, cfg.token);
    const data = this.extract(payload);
    const res = VehicleLive.ingest(vehicle.id, data, "manufacturer");
    if (!res.accepted) throw new Error("The endpoint answered, but none of its keys match a supported field. Expected keys such as " + FIELD_ORDER.slice(0, 5).join(", ") + "…");

    Store.setVehicleIntegration(vehicle.id, "manufacturer", {
      http: { url, headerName: cfg.headerName || "", token: cfg.token || "", lastOkAt: nowIso(), intervalSec: clamp(Number(cfg.intervalSec) || 15, 5, 3600) }
    });
    Store.setVehicleConnection(vehicle.id, "connected",
      { adapterId: "manufacturer", adapterName: (function () { try { return new URL(url).host; } catch (e) { return "endpoint"; } })(), lastError: null },
      "integration_connect", "Connected the telemetry endpoint for “" + vehicle.nickname + "” and received " + res.accepted + " real field(s) on the first poll.");

    this.stop();
    const interval = clamp(Number(cfg.intervalSec) || 15, 5, 3600) * 1000;
    const self = this;
    this.session = { vehicleId: vehicle.id, fails: 0, timer: setInterval(async () => {
      const v = Store.getVehicle(vehicle.id);
      if (!v || (v.connection.status !== "connected" && v.connection.status !== "partial") || v.connection.adapterId !== "manufacturer") { self.stop(); return; }
      const c = v.integration.config.http;
      try {
        const pl = await self.probe(c.url, c.headerName, c.token);
        const r = VehicleLive.ingest(vehicle.id, self.extract(pl), "manufacturer");
        self.session.fails = 0;
        if (r.accepted) VehicleLive.snapshot(vehicle.id);
      } catch (e) {
        self.session.fails++;
        Store.setVehicleConnection(vehicle.id, "connected", { lastError: self.session.fails > 2 ? "Polling failed " + self.session.fails + " times: " + e.message : e.message });
      }
    }, interval) };
    return { accepted: res.accepted, rejected: res.rejected };
  },

  stop() { if (this.session && this.session.timer) clearInterval(this.session.timer); this.session = null; },
  async disconnect(vehicleId) {
    this.stop();
    const v = Store.getVehicle(vehicleId);
    VehicleLive.snapshot(vehicleId);
    Store.setVehicleConnection(vehicleId, "disconnected",
      { adapterId: null, adapterName: v ? v.connection.adapterName : null, lastError: null },
      "vehicle_disconnect", "Stopped polling the telemetry endpoint" + (v ? " for “" + v.nickname + "”." : "."));
    UI.toast("Endpoint polling stopped", "The last real readings stay on screen with their timestamps.", "ok");
  }
};

/* ============================================================
   NATIVE SHELL VEHICLE SOURCE
   ============================================================ */
const NativeVehicle = {
  async connect(vehicle) {
    const caps = NativeBridge.capabilities();
    if (!NativeBridge.available) throw new Error(Caps.nativeBridge.reason);
    const ok = NativeBridge.subscribe(vehicle.id);
    Store.setVehicleIntegration(vehicle.id, "native-android", { native: { capabilities: caps, lastConnectAt: nowIso() } });
    Store.setVehicleConnection(vehicle.id, "connected",
      { adapterId: "native-android", adapterName: (Caps.nativeBridge.platform || "Native") + " vehicle API", lastError: null },
      "integration_connect", "Subscribed to the native vehicle API for “" + vehicle.nickname + "”" + (ok ? "." : " (the shell did not confirm the subscription)."));
    return { caps, subscribed: ok };
  },
  /* Asks the native shell to push its current values now (used by REFRESH). */
  async refresh(vehicleId) {
    if (!NativeBridge.available) return { ok: false, reason: Caps.nativeBridge.reason };
    const ok = NativeBridge.subscribe(vehicleId);
    let asked = false;
    try {
      const b = NativeBridge.bridge();
      if (b && typeof b.refreshVehicleData === "function") { b.refreshVehicleData(vehicleId); asked = true; }
    } catch (e) { /* the shell decides */ }
    return { ok: true, reason: asked ? "Asked the native layer for fresh values." : "Subscribed; the native layer pushes values when it has them." };
  },

  async disconnect(vehicleId) {
    NativeBridge.unsubscribe(vehicleId);
    VehicleLive.snapshot(vehicleId);
    Store.setVehicleConnection(vehicleId, "not_connected", { adapterId: null, lastError: null },
      "vehicle_disconnect", "Unsubscribed from the native vehicle API.");
  }
};

/* ============================================================
   HOST-DEVICE GPS (location field only)
   ============================================================ */
const HostGps = {
  watchId: null,
  vehicleId: null,

  async enable(vehicle) {
    if (!navigator.geolocation) throw new Error("This runtime exposes no Geolocation API.");
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, err => reject(new Error(
        err.code === 1 ? "Location permission was denied, so no position can be shown."
        : err.code === 2 ? "The device could not get a position fix right now."
        : "The location request timed out.")), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
    this.push(vehicle.id, pos);
    this.stop();
    this.vehicleId = vehicle.id;
    this.watchId = navigator.geolocation.watchPosition(p => this.push(vehicle.id, p), () => {}, { enableHighAccuracy: true, maximumAge: 5000 });
    Store.setVehicleIntegration(vehicle.id, vehicle.connection.adapterId || "host-gps", { gps: true });
    const v = Store.getVehicle(vehicle.id);
    if (v && v.connection.status !== "connected") {
      Store.setVehicleConnection(vehicle.id, "partial", {
        adapterId: "host-gps", adapterName: "This device's GPS only",
        lastError: null
      }, "integration_connect",
      "Enabled host-device GPS for “" + vehicle.nickname + "”. Only the Location field comes from this source; it is the position of the device you are carrying, not data from the vehicle.");
    }
    return true;
  },

  /* One explicit position request (used by REFRESH when GPS is the source). */
  async refresh(vehicleId) {
    if (!navigator.geolocation) return { ok: false, reason: "This runtime exposes no Geolocation API." };
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, err => reject(new Error(
          err.code === 1 ? "Location permission was denied." : "No position fix is available right now.")),
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
      });
      this.push(vehicleId, pos);
      return { ok: true, reason: "Fresh position received from this device." };
    } catch (e) {
      return { ok: false, reason: (e && e.message) || "The device could not get a position fix." };
    }
  },

  push(vehicleId, pos) {
    if (!pos || !pos.coords) return;
    const c = pos.coords;
    const text = c.latitude.toFixed(5) + ", " + c.longitude.toFixed(5) + " (±" + Math.round(c.accuracy || 0) + " m)";
    VehicleLive.ingest(vehicleId, {
      location: { value: text, unit: "", at: new Date(pos.timestamp || Date.now()).toISOString(), note: "Host device GPS · accuracy ±" + Math.round(c.accuracy || 0) + " m" }
    }, "host-gps");
    if (typeof VehicleLive.onChange === "function") VehicleLive.onChange(vehicleId);
  },

  stop(vehicleId) {
    if (this.watchId != null) { try { navigator.geolocation.clearWatch(this.watchId); } catch (e) {} }
    this.watchId = null;
    const s = VehicleLive.sessions[this.vehicleId || vehicleId];
    if (s) delete s.fields.location;
    const id = this.vehicleId || vehicleId;
    if (id) { Store.setVehicleIntegration(id, null, { gps: false }); }
    this.vehicleId = null;
  },
  async disable(vehicleId) {
    this.stop(vehicleId);
    const v = Store.getVehicle(vehicleId);
    if (v && v.connection.adapterId === "host-gps") {
      Store.setVehicleConnection(vehicleId, "disconnected", { adapterId: null, adapterName: null, lastError: null },
        "vehicle_disconnect", "Host-device GPS was switched off for “" + v.nickname + "”.");
    }
    UI.toast("GPS off", "The location field will be empty until you enable a source again.", "ok");
    UI.refresh();
  }
};

/* ============================================================
   CONNECT VEHICLE — the Connection Center
   ------------------------------------------------------------
   The registry below is the single source of truth for what this
   runtime can honestly do. Availability is probed, never claimed.
   ============================================================ */
const Integrations = {

  /* True as soon as one method is genuinely usable on this runtime. */
  anyMethodAvailable() {
    return Adapters.list().some(a => a.availability().ok);
  },

  /* The five-state verdict for a vehicle, plus the copy that goes with it. */
  connectionState(v) {
    return vehicleConnState(v);
  },

  markLost(vehicleId, why) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    if (v.connection.status === "connected" || v.connection.status === "partial") {
      const st = VehicleLive.status(vehicleId);
      VehicleLive.snapshot(vehicleId);
      Store.setVehicleConnection(vehicleId, "lost", { lastError: why || "The integration stopped answering." },
        "vehicle_disconnect", "Lost the link for “" + v.nickname + "”. " + (why || "") +
        (st.lastAt ? " Last real reading " + relTime(st.lastAt) + " stays visible, timestamped." : ""));
      UI.toast("Vehicle connection lost", why || "The integration stopped answering.", "warn");
      if (typeof VehicleLive.onChange === "function") VehicleLive.onChange(vehicleId);
    }
  },

  /* [ REFRESH DATA ] — asks the live integration for fresh values. */
  async refresh(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return { ok: false, reason: "Vehicle not found." };
    const adapterId = v.connection.adapterId || v.integration.activeAdapterId;
    const state = vehicleConnState(v);
    if (!adapterId || state.id === "not_connected" || state.id === "unsupported") {
      return { ok: false, reason: "No active integration to refresh. Connect a supported source first." };
    }
    const before = VehicleLive.lastUpdatedAt(vehicleId);
    try {
      if (adapterId === "obd-ii" || adapterId === "obd-ble") {
        const r = await ObdBle.pollOnce(vehicleId);
        if (!r.ok) { this.markLost(vehicleId, r.reason); return r; }
      } else if (adapterId === "manufacturer" || adapterId === "http") {
        const r = await HttpTelemetry.pollOnce(vehicleId);
        if (!r.ok) { this.markLost(vehicleId, r.reason); return r; }
      } else if (adapterId === "native-android" || adapterId === "native") {
        const r = await NativeVehicle.refresh(vehicleId);
        if (!r.ok) { this.markLost(vehicleId, r.reason); return r; }
      } else if (adapterId === "bluetooth" && ObdBle.device) {
        const r = await ObdBle.probeTelemetry(vehicleId);
        if (!r.ok) return r;
      } else if (adapterId === "host-gps") {
        const r = await HostGps.refresh(vehicleId);
        if (!r.ok) return r;
      } else {
        return { ok: false, reason: "That integration is no longer attached. Reconnect it from Connect vehicle." };
      }
      const after = VehicleLive.lastUpdatedAt(vehicleId);
      return {
        ok: true,
        updated: !!(after && after !== before),
        at: after,
        reason: (after && after !== before)
          ? "Fresh values received from " + (v.connection.adapterName || "the integration") + "."
          : "The integration answered but had no new values to report."
      };
    } catch (e) {
      const why = (e && e.message) || "The integration could not be reached.";
      this.markLost(vehicleId, why);
      return { ok: false, reason: why };
    }
  },
  /* ============================================================
     CONNECTION CENTER — [ + CONNECT VEHICLE ]
     A clean selection screen. Every method shows its real status on
     this runtime; a method that is not implemented here is listed as
     UNSUPPORTED with the reason, and cannot be selected.
     ============================================================ */
  methodStatus(v, a) {
    const av = a.availability();
    const active = v.connection.adapterId === a.id && (v.connection.status === "connected" || v.connection.status === "partial");
    const aliased = Adapters.aliases[v.connection.adapterId] === a.id;
    const isActive = active || (aliased && (v.connection.status === "connected" || v.connection.status === "partial"));
    if (isActive) return { label: "CONNECTED", kind: "ok", ok: av.ok, active: true, reason: av.reason };
    if (!av.ok) return { label: "UNSUPPORTED", kind: "warn", ok: false, active: false, reason: av.reason };
    if (a.configured && a.configured(v)) return { label: "READY TO RECONNECT", kind: "accent", ok: true, active: false, reason: av.reason };
    return { label: "NOT CONNECTED", kind: "", ok: true, active: false, reason: av.reason };
  },

  methodRow(v, a) {
    const st = this.methodStatus(v, a);
    const summary = a.configSummary ? a.configSummary(v) : null;
    return '<div class="adapter' + (st.ok ? " ready" : "") + (st.active ? " on" : "") + '" data-adapter="' + esc(a.id) + '">' +
      '<div class="adapter-ico">' + icon(a.icon, 18) + "</div>" +
      '<div class="adapter-body">' +
        '<div class="adapter-name">' + esc(a.name) + UI.pill(st.label, st.kind, true, st.active) + "</div>" +
        '<div class="adapter-desc">' + esc(a.blurb) + "</div>" +
        (summary ? '<div class="hint" style="margin-top:5px">' + icon("check", 11) + " " + esc(summary) + "</div>" : "") +
        (st.reason ? '<div class="hint" style="margin-top:5px;color:var(--warn)">' + esc(st.reason) + "</div>" : "") +
      "</div>" +
      '<div class="adapter-side">' +
        (st.active
          ? '<button class="btn btn-sm btn-ok" data-int-disconnect="' + esc(a.id) + '">Disconnect</button>'
          : (st.ok
              ? '<button class="btn btn-sm btn-primary" data-method="' + esc(a.id) + '">Connect</button>'
              : '<button class="btn btn-sm" disabled>Unavailable</button>')) +
        (a.kind === "vehicle" && st.ok ? '<button class="btn btn-sm btn-ghost" data-int-config="' + esc(a.id) + '">Config</button>' : "") +
      "</div></div>";
  },

  async connectFlow(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    const methods = Adapters.list();
    const extras = Adapters.extras();
    const available = methods.filter(a => a.availability().ok);
    const state = vehicleConnState(v);

    UI.modal({
      wide: true,
      body: [
        '<div class="sheet-head"><div><h3>Connect vehicle</h3><div class="sub">' + esc(v.nickname) + " · " + esc(vehType(v.type).label) +
          " — choose the way real data should reach this dashboard. Only methods that actually work on this runtime can be selected.</div></div></div>",

        UI.notice("<b>Current status: " + esc(state.label) + ".</b> " + esc(state.message), state.kind === "ok" ? "ok" : (state.kind === "bad" ? "bad" : ""), state.kind === "ok" ? "check" : "info"),

        '<div class="mini-label" style="margin-top:4px">Connection methods</div>',
        '<div class="stack" style="margin-top:10px">' + methods.map(a => this.methodRow(v, a)).join("") + "</div>",

        '<div class="mini-label" style="margin-top:18px">Additional sources</div>',
        '<div class="stack" style="margin-top:10px">' + extras.map(a => this.methodRow(v, a)).join("") + "</div>",

        (available.length
          ? ""
          : UI.notice("<b>Vehicle integration is not available in this version.</b> This browser exposes no way to reach a vehicle, so live telemetry stays off. Your vehicle profile, reminders, insurance and service history keep working exactly as they are.", "warn", "warn")),

        '<div class="hr"></div>',
        '<div class="sub" style="line-height:1.6">' + icon("shield", 12) + " Every reader on these screens works only with values an integration actually sends. Nothing is estimated, simulated or filled in — a field with no data shows “Not available”.</div>",
        '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Close</button></div>'
      ].join(""),
      onMount: (sheet, close) => {
        $$("[data-method]", sheet).forEach(b => b.addEventListener("click", () => { close(); this.methodScreen(vehicleId, b.dataset.method); }));
        $$("[data-int-config]", sheet).forEach(b => b.addEventListener("click", () => { close(); this.configFlow(vehicleId, b.dataset.intConfig); }));
        $$("[data-int-disconnect]", sheet).forEach(b => b.addEventListener("click", async () => {
          const a = Adapters.byId(b.dataset.intDisconnect);
          if (!a) return;
          b.disabled = true;
          await Integrations.disconnectVehicle(vehicleId);
          close();
          UI.toast("Disconnected", "The integration was closed. Your profile and history are untouched.", "ok");
          if (Router.current === "vehicle") UI.refresh();
          void a;
        }));
      }
    });
  },

  async methodScreen(vehicleId, methodId) {
    if (methodId === "bluetooth") return this.bluetoothScreen(vehicleId);
    if (methodId === "obd-ii") return this.obdScreen(vehicleId);
    if (methodId === "manufacturer") return this.manufacturerScreen(vehicleId);
    if (methodId === "native-android") return this.nativeScreen(vehicleId);
    if (methodId === "host-gps") return this.gpsScreen(vehicleId);
    return this.connectFlow(vehicleId);
  },

  /* ── BLUETOOTH ───────────────────────────────────────────── */
  bluetoothScreen(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    const av = Adapters.bluetooth.availability();
    const cfg = (v.integration.config && v.integration.config.ble) || {};
    const active = v.connection.adapterId === "bluetooth" && (v.connection.status === "connected" || v.connection.status === "partial");
    const live = VehicleLive.status(vehicleId);

    UI.modal({
      wide: true,
      body: [
        '<div class="sheet-head"><div class="card-ico">' + icon("bluetooth", 18) + "</div><div><h3>Bluetooth</h3>" +
          '<div class="sub">Connect a supported Bluetooth vehicle interface.</div></div></div>',

        (av.ok
          ? ""
          : UI.notice("<b>Unsupported on this runtime.</b> " + esc(av.reason || "This browser does not expose the Web Bluetooth API."), "warn", "warn")),

        '<div class="kpi-strip" style="margin-bottom:14px">' +
          '<div class="kpi"><span class="kpi-ico">' + icon("bluetooth", 15) + '</span><div><div class="kpi-v">' + (active ? "Connected" : "Not connected") + '</div><div class="kpi-l">Link state</div></div></div>' +
          '<div class="kpi"><span class="kpi-ico">' + icon("gauge", 15) + '</span><div><div class="kpi-v">' + (live.liveFields ? live.liveFields + " field(s)" : "None") + '</div><div class="kpi-l">Vehicle data</div></div></div>' +
        "</div>",

        (cfg.deviceName
          ? '<div class="row"><span class="avatar sm">' + icon("chip", 16) + '</span><div class="grow"><div class="name">' + esc(cfg.deviceName) + '</div><div class="meta">' + esc(cfg.services || 0) + " services seen · last linked " + esc(relTime(cfg.lastConnectAt)) + "</div></div></div>"
          : '<div class="sub">No interface linked yet.</div>'),

        UI.notice("A Bluetooth link is a link to a <b>device</b>, not to your vehicle's telemetry. This app only shows readings if the interface actually answers with them — a connected device with no vehicle channel stays at “Connected — waiting for vehicle data”.", "", "info"),

        '<div id="bleOut" style="margin-top:12px"></div>',
        '<div class="sheet-foot" style="gap:8px">' +
          '<button class="btn btn-ghost" data-back="1">Back</button>' +
          (active
            ? '<button class="btn btn-danger" data-ble-disconnect="1">Disconnect</button>'
            : '<button class="btn btn-primary" data-ble-connect="1"' + (av.ok ? "" : " disabled") + ">" + icon("bluetooth", 15) + " Connect Bluetooth device</button>") +
        "</div>"
      ].join(""),
      onMount: (sheet, close) => {
        $$("[data-back]", sheet).forEach(b => b.addEventListener("click", () => { close(); this.connectFlow(vehicleId); }));
        const out = $("#bleOut", sheet);
        const dis = $$("[data-ble-disconnect]", sheet)[0];
        if (dis) dis.addEventListener("click", async () => {
          dis.disabled = true;
          await Integrations.disconnectVehicle(vehicleId);
          close(); this.connectFlow(vehicleId);
          if (Router.current === "vehicle") UI.refresh();
        });
        const go = $$("[data-ble-connect]", sheet)[0];
        if (go) go.addEventListener("click", async () => {
          go.disabled = true;
          go.innerHTML = icon("refresh", 14, "spin") + " Requesting device…";
          out.innerHTML = UI.notice("The browser is asking you to choose a device. Nothing is scanned or picked automatically.", "", "info");
          try {
            const r = await BleVehicle.connect(Store.getVehicle(vehicleId));
            out.innerHTML = r.speaksObd
              ? UI.notice("<b>Linked to “" + esc(r.device || "device") + "”.</b> This interface answered the standard OBD-II exchange, so real values can now be requested. Open OBD-II and press CONNECT OBD-II to read them.", "ok", "check")
              : UI.notice("<b>Linked to “" + esc(r.device || "device") + "”.</b> The link is open, but this interface did not answer the standard OBD-II exchange, so no vehicle values can be read from it yet.<br>Status: <b>Connected — waiting for vehicle data.</b> If it is an OBD-II dongle, use the OBD-II method instead.", "warn", "warn");
            if (Router.current === "vehicle") UI.refresh();
            go.disabled = false;
            go.innerHTML = icon("bluetooth", 15) + " Connect another device";
          } catch (e) {
            out.innerHTML = UI.notice("<b>Not connected.</b> " + esc((e && e.message) || "The device link failed."), "bad", "warn");
            go.disabled = false;
            go.innerHTML = icon("bluetooth", 15) + " Connect Bluetooth device";
          }
        });
      }
    });
  },

  /* ── OBD-II ──────────────────────────────────────────────── */
  obdScreen(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    const av = Adapters.obd2.availability();
    const cfg = (v.integration.config && v.integration.config.obd) || {};
    const active = v.connection.adapterId === "obd-ii" && (v.connection.status === "connected" || v.connection.status === "partial");
    const live = VehicleLive.status(vehicleId);
    const polling = !!(ObdBle.session && ObdBle.session.vehicleId === vehicleId);

    UI.modal({
      wide: true,
      body: [
        '<div class="sheet-head"><div class="card-ico">' + icon("plug", 18) + "</div><div><h3>OBD-II</h3>" +
          '<div class="sub">Connect through a compatible OBD-II adapter.</div></div></div>',

        (av.ok
          ? ""
          : UI.notice("<b>OBD-II communication is not available in this web version.</b><br>" + esc(av.reason || "This browser cannot open a Bluetooth serial link to an adapter.") + " Your vehicle profile and reminders are unaffected.", "warn", "warn")),

        '<div class="kpi-strip" style="margin-bottom:14px">' +
          '<div class="kpi"><span class="kpi-ico">' + icon("plug", 15) + '</span><div><div class="kpi-v">' + (active ? "Connected" : "Not connected") + '</div><div class="kpi-l">Adapter</div></div></div>' +
          '<div class="kpi"><span class="kpi-ico">' + icon("refresh", 15) + '</span><div><div class="kpi-v">' + (polling ? "Polling " + (Store.data.settings.prefs.livePollSeconds || 2) + " s" : "Idle") + '</div><div class="kpi-l">Read loop</div></div></div>' +
          '<div class="kpi"><span class="kpi-ico">' + icon("gauge", 15) + '</span><div><div class="kpi-v">' + (live.liveFields ? live.liveFields + " of " + live.totalFields : "None") + '</div><div class="kpi-l">Fields received</div></div></div>' +
          '<div class="kpi"><span class="kpi-ico">' + icon("history", 15) + '</span><div><div class="kpi-v">' + (live.lastAt ? esc(relTime(live.lastAt)) : "—") + '</div><div class="kpi-l">Last value</div></div></div>' +
        "</div>",

        (cfg.btDeviceName ? '<div class="row"><span class="avatar sm">' + icon("chip", 16) + '</span><div class="grow"><div class="name">' + esc(cfg.btDeviceName) + '</div><div class="meta">' + esc(cfg.protocol || "protocol not recorded") + " · last linked " + esc(relTime(cfg.lastConnectAt)) + "</div></div></div>" : ""),

        UI.notice("This reader speaks the real ELM327 protocol. Only the PIDs your ECU actually answers are shown; unsupported or missing values stay at “Not available”. If the adapter is linked but silent, the status becomes CONNECTION LOST rather than pretending.", "", "info"),

        '<div id="obdOut" style="margin-top:12px"></div>',
        '<div class="btn-row" style="margin-top:12px">' +
          '<button class="btn btn-sm btn-ghost" data-int-config="obd-ii">Custom PIDs</button>' +
          (active ? '<button class="btn btn-sm" data-obd-refresh="1">' + icon("refresh", 13) + " Refresh data</button>" : "") +
        "</div>",
        '<div class="sheet-foot" style="gap:8px">' +
          '<button class="btn btn-ghost" data-back="1">Back</button>' +
          (active
            ? '<button class="btn btn-danger" data-obd-disconnect="1">Disconnect OBD-II</button>'
            : '<button class="btn btn-primary" data-obd-connect="1"' + (av.ok ? "" : " disabled") + ">" + icon("plug", 15) + " Connect OBD-II</button>") +
        "</div>"
      ].join(""),
      onMount: (sheet, close) => {
        $$("[data-back]", sheet).forEach(b => b.addEventListener("click", () => { close(); this.connectFlow(vehicleId); }));
        $$("[data-int-config]", sheet).forEach(b => b.addEventListener("click", () => { close(); this.configFlow(vehicleId, "obd-ii"); }));
        const out = $("#obdOut", sheet);
        const dis = $$("[data-obd-disconnect]", sheet)[0];
        if (dis) dis.addEventListener("click", async () => {
          dis.disabled = true;
          await Integrations.disconnectVehicle(vehicleId);
          close(); this.connectFlow(vehicleId);
          if (Router.current === "vehicle") UI.refresh();
        });
        const ref = $$("[data-obd-refresh]", sheet)[0];
        if (ref) ref.addEventListener("click", async () => {
          ref.disabled = true;
          const r = await Integrations.refresh(vehicleId);
          out.innerHTML = UI.notice(esc(r.reason), r.ok ? ((r.received && r.received.length) ? "ok" : "") : "warn", r.ok ? "check" : "warn");
          ref.disabled = false;
          if (Router.current === "vehicle") UI.refresh();
        });
        const go = $$("[data-obd-connect]", sheet)[0];
        if (go) go.addEventListener("click", async () => {
          go.disabled = true;
          go.innerHTML = icon("refresh", 14, "spin") + " Choosing adapter…";
          out.innerHTML = UI.notice("Pick your OBD-II adapter in the browser's chooser. The app then runs the real AT handshake and asks the ECU which PIDs it supports.", "", "info");
          try {
            const r = await ObdBle.connect(Store.getVehicle(vehicleId));
            out.innerHTML = UI.notice("<b>Connected to “" + esc(r.device || "adapter") + "”.</b> Handshake: " + r.steps.length + " AT commands, protocol " + esc(ObdBle.protocol || "default") +
              (r.vin ? " · ECU VIN " + esc(r.vin) : "") + ".<br>Readings appear only as the ECU answers them.", "ok", "check");
            if (Router.current === "vehicle") UI.refresh();
            go.disabled = false;
            go.innerHTML = icon("plug", 15) + " Reconnect adapter";
          } catch (e) {
            out.innerHTML = UI.notice("<b>Not connected.</b> " + esc((e && e.message) || "The adapter link failed."), "bad", "warn");
            go.disabled = false;
            go.innerHTML = icon("plug", 15) + " Connect OBD-II";
          }
        });
      }
    });
  },

  /* ── MANUFACTURER API ────────────────────────────────────── */
  manufacturerScreen(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    const av = Adapters.manufacturer.availability();
    const cfg = (v.integration.config && v.integration.config.http) || {};
    const active = v.connection.adapterId === "manufacturer" && v.connection.status === "connected";

    UI.modal({
      wide: true,
      body: [
        '<div class="sheet-head"><div class="card-ico">' + icon("cloud", 18) + "</div><div><h3>Manufacturer API</h3>" +
          '<div class="sub">Use an officially supported vehicle API.</div></div></div>',
        (av.ok ? "" : UI.notice("<b>Unsupported on this runtime.</b> " + esc(av.reason || "This runtime cannot make the request."), "warn", "warn")),
        UI.notice("Point this at an API you are entitled to use — a manufacturer fleet endpoint or a telematics gateway. The app reads the JSON it returns and shows only the fields that are actually present; it never invents the rest.", "", "info"),
        '<div class="form" style="margin-top:12px">',
          '<div class="field"><label>Endpoint URL</label><input class="input" id="mUrl" placeholder="https://api.example.com/vehicle/123/telemetry" value="' + esc(cfg.url || "") + '"></div>',
          '<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">',
            '<div class="field"><label>Auth header name</label><input class="input" id="mHeader" placeholder="authorization" value="' + esc(cfg.headerName || "") + '"></div>',
            '<div class="field"><label>Token</label><input class="input" id="mToken" placeholder="optional" value="' + esc(cfg.token || "") + '"></div>',
          "</div>",
          '<div class="field"><label>Poll interval (seconds)</label><input class="input" type="number" min="5" max="3600" id="mInterval" value="' + esc(String(cfg.intervalSec || 15)) + '"></div>',
        "</div>",
        '<div class="hint" style="margin-top:8px">Expected keys (any subset): <span class="mono">' + FIELD_ORDER.join(", ") + "</span></div>",
        '<div id="mOut" style="margin-top:12px"></div>',
        '<div class="sheet-foot" style="gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn-ghost" data-back="1">Back</button>' +
          '<button class="btn btn-sm" data-m-test="1">' + icon("ping", 14) + " Test request</button>" +
          (active
            ? '<button class="btn btn-danger" data-m-disconnect="1">Disconnect</button>'
            : '<button class="btn btn-primary" data-m-connect="1"' + (av.ok ? "" : " disabled") + ">" + icon("cloud", 15) + " Save &amp; connect</button>") +
        "</div>"
      ].join(""),
      onMount: (sheet, close) => {
        const read = () => ({
          url: $("#mUrl", sheet).value.trim(),
          headerName: $("#mHeader", sheet).value.trim(),
          token: $("#mToken", sheet).value,
          intervalSec: clamp(Number($("#mInterval", sheet).value) || 15, 5, 3600)
        });
        const out = $("#mOut", sheet);
        $$("[data-back]", sheet).forEach(b => b.addEventListener("click", () => { close(); this.connectFlow(vehicleId); }));
        $$("[data-m-test]", sheet).forEach(b => b.addEventListener("click", async () => {
          const c = read();
          if (!safeUrl(c.url)) { out.innerHTML = UI.notice("Enter a valid https:// URL first.", "warn", "warn"); return; }
          b.disabled = true; b.innerHTML = icon("refresh", 14, "spin") + " Testing…";
          try {
            const payload = await HttpTelemetry.probe(c.url, c.headerName, c.token);
            const data = HttpTelemetry.extract(payload);
            const keys = Object.keys(data || {}).filter(k => FIELD_ORDER.indexOf(k) > -1);
            out.innerHTML = UI.notice("<b>API answered.</b> " + keys.length + " usable field(s): " + (keys.map(k => k + "=" + JSON.stringify(data[k])).join(", ") || "none") +
              (keys.length ? "" : "<br>The response had no keys from the supported list, so nothing would be displayed.<br>Received: " + Object.keys(payload || {}).slice(0, 12).join(", ")), keys.length ? "ok" : "warn");
          } catch (e) {
            out.innerHTML = UI.notice("<b>Request failed.</b> " + esc(e.message) + "<br>Browsers block this when the API does not send CORS headers — a limitation of that API, not of this app.", "bad", "warn");
          } finally { b.disabled = false; b.innerHTML = icon("ping", 15) + " Test request"; }
        }));
        const dis = $$("[data-m-disconnect]", sheet)[0];
        if (dis) dis.addEventListener("click", async () => {
          dis.disabled = true;
          await Integrations.disconnectVehicle(vehicleId);
          close(); this.connectFlow(vehicleId);
          if (Router.current === "vehicle") UI.refresh();
        });
        const go = $$("[data-m-connect]", sheet)[0];
        if (go) go.addEventListener("click", async () => {
          const c = read();
          if (!safeUrl(c.url)) { UI.toast("Invalid URL", "Use a full https:// address.", "warn"); return; }
          go.disabled = true; go.innerHTML = icon("refresh", 14, "spin") + " Connecting…";
          Store.setVehicleIntegration(v.id, "manufacturer", { http: Object.assign({}, cfg, c) });
          try {
            await HttpTelemetry.connect(Store.getVehicle(v.id));
            close();
            UI.toast("API connected", "Real values from your endpoint are on the dashboard.", "ok");
            if (Router.current === "vehicle") UI.refresh();
          } catch (e) {
            out.innerHTML = UI.notice("<b>Not connected.</b> " + esc(e.message), "bad", "warn");
            go.disabled = false; go.innerHTML = icon("cloud", 15) + " Save &amp; connect";
          }
        });
      }
    });
  },

  /* ── NATIVE ANDROID ──────────────────────────────────────── */
  nativeScreen(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    const av = Adapters.native.availability();
    const caps = Caps.nativeBridge;
    const active = v.connection.adapterId === "native-android" && v.connection.status === "connected";

    UI.modal({
      wide: true,
      body: [
        '<div class="sheet-head"><div class="card-ico">' + icon("chip", 18) + "</div><div><h3>Native Android</h3>" +
          '<div class="sub">Use native Android vehicle/Bluetooth integration.</div></div></div>',
        UI.notice(caps.available
          ? "<b>A native bridge is present.</b> Platform: " + esc((caps.capabilities && caps.capabilities.platform) || "Android") + "."
          : "<b>Unsupported here.</b> " + esc(av.reason || "This page is not hosted inside a native Android shell.") +
            '<br>When the same app is packaged in a native wrapper that implements <span class="mono">window.MyDeviceHubNative</span> (subscribeVehicle / vehicle data push), this method becomes available and can use the platform\'s own vehicle APIs. Nothing is faked in the meantime.', "warn", "warn"),
        (caps.capabilities && Object.keys(caps.capabilities).length
          ? '<div class="grid grid-4" style="gap:10px;margin-top:12px">' + Object.keys(caps.capabilities).slice(0, 8).map(k =>
              tile(k, esc(String(caps.capabilities[k])), "reported by the shell")).join("") + "</div>"
          : ""),
        '<div class="sheet-foot" style="gap:8px">' +
          '<button class="btn btn-ghost" data-back="1">Back</button>' +
          (active
            ? '<button class="btn btn-danger" data-n-disconnect="1">Disconnect</button>'
            : '<button class="btn btn-primary" data-n-connect="1"' + (av.ok ? "" : " disabled") + ">Connect native source</button>") +
        "</div>"
      ].join(""),
      onMount: (sheet, close) => {
        $$("[data-back]", sheet).forEach(b => b.addEventListener("click", () => { close(); this.connectFlow(vehicleId); }));
        const go = $$("[data-n-connect]", sheet)[0];
        if (go) go.addEventListener("click", async () => {
          try {
            await NativeVehicle.connect(Store.getVehicle(vehicleId));
            close(); UI.toast("Native source connected", "The bridge will push real values as it gets them.", "ok");
            if (Router.current === "vehicle") UI.refresh();
          } catch (e) { UI.toast("Not connected", (e && e.message) || "The native bridge refused the subscription.", "bad"); }
        });
        const dis = $$("[data-n-disconnect]", sheet)[0];
        if (dis) dis.addEventListener("click", async () => { await Integrations.disconnectVehicle(vehicleId); close(); this.connectFlow(vehicleId); if (Router.current === "vehicle") UI.refresh(); });
      }
    });
  },

  /* ── DEVICE GPS (location field only) ────────────────────── */
  gpsScreen(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    const av = Adapters.hostGps.availability();
    const active = !!v.integration.config.gps;
    UI.modal({
      wide: true,
      body: [
        '<div class="sheet-head"><div class="card-ico">' + icon("pin", 18) + "</div><div><h3>Device GPS</h3>" +
          '<div class="sub">Fill the Location field from the device you are carrying. Nothing else.</div></div></div>',
        (av.ok ? "" : UI.notice("<b>Unsupported on this runtime.</b> " + esc(av.reason || "No Geolocation API."), "warn", "warn")),
        UI.notice("This is the host device's position, labelled as such in the dashboard. It is <b>not</b> the vehicle's GPS, and it never fills speed, fuel or anything else.", "", "info"),
        '<div class="sheet-foot" style="gap:8px">' +
          '<button class="btn btn-ghost" data-back="1">Back</button>' +
          (active
            ? '<button class="btn btn-danger" data-g-off="1">Turn off</button>'
            : '<button class="btn btn-primary" data-g-on="1"' + (av.ok ? "" : " disabled") + ">Enable device GPS</button>") +
        "</div>"
      ].join(""),
      onMount: (sheet, close) => {
        $$("[data-back]", sheet).forEach(b => b.addEventListener("click", () => { close(); this.connectFlow(vehicleId); }));
        const on = $$("[data-g-on]", sheet)[0];
        if (on) on.addEventListener("click", async () => {
          try { await HostGps.enable(Store.getVehicle(vehicleId)); close(); UI.toast("Device GPS on", "Only the Location field is filled, and it says where it came from.", "ok"); if (Router.current === "vehicle") UI.refresh(); }
          catch (e) { UI.toast("Could not start GPS", (e && e.message) || "Permission denied.", "bad"); }
        });
        const off = $$("[data-g-off]", sheet)[0];
        if (off) off.addEventListener("click", async () => { HostGps.stop(vehicleId); close(); UI.toast("Device GPS off", "The Location field will clear.", "ok"); if (Router.current === "vehicle") UI.refresh(); });
      }
    });
  },

  /* Disconnects whatever integration is actually attached right now. */
  async disconnectVehicle(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return { ok: false };
    const id = v.connection.adapterId || v.integration.activeAdapterId;
    const a = Adapters.byId(id);
    try {
      if (id === "obd-ii" || id === "obd-ble") await ObdBle.disconnect(vehicleId);
      else if (id === "bluetooth") await BleVehicle.disconnect(vehicleId);
      else if (id === "manufacturer" || id === "http") await HttpTelemetry.disconnect(vehicleId);
      else if (id === "native-android" || id === "native") await NativeVehicle.disconnect(vehicleId);
      else if (id === "host-gps") HostGps.stop(vehicleId);
      else if (a && a.disconnect) await a.disconnect(vehicleId);
    } catch (e) { /* the stored state below still reflects reality */ }
    const after = Store.getVehicle(vehicleId);
    if (after && after.connection.status !== "not_connected" && after.connection.status !== "unsupported") {
      Store.setVehicleConnection(vehicleId, "not_connected", { adapterId: null, lastError: null },
        "vehicle_disconnect", "Disconnected the integration from “" + v.nickname + "”.");
    }
    if (typeof VehicleLive.onChange === "function") VehicleLive.onChange(vehicleId);
    return { ok: true };
  },

  configFlow(vehicleId, adapterId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    if (adapterId === "obd-ii" || adapterId === "obd-ble") return this.obdConfig(v);
    if (adapterId === "http") return this.httpConfig(v);
    return this.connectFlow(vehicleId);
  },

  obdConfig(v) {
    const cfg = (v.integration.config.obd) || {};
    UI.modal({
      wide: true,
      body: [
        '<div class="sheet-head"><div><h3>OBD-II adapter settings</h3><div class="sub">' + esc(v.nickname) + " · Bluetooth ELM327 adapters.</div></div></div>",
        '<div class="form">',
          '<div class="notice">' + icon("info", 17) + '<div style="margin-left:2px">Pairing happens in the browser\'s own chooser when you press Connect. Standard OBD-II gives speed, RPM, coolant, fuel level and control-module voltage. Tyre pressure needs a manufacturer PID — add one below.</div></div>',
          '<div class="field"><label>Saved adapter</label><input class="input" value="' + esc(cfg.btDeviceName || "none yet") + '" readonly></div>',
          switchRow("obd-showall", "Show every Bluetooth device when scanning", "By default only devices advertising a known OBD/UART service are offered, which keeps the chooser short and avoids pairing with the wrong thing.", !!cfg.showAll),
          '<div class="hr"></div>',
          '<div class="row-between"><div><div class="sw-t">Custom manufacturer PIDs</div><div class="sw-s">Needed for values outside standard OBD-II — tyre pressure, individual sensors, EV battery detail. Each row is a raw request the ECU must answer; if it does not, the field stays empty.</div></div><button class="btn btn-sm" data-add-pid="1">' + icon("plus", 13) + " Add PID</button></div>",
          '<div id="pidList" class="stack">' + ((cfg.customPids || []).map((p, i) => this.pidRowHtml(p, i)).join("") || '<div class="hint">No custom PIDs configured.</div>') + "</div>",
        "</div>",
        '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Close</button><button class="btn btn-primary" data-save-obd="1">' + icon("check", 15) + " Save settings</button></div>"
      ].join(""),
      onMount(sheet, close) {
        $$("[data-add-pid]", sheet).forEach(b => b.addEventListener("click", () => {
          const list = $("#pidList", sheet);
          const idx = $$("[data-pid-row]", sheet).length;
          const tmp = document.createElement("div");
          tmp.innerHTML = ObdBle && Adapters ? Integrations.pidRowHtml({ request: "", mode: "62", pid: "", byte: 0, len: 1, scale: 1, offset: 0, unit: "bar", field: "tyres", label: "" }, idx) : "";
          list.appendChild(tmp.firstChild);
          if (list.firstChild && list.firstChild.classList && list.firstChild.classList.contains("hint")) list.firstChild.remove();
        }));
        $$("[data-pid-del]", sheet).forEach(b => b.addEventListener("click", () => {
          const row = b.closest("[data-pid-row]");
          if (row) row.remove();
        }));
        $$("[data-save-obd]", sheet).forEach(b => b.addEventListener("click", () => {
          const pids = $$("[data-pid-row]", sheet).map(row => ({
            request: ($("[data-f=request]", row) || {}).value || "",
            mode: (($("[data-f=mode]", row) || {}).value || "62").replace(/[^0-9a-fA-F]/g, "").slice(0, 2) || "62",
            pid: (($("[data-f=pid]", row) || {}).value || "").replace(/[^0-9a-fA-F]/g, "").slice(0, 4) || "0",
            byte: Number(($("[data-f=byte]", row) || {}).value) || 0,
            len: clamp(Number(($("[data-f=len]", row) || {}).value) || 1, 1, 4),
            scale: Number(($("[data-f=scale]", row) || {}).value) || 1,
            offset: Number(($("[data-f=offset]", row) || {}).value) || 0,
            unit: ($("[data-f=unit]", row) || {}).value || "",
            field: ($("[data-f=field]", row) || {}).value || "tyres",
            label: ($("[data-f=label]", row) || {}).value || ""
          })).filter(p => /^[0-9a-fA-F]{4,}$/.test(p.request));
          const showAll = $("#obd-showall", sheet) && $("#obd-showall", sheet).classList.contains("on");
          Store.setVehicleIntegration(v.id, v.integration.activeAdapterId, { obd: Object.assign({}, cfg, { showAll, customPids: pids }) });
          Store.log("integration_config", "Saved OBD-II settings for “" + v.nickname + "” (" + pids.length + " custom PID" + (pids.length === 1 ? "" : "s") + ").", { type: "vehicle", id: v.id, name: v.nickname });
          UI.toast("Settings saved", pids.length ? pids.length + " custom PID(s) will be polled alongside the standard set." : "Standard OBD-II polling only.", "ok");
          close();
          Integrations.connectFlow(vehicleId);
        }));
      }
    });
  },

  pidRowHtml(p, i) {
    const opts = FIELD_ORDER.map(f => '<option value="' + f + '"' + (p.field === f ? " selected" : "") + ">" + esc(fieldDef(f).label) + "</option>").join("");
    return '<div class="card flat" data-pid-row="' + i + '" style="padding:12px">' +
      '<div class="row-between" style="margin-bottom:10px"><span class="mini-label">Manufacturer PID ' + (i + 1) + '</span><button class="icon-btn" style="width:28px;height:28px" data-pid-del="1" aria-label="Remove PID">' + icon("trash", 14) + "</button></div>" +
      '<div class="form-grid" style="gap:10px">' +
        '<div class="field"><label>Request (hex)</label><input class="input mono" data-f="request" value="' + esc(p.request || "") + '" placeholder="221234"></div>' +
        '<div class="field"><label>Fills field</label><select class="select" data-f="field">' + opts + "</select></div>" +
        '<div class="field"><label>Response mode</label><input class="input mono" data-f="mode" value="' + esc(p.mode || "62") + '" placeholder="62"></div>' +
        '<div class="field"><label>Response PID</label><input class="input mono" data-f="pid" value="' + esc(p.pid || "") + '" placeholder="1234"></div>' +
        '<div class="field"><label>Byte offset</label><input class="input mono" data-f="byte" type="number" min="0" max="8" value="' + esc(p.byte) + '"></div>' +
        '<div class="field"><label>Byte length</label><input class="input mono" data-f="len" type="number" min="1" max="4" value="' + esc(p.len) + '"></div>' +
        '<div class="field"><label>Scale</label><input class="input mono" data-f="scale" value="' + esc(p.scale) + '" placeholder="1"></div>' +
        '<div class="field"><label>Offset</label><input class="input mono" data-f="offset" value="' + esc(p.offset) + '" placeholder="0"></div>' +
        '<div class="field"><label>Unit</label><input class="input mono" data-f="unit" value="' + esc(p.unit || "") + '" placeholder="bar"></div>' +
        '<div class="field"><label>Label</label><input class="input" data-f="label" value="' + esc(p.label || "") + '" placeholder="Tyre pressures (FL/FR/RL/RR)"></div>' +
      "</div></div>";
  },

  httpConfig(v) {
    const cfg = (v.integration.config.http) || {};
    UI.modal({
      wide: true,
      body: [
        '<div class="sheet-head"><div><h3>Telemetry endpoint</h3><div class="sub">' + esc(v.nickname) + " · an HTTP JSON feed you already have access to.</div></div></div>",
        '<div class="notice warn">' + icon("warn", 17) + '<div style="margin-left:2px">This app will send a GET request to exactly this URL, and nothing else. Most manufacturer APIs cannot be called directly from a browser (CORS, OAuth); a small proxy of your own is usually required. A token saved here is stored unencrypted in this browser.</div></div>',
        '<div class="form" style="margin-top:14px">',
          '<div class="field"><label>Endpoint URL (https)</label><input class="input mono" id="httpUrl" value="' + esc(cfg.url || "") + '" placeholder="https://api.example.com/v1/vehicles/123/telemetry"></div>',
          '<div class="form-grid">',
            '<div class="field"><label>Auth header name</label><input class="input mono" id="httpHeader" value="' + esc(cfg.headerName || "") + '" placeholder="Authorization"></div>',
            '<div class="field"><label>Token</label><input class="input mono" id="httpToken" type="password" value="' + esc(cfg.token || "") + '" placeholder="optional"></div>',
          "</div>",
          '<div class="field"><label>Poll every (seconds)</label><input class="input mono" id="httpInterval" type="number" min="5" max="3600" value="' + esc(cfg.intervalSec || 15) + '"></div>',
          '<div class="hr"></div>',
          '<div class="mini-label">Accepted keys</div>',
          '<div class="wrap" style="margin-top:8px">' + FIELD_ORDER.map(f => '<span class="chip">' + f + "</span>").join("") + "</div>",
          '<div class="hint" style="margin-top:8px">Example: <span class="mono">{"speed": 62.4, "fuel": 48, "coolant": 88, "tyres": 2.3}</span> — anything else in the payload is ignored, and a key must carry a finite number to be used.</div>',
        "</div>",
        '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Close</button><button class="btn" data-test-http="1">' + icon("ping", 15) + " Test request</button><button class=\"btn btn-primary\" data-save-http=\"1\">" + icon("check", 15) + " Save &amp; connect</button></div>",
        '<div id="httpTestOut" style="margin-top:12px"></div>'
      ].join(""),
      onMount(sheet, close) {
        const read = () => ({
          url: $("#httpUrl", sheet).value.trim(),
          headerName: $("#httpHeader", sheet).value.trim(),
          token: $("#httpToken", sheet).value,
          intervalSec: clamp(Number($("#httpInterval", sheet).value) || 15, 5, 3600)
        });
        $$("[data-test-http]", sheet).forEach(b => b.addEventListener("click", async () => {
          const c = read();
          const out = $("#httpTestOut", sheet);
          if (!safeUrl(c.url)) { out.innerHTML = UI.notice("Enter a valid https:// URL first.", "warn", "warn"); return; }
          b.disabled = true; b.innerHTML = icon("refresh", 14, "spin") + " Testing…";
          try {
            const payload = await HttpTelemetry.probe(c.url, c.headerName, c.token);
            const data = HttpTelemetry.extract(payload);
            const keys = Object.keys(data || {}).filter(k => FIELD_ORDER.indexOf(k) > -1);
            out.innerHTML = UI.notice("<b>Endpoint answered.</b> " + keys.length + " usable field(s): " + (keys.map(k => k + "=" + JSON.stringify(data[k])).join(", ") || "none") +
              (keys.length ? "" : "<br>The response contained no keys from the supported list, so nothing would be displayed.<br>Received keys: " + Object.keys(payload || {}).slice(0, 12).join(", ")), keys.length ? "ok" : "warn");
          } catch (e) {
            out.innerHTML = UI.notice("<b>Request failed.</b> " + esc(e.message) + "<br>A browser blocks this if the endpoint does not send CORS headers — that is a limitation of the endpoint, not of this app.", "bad", "warn");
          } finally { b.disabled = false; b.innerHTML = icon("ping", 15) + " Test request"; }
        }));
        $$("[data-save-http]", sheet).forEach(b => b.addEventListener("click", async () => {
          const c = read();
          if (!safeUrl(c.url)) { UI.toast("Invalid URL", "Use a full https:// address.", "warn"); return; }
          Store.setVehicleIntegration(v.id, "http", { http: Object.assign({}, cfg, c) });
          close();
          try {
            await HttpTelemetry.connect(Store.getVehicle(v.id));
            UI.toast("Endpoint connected", "Real values from your endpoint are now on the dashboard.", "ok");
          } catch (e) {
            UI.toast("Endpoint not connected", e.message, "bad");
          }
          Integrations.connectFlow(vehicleId);
          if (Router.current === "vehicle") UI.refresh();
        }));
      }
    });
  }
};
