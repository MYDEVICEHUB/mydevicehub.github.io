/* ============================================================
   DEVICE STATUS — saved profile ≠ live connection
   ============================================================ */
function deviceStatusMeta(d) {
  if (!d) return { label: "Unknown", kind: "", dot: false };
  switch (d.status) {
    case "connected":    return { label: "Connected", kind: "ok", dot: true, live: true };
    case "disconnected": return { label: "Disconnected", kind: "warn", dot: true };
    case "unknown":      return { label: "Unknown", kind: "", dot: true };
    default:             return { label: "Saved profile", kind: "", dot: false };
  }
}
function deviceLiveLine(d) {
  if (d.status === "connected" && d.live && d.live.linkedName) {
    return "Live link to “" + d.live.linkedName + "” since " + relTime(d.live.linkedAt || d.live.lastConnectedAt);
  }
  if (d.status === "disconnected") return "Last live link ended " + relTime(d.live && d.live.lastDisconnectedAt) + ".";
  if (d.status === "unknown") return "Status was never confirmed by a real connection.";
  return "No live connection. This is a saved profile only.";
}

function deviceChips(d) {
  const st = deviceStatusMeta(d);
  return '<div class="wrap">' +
    '<span class="chip">' + catOf(d.category).emoji + " " + esc(catOf(d.category).label) + "</span>" +
    '<span class="chip">' + icon(d.connection === "bluetooth" ? "bluetooth" : d.connection === "wifi" ? "wifi" : "link", 12) + " " + esc(connLabel(d.connection)) + "</span>" +
    (Store.data.settings.prefs.showSavedBadge ? '<span class="pill">' + esc(USER_STATUS[d.status] === "Saved profile" ? "Saved device" : "Saved profile") + "</span>" : "") +
    UI.pill(st.label, st.kind, st.dot, st.live) +
    "</div>";
}

function deviceRowHtml(d, compact) {
  const st = deviceStatusMeta(d);
  return '<div class="row tap" data-device="' + esc(d.id) + '">' +
    UI.avatarHtml(d, compact ? "sm" : "") +
    '<div class="grow"><div class="name">' + esc(d.name) + "</div>" +
    '<div class="meta">' + esc([d.brand, d.model].filter(Boolean).join(" ") || catOf(d.category).label) + " · " + esc(deviceLiveLine(d)) + "</div></div>" +
    '<div class="wrap" style="justify-content:flex-end">' + UI.pill(st.label, st.kind, st.dot, st.live) + "</div>" +
    "</div>";
}

function deviceCardHtml(d) {
  const st = deviceStatusMeta(d);
  const img = safeImg(d.image);
  return '<div class="card dev-card tap" data-device="' + esc(d.id) + '">' +
    '<div class="dev-top">' +
      (img
        ? '<div class="avatar" style="width:56px;height:56px;border-radius:14px"><img src="' + esc(img) + '" alt=""></div>'
        : '<div class="avatar" style="width:56px;height:56px;border-radius:14px;font-size:25px">' + catOf(d.category).emoji + "</div>") +
      '<div class="grow" style="min-width:0">' +
        '<div class="dev-name">' + esc(d.name) + "</div>" +
        '<div class="dev-sub">' + esc([d.brand, d.model].filter(Boolean).join(" ") || "No brand / model recorded") + "</div>" +
        '<div class="wrap" style="margin-top:7px">' + UI.pill(st.label, st.kind, st.dot, st.live) + "</div>" +
      "</div>" +
    "</div>" +
    deviceChips(d) +
    '<div class="dev-note">' + icon("info", 12) + "<span>" + esc(deviceLiveLine(d)) + "</span></div>" +
    '<div class="hr" style="margin:2px 0"></div>' +
    '<div class="row-between"><span class="sub">' + (d.lastSeen ? "Last seen " + esc(relTime(d.lastSeen)) : "Never seen live") + "</span>" +
      '<button class="link-btn" data-no-nav="1" data-open-device="' + esc(d.id) + '">Details ' + icon("chevron", 11) + "</button>" +
    "</div>" +
    "</div>";
}

/* ============================================================
   DEVICES VIEW
   ============================================================ */
defRoute("devices", {
  title: "Devices",
  render() {
    const s = Store.data;
    const p = Router.params || {};
    const q = (p.q || "").toLowerCase();
    const catF = p.cat || "all";
    const connF = p.conn || "all";
    const statF = p.status || "all";

    let list = s.devices.slice();
    if (q) list = list.filter(d => (d.name + " " + d.brand + " " + d.model + " " + d.notes + " " + d.serial).toLowerCase().includes(q));
    if (catF !== "all") list = list.filter(d => d.category === catF);
    if (connF !== "all") list = list.filter(d => d.connection === connF);
    if (statF !== "all") list = list.filter(d => (statF === "saved" ? d.status === "none" : d.status === statF));

    const liveCount = s.devices.filter(d => d.status === "connected").length;

    return [
      '<div class="page-head">',
        "<div><div class=\"eyebrow\">Inventory</div><h2>My Devices</h2>" +
        '<p class="sub">Profiles you own. Adding a profile never connects anything — live status appears only when a real connection is made.</p></div>',
        '<div class="spacer"></div>',
        '<div class="wrap"><button class="btn" data-back="1">' + icon("back", 15) + " Home</button>" +
        '<button class="btn btn-primary" data-add-device="1">' + icon("plus", 15) + " Add device</button></div>",
      "</div>",

      '<div class="grid grid-4" style="margin-bottom:16px">',
        tile("Saved devices", nForm(s.devices.length), "in your hub", "accent"),
        tile("Live connections", nForm(liveCount), liveCount ? "real link active" : "nothing connected"),
        tile("Categories used", nForm(new Set(s.devices.map(d => d.category)).size), "of " + CATEGORIES.length + " available"),
        tile("Most recent", s.devices[0] ? esc(s.devices[0].name) : "—", s.devices[0] ? esc(relTime(s.devices[0].createdAt)) : "no devices yet"),
      "</div>",

      '<div class="card flat" style="margin-bottom:16px">',
        '<div class="form-grid">',
          '<div class="field"><label>Search</label><input class="input" id="devSearch" placeholder="Name, brand, model, serial…" value="' + esc(p.q || "") + '"></div>',
          '<div class="field"><label>Category</label><select class="select" id="devCat"><option value="all">All categories</option>' +
            CATEGORIES.map(c => '<option value="' + c.id + '"' + (catF === c.id ? " selected" : "") + ">" + c.emoji + " " + esc(c.label) + "</option>").join("") + "</select></div>",
          '<div class="field"><label>Connection type</label><select class="select" id="devConn"><option value="all">Any connection type</option>' +
            CONN_TYPES.map(c => '<option value="' + c.id + '"' + (connF === c.id ? " selected" : "") + ">" + esc(c.label) + "</option>").join("") + "</select></div>",
          '<div class="field"><label>Live status</label><select class="select" id="devStat">' +
            [["all", "Any status"], ["saved", "Saved profile only (never connected)"], ["connected", "Connected"], ["disconnected", "Disconnected"], ["unknown", "Unknown"]]
              .map(o => '<option value="' + o[0] + '"' + (statF === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>").join("") + "</select></div>",
        "</div>",
        (q || catF !== "all" || connF !== "all" || statF !== "all")
          ? '<div class="row-between" style="margin-top:12px"><span class="sub">' + list.length + " of " + s.devices.length + ' devices match</span><button class="link-btn" data-clear-filters="1">Clear filters</button></div>'
          : "",
      "</div>",

      list.length
        ? '<div class="grid">' + list.map(deviceCardHtml).join("") + "</div>"
        : (s.devices.length
            ? UI.emptyState("No matches", "No saved device matches these filters.", "Clear filters", "data-clear-filters=\"1\"", "filter")
            : UI.emptyState("No devices yet", "Add your first device profile. It stays a profile until you genuinely connect to something.", "Add your first device", 'data-add-device="1"', "devices")),

      '<div style="margin-top:18px">' + UI.notice(
        "<b>How device data works here:</b> a saved profile stores only what you typed. The browser can additionally see real Bluetooth details — but only for a device you explicitly pick in the browser's own chooser, and only while this page is open. Battery, signal strength and other apps' connections are not readable from a web page.",
        "", "shield") + "</div>"
    ].join("");
  },
  afterRender(root) {
    const setP = patch => {
      const next = Object.assign({}, Router.params, patch);
      Router.go("devices", next);
    };
    const search = $("#devSearch", root);
    if (search) {
      let t = null;
      search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => setP({ q: search.value }), 320); });
      search.addEventListener("keydown", e => { if (e.key === "Enter") setP({ q: search.value }); });
    }
    const cat = $("#devCat", root); if (cat) cat.addEventListener("change", () => setP({ cat: cat.value }));
    const conn = $("#devConn", root); if (conn) conn.addEventListener("change", () => setP({ conn: conn.value }));
    const stat = $("#devStat", root); if (stat) stat.addEventListener("change", () => setP({ status: stat.value }));
    $$("[data-clear-filters]", root).forEach(b => b.addEventListener("click", () => Router.go("devices")));
    bindDeviceInteractions(root);
  }
});

/* ============================================================
   DEVICE DETAIL
   ============================================================ */
defRoute("device", {
  title: "Device",
  render(params) {
    const d = Store.getDevice(params.id);
    if (!d) return UI.emptyState("Device not found", "This profile no longer exists.", "Back to devices", 'data-go="devices"', "devices");
    const st = deviceStatusMeta(d);
    const isLive = d.status === "connected" && BT.device && BT.device.gatt && BT.device.gatt.connected;
    const cat = catOf(d.category);
    const img = safeImg(d.image);

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="devices" aria-label="Back to devices">' + icon("back", 19) + "</button>",
        '<div class="spacer"></div>',
        '<div class="wrap">',
          '<button class="btn" data-edit-device="' + esc(d.id) + '">' + icon("edit", 15) + " Edit</button>",
          '<button class="btn btn-danger" data-del-device="' + esc(d.id) + '">' + icon("trash", 15) + " Delete</button>",
        "</div>",
      "</div>",

      '<div class="card" style="margin-bottom:16px">',
        '<div class="dev-top" style="gap:16px">',
          (img ? '<div class="avatar" style="width:84px;height:84px;font-size:34px"><img src="' + esc(img) + '" alt=""></div>' : UI.avatarHtml(d, "")),
          '<div class="grow" style="min-width:0">',
            '<h2 style="font-size:clamp(19px,4.4vw,24px)">' + esc(d.name) + "</h2>",
            '<div class="sub" style="margin-top:4px">' + esc([d.brand, d.model].filter(Boolean).join(" ") || "No brand / model recorded") + "</div>",
            '<div class="wrap" style="margin-top:10px">' +
              '<span class="chip">' + cat.emoji + " " + esc(cat.label) + "</span>" +
              '<span class="chip">' + esc(connLabel(d.connection)) + "</span>" +
            "</div>",
          "</div>",
        "</div>",
      "</div>",

      /* the separation the brief demands: saved vs live */
      '<div class="two-col" style="margin-bottom:16px">',
        '<div class="card">',
          cardHead("file", "Saved device profile"),
          UI.kv("Recorded on", esc(fmtDateTime(d.createdAt)), false) +
          UI.kv("Last edited", esc(fmtDateTime(d.updatedAt)), false) +
          UI.kv("Category", esc(cat.label), false) +
          UI.kv("Preferred connection", esc(connLabel(d.connection)), false) +
          UI.kv("Serial / ID", d.serial ? esc(d.serial) : '<span class="dim">not recorded</span>', false) +
          '<div class="sub" style="margin-top:10px">' + icon("info", 13) + " This block is just your own record. It does not imply any connection.</div>",
        "</div>",
        '<div class="card">',
          cardHead("bluetooth", "Live connection status"),
          '<div class="row-between" style="margin-bottom:12px"><span class="sub">Current state</span>' + UI.pill(st.label, st.kind, st.dot, st.live) + "</div>" +
          UI.kv("Linked live device", d.live && d.live.linkedName ? esc(d.live.linkedName) : '<span class="dim">none</span>', false) +
          UI.kv("Connected since", d.live && d.live.lastConnectedAt ? esc(relTime(d.live.lastConnectedAt)) : '<span class="dim">never</span>', false) +
          UI.kv("Last disconnected", d.live && d.live.lastDisconnectedAt ? esc(relTime(d.live.lastDisconnectedAt)) : '<span class="dim">never</span>', false) +
          UI.kv("GATT services exposed", (d.live && d.live.gattServices && d.live.gattServices.length) ? d.live.gattServices.length + " service(s)" : '<span class="dim">—</span>', false) +
          (d.live && d.live.lastError ? '<div class="notice warn" style="margin-top:10px"><span class="ni">' + icon("warn", 17) + "</span><div>" + esc(d.live.lastError) + "</div></div>" : ""),
        "</div>",
      "</div>",

      /* actions */
      '<div class="card" style="margin-bottom:16px">',
        cardHead("wand", "Actions available on this platform", '<span class="sub">' + esc(Platform.platformLabel) + "</span>"),
        '<div class="btn-row">',
          (isLive
            ? '<button class="btn btn-ok" data-bt-disconnect="1">' + icon("unlink", 15) + " Disconnect</button>" +
              '<button class="btn" data-bt-battery="1">' + icon("sparkle", 15) + " Read battery (GATT)</button>"
            : (BT.state === "supported"
                ? '<button class="btn btn-primary" data-bt-connect="' + esc(d.id) + '">' + icon("link", 15) + " Connect</button>"
                : '<button class="btn" disabled title="Bluetooth is not available on this platform">' + icon("link", 15) + " Connect (unavailable)</button>")) +
          '<button class="btn" data-scan-here="1">' + icon("scan", 15) + " Scan nearby</button>" +
          '<button class="btn" data-open-activity="1">' + icon("clock", 15) + " Activity log</button>" +
        "</div>",
        '<div style="margin-top:12px">' + UI.notice(
          isLive
            ? "A real GATT connection is open right now through Web Bluetooth. It will drop the moment you close this page, and the browser will report the disconnection."
            : BT.state === "supported"
              ? "Tapping <b>Connect</b> opens the browser's own Bluetooth chooser. If this profile was linked before, the browser may reconnect it directly without asking again."
              : "<b>" + esc(BT.status().label) + ".</b> " + esc(BT.status().detail) + " You can still keep this profile and its notes.",
          BT.state === "supported" ? "ok" : "warn") + "</div>",
      "</div>",

      /* technical information read from the live device, when readable */
      (isLive ? '<div class="card" style="margin-bottom:16px">' +
        cardHead("chip", "Technical information from the live device", '<button class="link-btn" data-read-info="1">Read</button>') +
        '<div id="devInfoBox">' + UI.notice("Press <b>Read</b> to query the standard GATT Device Information Service on the connected device. Only values the device actually publishes are shown.", "", "info") + "</div>" +
      "</div>" : ""),

      /* notes */
      '<div class="card">',
        cardHead("edit", "Notes", '<button class="link-btn" data-edit-device="' + esc(d.id) + '">Edit</button>'),
        d.notes ? '<div class="sub" style="white-space:pre-wrap;color:var(--text-2);font-size:13.5px">' + esc(d.notes) + "</div>" : '<div class="sub dim">No notes recorded for this device.</div>',
      "</div>",

      '<div style="margin-top:14px">' + UI.notice("Technical information shown for a live device comes straight from the browser's Web Bluetooth API: the name the device advertises, the opaque per-origin device id, and the GATT services it exposes. Battery, signal strength, firmware and other apps' connections are not accessible from a web page and are therefore never displayed.", "", "shield") + "</div>"
    ].join("");
  },
  afterRender(root) {
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(b.dataset.back || "devices")));
    bindDeviceInteractions(root);
    const id = Router.params.id;
    $$("[data-edit-device]", root).forEach(b => b.addEventListener("click", () => DeviceForm.open(Store.getDevice(b.dataset.editDevice))));
    $$("[data-del-device]", root).forEach(b => b.addEventListener("click", () => deleteDeviceFlow(Store.getDevice(b.dataset.delDevice))));
    $$("[data-bt-connect]", root).forEach(b => b.addEventListener("click", () => DeviceActions.connect(b.dataset.btConnect, b)));
    $$("[data-bt-disconnect]", root).forEach(b => b.addEventListener("click", () => DeviceActions.disconnect()));
    $$("[data-bt-battery]", root).forEach(b => b.addEventListener("click", () => DeviceActions.battery()));
    $$("[data-scan-here]", root).forEach(b => b.addEventListener("click", () => BluetoothView.scanFlow({ thenLinkProfile: id })));
    $$("[data-open-activity]", root).forEach(b => b.addEventListener("click", () => Router.go("activity")));
    $$("[data-read-info]", root).forEach(b => b.addEventListener("click", async () => {
      const box = $("#devInfoBox"); if (!box) return;
      b.disabled = true; b.innerHTML = icon("refresh", 14, "spin") + " Reading…";
      const r = await BT.readDeviceInfo();
      if (r.ok) {
        box.innerHTML = '<div>' + Object.keys(r.info).map(k => UI.kv(k.charAt(0).toUpperCase() + k.slice(1), esc(r.info[k]), false)).join("") + "</div>" +
          '<div class="hint" style="margin-top:10px">Read over the live GATT connection just now, straight from the device.</div>';
        UI.toast("Device information read", "Values came from the device itself.", "ok");
      } else {
        box.innerHTML = UI.notice(esc(r.reason), "warn", "warn");
      }
      b.disabled = false; b.innerHTML = "Read";
    }));
  }
});

/* ============================================================
   DEVICE ACTIONS
   ============================================================ */
const DeviceActions = {
  async connect(profileId, btn) {
    const p = Store.getDevice(profileId);
    if (!p) return;
    if (!BT.nav) { UI.toast("Bluetooth unsupported", BT.status().detail, "bad"); return; }
    const label = btn ? btn.innerHTML : null;
    if (btn) { btn.disabled = true; btn.innerHTML = icon("refresh", 15) + " Working…"; }
    try {
      let remembered = null;
      if (p.btDeviceId || p.btDeviceName) {
        try { remembered = await BT.matchProfile(p); } catch (e) { remembered = null; }
      }
      if (remembered) {
        await BT.link(p, remembered);
        UI.toast("Connected", "Reconnected to “" + (remembered.name || "device") + "” using the browser's granted-device list.", "ok");
      } else {
        UI.toast("Choose the device", "Pick this device in the browser's own Bluetooth chooser.", "");
        const dev = await BT.nav.requestDevice({ acceptAllDevices: true });
        await BT.link(p, dev);
        UI.toast("Connected", "Linked “" + (dev.name || "unnamed device") + "” to this profile.", "ok");
      }
      UI.refresh();
    } catch (e) {
      const msg = BT.describe(e);
      BT.lastError = msg;
      Store.setDeviceStatus(p.id, p.status === "connected" ? "connected" : "unknown", { live: { lastError: msg } });
      UI.toast("Connection not established", msg, e && e.name === "NotFoundError" ? "warn" : "bad");
      UI.refresh();
    } finally {
      if (btn && document.body.contains(btn)) { btn.disabled = false; if (label) btn.innerHTML = label; }
    }
  },
  disconnect() {
    const name = BT.device ? (BT.device.name || "the device") : "the device";
    const p = Store.getDevice(BT.linkedProfileId || "");
    const did = BT.disconnect();
    if (p) Store.setDeviceStatus(p.id, "disconnected", {
      live: { lastDisconnectedAt: nowIso(), gattServices: null },
      log: { action: "device_disconnect", detail: "You closed the live link to “" + name + "”." }
    });
    UI.toast(did ? "Disconnected" : "Nothing to disconnect", did ? "The live link to " + name + " was closed by you." : "No active Bluetooth link was open.", did ? "ok" : "warn");
    UI.refresh();
  },
  async battery() {
    const r = await BT.readBattery();
    if (r.ok) UI.toast("Battery level", "The device reported " + r.level + "% over the standard GATT Battery Service.", "ok");
    else UI.toast("Battery not readable", r.reason, "warn");
  }
};

/* ============================================================
   DEVICE FORM (add / edit)
   ============================================================ */
const DeviceForm = {
  draft: null,
  open(existing) {
    const isEdit = !!existing;
    this.draft = existing
      ? JSON.parse(JSON.stringify(existing))
      : { name: "", brand: "", model: "", category: Router.params && Router.params.category ? Router.params.category : "phone", image: null, connection: "bluetooth", notes: "", serial: "" };
    this.render();
  },
  render() {
    const d = this.draft;
    const body = [
      '<div class="sheet-head"><div><h3>' + (d.id ? "Edit device" : "Add a device") + '</h3><div class="sub">' +
        (d.id ? "Update this saved profile. Editing a profile never changes live connection state." : "This creates a saved profile only. Nothing is connected until you genuinely connect to a device.")
      + "</div></div></div>",

      '<div class="form">',
        '<div class="upload-box">',
          '<div class="upload-prev" id="devPrev">' + (safeImg(d.image) ? '<img src="' + esc(safeImg(d.image)) + '" alt="">' : catOf(d.category).emoji) + "</div>",
          '<div class="grow"><div style="font-weight:600;font-size:13.5px">Device image</div>' +
          '<div class="hint">Optional. Stored locally at up to ' + (Store.data.settings.prefs.imageMaxKb || 512) + " KB after automatic downscaling. Leave it empty to use the category icon.</div>" +
          '<div class="btn-row" style="margin-top:9px"><button class="btn btn-sm" data-pick-img="1">' + icon("camera", 14) + ' Choose image</button>' +
          '<button class="btn btn-sm btn-ghost" data-clear-img="1">Clear</button></div></div>',
        "</div>",

        '<div class="field"><label>Device name *</label><input class="input" id="fName" value="' + esc(d.name) + '" placeholder="e.g. My Pixel 8, Studio Monitor…"></div>',

        '<div class="form-grid">',
          '<div class="field"><label>Brand</label><input class="input" id="fBrand" value="' + esc(d.brand) + '" placeholder="e.g. Google"></div>',
          '<div class="field"><label>Model</label><input class="input" id="fModel" value="' + esc(d.model) + '" placeholder="e.g. Pixel 8 Pro"></div>',
        "</div>",

        '<div class="field"><label>Category *</label><div class="cat-grid" id="fCats">' +
          CATEGORIES.map(c => '<button type="button" class="cat-opt' + (d.category === c.id ? " sel" : "") + '" data-cat="' + c.id + '"><span class="ce">' + c.emoji + '</span><span>' + esc(c.label) + "</span></button>").join("") +
        "</div></div>",

        '<div class="form-grid">',
          '<div class="field"><label>Connection type</label><select class="select" id="fConn">' +
            CONN_TYPES.map(c => '<option value="' + c.id + '"' + (d.connection === c.id ? " selected" : "") + ">" + esc(c.label) + "</option>").join("") + "</select></div>",
          '<div class="field"><label>Serial / asset ID</label><input class="input" id="fSerial" value="' + esc(d.serial) + '" placeholder="optional"></div>',
        "</div>",

        '<div class="field"><label>Notes</label><textarea class="textarea" id="fNotes" placeholder="Warranty info, charger type, where you keep it…">' + esc(d.notes) + "</textarea></div>",

        '<div class="notice"><span class="ni">' + icon("info", 17) + "</span><div><b>Live status stays separate.</b> A new profile is saved with the status “Saved profile”. It becomes <i>Connected</i> only if you later tap Connect and a real Bluetooth link opens.</div></div>",
      "</div>",

      '<div class="sheet-foot">',
        '<button class="btn btn-ghost" data-close>Cancel</button>',
        '<button class="btn btn-primary" data-save="1">' + icon("check", 15) + " " + (d.id ? "Save changes" : "Add device") + "</button>",
      "</div>"
    ].join("");

    const self = this;
    UI.modal({
      body,
      wide: true,
      onMount(sheet, close) {
        $$("[data-cat]", sheet).forEach(b => b.addEventListener("click", () => {
          self.draft.category = b.dataset.cat;
          $$("[data-cat]", sheet).forEach(x => x.classList.toggle("sel", x === b));
          const prev = $("#devPrev", sheet);
          if (!self.draft.image) prev.textContent = catOf(self.draft.category).emoji;
        }));
        $$("[data-pick-img]", sheet).forEach(b => b.addEventListener("click", () => UI.pickImage(dataUrl => {
          self.draft.image = dataUrl;
          const prev = $("#devPrev", sheet);
          if (prev) prev.innerHTML = '<img src="' + esc(dataUrl) + '" alt="">';
          UI.toast("Image attached", "It will be stored locally with this profile.", "ok");
        })));
        $$("[data-clear-img]", sheet).forEach(b => b.addEventListener("click", () => {
          self.draft.image = null;
          const prev = $("#devPrev", sheet);
          if (prev) prev.textContent = catOf(self.draft.category).emoji;
        }));
        $$("[data-save]", sheet).forEach(b => b.addEventListener("click", () => {
          self.draft.name = $("#fName", sheet).value.trim();
          self.draft.brand = $("#fBrand", sheet).value.trim();
          self.draft.model = $("#fModel", sheet).value.trim();
          self.draft.serial = $("#fSerial", sheet).value.trim();
          self.draft.notes = $("#fNotes", sheet).value;
          self.draft.connection = $("#fConn", sheet).value;
          if (!self.draft.name) { UI.toast("Name required", "Give the device a name so you can recognise it later.", "warn"); $("#fName", sheet).focus(); return; }
          if (self.draft.id) {
            Store.updateDevice(self.draft.id, {
              name: self.draft.name, brand: self.draft.brand, model: self.draft.model, category: self.draft.category,
              image: self.draft.image, connection: self.draft.connection, notes: self.draft.notes, serial: self.draft.serial
            });
            UI.toast("Profile updated", "“" + self.draft.name + "” was saved.", "ok");
          } else {
            const created = Store.addDevice(self.draft);
            UI.toast("Device saved", "“" + created.name + "” is a saved profile. Status: Saved profile.", "ok");
          }
          close();
          if (Router.current === "device" || Router.current === "devices" || Router.current === "home") UI.refresh();
          else Router.go("devices");
        }));
      }
    });
  }
};

function deleteDeviceFlow(d) {
  if (!d) return;
  UI.confirm({
    title: "Delete “" + d.name + "”?",
    message: "The saved profile, its notes and its remembered connection history will be removed from this device. This cannot be undone.",
    confirmText: "Delete device"
  }).then(ok => {
    if (!ok) return;
    Store.deleteDevice(d.id);
    UI.toast("Device deleted", "“" + d.name + "” was removed from the hub.", "ok");
    Router.go("devices");
  });
}

/* ------------------------------------------------------------
   shared click wiring for device rows / quick actions
   ------------------------------------------------------------ */
function bindDeviceInteractions(root) {
  $$("[data-device]", root).forEach(el => {
    if (el._bound) return; el._bound = true;
    el.addEventListener("click", e => {
      if (e.target.closest("[data-no-nav]")) return;
      e.stopPropagation();
      Router.go("device", { id: el.dataset.device });
    });
  });
  $$("[data-add-device]", root).forEach(el => {
    if (el._bound) return; el._bound = true;
    el.addEventListener("click", e => { e.stopPropagation(); DeviceForm.open(null); });
  });
  $$("[data-open-device]", root).forEach(el => {
    if (el._bound) return; el._bound = true;
    el.addEventListener("click", e => { e.stopPropagation(); Router.go("device", { id: el.dataset.openDevice }); });
  });
  $$("[data-add-task]", root).forEach(el => {
    if (el._bound) return; el._bound = true;
    el.addEventListener("click", e => { e.stopPropagation(); openTaskForm(null); });
  });
  $$("[data-go]", root).forEach(el => {
    if (el._bound) return; el._bound = true;
    el.addEventListener("click", () => Router.go(el.dataset.go));
  });
  const qaMap = {
    "home-qa-add": () => DeviceForm.open(null),
    "home-qa-addveh": () => VehicleForm.open(null),
    "home-qa-bt": () => { Router.go("bluetooth"); setTimeout(() => BluetoothView.scanFlow({}), 350); },
    "home-qa-wifi": () => Router.go("wifi"),
    "home-qa-car": () => Router.go("car"),
    "home-qa-focus": () => Router.go("focus")
  };
  Object.keys(qaMap).forEach(id => { const el = $("#" + id, root); if (el) el.addEventListener("click", qaMap[id]); });
}

