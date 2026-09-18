
/* ============================================================
   VIEW TICKERS — intervals registered by a view are cleared
   automatically when the view is replaced.
   ============================================================ */
UI._tickers = [];
UI.every = function (fn, ms) {
  const id = setInterval(fn, ms);
  this._tickers.push(id);
  return id;
};
UI.clearTickers = function () {
  this._tickers.forEach(clearInterval);
  this._tickers = [];
  Focus._tickId = null;
};

/* ============================================================
   SHARED CARD PIECES (used across every section, so the visual
   language stays identical everywhere)
   ============================================================ */
function cardHead(iconName, title, right) {
  return '<div class="card-head"><span class="card-ico">' + icon(iconName, 17) + '</span><span class="t">' + esc(title) + '</span><span class="spacer"></span>' + (right || "") + "</div>";
}
function nForm(n) { return Number(n || 0).toLocaleString(); }
function qa(iconName, label, id) {
  return '<button class="qa" id="' + id + '"><span class="qi">' + icon(iconName, 16) + '</span><span class="qt">' + esc(label) + "</span></button>";
}
function tile(label, value, sub, cls, iconName) {
  return '<div class="tile ' + (cls || "") + '">' + (iconName ? '<span class="tico">' + icon(iconName, 15) + "</span>" : "") +
    '<div class="tl">' + esc(label) + '</div><div class="tv">' + value + "</div>" + (sub ? '<div class="ts">' + sub + "</div>" : "") + "</div>";
}
function kpi(iconName, value, label) {
  return '<div class="kpi"><span class="kpi-ico">' + icon(iconName, 16) + '</span><div><div class="kpi-v">' + value + '</div><div class="kpi-l">' + esc(label) + "</div></div></div>";
}
function activityItem(a) {
  const entity = a.entity && a.entity.name ? '<div class="tl-entity">' + icon(a.entity.type === "vehicle" ? "car" : a.entity.type === "device" ? "devices" : a.entity.type === "task" ? "tasks" : "info", 11) + " " + esc(a.entity.name) + "</div>" : "";
  return '<div class="tl-item evt-' + esc(a.kind || "") + '"><div class="tl-t">' + esc(a.label) + '</div><div class="tl-d">' + esc(a.detail) + "</div>" + entity +
    '<div class="tl-w">' + esc(fmtDateTime(a.ts)) + " · " + esc(relTime(a.ts)) + "</div></div>";
}
function lastBtTime() {
  const withLive = Store.data.devices.filter(d => d.live && d.live.lastConnectedAt).sort((a, b) => new Date(b.live.lastConnectedAt) - new Date(a.live.lastConnectedAt));
  if (withLive.length) return esc(relTime(withLive[0].live.lastConnectedAt)) + ' <span class="dim">(' + esc(withLive[0].name) + ")</span>";
  return '<span class="dim">never recorded</span>';
}

/* ============================================================
   HOME — the command center overview
   ============================================================ */
defRoute("home", {
  title: "Home",
  render() {
    const s = Store.data;
    const devCount = s.devices.length;
    const vehCount = s.vehicles.length;
    const cars = Store.vehiclesOfType("car").length;
    const bikes = Store.vehiclesOfType("bike").length;
    const primary = Store.primaryVehicle();
    const bt = BT.status();
    const net = Net.snapshot();
    const connectedDevices = s.devices.filter(d => d.status === "connected").length;
    const todaySec = Store.secondsForDay(todayKey());
    const goalMin = (s.settings.prefs && s.settings.prefs.dailyFocusGoal) || 120;
    const tasks = s.tasks;
    const todayTasks = tasks.filter(t => t.due === todayKey() || (!t.due && !t.done));
    const doneToday = tasks.filter(t => t.done && t.completedAt && dayKey(t.completedAt) === todayKey()).length;
    const openTasks = tasks.filter(t => !t.done).length;
    const xp = s.mystery.xp;
    const solved = MYSTERY_CASES.filter(c => s.mystery.progress[c.id] && s.mystery.progress[c.id].solved).length;
    const dueVehicle = s.vehicles.map(v => ({ v, r: nextVehicleReminder(v) })).filter(x => x.r && x.r.days <= 14).sort((a, b) => a.r.days - b.r.days)[0] || null;
    const liveVehicles = s.vehicles.filter(v => ["live", "waiting"].indexOf(vehicleConnState(v).id) > -1).length;

    return [
      /* ── heartbeat ── */
      '<div class="hero">',
        '<div class="row-between" style="align-items:flex-start;gap:16px;flex-wrap:wrap">',
          "<div>",
            '<div class="eyebrow">Command center</div>',
            '<div class="hero-clock" id="heroClock">' + fmtTime(new Date()) + "</div>",
            '<div class="hero-date" id="heroDate">' + esc(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })) + "</div>",
          "</div>",
          '<div class="wrap" style="justify-content:flex-end;max-width:340px">',
            UI.pill(bt.label, bt.kind, true, bt.state === "supported"),
            UI.pill(net.online ? (net.type !== "unknown" ? net.typeLabel + " link" : "Online") : "Offline", net.online ? "ok" : "bad", true),
          "</div>",
        "</div>",
        '<div class="hero-strip">',
          '<div class="hero-cell"><div class="hc-l">Devices</div><div class="hc-v">' + icon("devices", 14) + " " + nForm(devCount) + "</div></div>",
          '<div class="hero-cell"><div class="hc-l">Vehicles</div><div class="hc-v">' + icon("car", 14) + " " + nForm(vehCount) + "</div></div>",
          '<div class="hero-cell"><div class="hc-l">Bluetooth</div><div class="hc-v">' + icon("bluetooth", 14) + " " + esc(bt.state === "supported" ? "Available" : bt.state === "unavailable" ? "Unavailable" : "Unsupported") + "</div></div>",
          '<div class="hero-cell"><div class="hc-l">Network</div><div class="hc-v">' + icon("wifi", 14) + " " + esc(net.online ? (net.type !== "unknown" ? net.typeLabel : "Online") : "Offline") + "</div></div>",
        "</div>",
        '<div class="qa-grid">',
          qa("plus", "Add device", "home-qa-add"),
          qa("car", "Add vehicle", "home-qa-addveh"),
          qa("scan", "Scan Bluetooth", "home-qa-bt"),
          qa("wifi", "Wi-Fi details", "home-qa-wifi"),
          qa("focus", "Focus timer", "home-qa-focus"),
        "</div>",
      "</div>",

      '<div class="section-title">Overview<span class="spacer"></span><span class="saved-note">' + icon("shield", 12) + " real data only</span></div>",

      '<div class="grid">',

        /* ── MY DEVICES ── */
        '<div class="card tap span-2" data-go="devices" style="display:flex;flex-direction:column;gap:12px">',
          cardHead("devices", "My devices", '<span class="link-btn">Open ' + icon("chevron", 12) + "</span>"),
          devCount
            ? '<div class="row-between" style="align-items:flex-end;gap:14px">' +
                '<div><div class="big">' + nForm(devCount) + '</div><div class="sub">saved device profile' + (devCount === 1 ? "" : "s") + (connectedDevices ? " · " + connectedDevices + " live connection" + (connectedDevices === 1 ? "" : "s") : " · none connected") + "</div></div>" +
                '<div class="wrap" style="justify-content:flex-end">' + categoryChips(s.devices) + "</div>" +
              "</div>" +
              '<div class="list">' + s.devices.slice(0, 3).map(d => deviceRowHtml(d, true)).join("") + "</div>"
            : UI.emptyState("No devices yet", "Add a phone, laptop, headset or anything else you own. A profile is only a record until you genuinely connect.", "Add your first device", 'data-add-device="1"', "devices"),
        "</div>",

        /* ── MY VEHICLES ── */
        '<div class="card span-2">',
          cardHead("car", "My vehicles", '<button class="link-btn" data-go="vehicles">View all ' + icon("chevron", 12) + "</button>"),
          (vehCount
            ? '<div class="row-between" style="align-items:flex-end;gap:14px;margin-bottom:12px">' +
                '<div><div class="big">' + nForm(vehCount) + '</div><div class="sub">' + nForm(cars) + " car" + (cars === 1 ? "" : "s") + " · " + nForm(bikes) + " bike" + (bikes === 1 ? "" : "s") + " · unlimited profiles" + (liveVehicles ? " · " + liveVehicles + " integration" + (liveVehicles === 1 ? "" : "s") + " active" : "") + "</div></div>" +
              "</div>" +
              (primary
                ? '<div class="row tap" data-go="vehicle" data-primary-card="' + esc(primary.id) + '">' +
                    UI.avatarHtml({ category: "other", image: primary.photo }, "sm") +
                    '<div class="grow"><div class="name">' + esc(primary.nickname) + ' <span class="badge-type badge-primary" style="margin-left:6px">' + icon("star", 10) + " Primary</span></div>" +
                    '<div class="meta">' + esc(vehicleSubtitle(primary)) + " · " + esc(vehicleConnectionMeta(primary).label) + "</div></div>" +
                    icon("chevron", 16) +
                  "</div>" : "") +
              (dueVehicle ? '<div class="dev-note" style="margin-top:10px">' + icon("bell", 12) + "<span><b>" + esc(dueVehicle.v.nickname) + ":</b> " + esc(dueVehicle.r.label) + " — " + esc(dueVehicle.r.when) + "</span></div>" : "") +
              '<div class="btn-row" style="margin-top:12px"><button class="btn btn-sm btn-primary" data-add-vehicle="1">' + icon("plus", 13) + " Add vehicle</button>" +
              '<button class="btn btn-sm" data-go="vehicles">View all vehicles</button></div>'
            : UI.emptyState("No vehicles yet", "Keep your car and bike profiles here — photos, reminders, insurance and service history, with live data only when a real integration is connected.", "Add your first vehicle", 'data-add-vehicle="1"', "car")),
        "</div>",

        /* ── BLUETOOTH ── */
        '<div class="card tap" data-go="bluetooth">',
          cardHead("bluetooth", "Bluetooth", '<span class="link-btn">' + icon("chevron", 12) + "</span>"),
          '<div style="font-size:18px;font-weight:650;display:flex;align-items:center;gap:9px">' + icon("bluetooth", 18) + esc(bt.label) + "</div>",
          '<div class="sub" style="margin-top:7px">' + esc(bt.text) + "</div>",
          '<div class="hr"></div>',
          (BT.device
            ? UI.kv("Live device", esc(BT.device.name || "Unnamed")) + UI.kv("GATT services", String((BT.gattServices || []).length))
            : UI.kv("Live connection", '<span class="dim">none</span>')),
          UI.kv("Last connection", lastBtTime()),
        "</div>",

        /* ── WI-FI ── */
        '<div class="card tap" data-go="wifi">',
          cardHead("wifi", "Wi-Fi &amp; network", '<span class="link-btn">' + icon("chevron", 12) + "</span>"),
          '<div style="font-size:18px;font-weight:650;display:flex;align-items:center;gap:9px">' + icon("wifi", 18) + (net.online ? "Online" : "Offline") + "</div>",
          '<div class="sub" style="margin-top:7px">' + (net.type !== "unknown" ? "Link type reported as " + esc(net.typeLabel) + "." : Net.supported ? "Link type is not reported by this browser." : "Wi-Fi information limited on this platform.") + "</div>",
          '<div class="hr"></div>',
          UI.kv("Effective class", net.effectiveType ? esc(net.effectiveType) : '<span class="dim">not reported</span>') +
          UI.kv("Network name", '<span class="dim">not exposed to pages</span>'),
        "</div>",

        /* ── FOCUS ── */
        '<div class="card tap" data-go="focus">',
          cardHead("focus", "Focus", '<span class="link-btn">' + icon("chevron", 12) + "</span>"),
          '<div class="row" style="background:transparent;border:0;padding:0;gap:14px">' +
            UI.miniRing(goalMin ? (todaySec / 60) / goalMin : 0, Math.round(todaySec / 60) + "m") +
            '<div class="grow"><div class="dev-name">' + fmtDur(todaySec / 60) + ' today</div><div class="dev-sub">' + s.focus.sessions.length + " session" + (s.focus.sessions.length === 1 ? "" : "s") + " · " + Store.streak() + "-day streak</div></div>" +
          "</div>" +
          '<div class="hr"></div>' +
          '<button class="btn btn-primary btn-block" data-go="focus">' + icon("play", 14) + " Start a focus session</button>",
        "</div>",

        /* ── TASKS ── */
        '<div class="card tap" data-go="tasks">',
          cardHead("tasks", "Tasks", '<span class="link-btn">' + icon("chevron", 12) + "</span>"),
          (tasks.length
            ? '<div class="big">' + nForm(openTasks) + ' <span style="font-size:13px;font-weight:500;color:var(--muted)">open</span></div>' +
              '<div class="hr"></div>' +
              '<div class="stat-pair">' +
                '<div class="sp"><div class="sp-v">' + todayTasks.length + '</div><div class="sp-l">Today</div></div>' +
                '<div class="sp"><div class="sp-v" style="color:var(--ok)">' + doneToday + '</div><div class="sp-l">Completed</div></div>' +
                '<div class="sp"><div class="sp-v" style="color:var(--warn)">' + (todayTasks.length - todayTasks.filter(t => t.done).length) + '</div><div class="sp-l">Remaining</div></div>' +
              "</div>"
            : UI.emptyState("No tasks yet", "Tasks stay on this device. Vehicle reminders can be turned into tasks in one tap.", "Add a task", 'data-add-task="1"', "tasks")),
        "</div>",

        /* ── MYSTERY (kept apart from devices and vehicles) ── */
        '<div class="card tap" data-go="mystery">',
          cardHead("mystery", "Mystery files", '<span class="link-btn">' + icon("chevron", 12) + "</span>"),
          '<div class="big">' + nForm(xp) + ' <span style="font-size:13px;font-weight:500;color:var(--muted)">XP</span></div>',
          '<div class="sub" style="margin-top:6px">' + solved + " of " + MYSTERY_CASES.length + " cases closed · separate fictional section</div>",
          '<div class="hr"></div>',
          '<div class="xp-bar"><div class="xp-fill" style="width:' + pct(solved, MYSTERY_CASES.length) + '%"></div></div>',
        "</div>",

        /* ── ACTIVITY ── */
        '<div class="card span-full">',
          cardHead("clock", "Activity", '<button class="link-btn" data-go="activity">View all ' + icon("chevron", 12) + "</button>"),
          (s.activity.length
            ? '<div class="timeline">' + s.activity.slice(0, 6).map(activityItem).join("") + "</div>"
            : '<div class="sub">Nothing recorded yet. Device edits, vehicle changes, real Bluetooth and vehicle connections, completed tasks and focus sessions all appear here — and nothing else.</div>'),
        "</div>",

      "</div>"
    ].join("");
  },
  afterRender(root) {
    UI.every(() => {
      const c = $("#heroClock", root), d = $("#heroDate", root);
      if (!c) return;
      const n = new Date();
      c.textContent = fmtTime(n);
      if (d) d.textContent = n.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }, 1000);
    bindDeviceInteractions(root);
    const pc = root.querySelector("[data-primary-card]");
    if (pc && !pc._bound) { pc._bound = true; pc.addEventListener("click", e => { e.stopPropagation(); Router.go("vehicle", { id: pc.dataset.primaryCard }); }); }
    root.querySelectorAll("[data-go='vehicle']").forEach(el => {});
  }
});

function categoryChips(devices) {
  const counts = {};
  devices.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
  return Object.keys(counts).slice(0, 4).map(k => '<span class="chip">' + catOf(k).emoji + " " + counts[k] + "</span>").join("");
}

/* ============================================================
   ACTIVITY TIMELINE (full)
   ============================================================ */
defRoute("activity", {
  title: "Activity",
  render() {
    const s = Store.data;
    const p = Router.params || {};
    const scope = p.scope || "all";
    const limit = p.limit || 60;
    const items = s.activity.filter(a => scope === "all" ? true : (a.entity && a.entity.type === scope)).slice(0, limit);
    const counts = {};
    s.activity.forEach(a => { counts[a.kind] = (counts[a.kind] || 0) + 1; });
    const deviceEvents = s.activity.filter(a => a.entity && a.entity.type === "device").length;
    const vehicleEvents = s.activity.filter(a => a.entity && a.entity.type === "vehicle").length;

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="home" aria-label="Back">' + icon("back", 19) + "</button>",
        "<div><h2>Activity timeline</h2><p class=\"sub\">Every entry was produced by something that actually happened — your edits, your sessions, or a connection change reported by a real API. Nothing is generated to fill the list.</p></div>",
      "</div>",

      '<div class="grid grid-4" style="margin-bottom:16px">',
        tile("Total events", nfmt(s.activity.length), "since " + fmtDate(s.createdAt), "", "clock"),
        tile("Device events", nfmt(deviceEvents), "profiles and Bluetooth", "", "devices"),
        tile("Vehicle events", nfmt(vehicleEvents), "profiles and integrations", "", "car"),
        tile("Warnings", nfmt(counts.warn || 0), "limitations &amp; failures", "", "warn"),
      "</div>",

      '<div class="row-between" style="margin-bottom:12px;flex-wrap:wrap;gap:10px">' +
        '<div class="seg">' + [["all", "Everything"], ["device", "Devices"], ["vehicle", "Vehicles"], ["task", "Tasks"], ["case", "Mystery"]]
          .map(o => '<button data-scope="' + o[0] + '" class="' + (scope === o[0] ? "on" : "") + '">' + o[1] + "</button>").join("") + "</div>" +
        '<span class="saved-note">' + icon("shield", 12) + " real events only</span>" +
      "</div>",

      '<div class="card">',
        (items.length
          ? '<div class="timeline">' + items.map(activityItem).join("") + "</div>"
          : '<div class="sub">No events in this filter yet.</div>'),
      "</div>",

      (s.activity.length > limit ? '<div style="margin-top:14px"><button class="btn btn-block" data-more="' + (limit + 60) + '" data-scope-keep="' + esc(scope) + '">Load older events</button></div>' : ""),
      '<div style="margin-top:14px">' + UI.notice("If the browser cannot observe something — other apps' Bluetooth traffic, your Wi-Fi network name, a vehicle that is not connected — no entry is written and no value is shown. Absence of data is reported as absence.", "", "shield") + "</div>"
    ].join("");
  },
  afterRender(root) {
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go("home")));
    $$("[data-scope]", root).forEach(b => b.addEventListener("click", () => Router.go("activity", { scope: b.dataset.scope })));
    $$("[data-more]", root).forEach(b => b.addEventListener("click", () => Router.go("activity", { scope: b.dataset.scopeKeep, limit: Number(b.dataset.more) })));
  }
});
