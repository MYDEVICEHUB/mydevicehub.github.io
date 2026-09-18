/* ============================================================
   BLUETOOTH VIEW
   ============================================================ */
const BluetoothView = {
  async scanFlow(opts) {
    opts = opts || {};
    if (!BT.nav) {
      UI.toast("Bluetooth unavailable", BT.status().detail, "bad");
      return;
    }
    if (!Platform.secure) { UI.toast("HTTPS required", BT.status().detail, "bad"); return; }
    UI.toast("Opening chooser", "The browser's own Bluetooth dialog is the only way a web page can see a device. Pick one to continue.", "");
    try {
      const dev = await BT.scan();
      if (!dev) return;
      const name = dev.name || "Unnamed Bluetooth device";
      const profile = Store.data.devices.find(d => d.btDeviceId === dev.id) ||
                      Store.data.devices.find(d => d.btDeviceName && dev.name && d.btDeviceName.toLowerCase() === dev.name.toLowerCase()) ||
                      (opts.thenLinkProfile ? Store.getDevice(opts.thenLinkProfile) : null);
      UI.modal({
        body: [
          '<div class="sheet-head"><div><h3>Device selected</h3><div class="sub">This is a real device the browser just handed to this page.</div></div></div>',
          '<div class="row"><span class="avatar sm">' + icon("bluetooth", 20) + '</span><div class="grow"><div class="name">' + esc(name) + '</div><div class="meta">Advertised name from the Bluetooth device itself</div></div></div>',
          '<div style="margin-top:12px">',
            UI.kv("Browser device id", esc(dev.id.slice(0, 18)) + (dev.id.length > 18 ? "…" : ""), false),
            UI.kv("GATT available", dev.gatt ? "yes" : "no", false),
            UI.kv("Watch advertisements", typeof dev.watchAdvertisements === "function" ? "supported" : "not supported", false),
          "</div>",
          (profile ? '<div style="margin-top:14px">' + UI.notice("This matches your saved profile <b>" + esc(profile.name) + "</b>.", "ok") + "</div>"
                   : '<div style="margin-top:14px">' + UI.notice("This device is not saved in your hub yet. You can connect to it now, or add it as a profile first.") + "</div>"),
          '<div class="sheet-foot">',
            '<button class="btn btn-ghost" data-close>Close</button>',
            (profile
              ? '<button class="btn btn-primary" data-do-link="' + esc(profile.id) + '">' + icon("link", 15) + " Connect to “" + esc(profile.name) + "”</button>"
              : '<button class="btn" data-do-save="1">' + icon("plus", 15) + " Save as device profile</button>" +
                '<button class="btn btn-primary" data-do-quick="1">' + icon("link", 15) + " Connect now</button>"),
          "</div>"
        ].join(""),
        onMount(sheet, close) {
          const doLink = $("[data-do-link]", sheet);
          if (doLink) doLink.addEventListener("click", async () => {
            close();
            try {
              await BT.link(Store.getDevice(doLink.dataset.doLink), dev);
              UI.toast("Connected", "Live link established with “" + name + "”.", "ok");
            } catch (e) { UI.toast("Connection failed", BT.describe(e), "bad"); }
            UI.refresh();
          });
          const quick = $("[data-do-quick]", sheet);
          if (quick) quick.addEventListener("click", async () => {
            close();
            try {
              const res = await BT.connect(dev);
              BT.attach(dev);
              Store.data.settings.lastQuickBt = name;
              UI.toast("Connected", "Linked for this session. " + (res.services.length ? res.services.length + " GATT service(s) exposed." : "No GATT services were exposed."), "ok");
            } catch (e) { UI.toast("Connection failed", BT.describe(e), "bad"); }
            UI.refresh();
          });
          const save = $("[data-do-save]", sheet);
          if (save) save.addEventListener("click", () => {
            close();
            DeviceForm.open({ name: name, brand: "", model: "", category: "other", image: null, connection: "bluetooth", notes: "", serial: "", btDeviceId: dev.id, btDeviceName: dev.name || null });
          });
        }
      });
    } catch (e) {
      BT.lastError = BT.describe(e);
      if (e && e.name === "NotFoundError") UI.toast("No device selected", BT.lastError, "warn");
      else UI.toast("Scan failed", BT.lastError, "bad");
      UI.refresh();
    }
  },

  render() {
    const st = BT.status();
    const s = Store.data;
    const live = BT.device && BT.device.gatt && BT.device.gatt.connected ? BT.device : null;
    const linked = Store.getDevice(BT.linkedProfileId || "") || null;
    const btProfiles = s.devices.filter(d => d.connection === "bluetooth" || d.btDeviceId);
    const otherProfiles = s.devices.filter(d => d.connection !== "bluetooth" && !d.btDeviceId);
    const supported = st.state === "supported" || st.state === "unavailable";

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="home" aria-label="Back">' + icon("back", 19) + "</button>",
        "<div><div class=\"eyebrow\">Live hardware</div><h2>Bluetooth</h2>" +
        '<p class="sub">Everything on this page comes from the browser\'s Web Bluetooth API or from your own saved profiles. If a value cannot be read, it says so.</p></div>',
      "</div>",

      '<div class="card" style="margin-bottom:16px">',
        '<div class="row-between" style="align-items:flex-start;gap:16px;flex-wrap:wrap">',
          "<div>",
            '<div class="card-head" style="margin-bottom:8px"><span class="card-ico">' + icon("bluetooth", 18) + '</span><span class="t">Adapter status</span></div>',
            '<div style="font-size:clamp(19px,4.4vw,24px);font-weight:700">' + esc(st.label) + "</div>",
            '<div class="sub" style="margin-top:6px;max-width:60ch">' + esc(st.text) + "</div>",
            (st.detail ? '<div class="sub" style="margin-top:6px;max-width:60ch;color:var(--warn)">' + icon("warn", 13) + " " + esc(st.detail) + "</div>" : ""),
          "</div>",
          '<div class="stack" style="align-items:flex-end">' +
            UI.pill(st.label, st.kind, true, st.state === "supported") +
            '<span class="chip">' + esc(Platform.platformLabel) + "</span>" +
            '<span class="chip">' + (Platform.secure ? "secure origin" : "insecure origin") + "</span>" +
          "</div>",
        "</div>",
        '<div class="hr"></div>',
        '<div class="btn-row">',
          '<button class="btn btn-primary" data-bt-scan="1"' + (supported && Platform.secure ? "" : " disabled") + ">" + icon("scan", 15) + " Scan</button>",
          (live
            ? '<button class="btn btn-ok" data-bt-disconnect="1">' + icon("unlink", 15) + " Disconnect</button>"
            : '<button class="btn" data-bt-connect-profile="1"' + (st.state === "supported" && btProfiles.length ? "" : " disabled") + ">" + icon("link", 15) + " Connect</button>") +
          '<button class="btn" data-bt-refresh="1">' + icon("refresh", 15) + " Re-check adapter</button>" +
          '<button class="btn" data-bt-battery="1"' + (live ? "" : " disabled") + ">" + icon("sparkle", 15) + " Read battery</button>" +
        "</div>",
        '<div class="hint" style="margin-top:9px">Buttons that this platform cannot support stay disabled rather than doing nothing.</div>',
      "</div>",

      /* LIVE CONNECTION */
      '<div class="section-title">Live connection</div>',
      live
        ? '<div class="card" style="margin-bottom:16px">' +
            '<div class="row">' +
              '<span class="avatar">' + icon("bluetooth", 22) + "</span>" +
              '<div class="grow"><div class="name">' + esc(live.name || "Unnamed Bluetooth device") + '</div><div class="meta">Real GATT connection held by this page</div></div>' +
              UI.pill("Connected", "ok", true, true) +
            "</div>" +
            '<div class="hr"></div>' +
            UI.kv("Advertised name", live.name ? esc(live.name) : '<span class="dim">this device advertises no name</span>', false) +
            UI.kv("Opaque device id", esc(live.id.slice(0, 28)) + (live.id.length > 28 ? "…" : ""), false) +
            UI.kv("Saved profile", linked ? esc(linked.name) : '<span class="dim">not linked to a profile</span>', false) +
            UI.kv("Connected since", linked && linked.live && linked.live.lastConnectedAt ? esc(relTime(linked.live.lastConnectedAt)) : '<span class="dim">just now</span>', false) +
            UI.kv("GATT services exposed", (BT.gattServices && BT.gattServices.length) ? BT.gattServices.length + " service(s)" : '<span class="dim">none readable</span>', false) +
            ((BT.gattServices && BT.gattServices.length) ? '<div class="wrap" style="margin-top:10px">' + BT.gattServices.map(u => '<span class="chip">' + esc(String(u).slice(0, 20)) + (String(u).length > 20 ? "…" : "") + "</span>").join("") + "</div>" : "") +
            '<div class="hint" style="margin-top:10px">The device id is a per-origin identifier created by the browser. Your Bluetooth MAC address is deliberately not exposed to web pages.</div>' +
          "</div>"
        : UI.notice("<b>No live Bluetooth connection.</b> A web page can only see devices you hand it through the browser's own chooser, and only while the page is open. Nothing is connected right now — and nothing is invented to fill the space.", "", "bluetooth"),

      /* RECENTLY GRANTED */
      '<div class="section-title">Devices this browser already trusts <span class="spacer"></span><button class="link-btn" data-bt-refresh="1">Refresh</button></div>',
      '<div class="card" id="grantedBox" style="margin-bottom:16px"><div class="sub">Reading the browser\'s granted-device list…</div></div>',

      /* PROFILES */
      '<div class="section-title">Saved profiles that expect Bluetooth</div>',
      (btProfiles.length
        ? '<div class="card" style="margin-bottom:16px"><div class="list">' + btProfiles.map(p => BluetoothProfileRow(p, live)).join("") + "</div></div>"
        : UI.emptyState("No Bluetooth profiles yet", "Add a device and set its connection type to Bluetooth — for example your headphones or a speaker.", "Add a device", 'data-add-device="1"', "bluetooth")),
      (otherProfiles.length ? '<div class="card" style="margin-bottom:16px">' + cardHead("devices", "Other saved profiles", '<span class="sub">Wi-Fi / USB / other</span>') +
        '<div class="list">' + otherProfiles.map(p => '<div class="row"><span class="avatar sm">' + catOf(p.category).emoji + '</span><div class="grow"><div class="name">' + esc(p.name) + '</div><div class="meta">Connection type: ' + esc(connLabel(p.connection)) + ' · not a Bluetooth profile</div></div><span class="chip">no BT</span></div>').join("") + "</div>" +
        '<div class="hint" style="margin-top:10px">These profiles are not offered a Bluetooth connect button because you recorded them as non-Bluetooth devices.</div></div>' : ""),

      /* LIMITATIONS */
      '<div class="section-title">What a web page genuinely can and cannot do</div>',
      '<div class="card">',
        '<div class="form-grid" style="gap:16px">',
          '<div>' + UI.notice("<b>Can do</b><ul>" +
            "<li>Ask the browser for a device chooser, after a direct tap on SCAN or CONNECT</li>" +
            "<li>Read the name the device advertises and its opaque browser id</li>" +
            "<li>Open a real GATT connection, list exposed services, and read standard characteristics such as the GATT Battery Service when the device supports it</li>" +
            "<li>Receive the browser's own disconnection events while the page is open</li>" +
            "<li>Reconnect to a device you already granted, without a new chooser</li></ul>", "ok", "check") + "</div>",
          '<div>' + UI.notice("<b>Cannot do</b><ul>" +
            "<li>See other apps' Bluetooth activity, pairing lists or system settings</li>" +
            "<li>Read MAC addresses, signal strength (RSSI), or scan in the background</li>" +
            "<li>Run a real discovery scan: the browser chooser only ever reveals the one device you pick. A full nearby-device list is not available to web pages</li>" +
            "<li>Keep a connection alive after the page closes</li>" +
            "<li>Read Wi-Fi, battery or telemetry of the device beyond the GATT services it exposes</li></ul>", "warn", "warn") + "</div>",
        "</div>",
      "</div>",
      (BT.lastError ? '<div style="margin-top:14px">' + UI.notice("<b>Last Bluetooth response:</b> " + esc(BT.lastError), "warn", "warn") + "</div>" : "")
    ].join("");
  },

  async afterRender(root) {
    bindDeviceInteractions(root);
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(b.dataset.back || "home")));
    $$("[data-bt-scan]", root).forEach(b => b.addEventListener("click", () => BluetoothView.scanFlow({})));
    $$("[data-bt-refresh]", root).forEach(b => b.addEventListener("click", async () => {
      UI.toast("Re-checking adapter", "Asking the browser for its current Bluetooth availability.", "");
      await BT.probe();
      UI.refresh();
    }));
    $$("[data-bt-disconnect]", root).forEach(b => b.addEventListener("click", () => DeviceActions.disconnect()));
    $$("[data-bt-battery]", root).forEach(b => b.addEventListener("click", () => DeviceActions.battery()));
    $$("[data-bt-connect-profile]", root).forEach(b => b.addEventListener("click", () => {
      const btn = $("[data-connect-profile]", root);
      if (btn) btn.click();
      else UI.toast("No Bluetooth profile", "Add a device with the Bluetooth connection type first.", "warn");
    }));
    $$("[data-connect-profile]", root).forEach(b => b.addEventListener("click", () => DeviceActions.connect(b.dataset.connectProfile, b)));
    $$("[data-relink]", root).forEach(b => b.addEventListener("click", () => DeviceActions.connect(b.dataset.relink, b)));
    await BluetoothView.loadGranted();
  },

  async loadGranted() {
    const box = $("#grantedBox");
    if (!box) return;
    const rem = await BT.remembered();
    if (!box.isConnected) return;
    if (!rem.supported) {
      box.innerHTML = '<div class="sub">The browser does not expose <span class="mono">navigator.bluetooth.getDevices()</span>, so previously granted devices cannot be listed. ' +
        (BT.nav ? "You can still scan and pick a device again." : "Bluetooth scanning is unavailable on this platform.") + "</div>";
      return;
    }
    if (!rem.devices.length) {
      box.innerHTML = '<div class="sub">No device has been granted to this site yet. After you scan and pick a device once, it appears here and can be reconnected without a new chooser.</div>';
      return;
    }
    box.innerHTML = '<div class="list">' + rem.devices.map(d => {
      const prof = Store.data.devices.find(x => x.btDeviceId === d.id) || Store.data.devices.find(x => x.btDeviceName && d.name && x.btDeviceName.toLowerCase() === d.name.toLowerCase());
      return '<div class="row"><span class="avatar sm">' + icon("bluetooth", 18) + '</span>' +
        '<div class="grow"><div class="name">' + esc(d.name || "Unnamed device") + '</div>' +
        '<div class="meta">' + (prof ? "Matched to saved profile: " + esc(prof.name) : "Not saved as a profile yet") + "</div></div>" +
        (prof
          ? '<button class="btn btn-sm btn-primary" data-relink="' + esc(prof.id) + '">Connect</button>'
          : '<button class="btn btn-sm" data-save-granted="1" data-id="' + esc(d.id) + '" data-name="' + esc(d.name || "") + '">Save profile</button>') +
        "</div>";
    }).join("") + "</div>";
    $$("[data-save-granted]", box).forEach(b => b.addEventListener("click", () => {
      DeviceForm.open({ name: b.dataset.name || "Bluetooth device", brand: "", model: "", category: "other", image: null, connection: "bluetooth", notes: "", serial: "", btDeviceId: b.dataset.id, btDeviceName: b.dataset.name || null });
    }));
    $$("[data-relink]", box).forEach(b => {
      if (b._bound) return; b._bound = true;
      b.addEventListener("click", () => DeviceActions.connect(b.dataset.relink, b));
    });
  }
};

function BluetoothProfileRow(p, live) {
  const st = deviceStatusMeta(p);
  const isThisLive = live && Store.getDevice(BT.linkedProfileId || "") && Store.getDevice(BT.linkedProfileId).id === p.id;
  return '<div class="row">' +
    UI.avatarHtml(p, "sm") +
    '<div class="grow"><div class="name">' + esc(p.name) + '</div>' +
    '<div class="meta">' + esc([p.brand, p.model].filter(Boolean).join(" ") || connLabel(p.connection)) + " · " + esc(deviceLiveLine(p)) + "</div></div>" +
    '<div class="wrap" style="justify-content:flex-end">' +
      UI.pill(st.label, st.kind, st.dot, st.live) +
      (isThisLive
        ? '<button class="btn btn-sm btn-ok" data-bt-disconnect="1">Disconnect</button>'
        : '<button class="btn btn-sm btn-primary" data-connect-profile="' + esc(p.id) + '">Connect</button>') +
    "</div></div>";
}

defRoute("bluetooth", {
  title: "Bluetooth",
  render(params) { return BluetoothView.render(params); },
  afterRender(root, params) { return BluetoothView.afterRender(root, params); }
});

/* ============================================================
   WI-FI VIEW
   ============================================================ */
defRoute("wifi", {
  title: "Wi-Fi",
  render() {
    const net = Net.snapshot();
    const perms = Perm.cache || [];
    const geo = perms.find(p => p.key === "location");
    const ua = navigator.userAgent;

    const limitBox = UI.notice(
      "<b>Wi-Fi access is limited by this platform.</b><br>" +
      "A normal web page cannot read your Wi-Fi connection at all. It cannot see the network name (SSID), the Wi-Fi password, connected devices on your network, IP addresses, signal strength, or network speed. " +
      "Those values are deliberately withheld by every browser for privacy reasons, because network names can reveal your physical location.<br><br>" +
      "<b>Native Android integration may provide additional information.</b> An installed app with the NEARBY_WIFI_DEVICES and location permissions can legitimately read the SSID, BSSID, IP address and link speed. This web build does not request or fake any of that.",
      "warn", "warn");

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="home" aria-label="Back">' + icon("back", 19) + "</button>",
        "<div><div class=\"eyebrow\">Network</div><h2>Wi-Fi &amp; Network</h2>" +
        '<p class="sub">Only values the browser genuinely reports are displayed here. Everything else is shown as a limitation, never as an invented number.</p></div>',
      "</div>",

      '<div class="grid grid-4" style="margin-bottom:16px">',
        tile(net.online ? "Online" : "Offline", net.online ? "reachable" : "no link", "from navigator.onLine", net.online ? "accent" : ""),
        tile("Link type", net.type !== "unknown" ? esc(net.typeLabel) : "Unknown", Net.supported ? "from the Network Information API" : "API unsupported here"),
        tile("Effective class", net.effectiveType ? esc(net.effectiveType) : "—", "coarse speed bucket, not a speed test"),
        tile("RTT estimate", net.rtt != null ? net.rtt + " ms" : "—", "browser estimate, rounded"),
      "</div>",

      '<div class="two-col" style="margin-bottom:16px">',
        '<div class="card">',
          cardHead("wifi", "What this platform reports"),
          UI.kv("Navigator online", net.online ? "true" : "false", false) +
          UI.kv("Link type", esc(net.typeLabel), false) +
          UI.kv("Effective connection type", net.effectiveType ? esc(net.effectiveType) : '<span class="dim">not reported</span>', false) +
          UI.kv("Estimated downlink", net.downlink != null ? net.downlink + " Mbps (coarse estimate)" : '<span class="dim">not reported</span>', false) +
          UI.kv("Estimated round-trip time", net.rtt != null ? net.rtt + " ms" : '<span class="dim">not reported</span>', false) +
          UI.kv("Data-saver preference", net.saveData == null ? '<span class="dim">not reported</span>' : (net.saveData ? "on" : "off"), false) +
          UI.kv("Last observed change", esc(relTime(Net.since)), false) +
          '<div class="hint" style="margin-top:10px">Source: <span class="mono">navigator.onLine</span>' + (Net.supported ? ' and <span class="mono">navigator.connection</span>' : ' (the Network Information API is absent in this browser)') + ". Values update live as the browser reports changes.</div>",
        "</div>",
        '<div class="card">',
          cardHead("warn", "What is genuinely unavailable", '<span class="chip">never faked</span>'),
          '<div class="list">' + [
            ["Network name (SSID)", "withheld by the browser"],
            ["Router / BSSID &amp; band", "withheld by the browser"],
            ["Local &amp; public IP address", "not exposed to page script"],
            ["Signal strength (RSSI)", "not exposed to page script"],
            ["Real measured speed", "estimates only, or run your own test"],
            ["Devices on your network", "impossible from a web page"],
            ["Other apps' network activity", "not observable"]
          ].map(r => '<div class="row" style="padding:9px 11px"><span class="grow" style="font-size:13px">' + r[0] + '</span><span class="chip">' + r[1] + "</span></div>").join("") + "</div>",
        "</div>",
      "</div>",

      '<div class="section-title">Why permissions exist here</div>',
      '<div class="card" style="margin-bottom:16px">',
        '<div class="form-grid">',
          '<div>' + UI.notice("<b>Location permission</b><br>A web page that <i>is</i> allowed to read Wi-Fi network names must also hold location permission, because SSIDs and BSSIDs are treated as location data. This app does not request it by default and does not need it — no page here asks the browser for Wi-Fi names.", "", "key") +
            '<div style="margin-top:10px">' + (geo ? '<div class="row"><span class="grow" style="font-size:13px">Current location permission</span>' + pillForPerm(geo.state) + "</div>" : '<div class="sub">Permission state could not be queried on this browser.</div>') + "</div>",
          "</div>",
          '<div>' + UI.notice("<b>Network Information API</b><br>Where supported (Chromium browsers), it reports only a coarse classification of your connection and rough estimates. Firefox and Safari do not implement it, so this page will honestly show “not reported” there instead of guessing.", Net.supported ? "ok" : "warn", Net.supported ? "check" : "warn") + "</div>",
        "</div>",
      "</div>",

      '<div class="section-title">Connection changes observed in this session</div>',
      '<div class="card" style="margin-bottom:16px">',
        (Net.changes && Net.changes.length
          ? '<div class="timeline">' + Net.changes.slice(0, 8).map(c => '<div class="tl-item"><div class="tl-t">Link changed to ' + esc(c.to) + '</div><div class="tl-d">The browser reported a network state change while the app was open.</div><div class="tl-w">' + esc(fmtDateTime(c.at)) + " · " + esc(relTime(c.at)) + "</div></div>").join("") + "</div>"
          : '<div class="sub">No network change has been reported since you opened the app. When the browser fires an online, offline or connection-change event, it is listed here and written to your activity log — nothing is predicted or simulated.</div>'),
      "</div>",

      '<div style="margin-bottom:16px">' + limitBox + "</div>",

      '<div class="card">',
        cardHead("sliders", "Platform notes"),
        UI.kv("User agent", esc(ua.slice(0, 78)) + (ua.length > 78 ? "…" : ""), false) +
        UI.kv("Secure context", Platform.secure ? "yes" : "no", false) +
        UI.kv("Display mode", Platform.ua.standalone ? "installed / standalone" : "browser tab", false) +
        UI.kv("Language", esc(navigator.language || "unknown"), false) +
        UI.kv("Logical cores", navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : '<span class="dim">not reported</span>', false) +
        UI.kv("Device memory hint", navigator.deviceMemory ? navigator.deviceMemory + " GB (hint only)" : '<span class="dim">not reported</span>', false),
      "</div>"
    ].join("");
  },
  afterRender(root) {
    bindDeviceInteractions(root);
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(b.dataset.back || "home")));
    $$("[data-copy]", root).forEach(b => b.addEventListener("click", () => {
      const v = b.dataset.copy;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(() => UI.toast("Copied", v, "ok")).catch(() => UI.toast("Copy blocked", "Select the value manually.", "warn"));
      else UI.toast("Clipboard unavailable", "This browser did not allow clipboard access.", "warn");
    }));
  }
});

function pillForPerm(state) {
  const map = {
    granted: { l: "Granted", k: "ok" },
    denied: { l: "Denied", k: "bad" },
    prompt: { l: "Not decided", k: "warn" },
    unsupported: { l: "Not queryable", k: "" }
  };
  const m = map[state] || { l: state, k: "" };
  return UI.pill(m.l, m.k, true);
}

