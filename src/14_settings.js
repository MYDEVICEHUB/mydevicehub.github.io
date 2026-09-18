/* ============================================================
   SETTINGS
   ============================================================ */
const ACCENTS = [
  { id: "cyan",    label: "Cyan",    color: "#22D3EE" },
  { id: "blue",    label: "Blue",    color: "#4C9AFF" },
  { id: "violet",  label: "Violet",  color: "#9B8CFF" },
  { id: "emerald", label: "Emerald", color: "#3DD68C" },
  { id: "amber",   label: "Amber",   color: "#E7B346" },
  { id: "slate",   label: "Slate",   color: "#9DB4CE" }
];

function applySettings() {
  const s = Store.data.settings;
  const html = document.documentElement;
  html.dataset.accent = s.accent || "cyan";
  html.dataset.bg = s.background === "deep" ? "navy" : (s.background || "navy");
  html.dataset.glow = s.glow === true ? "soft" : (s.glow === false ? "none" : (s.glow || "soft"));
  html.dataset.motion = s.motion ? "on" : "off";
  html.style.setProperty("--fs", String(s.fontScale || 1));
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", (s.background === "graphite" ? "#07090C" : s.background === "midnight" ? "#020306" : "#04060B"));
}

const PERMISSION_NOTES = [
  { key: "bluetooth", icon: "bluetooth", label: "Bluetooth",
    why: "Requested <b>only</b> when you tap SCAN or CONNECT, and only for the single device you choose in the browser's own chooser. The page never scans on its own and never sees devices you did not pick." },
  { key: "location", icon: "globe", label: "Location",
    why: "Needed by a browser only if a page is allowed to read Wi-Fi network names, because network names count as location data. <b>This app never asks for it</b> — there is no Wi-Fi name reading here at all." },
  { key: "notify", icon: "bell", label: "Notifications",
    why: "Used for focus-timer and vehicle-reminder alerts, and only if you switch those on above. Purely optional — in-app toasts work without it." },
  { key: "camera", icon: "camera", label: "Camera",
    why: "Only touched if you choose to photograph a device or a vehicle instead of picking a file from storage." },
  { key: "clipboard", icon: "file", label: "Clipboard",
    why: "Only used when you tap Copy — for example exporting a backup or copying a technical value from the Wi-Fi page." }
];

function switchRow(id, title, sub, on) {
  return '<div class="switch"><div><div class="sw-t">' + title + '</div><div class="sw-s">' + sub + '</div></div>' +
    '<button class="toggle' + (on ? " on" : "") + '" data-toggle="' + id + '" role="switch" aria-checked="' + (on ? "true" : "false") + '" aria-label="' + esc(title) + '"></button></div>';
}

defRoute("settings", {
  title: "Settings",
  render() {
    const s = Store.data;
    const st = s.settings;
    const perms = Perm.cache || null;
    let bytes = 0, imgCount = 0, imgBytes = 0;
    try { bytes = (localStorage.getItem(STORE_KEY) || "").length; } catch (e) { bytes = -1; }
    s.devices.forEach(d => { if (d.image) { imgCount++; imgBytes += d.image.length; } });
    s.vehicles.forEach(v => { if (v.photo) { imgCount++; imgBytes += v.photo.length; } });

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="1" aria-label="Back">' + icon("back", 19) + "</button>",
        "<div><div class=\"eyebrow\">Configuration</div><h2>Settings</h2>" +
        '<p class="sub">Appearance, notifications, permissions, privacy and your data. Everything is under your control and everything is local.</p></div>',
      "</div>",

      /* APPEARANCE */
      '<div class="card set-group">',
        '<h4>' + icon("wand", 14) + " Appearance</h4>",
        '<div class="field"><label>Accent colour</label><div class="swatches">' +
          ACCENTS.map(a => '<button class="swatch' + (st.accent === a.id ? " on" : "") + '" data-accent="' + a.id + '" title="' + esc(a.label) + '" style="background:linear-gradient(135deg,' + a.color + ", rgba(59,130,246,.6))\"></button>").join("") +
        "</div></div>",
        '<div class="form-grid" style="margin-top:14px">',
          '<div class="field"><label>Background tone</label><div class="seg">' +
            [["navy", "Deep navy"], ["midnight", "Midnight"], ["graphite", "Graphite"]].map(o => '<button data-bg="' + o[0] + '" class="' + ((st.background === o[0] || (st.background === "deep" && o[0] === "navy")) ? "on" : "") + '">' + o[1] + "</button>").join("") + "</div></div>",
          '<div class="field"><label>Text size</label><div class="seg">' +
            [[0.94, "Compact"], [1, "Default"], [1.08, "Large"], [1.16, "Larger"]].map(o => '<button data-fs="' + o[0] + '" class="' + (Number(st.fontScale) === o[0] ? "on" : "") + '">' + o[1] + "</button>").join("") + "</div></div>",
        "</div>",
        '<div class="field" style="margin-top:14px"><label>Accent lighting</label><div class="seg">' +
          [["soft", "Soft"], ["none", "Flat"]].map(o => '<button data-glow="' + o[0] + '" class="' + (((st.glow === true && o[0] === "soft") || st.glow === o[0]) ? "on" : "") + '">' + o[1] + "</button>").join("") + "</div></div>" +
        switchRow("motion", "Smooth transitions", "Animated view changes and hover lifts. Disable if you prefer instant, static screens.", st.motion) +
        switchRow("reduceEffects", "Reduce visual effects", "Trims backdrop blur for maximum performance on low-powered devices.", st.reduceEffects),
      "</div>",

      /* NOTIFICATIONS */
      '<div class="card set-group">',
        '<h4>' + icon("bell", 14) + " Notifications</h4>",
        switchRow("n-toasts", "In-app toasts", "Short confirmations for actions you take, such as saving a device or closing a case.", st.notify.toasts) +
        switchRow("n-focus", "Focus session alerts", "A browser notification when a focus session completes, if you have granted notification permission.", st.notify.focus) +
        switchRow("n-rem", "Vehicle reminder alerts", "Shown when an insurance, PUC or service date you entered becomes due while the app is open.", st.notify.reminders) +
        switchRow("n-mys", "Mystery case alerts", "Only for puzzle milestones — off by default so it never interrupts real work.", st.notify.mystery) +
        '<div class="hr"></div>' +
        '<div class="row-between" style="flex-wrap:wrap;gap:10px"><div><div class="sw-t">Browser notification permission</div><div class="sw-s">' +
          (typeof Notification === "undefined" ? "This platform does not expose the Notification API." : "Current state: " + esc(Notification.permission) + ". Notifications are only ever sent for things you switched on above.") +
        '</div></div>' +
        (typeof Notification === "undefined" ? '<span class="chip">unsupported</span>'
          : (Notification.permission === "granted" ? '<span class="chip">granted</span>' :
             '<button class="btn btn-sm" data-notif-ask="1">Request permission</button>')) + "</div>",
      "</div>",

      /* DEVICE PREFERENCES */
      '<div class="card set-group">',
        '<h4>' + icon("devices", 14) + " Device preferences</h4>",
        '<div class="form-grid">',
          '<div class="field"><label>Default connection type for new devices</label><select class="select" id="setDefaultConn">' +
            CONN_TYPES.map(c => '<option value="' + c.id + '"' + (st.prefs.defaultConn === c.id ? " selected" : "") + ">" + esc(c.label) + "</option>").join("") + "</select></div>",
          '<div class="field"><label>Image size limit per device</label><select class="select" id="setImgKb">' +
            [256, 512, 1024, 2048].map(k => '<option value="' + k + '"' + (Number(st.prefs.imageMaxKb) === k ? " selected" : "") + ">" + k + " KB (downscaled)</option>").join("") + "</select></div>",
        "</div>",
        '<div class="form-grid" style="margin-top:14px">',
          '<div class="field"><label>Default vehicle type for new profiles</label><div class="seg">' +
            VEHICLE_TYPES.map(t => '<button data-default-veh="' + t.id + '" class="' + (st.prefs.defaultVehicleType === t.id ? "on" : "") + '">' + t.emoji + " " + esc(t.label) + "</button>").join("") + "</div></div>",
            '<div class="hint" style="margin-top:9px">' + icon("layers", 12) + ' Vehicle information comes from the app\u2019s built-in database (updated ' + esc(VEHICLE_DB.updated) + ", " + esc(VEHICLE_DB.market) + "). It is reference data and stays separate from any live reading.</div>",
          '<div class="field"><label>Vehicle live-data poll interval</label><div class="seg">' +
            [[2, "2 s"], [5, "5 s"], [10, "10 s"]].map(o => '<button data-poll="' + o[0] + '" class="' + (Number(st.prefs.livePollSeconds) === o[0] ? "on" : "") + '">' + o[1] + "</button>").join("") + "</div></div>",
        "</div>",
        '<div style="margin-top:6px">' +
          switchRow("p-saved", "Show the “saved device” badge", "Makes it obvious that a card is a profile rather than a live connection.", st.prefs.showSavedBadge) +
          switchRow("p-confirm", "Confirm before deleting anything", "Strongly recommended. Deleting a device, vehicle, task or case asks first.", st.prefs.confirmDelete) +
          switchRow("p-snapshot", "Keep the last real vehicle snapshot", "After a reload, the most recent genuine readings stay visible with their original timestamps and a STALE label. Switching this off clears them instead.", st.prefs.keepLiveSnapshot) +
          switchRow("p-autobt", "Check Bluetooth availability on launch", "Reads navigator.bluetooth.getAvailability() once at startup. It never scans and never opens a chooser on its own.", st.autoScanBluetooth) +
          switchRow("p-autonet", "Track network connection changes", "Listens to the browser's online, offline and connection-change events while the app is open.", st.autoScanNetwork) +
        "</div>",
        '<div style="margin-top:14px">' + UI.notice("<b>Bluetooth and Wi-Fi buttons stay honest.</b> Connect buttons are disabled rather than simulated, and a scan only ever opens the browser's own chooser after you tap it. Nothing is requested in the background.", "", "shield") + "</div>",
      "</div>",

      /* PERMISSIONS */
      '<div class="card set-group">',
        '<h4>' + icon("key", 14) + " Permissions</h4>",
        '<div class="row-between" style="margin-bottom:12px"><div class="sub">Queried live from the browser — never assumed.</div><button class="btn btn-sm" data-perm-refresh="1">' + icon("refresh", 14) + " Re-check</button></div>",
        '<div class="list">' + PERMISSION_NOTES.map(n => {
          const live = (perms || []).find(p => p.key === n.key || (n.key === "notify" && p.key === "notify"));
          const state = live ? live.state : "unsupported";
          return '<div class="row" style="align-items:flex-start"><span class="avatar sm">' + icon(n.icon, 17) + "</span>" +
            '<div class="grow" style="min-width:0"><div class="name">' + esc(n.label) + '</div>' +
            '<div class="meta" style="white-space:normal;line-height:1.55">' + n.why + "</div>" +
            '<div class="meta" style="margin-top:5px;color:var(--dim)">' + esc(live ? "Current browser state: " + state : "This browser does not report a state for this permission.") + "</div></div>" +
            pillForPerm(state) + "</div>";
        }).join("") + "</div>",
        '<div class="hr"></div>',
        '<div class="sub">' + icon("shield", 13) + " This app never asks for a permission before you use the feature that needs it, and never uses a permission to gather anything you did not ask for.</div>",
      "</div>",

      /* PRIVACY */
      '<div class="card set-group">',
        '<h4>' + icon("shield", 14) + " Privacy</h4>",
        '<div class="grid grid-4" style="gap:10px">',
          tile("Stored locally", "yes", "in this browser", "accent"),
          tile("Accounts required", "none", "no sign-in anywhere"),
          tile("Data sent to servers", "none", "this app has no backend"),
          tile("Trackers / analytics", "none", "no third-party scripts"),
        "</div>",
        '<div class="hr"></div>',
        '<div class="list">' + [
          ["What is stored", "Your device profiles, vehicle profiles with their service history, tasks, focus sessions, mystery progress, settings and the activity log — all in this browser's local storage under the key <span class=\"mono\">mydevicehub.v1</span>."],
          ["What is never collected", "No name, no email, no phone number, no location, no contacts, no files. Images you attach are downscaled and stored locally as data URLs."],
          ["What Bluetooth reveals", "Only a device you explicitly pick in the browser's chooser, and only while this page is open. Names and GATT service UUIDs of that device are shown to you, not sent anywhere. An OBD-II vehicle adapter is treated exactly the same way."],
          ["Blocked links", "If a saved profile ever contained a link this app could not verify as safe, it would be blocked and logged as a security notice rather than loaded."],
          ["Session hygiene", "The live device id and GATT connection are dropped by the browser when you close the tab. Nothing reconnects on its own."]
        ].map(r => '<div class="row" style="padding:11px 12px;align-items:flex-start"><span class="avatar xs">' + icon("info", 15) + '</span><div class="grow" style="min-width:0"><div class="name">' + r[0] + '</div><div class="meta" style="white-space:normal;line-height:1.55">' + r[1] + "</div></div></div>").join("") + "</div>",
      "</div>",

      /* DATA MANAGEMENT */
      '<div class="card set-group">',
        '<h4>' + icon("layers", 14) + " Data management</h4>",
        '<div class="grid grid-4" style="gap:10px">',
          tile("Backup size", bytes < 0 ? "unavailable" : (bytes / 1024).toFixed(1) + " KB", bytes < 0 ? "storage blocked" : "JSON export below"),
          tile("Records", nfmt(s.devices.length + s.vehicles.length + s.tasks.length), nfmt(s.devices.length) + " devices · " + nfmt(s.vehicles.length) + " vehicles"),
          tile("Images", (imgBytes / 1024).toFixed(1) + " KB", imgCount + " picture" + (imgCount === 1 ? "" : "s") + " stored"),
          tile("Last export", s.meta.lastBackupAt ? esc(relTime(s.meta.lastBackupAt)) : "never", s.meta.lastImportAt ? "last import " + esc(relTime(s.meta.lastImportAt)) : "no import yet"),
        "</div>",
        '<div class="hr"></div>',
        '<div class="btn-row">',
          '<button class="btn btn-primary" data-export="1">' + icon("download", 15) + " Export data</button>",
          '<button class="btn" data-import="1">' + icon("upload", 15) + " Import data</button>",
          '<button class="btn" data-copy-backup="1">' + icon("file", 15) + " Copy JSON to clipboard</button>",
          '<button class="btn btn-danger" data-clear-all="1">' + icon("trash", 15) + " Clear all data</button>",
        "</div>",
        '<div class="hint" style="margin-top:10px">Export produces a single JSON file with everything listed above. Import validates the file before touching your current data, and always asks how you want it applied.</div>',
        '<div class="hr"></div>',
        '<div class="btn-row">',
          '<button class="btn btn-sm" data-clear-activity="1">Clear activity log only</button>',
          '<button class="btn btn-sm" data-clear-focus="1">Clear focus history only</button>',
          '<button class="btn btn-sm" data-clear-mystery="1">Reset mystery progress only</button>',
        "</div>",
      "</div>",

      /* ABOUT */
      '<div class="card set-group">',
        '<h4>' + icon("sparkle", 14) + " About</h4>",
        '<div class="row" style="align-items:flex-start;gap:14px"><span class="avatar">' + icon("devices", 22) + "</span><div class=\"grow\">" +
          '<div class="name" style="font-size:16px">My Device Hub</div>' +
          '<div class="meta">Your Personal Device Command Center · version 2.0.0 · build 2026.09</div>' +
          '<div class="sub" style="margin-top:8px;line-height:1.6">A 2D dashboard for the devices and vehicles you actually own. It shows real Bluetooth information where the browser allows it, real network values where they exist, real vehicle data only through a genuinely connected integration — and an explicit limitation everywhere else. Nothing on any screen is simulated, ever.</div>' +
        "</div></div>",
        '<div class="hr"></div>',
        UI.kv("Platform", esc(Platform.platformLabel), false) +
        UI.kv("Runtime", esc(navigator.userAgent.split(") ")[0].replace(/^Mozilla\/5\.0 \(/, "")) || "unknown", false) +
        UI.kv("Secure context", Platform.secure ? "yes (HTTPS or localhost)" : "no — Bluetooth will be blocked", false) +
        UI.kv("Storage", Store.available ? "localStorage available" : "unavailable — data is session-only", false) +
        UI.kv("Data version", "schema v" + (Store.data.version || 1) + " · created " + esc(fmtDate(Store.data.createdAt)), false) +
        '<div class="hr"></div>',
        '<div class="sub" style="line-height:1.7"><b>What this app deliberately is not:</b> it is not a simulator, and it is not a spy tool. It cannot see other apps, other people\'s devices, or your Wi-Fi password — and it will never pretend otherwise.</div>',
        '<div class="hr"></div>',
        '<div class="mini-label">Vehicle data sources on this runtime</div>',
        '<div class="stack" style="margin-top:10px">' + Adapters.list().map(a => {
          const av = a.availability();
          return '<div class="row" style="align-items:flex-start"><span class="avatar sm">' + icon(a.icon, 16) + '</span><div class="grow"><div class="name">' + esc(a.name) + '</div>' +
            '<div class="meta wrapmeta">' + esc(av.reason || a.blurb.slice(0, 120)) + '</div></div>' + UI.pill(av.label, av.kind, true) + "</div>";
        }).join("") + "</div>" +
        '<div class="hr"></div>',
        '<div class="btn-row"><button class="btn btn-sm" data-wipe-images="1">Remove all stored images</button><button class="btn btn-sm" data-signal-a="1">Re-read platform capabilities</button></div>',
      "</div>"
    ].join("");
  },
  afterRender(root) {
    const save = (msg) => { Store.persist(); if (msg) UI.toast("Setting saved", msg, "ok"); };

    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(Store._lastTab || "home")));

    $$("[data-accent]", root).forEach(b => b.addEventListener("click", () => {
      Store.data.settings.accent = b.dataset.accent;
      applySettings(); save("Accent updated.");
      $$("[data-accent]", root).forEach(x => x.classList.toggle("on", x === b));
      Store.log("settings_change", "Accent colour changed to " + b.dataset.accent + ".", null);
    }));
    $$("[data-bg]", root).forEach(b => b.addEventListener("click", () => {
      Store.data.settings.background = b.dataset.bg; applySettings(); save("Background updated.");
      $$("[data-bg]", root).forEach(x => x.classList.toggle("on", x === b));
    }));
    $$("[data-glow]", root).forEach(b => b.addEventListener("click", () => {
      Store.data.settings.glow = b.dataset.glow; applySettings(); save("Accent lighting updated.");
      $$("[data-glow]", root).forEach(x => x.classList.toggle("on", x === b));
    }));
    $$("[data-fs]", root).forEach(b => b.addEventListener("click", () => {
      Store.data.settings.fontScale = Number(b.dataset.fs); applySettings(); save("Text size updated.");
      $$("[data-fs]", root).forEach(x => x.classList.toggle("on", x === b));
    }));

    const toggles = {
      "motion": () => { Store.data.settings.motion = !Store.data.settings.motion; applySettings(); return Store.data.settings.motion; },
      "reduceEffects": () => { const v = !Store.data.settings.reduceEffects; Store.data.settings.reduceEffects = v; applySettings(); return v; },
      "n-toasts": () => { const n = Store.data.settings.notify; n.toasts = !n.toasts; return n.toasts; },
      "n-focus":  () => { const n = Store.data.settings.notify; n.focus = !n.focus; return n.focus; },
      "n-rem":    () => { const n = Store.data.settings.notify; n.reminders = !n.reminders; return n.reminders; },
      "n-mys":    () => { const n = Store.data.settings.notify; n.mystery = !n.mystery; return n.mystery; },
      "p-saved":  () => { const p = Store.data.settings.prefs; p.showSavedBadge = !p.showSavedBadge; return p.showSavedBadge; },
      "p-confirm":() => { const p = Store.data.settings.prefs; p.confirmDelete = !p.confirmDelete; return p.confirmDelete; },
      "p-snapshot": () => { const p = Store.data.settings.prefs; p.keepLiveSnapshot = !p.keepLiveSnapshot; if (!p.keepLiveSnapshot) Store.data.vehicles.forEach(v => { if (!VehicleLive.anyValue(v.id)) VehicleLive.clear(v.id); }); return p.keepLiveSnapshot; },
      "p-autobt": () => { Store.data.settings.autoScanBluetooth = !Store.data.settings.autoScanBluetooth; return Store.data.settings.autoScanBluetooth; },
      "p-autonet":() => { Store.data.settings.autoScanNetwork = !Store.data.settings.autoScanNetwork; return Store.data.settings.autoScanNetwork; }
    };
    $$("[data-toggle]", root).forEach(b => b.addEventListener("click", () => {
      const fn = toggles[b.dataset.toggle];
      if (!fn) return;
      const v = fn();
      b.classList.toggle("on", !!v);
      b.setAttribute("aria-checked", v ? "true" : "false");
      save(null);
      Store.log("settings_change", "Toggled " + b.dataset.toggle + " to " + (v ? "on" : "off") + ".", null);
    }));

    const dc = $("#setDefaultConn", root); if (dc) dc.addEventListener("change", () => { Store.data.settings.prefs.defaultConn = dc.value; save("Default connection type set to " + connLabel(dc.value) + "."); });
    $$("[data-default-veh]", root).forEach(b => b.addEventListener("click", () => {
      Store.data.settings.prefs.defaultVehicleType = b.dataset.defaultVeh; save("New vehicles will default to " + vehType(b.dataset.defaultVeh).label + ".");
      $$("[data-default-veh]", root).forEach(x => x.classList.toggle("on", x === b));
    }));
    $$("[data-poll]", root).forEach(b => b.addEventListener("click", () => {
      Store.data.settings.prefs.livePollSeconds = Number(b.dataset.poll); save("Vehicle polling interval set to " + b.dataset.poll + " s.");
      $$("[data-poll]", root).forEach(x => x.classList.toggle("on", x === b));
    }));
    const ik = $("#setImgKb", root); if (ik) ik.addEventListener("change", () => { Store.data.settings.prefs.imageMaxKb = Number(ik.value); save("Image limit set to " + ik.value + " KB."); });

    $$("[data-notif-ask]", root).forEach(b => b.addEventListener("click", async () => {
      try {
        const res = await Notification.requestPermission();
        UI.toast(res === "granted" ? "Notifications allowed" : "Notifications not allowed", res === "granted" ? "Focus and reminder alerts can now reach you." : "The app will keep using in-app toasts instead.", res === "granted" ? "ok" : "warn");
        UI.refresh();
      } catch (e) { UI.toast("Could not request permission", "The browser refused the request.", "bad"); }
    }));

    $$("[data-perm-refresh]", root).forEach(b => b.addEventListener("click", async () => {
      b.disabled = true; b.innerHTML = icon("refresh", 14) + " Checking…";
      await refreshPermissions();
      UI.toast("Permissions refreshed", "States are read directly from the browser.", "ok");
      UI.refresh();
    }));

    /* ---- DATA ---- */
    $$("[data-export]", root).forEach(b => b.addEventListener("click", () => exportData(false)));
    $$("[data-copy-backup]", root).forEach(b => b.addEventListener("click", () => exportData(true)));
    $$("[data-import]", root).forEach(b => b.addEventListener("click", importFlow));
    $$("[data-clear-all]", root).forEach(b => b.addEventListener("click", clearAllFlow));
    $$("[data-clear-activity]", root).forEach(b => b.addEventListener("click", () => {
      UI.confirm({ title: "Clear the activity log?", message: "All " + Store.data.activity.length + " logged events will be removed. Everything else stays.", confirmText: "Clear log" })
        .then(ok => { if (!ok) return; const n = Store.data.activity.length; Store.data.activity = []; Store.persist(); UI.toast("Activity log cleared", n + " events removed. The clearing itself is not logged.", "ok"); UI.refresh(); });
    }));
    $$("[data-clear-focus]", root).forEach(b => b.addEventListener("click", () => {
      UI.confirm({ title: "Clear focus history?", message: "All recorded focus sessions and their time totals will be removed. This cannot be undone.", confirmText: "Clear history" })
        .then(ok => { if (!ok) return; Store.data.focus.sessions = []; Store.data.focus.totalSeconds = 0; Store.persist(); Store.log("data_clear", "Focus session history was cleared.", null); UI.toast("Focus history cleared", "Totals reset to zero.", "ok"); UI.refresh(); });
    }));
    $$("[data-clear-mystery]", root).forEach(b => b.addEventListener("click", () => {
      UI.confirm({ title: "Reset mystery progress?", message: "All case answers, revealed clues and " + nfmt(Store.data.mystery.xp) + " XP will be cleared. Device data is not affected.", confirmText: "Reset mystery" })
        .then(ok => { if (!ok) return; Store.data.mystery = { xp: 0, progress: {} }; Store.persist(); Store.log("mystery_reset", "All mystery progress and XP were reset.", null); UI.toast("Mystery reset", "All cases are unsolved again.", "ok"); UI.refresh(); });
    }));
    $$("[data-wipe-images]", root).forEach(b => b.addEventListener("click", () => {
      const count = Store.data.devices.filter(d => d.image).length + Store.data.vehicles.filter(v => v.photo).length;
      if (!count) { UI.toast("No images stored", "There is nothing to remove.", "warn"); return; }
      UI.confirm({ title: "Remove all stored images?", message: count + " image(s) will be deleted. Device and vehicle records stay, but they fall back to their placeholder icons.", confirmText: "Remove images" })
        .then(ok => { if (!ok) return; Store.data.devices.forEach(d => { d.image = null; }); Store.data.vehicles.forEach(v => { v.photo = null; }); Store.persist(); Store.log("data_clear", count + " stored image(s) were removed.", null); UI.toast("Images removed", count + " image(s) deleted; records kept.", "ok"); UI.refresh(); });
    }));
    $$("[data-signal-a]", root).forEach(b => b.addEventListener("click", async () => {
      await BT.probe(); Net.init(); await refreshPermissions(); applySettings();
      UI.toast("Capabilities re-read", BT.status().label + " · network: " + (Net.supported ? "available" : "not reported"), "ok");
      UI.refresh();
    }));
  }
});

/* ---------------- export / import / clear ---------------- */
function buildExport() {
  const s = Store.data;
  return {
    app: "My Device Hub",
    kind: "mydevicehub.backup",
    schema: s.version || 1,
    exportedAt: nowIso(),
    counts: {
      devices: s.devices.length, vehicles: s.vehicles.length,
      tasks: s.tasks.length, activity: s.activity.length,
      sessions: s.focus.sessions.length, cases: Object.keys(s.mystery.progress || {}).length
    },
    settings: s.settings,
    devices: s.devices,
    vehicles: s.vehicles,
    primaryVehicleId: s.primaryVehicleId,
    tasks: s.tasks,
    focus: s.focus,
    mystery: s.mystery,
    activity: s.activity,
    meta: s.meta
  };
}
function exportData(toClipboard) {
  const payload = JSON.stringify(buildExport(), null, 2);
  const kb = (payload.length / 1024).toFixed(1) + " KB";
  if (toClipboard) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload)
        .then(() => { Store.data.meta.lastBackupAt = nowIso(); Store.persist(); UI.toast("Backup copied", kb + " of JSON is on your clipboard. Paste it somewhere safe.", "ok"); UI.refresh(); })
        .catch(() => showBackupModal(payload, kb, "Clipboard access was blocked by the browser."));
    } else showBackupModal(payload, kb, "This browser did not expose the clipboard API.");
    return;
  }
  showBackupModal(payload, kb, null);
}
function showBackupModal(payload, kb, note) {
  UI.modal({
    wide: true,
    body: [
      '<div class="sheet-head"><div><h3>Your backup</h3><div class="sub">' + kb + " of JSON containing " + esc(Store.data.devices.length + " device(s), " + Store.data.vehicles.length + " vehicle(s), " + Store.data.tasks.length + " task(s) and all your progress.") +
      (note ? " <b>" + esc(note) + "</b>" : "") + "</div></div></div>",
      '<div class="field"><label>Backup JSON</label><textarea class="textarea mono" id="backupText" readonly style="min-height:190px;font-size:11.5px">' + esc(payload) + "</textarea></div>",
      '<div class="sheet-foot">',
        '<button class="btn btn-primary" data-dl="1">' + icon("download", 15) + " Download .json file</button>",
        '<button class="btn" data-copy2="1">' + icon("file", 15) + " Copy to clipboard</button>",
        '<button class="btn btn-ghost" data-close>Close</button>',
      "</div>",
      '<div class="hint" style="margin-top:12px">If the download is blocked (some in-app browsers and sandboxed frames disallow it), copy the JSON from the box above — it is the same data.</div>'
    ].join(""),
    onMount(sheet, close) {
      $$("[data-dl]", sheet).forEach(b => b.addEventListener("click", () => {
        try {
          const blob = new Blob([payload], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "my-device-hub-backup-" + dayKey() + ".json";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
          Store.data.meta.lastBackupAt = nowIso();
          Store.persist();
          Store.log("data_import", "A backup file was exported (" + kb + ").", null);
          UI.toast("Download started", "Keep this file somewhere safe.", "ok");
          UI.refresh();
        } catch (e) {
          UI.toast("Download blocked", "Copy the JSON from the box instead — it is identical.", "warn");
        }
      }));
      $$("[data-copy2]", sheet).forEach(b => b.addEventListener("click", () => {
        const ta = $("#backupText", sheet);
        ta.removeAttribute("readonly"); ta.select(); ta.setSelectionRange(0, ta.value.length);
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        ta.setAttribute("readonly", "readonly");
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(payload).then(() => {}).catch(() => {});
        UI.toast(ok ? "Copied" : "Select manually", ok ? "Backup JSON is on your clipboard." : "Your browser blocked scripted copy — the text is selected, press Ctrl/Cmd+C.", ok ? "ok" : "warn");
        Store.data.meta.lastBackupAt = nowIso(); Store.persist();
      }));
    }
  });
}

function importFlow() {
  UI.modal({
    body: [
      '<div class="sheet-head"><div><h3>Import a backup</h3><div class="sub">The file is validated before anything is changed. You choose how it is applied.</div></div></div>',
      '<div class="btn-row"><button class="btn btn-primary btn-block" data-pick-file="1">' + icon("upload", 15) + " Choose a .json backup file</button></div>",
      '<div class="hr"></div>',
      '<div class="field"><label>…or paste the backup JSON directly</label><textarea class="textarea mono" id="importText" placeholder="{ &quot;app&quot;: &quot;My Device Hub&quot; … }" style="min-height:140px;font-size:11.5px"></textarea></div>',
      '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn" data-import-text="1">Validate &amp; continue</button></div>',
      '<div class="hint" style="margin-top:12px">Only files created by this app are accepted. Unknown or malformed files are rejected without touching your data.</div>'
    ].join(""),
    onMount(sheet, close) {
      $$("[data-pick-file]", sheet).forEach(b => b.addEventListener("click", () => {
        const input = $("#jsonPicker");
        input.value = "";
        input.onchange = () => {
          const f = input.files && input.files[0];
          if (!f) return;
          if (f.size > 8 * 1024 * 1024) { UI.toast("File too large", "Backups larger than 8 MB are not accepted.", "bad"); return; }
          const rd = new FileReader();
          rd.onload = () => { close(); handleImportPayload(String(rd.result)); };
          rd.onerror = () => UI.toast("Could not read file", "Please try again.", "bad");
          rd.readAsText(f);
        };
        input.click();
      }));
      $$("[data-import-text]", sheet).forEach(b => b.addEventListener("click", () => {
        const v = $("#importText", sheet).value.trim();
        if (!v) { UI.toast("Nothing to import", "Paste a backup or choose a file.", "warn"); return; }
        close();
        handleImportPayload(v);
      }));
    }
  });
}

function handleImportPayload(text) {
  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { UI.toast("Not valid JSON", "The file could not be parsed, so nothing was changed.", "bad"); return; }
  if (!parsed || parsed.app !== "My Device Hub" || !parsed.kind) {
    UI.toast("Unrecognised backup", "This file was not produced by My Device Hub. Nothing was changed.", "bad");
    return;
  }
  const c = parsed.counts || {};
  UI.modal({
    body: [
      '<div class="sheet-head"><div><h3>Backup verified</h3><div class="sub">Exported ' + esc(parsed.exportedAt ? fmtDateTime(parsed.exportedAt) : "at an unknown time") + ". Nothing has been changed yet.</div></div></div>",
      '<div class="grid grid-4" style="gap:10px">' +
        tile("Devices", nfmt(c.devices || (parsed.devices || []).length), "in the file") +
        tile("Vehicles", nfmt(c.vehicles || (parsed.vehicles || []).length), "in the file") +
        tile("Tasks", nfmt(c.tasks || (parsed.tasks || []).length), "in the file") +
        tile("Activity rows", nfmt(c.activity || (parsed.activity || []).length), "in the file") +
      "</div>",
      '<div class="hr"></div>',
      '<div class="list">' +
        '<div class="row"><span class="avatar sm">' + icon("layers", 17) + '</span><div class="grow"><div class="name">Merge with my current data</div><div class="meta">Keeps everything you have now and adds the file\'s devices, vehicles, tasks and sessions alongside it. Duplicate ids are skipped, so no vehicle is ever overwritten.</div></div><button class="btn btn-sm" data-mode="merge">Merge</button></div>' +
        '<div class="row"><span class="avatar sm" style="color:var(--bad);border-color:rgba(241,106,106,.35)">' + icon("warn", 17) + '</span><div class="grow"><div class="name">Replace everything</div><div class="meta">Your current devices, vehicles, tasks, focus history, mystery progress and settings are discarded and replaced by the file\'s contents.</div></div><button class="btn btn-sm btn-danger" data-mode="replace">Replace</button></div>' +
      "</div>",
      '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Cancel</button></div>'
    ].join(""),
    onMount(sheet, close) {
      $$("[data-mode]", sheet).forEach(b => b.addEventListener("click", () => {
        const mode = b.dataset.mode;
        close();
        UI.confirm({
          title: mode === "replace" ? "Replace all current data?" : "Merge this backup in?",
          message: mode === "replace"
            ? "Everything currently in the hub will be deleted and replaced with the contents of this file. This cannot be undone."
            : "The file's devices, tasks, car profile and sessions will be added to what you already have. Matching ids are skipped rather than duplicated.",
          confirmText: mode === "replace" ? "Replace everything" : "Merge backup",
          danger: mode === "replace"
        }).then(ok => { if (ok) applyImport(parsed, mode); });
      }));
    }
  });
}

function applyImport(parsed, mode) {
  const before = { devices: Store.data.devices.length, vehicles: Store.data.vehicles.length, tasks: Store.data.tasks.length, sessions: Store.data.focus.sessions.length };
  if (mode === "replace") {
    if (!parsed.vehicles && parsed.car) { parsed.vehicles = null; }   /* let migrate() lift a v1 backup forward */
    Store.data = Store.migrate(parsed);
    Store.data.meta.lastImportAt = nowIso();
    Store.data.activity.unshift({ id: uid("act"), ts: nowIso(), action: "data_import", label: ACTIVITY_ACTIONS.data_import.l, detail: "Backup applied in replace mode: " + before.devices + " device(s) replaced.", kind: "add", entity: null });
    Store.persist();
    UI.toast("Backup restored", "Your hub now matches the backup exactly.", "ok");
  } else {
    let added = 0, skipped = 0;
    (parsed.devices || []).forEach(d => {
      if (!d || !d.id || Store.getDevice(d.id)) { skipped++; return; }
      Store.data.devices.push(d); added++;
    });
    (parsed.vehicles || []).forEach(v => {
      if (!v || !v.id || Store.getVehicle(v.id)) { skipped++; return; }
      Store.data.vehicles.push(Store.normalizeVehicle(v)); added++;
    });
    (parsed.tasks || []).forEach(t => {
      if (!t || !t.id || Store.data.tasks.some(x => x.id === t.id)) { skipped++; return; }
      Store.data.tasks.push(t); added++;
    });
    const known = new Set(Store.data.focus.sessions.map(s => s.id));
    (parsed.focus && parsed.focus.sessions || []).forEach(s => {
      if (!s || !s.id || known.has(s.id)) { skipped++; return; }
      Store.data.focus.sessions.push(s);
      Store.data.focus.totalSeconds += (s.seconds || 0);
      added++;
    });
    Object.keys((parsed.mystery || {}).progress || {}).forEach(cid => {
      if (!Store.data.mystery.progress[cid]) {
        Store.data.mystery.progress[cid] = parsed.mystery.progress[cid];
        Store.data.mystery.xp += (parsed.mystery.progress[cid].xp || 0);
        added++;
      } else skipped++;
    });
    if (!Store.data.primaryVehicleId && parsed.primaryVehicleId && Store.getVehicle(parsed.primaryVehicleId)) {
      Store.data.primaryVehicleId = parsed.primaryVehicleId;
    }
    Store.data.devices.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    Store.data.vehicles.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    Store.data.meta.lastImportAt = nowIso();
    Store.persist();
    Store.log("data_import", "Merged a backup: " + added + " record(s) added, " + skipped + " skipped as duplicates.", null);
    UI.toast("Backup merged", added + " record(s) added, " + skipped + " skipped.", "ok");
  }
  applySettings();
  Router.go("home");
  UI.refresh();
}

function clearAllFlow() {
  UI.modal({
    body: [
      '<div class="sheet-head"><div class="card-ico" style="color:var(--bad);background:rgba(248,113,113,.12);border-color:rgba(248,113,113,.3)">' + icon("warn", 19) + '</div><div><h3>Clear all data?</h3>' +
      '<div class="sub">This removes every device profile, every vehicle profile and its service history, all tasks, focus sessions, mystery progress, settings and the entire activity log from this browser. It cannot be undone.</div></div></div>',
      '<div class="notice warn"><span class="ni">' + icon("warn", 17) + '</span><div>Type <b>CLEAR</b> below to confirm. If you might want this data again, export a backup first — the button is right there.</div></div>',
      '<div class="field" style="margin-top:12px"><label>Confirmation</label><input class="input" id="clearConfirm" placeholder="CLEAR" autocomplete="off"></div>',
      '<div class="sheet-foot">',
        '<button class="btn btn-ghost" data-close>Cancel</button>',
        '<button class="btn" data-export-first="1">' + icon("download", 15) + " Export first</button>",
        '<button class="btn btn-danger" data-do-clear="1" disabled>' + icon("trash", 15) + " Erase everything</button>",
      "</div>"
    ].join(""),
    onMount(sheet, close) {
      const inp = $("#clearConfirm", sheet);
      const btn = $("[data-do-clear]", sheet);
      inp.addEventListener("input", () => { btn.disabled = inp.value.trim().toUpperCase() !== "CLEAR"; });
      $("[data-export-first]", sheet).addEventListener("click", () => { exportData(false); });
      btn.addEventListener("click", () => {
        const n = Store.data.devices.length + Store.data.vehicles.length + Store.data.tasks.length + Store.data.focus.sessions.length;
        Store.reset();
        applySettings();
        close();
        UI.toast("All data cleared", n + " user records erased. The hub is back to a fresh, empty state.", "ok");
        Router.go("home");
      });
    }
  });
}

