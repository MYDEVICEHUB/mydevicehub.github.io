/* ============================================================
   NOTIFICATIONS (browser-level, opt-in only)
   ============================================================ */
UI.notify = function (title, body, silent) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    const n = new Notification(title, { body: body || "", tag: "mydevicehub-" + title, silent: !!silent });
    setTimeout(() => { try { n.close(); } catch (e) {} }, 12000);
    return true;
  } catch (e) { return false; }
};

async function refreshPermissions() {
  try { Perm.cache = await Perm.queryAll(); }
  catch (e) { Perm.cache = [{ key: "api", label: "Permissions API", why: "Query failed.", state: "unsupported" }]; }
  return Perm.cache;
}

/* ============================================================
   BOOT
   ============================================================ */
(function boot() {
  /* 1. load persisted state */
  Store.load();
  applySettings();

  /* 2. safety net for old / partial backups */
  if (Store.data.version == null) Store.data.version = 1;
  Store.data.meta.lastOpenAt = nowIso();

  /* 2b. native bridge receiver — installed so a real wrapper can push data */
  NativeBridge.installReceiver();

  /* 2c. tell the user once if their data was upgraded from v1 */
  if (Store.data.meta.migratedFrom === "v1" && !Store.data.meta.upgradeNoticeShown) {
    Store.data.meta.upgradeNoticeShown = true;
    Store.persist();
    setTimeout(() => UI.toast("Upgraded to My Device Hub v2",
      "Your car profile became your first vehicle" + (Store.data.vehicles.length > 1 ? " (alongside " + (Store.data.vehicles.length - 1) + " other vehicle profile(s))" : "") +
      ", and device categories were updated. Nothing was deleted.", "ok"), 1400);
  }

  /* 3. storage banner if localStorage is unavailable */
  if (!Store.available) {
    $("#storageBanner").innerHTML = UI.notice(
      "<b>Storage unavailable.</b> This browser blocked local storage, so nothing you create will survive a reload. You can still explore the app; use Export in settings to copy your data out as JSON.",
      "warn", "warn");
  } else if (Store.externalConflict) {
    $("#storageBanner").innerHTML = UI.notice("<b>Could not save.</b> The browser refused a write — likely a full or restricted storage quota. Free space or export a backup.", "bad", "warn");
  }

  /* 4. restore an unfinished focus session, honestly */
  const live = Store.data.focus.current;
  if (live && live.running) {
    const restored = clamp(Number(live.elapsedSec) || 0, 0, 24 * 3600);
    Focus.running = true;
    Focus.paused = true;
    Focus.elapsedBeforePause = restored;
    Focus.startedAt = null;
    UI.toast("Focus session restored", "A session was running when the page last closed. It is paused at " + mmss(restored) + " and only that real time is saved. Resume or finish it from the Focus tab.", "warn");
  }

  /* 5. platform capabilities */
  const s = Store.data.settings;
  if (s.autoScanBluetooth) {
    BT.probe();
  } else {
    // still report API presence honestly, without asking the adapter anything
    if (!navigator.bluetooth) { BT.state = "unsupported"; BT.reason = Platform.ua.ios ? "Safari and every iOS browser do not expose the Web Bluetooth API." : "This browser does not expose the Web Bluetooth API."; }
    else if (!Platform.secure) { BT.state = "insecure"; BT.reason = "Web Bluetooth only works on a secure HTTPS origin (or localhost)."; }
    else { BT.state = "supported"; BT.reason = "Availability check at launch is switched off in settings, so the adapter has not been queried yet."; }
  }
  Net.init(!!s.autoScanNetwork);
  if (s.autoScanNetwork) {
    window.addEventListener("online", () => Net.onOnline());
    window.addEventListener("offline", () => Net.onOffline());
  }
  refreshPermissions().then(() => { if (Router.current === "settings") UI.refresh(); });

  /* 6. wire global inputs */
  const imgInput = $("#imgPicker");
  if (imgInput) imgInput.addEventListener("change", e => UI.handleImageFile(e.target.files && e.target.files[0]));

  /* 7. global safety + persistence hooks */
  window.addEventListener("beforeunload", () => {
    Focus.persistLive();
    Store.persist();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { Focus.persistLive(); Store.persist(); }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && UI.modalStack.length) {
      const top = UI.modalStack[UI.modalStack.length - 1];
      if (top.close) top.close();
    }
  });
  /* a single delegated handler for links: never load an unverified URL */
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[data-ext]");
    if (!a) return;
    e.preventDefault();
    const url = safeUrl(a.getAttribute("href"));
    if (!url) {
      UI.toast("Link blocked", "That address failed the safety check and was not opened.", "bad");
      Store.log("security_notice", "Blocked a link that failed URL validation.", null);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  });

  /* 8. global timers */
  Focus.ensureGlobalTick();

  /* vehicle reminder check — only while the app is open, and only for dates you entered */
  const seenReminders = {};
  setInterval(() => {
    if (!Store.data.settings.notify.reminders) return;
    Store.data.vehicles.forEach(v => {
      const next = nextVehicleReminder(v);
      if (!next || next.days > 3 || next.days < 0) return;
      const key = v.id + ":" + next.label + ":" + dayKey();
      if (seenReminders[key]) return;
      seenReminders[key] = true;
      UI.toast("Vehicle reminder", v.nickname + " · " + next.label + " — " + next.when + ".", "warn");
      UI.notify("Vehicle reminder", v.nickname + ": " + next.label + " is " + next.when + ".", true);
      Store.log("service_due", "Reminder surfaced for “" + v.nickname + "”: " + next.label + " (" + next.when + ").", { type: "vehicle", id: v.id, name: v.nickname });
    });
  }, 60000);

  /* live snapshots survive a reload only as clearly-timestamped last readings */
  if (Store.data.settings.prefs.keepLiveSnapshot === false) {
    Store.data.vehicles.forEach(v => { if (v.live) delete v.live; });
    Store.persist();
  }

  /* a calm heartbeat that keeps time-based labels honest without re-rendering constantly */
  setInterval(() => {
    if (Router.current === "home") {
      const d = $("#heroDate");
      if (d) d.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
  }, 30000);

  /* 9. first paint */
  UI.syncNav();
  Router.go("home");
  UI.syncFooter();

  /* 10. gentle first-run guidance, shown once per install */
  if (Store.data.devices.length === 0 && !Store.data.meta.seenIntro) {
    Store.data.meta.seenIntro = true;
    Store.persist();
    setTimeout(() => {
      UI.modal({
        body: [
          '<div class="sheet-head"><div><h3>Welcome to My Device Hub</h3><div class="sub">Your personal device and vehicle command center. Here is exactly what it will and will not do.</div></div></div>',
          '<div class="list">' +
            '<div class="row" style="align-items:flex-start"><span class="avatar sm" style="color:var(--ok);border-color:rgba(52,211,153,.35)">' + icon("check", 17) + '</span><div class="grow"><div class="name">Real data only</div><div class="meta" style="white-space:normal;line-height:1.55">Bluetooth and network information comes from the browser\'s own APIs. If something cannot be read, the app says so plainly.</div></div></div>' +
            '<div class="row" style="align-items:flex-start"><span class="avatar sm">' + icon("shield", 17) + '</span><div class="grow"><div class="name">Nothing is uploaded</div><div class="meta" style="white-space:normal;line-height:1.55">There is no account and no server. Everything you create lives in this browser\'s local storage.</div></div></div>' +
            '<div class="row" style="align-items:flex-start"><span class="avatar sm">' + icon("devices", 17) + '</span><div class="grow"><div class="name">Saved is not connected</div><div class="meta" style="white-space:normal;line-height:1.55">Adding a device just records it. A profile shows “Saved profile” until you genuinely connect to something real.</div></div></div>' +
            '<div class="row" style="align-items:flex-start"><span class="avatar sm">' + icon("car", 17) + '</span><div class="grow"><div class="name">Vehicles: unlimited cars and bikes</div><div class="meta" style="white-space:normal;line-height:1.55">Each vehicle has its own profile, reminders and service history. Live speed, fuel, temperature and the rest appear <b>only</b> through a really connected integration — OBD-II, your own telemetry endpoint or a native bridge.</div></div></div>' +
            '<div class="row" style="align-items:flex-start"><span class="avatar sm" style="color:var(--warn);border-color:rgba(231,179,70,.35)">' + icon("warn", 17) + '</span><div class="grow"><div class="name">What this can never see</div><div class="meta" style="white-space:normal;line-height:1.55">Other apps\' Bluetooth activity, Wi-Fi names, IP addresses, signal strength, and any vehicle data without a connected integration. Those stay off-limits — and are never faked here.</div></div></div>' +
          "</div>",
          '<div class="sheet-foot"><button class="btn btn-primary btn-block" data-close>' + icon("check", 15) + " Get started</button></div>",
        ].join(""),
        onMount(sheet, close) {
          const go = $(".sheet-foot .btn", sheet);
          if (go) go.addEventListener("click", () => { UI.toast("Ready", "Tap + ADD DEVICE whenever you are.", "ok"); });
        }
      });
    }, 700);
  }

  console.info("[My Device Hub] v2 booted. Bluetooth:", BT.state, "· Network API:", Net.supported, "· Storage:", Store.available,
    "· Devices:", Store.data.devices.length, "· Vehicles:", Store.data.vehicles.length, "· Vehicle sources:", JSON.stringify(Caps.summary()));
})();
</script>
</body>
</html>
