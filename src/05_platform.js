/* ============================================================
   PLATFORM LAYER — one rule: real data, or an honest limitation.
   Nothing here is ever simulated.
   ============================================================ */
const Platform = {
  touch: ("ontouchstart" in window) || (navigator.maxTouchPoints || 0) > 0,
  secure: window.isSecureContext !== false,
  ua: {
    android: /Android/i.test(navigator.userAgent),
    ios: /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && (navigator.maxTouchPoints || 0) > 1),
    standalone: (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true
  },
  get platformLabel() {
    if (this.ua.android) return "Android";
    if (this.ua.ios) return "iOS / iPadOS";
    return "Desktop browser";
  }
};

/* ------------------------------------------------------------
   BLUETOOTH  (Web Bluetooth — what a web page can really do)
   ------------------------------------------------------------ */
const BT = {
  state: "unknown",          // supported | unsupported | insecure | unavailable | off
  reason: "",
  availability: null,        // from navigator.bluetooth.getAvailability() when available
  device: null,              // the single live BluetoothDevice granted by the user
  linkedProfileId: null,
  lastError: null,
  busy: false,
  gattServices: null,
  listeners: [],

  get nav() { return navigator.bluetooth || null; },

  async probe() {
    this.lastError = null;
    if (!this.nav) {
      this.state = "unsupported";
      this.reason = Platform.ua.ios
        ? "Safari and every iOS browser do not expose the Web Bluetooth API."
        : "This browser does not expose the Web Bluetooth API. Chrome, Edge and Opera on desktop or Android do.";
      return this.status();
    }
    if (!Platform.secure) {
      this.state = "insecure";
      this.reason = "Web Bluetooth only works on a secure HTTPS origin (or localhost).";
      return this.status();
    }
    if (typeof this.nav.getAvailability === "function") {
      try {
        this.availability = await this.nav.getAvailability();
        if (this.availability === false) {
          this.state = "unavailable";
          this.reason = "The browser reports that no Bluetooth adapter is available to this page. On some systems the browser also reports false until the first permission prompt.";
          return this.status();
        }
      } catch (e) { this.availability = null; }
    }
    this.state = "supported";
    this.reason = "";
    return this.status();
  },
  status() {
    const map = {
      supported:   { label: "Bluetooth Available",   kind: "ok",   text: "This browser exposes the Web Bluetooth API and reports a usable adapter." },
      unavailable: { label: "Bluetooth Unavailable", kind: "warn", text: "No Bluetooth adapter is reported by the browser. You can still keep device profiles." },
      unsupported: { label: "Bluetooth Unsupported", kind: "bad",  text: "This platform cannot access Bluetooth from a web page." },
      insecure:    { label: "Needs HTTPS",           kind: "bad",  text: "Bluetooth is blocked because this page is not on a secure origin." },
      unknown:     { label: "Checking…",             kind: "",     text: "" }
    };
    return Object.assign({ state: this.state, detail: this.reason }, map[this.state] || map.unknown);
  },

  /* --- remember previously granted devices across sessions (browser-managed list) --- */
  async remembered() {
    if (!this.nav || typeof this.nav.getDevices !== "function") return { supported: false, devices: [] };
    try {
      const list = await this.nav.getDevices();
      return { supported: true, devices: list };
    } catch (e) {
      return { supported: false, devices: [], error: e.message };
    }
  },

  async matchProfile(profile) {
    const rem = await this.remembered();
    if (!rem.supported) return null;
    if (profile.btDeviceId) {
      const hit = rem.devices.find(d => d.id === profile.btDeviceId);
      if (hit) return hit;
    }
    if (profile.btDeviceName) {
      const hit = rem.devices.find(d => d.name && d.name.toLowerCase() === profile.btDeviceName.toLowerCase());
      if (hit) return hit;
    }
    return null;
  },

  async scan() {
    if (!this.nav || !Platform.secure) { await this.probe(); return null; }
    this.busy = true; this.lastError = null;
    try {
      const opts = {
        acceptAllDevices: true,
        optionalServices: []
      };
      const dev = await this.nav.requestDevice(opts);
      this.device = dev;
      this.attach(dev);
      await this.probe();
      return dev;
    } catch (e) {
      this.lastError = this.describe(e);
      if (e && e.name !== "NotFoundError") Store.log("security_notice", "Bluetooth scan could not start: " + this.lastError, null);
      throw e;
    } finally {
      this.busy = false;
    }
  },

  attach(dev) {
    if (!dev || !dev.addEventListener) return;
    dev.addEventListener("gattserverdisconnected", () => {
      const p = Store.getDevice(this.linkedProfileId || "");
      const name = dev.name || "Bluetooth device";
      this.gattServices = null;
      if (p) Store.setDeviceStatus(p.id, "disconnected", { live: { lastDisconnectedAt: nowIso(), gattServices: null }, log: { action: "device_disconnect", detail: "The live link to “" + name + "” ended while the page was open (device moved away, powered off, or closed the connection)." } });
      UI.toast("Disconnected", name + " is no longer connected.", "warn");
      UI.refresh();
    });
  },

  async connect(dev) {
    if (!dev || !dev.gatt) throw new Error("This device entry has no GATT server handle.");
    const server = await dev.gatt.connect();
    let services = [];
    try {
      const prim = await server.getPrimaryServices();
      services = prim.map(s => s.uuid);
    } catch (e) { services = []; }
    this.gattServices = services;
    return { server, services };
  },

  async link(profile, btDev) {
    const res = await this.connect(btDev);
    this.device = btDev;
    this.linkedProfileId = profile.id;
    this.attach(btDev);
    const svcNote = res.services.length ? " Exposed " + res.services.length + " GATT service(s)." : " The device exposed no readable GATT services.";
    Store.setDeviceStatus(profile.id, "connected", {
      live: { linkedName: btDev.name || "Unnamed Bluetooth device", linkedAt: nowIso(), lastConnectedAt: nowIso(), lastError: null, gattServices: res.services },
      log: { action: "device_connect", detail: "Connected to “" + (btDev.name || "unnamed device") + "” over real Web Bluetooth GATT." + svcNote }
    });
    Store.updateDevice(profile.id, { btDeviceId: btDev.id, btDeviceName: btDev.name || null });
    return res;
  },

  async pairNew(profile) {
    const dev = await this.nav.requestDevice({ acceptAllDevices: true });
    const res = await this.link(profile, dev);
    this.availability = true; this.state = "supported"; this.reason = "";
    return { dev, res };
  },

  disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
      return true;
    }
    this.device = null;
    this.gattServices = null;
    return false;
  },

  /* Standard GATT Device Information Service — where a peripheral publishes it,
     these values are real device-reported strings (not guesses). */
  async readDeviceInfo() {
    const dev = this.device;
    if (!dev || !dev.gatt || !dev.gatt.connected) return { ok: false, reason: "No live Bluetooth connection." };
    const chars = { 0x2a29: "manufacturer", 0x2a24: "model", 0x2a26: "firmware", 0x2a25: "serial", 0x2a27: "hardware", 0x2a28: "software" };
    const out = {};
    try {
      const svc = await dev.gatt.getPrimaryService("device_information");
      const list = await svc.getCharacteristics();
      for (const ch of list) {
        const key = chars[Number(ch.uuid.length === 4 ? parseInt(ch.uuid, 16) : 0)];
        if (!key || !ch.readValue) continue;
        try {
          const val = await ch.readValue();
          out[key] = new TextDecoder("utf-8").decode(val.buffer).replace(/\u0000+$/, "").trim();
        } catch (e) { /* characteristic present but not readable — ignored, never invented */ }
      }
      if (!Object.keys(out).length) return { ok: false, reason: "The device exposes a Device Information Service but no readable fields." };
      return { ok: true, info: out };
    } catch (e) {
      return { ok: false, reason: "This device does not publish the standard GATT Device Information Service, so the browser cannot read its manufacturer, model or firmware." };
    }
  },

  /* Enumerate everything the page is allowed to see on the live connection. */
  async enumerate() {
    const dev = this.device;
    if (!dev || !dev.gatt || !dev.gatt.connected) return [];
    try {
      const services = await dev.gatt.getPrimaryServices();
      const out = [];
      for (const svc of services) {
        const entry = { uuid: svc.uuid, chars: [] };
        try {
          const list = await svc.getCharacteristics();
          entry.chars = list.map(c => ({ uuid: c.uuid, props: Object.keys(c.properties || {}).filter(k => c.properties[k] === true) }));
        } catch (e) {}
        out.push(entry);
      }
      return out;
    } catch (e) { return []; }
  },

  describe(e) {
    if (!e) return "Unknown error.";
    switch (e.name) {
      case "NotFoundError":        return "No device was selected. The chooser was closed or cancelled.";
      case "SecurityError":        return "The browser blocked the request. Web Bluetooth needs HTTPS and a direct tap on the button.";
      case "NotSupportedError":    return "This browser build has Bluetooth disabled by policy or by the user's setting.";
      case "InvalidStateError":    return "The browser is already showing a chooser, or the device is busy.";
      case "NetworkError":         return "The Bluetooth connection attempt failed (the device did not respond).";
      case "AbortError":           return "The connection attempt was aborted.";
      default: return e.message || String(e);
    }
  },

  /* real battery info where the GATT Battery Service is exposed by the device */
  async readBattery() {
    const dev = this.device;
    if (!dev || !dev.gatt || !dev.gatt.connected) return { ok: false, reason: "No live Bluetooth connection." };
    try {
      const svc = await dev.gatt.getPrimaryService("battery_service");
      const ch = await svc.getCharacteristic("battery_level");
      const val = await ch.readValue();
      return { ok: true, level: val.getUint8(0) };
    } catch (e) {
      return { ok: false, reason: "This device does not expose the standard GATT Battery Service, so the browser cannot read its battery level." };
    }
  }
};

/* ------------------------------------------------------------
   NATIVE BRIDGE — for a real Android wrapper (WebView JS interface)
   This build ships no native shell, so the bridge is only ever used
   when the host app genuinely injects one. Nothing is simulated.
   ------------------------------------------------------------ */
const NativeBridge = {
  /* A native wrapper can expose any of these globals (Android
     addJavascriptInterface or a promise-based iOS bridge). */
  find() {
    const cands = [
      { name: "MyDeviceHubNative", obj: window.MyDeviceHubNative, platform: "Android" },
      { name: "AndroidDeviceHub", obj: window.AndroidDeviceHub, platform: "Android" },
      { name: "webkit.messageHandlers.mdhNative", obj: window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.mdhNative, platform: "iOS" }
    ];
    return cands.find(c => c.obj) || null;
  },
  get available() { return !!this.find(); },
  describe() {
    const b = this.find();
    if (!b) return { available: false, reason: "No native shell is hosting this page, so the native Android vehicle APIs are not reachable." };
    return { available: true, platform: b.platform, name: b.name };
  },
  /* Capability probe — the wrapper decides what it can actually do.
     Expected contract (all optional):
       getCapabilities() -> JSON string { vehicleBluetooth:true, obd:true, wifi:true, vehicleApi:true }
       subscribeVehicle(id) / unsubscribeVehicle(id)
     and it may call window.MDHNative.pushVehicleData(json). */
  capabilities() {
    const b = this.find();
    if (!b) return null;
    try {
      if (typeof b.obj.getCapabilities === "function") {
        const raw = b.obj.getCapabilities();
        return typeof raw === "string" ? JSON.parse(raw) : raw;
      }
    } catch (e) { return { error: e.message }; }
    return {};
  },
  subscribe(vehicleId) {
    const b = this.find();
    if (!b || typeof b.obj.subscribeVehicle !== "function") return false;
    try { b.obj.subscribeVehicle(vehicleId); return true; } catch (e) { return false; }
  },
  unsubscribe(vehicleId) {
    const b = this.find();
    if (!b || typeof b.obj.unsubscribeVehicle !== "function") return false;
    try { b.obj.unsubscribeVehicle(vehicleId); return true; } catch (e) { return false; }
  },
  /* Entry point the native side calls with real readings. */
  installReceiver() {
    window.MDHNative = {
      pushVehicleData: payload => {
        try {
          const data = typeof payload === "string" ? JSON.parse(payload) : payload;
          if (data && data.vehicleId && typeof VehicleLive !== "undefined") VehicleLive.ingest(data.vehicleId, data.fields || data, "native");
        } catch (e) { console.warn("[My Device Hub] native payload rejected", e); }
      },
      notifyEvent: (kind, detail) => { Store.log("integration_connect", String(detail || kind || "Native event"), null); UI.refresh(); }
    };
  }
};

/* ------------------------------------------------------------
   NETWORK / WI-FI — only what the browser genuinely exposes
   ------------------------------------------------------------ */
const Net = {
  conn: null,
  supported: false,
  since: nowIso(),
  lastChange: null,
  changes: [],
  listeners: [],

  init(trackChanges) {
    if (typeof navigator.onLine !== "boolean") return;
    this.conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    this.supported = !!this.conn;
    this.tracking = trackChanges !== false;
    if (this.conn && this.conn.addEventListener && this.tracking) {
      const h = () => {
        const snap = this.snapshot();
        const label = snap.type !== "unknown" ? snap.typeLabel : (snap.effectiveType || "Unknown");
        const prev = this.changes[0];
        if (!prev || prev.to !== label) {
          this.changes.unshift({ from: prev ? prev.to : null, to: label, at: nowIso() });
          if (this.changes.length > 40) this.changes.length = 40;
        }
        UI.refresh();
      };
      this.conn.addEventListener("change", h);
      this.listeners.push(h);
    }
  },
  onOnline() {
    this.since = nowIso();
    const snap = this.snapshot();
    this.changes.unshift({ from: "Offline", to: snap.type !== "unknown" ? snap.typeLabel : "Online", at: nowIso() });
    if (this.changes.length > 40) this.changes.length = 40;
    UI.refresh();
  },
  onOffline() {
    this.since = nowIso();
    this.changes.unshift({ from: this.changes[0] ? this.changes[0].to : null, to: "Offline", at: nowIso() });
    if (this.changes.length > 40) this.changes.length = 40;
    UI.refresh();
  },

  snapshot() {
    const c = this.conn;
    const typeMap = { bluetooth: "Bluetooth", cellular: "Cellular", ethernet: "Ethernet", wifi: "Wi-Fi", wimax: "WiMAX", none: "No link", other: "Other", unknown: "Unknown" };
    const raw = c && c.type ? c.type : "unknown";
    return {
      online: navigator.onLine === true,
      type: raw,
      typeLabel: typeMap[raw] || "Unknown",
      effectiveType: c && c.effectiveType ? String(c.effectiveType).toUpperCase() : null,
      downlink: c && typeof c.downlink === "number" ? c.downlink : null,
      downlinkMax: c && typeof c.downlinkMax === "number" ? c.downlinkMax : null,
      rtt: c && typeof c.rtt === "number" ? c.rtt : null,
      saveData: c && typeof c.saveData === "boolean" ? c.saveData : null,
      apiName: c ? ((c === navigator.connection && "Network Information API (connection)") || "Network Information API") : null
    };
  },
  isPrivateContext() {
    return !(window.isSecureContext === false);
  },
  /* honest explanation strings */
  limits(html) { return html; }
};

/* ------------------------------------------------------------
   CAPABILITIES — the single honest source of truth for what this
   runtime can and cannot reach. Every screen reads from here.
   ------------------------------------------------------------ */
const Caps = {
  get webBluetooth() {
    return {
      id: "obd-ble",
      supported: !!navigator.bluetooth && Platform.secure,
      reason: !navigator.bluetooth
        ? (Platform.ua.ios ? "iOS browsers do not expose the Web Bluetooth API." : "This browser does not expose the Web Bluetooth API.")
        : (!Platform.secure ? "Bluetooth needs a secure HTTPS origin." : "")
    };
  },
  get telemetryEndpoint() {
    return { id: "http", supported: typeof fetch === "function", reason: typeof fetch === "function" ? "" : "This runtime has no fetch()." };
  },
  get nativeBridge() { return NativeBridge.describe(); },
  get geolocation() { return { id: "gps", supported: !!navigator.geolocation, reason: navigator.geolocation ? "" : "This runtime exposes no Geolocation API." }; },
  get webBluetoothGps() { return !!navigator.bluetooth; },
  summary() {
    return {
      platform: Platform.platformLabel,
      secure: Platform.secure,
      obdBle: this.webBluetooth.supported,
      endpoint: this.telemetryEndpoint.supported,
      native: this.nativeBridge.available,
      gps: this.geolocation.supported,
      anyVehicleSource: this.webBluetooth.supported || this.telemetryEndpoint.supported || this.nativeBridge.available
    };
  }
};

/* ------------------------------------------------------------
   PERMISSIONS — queried live, never assumed
   ------------------------------------------------------------ */
const Perm = {
  async queryAll() {
    const out = [];
    const push = (key, label, why) => out.push({ key, label, why, state: "unsupported" });
    if (!navigator.permissions || !navigator.permissions.query) {
      out.push({ key: "api", label: "Permissions API", why: "This browser does not expose navigator.permissions, so nothing can be queried.", state: "unsupported" });
      return out;
    }
    const names = [
      { name: "bluetooth",  key: "bluetooth",  label: "Bluetooth",    why: "Asked only when you tap SCAN, and only for the single device you pick in the browser's own chooser." },
      { name: "geolocation",key: "location",   label: "Location",     why: "Needed only if you ever allow the browser to reveal Wi-Fi network names — the OS treats those names as location data." },
      { name: "notifications", key: "notify",  label: "Notifications",why: "Used for focus-timer and reminder alerts. Purely optional." },
      { name: "camera",     key: "camera",     label: "Camera",       why: "Only if you photograph a device or your car instead of uploading a file." },
      { name: "clipboard-write", key: "clipboard", label: "Clipboard",why: "Only to copy technical values you tap on the Wi-Fi or device pages." }
    ];
    for (const n of names) {
      try {
        const st = await navigator.permissions.query({ name: n.name });
        out.push({ key: n.key, label: n.label, why: n.why, state: st.state, obj: st });
      } catch (e) {
        out.push({ key: n.key, label: n.label, why: n.why, state: "unsupported", note: "This browser does not let a page query this permission." });
      }
    }
    return out;
  }
};

