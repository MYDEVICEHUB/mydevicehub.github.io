
/* ============================================================
   VEHICLES — multi-vehicle hub (cars and bikes only)
   Profile + reminders + real integration data. A profile never
   implies a connection, and the dashboard never invents a value.
   ============================================================ */
function vehicleConnectionMeta(v) {
  const st = (typeof vehicleConnState === "function") ? vehicleConnState(v) : CONN_STATES.not_connected;
  const adapter = v && v.connection ? Adapters.byId(v.connection.adapterId) : null;
  const text = {
    not_connected: "Nothing is linked yet. Choose a connection method to receive real vehicle data.",
    waiting: "The integration is linked. Values will appear as soon as the vehicle reports them.",
    live: "Real values are arriving from " + ((v.connection.adapterName) || "the connected integration") + ".",
    lost: (v.connection.lastError || "The integration stopped answering.") + " Reconnect to resume live data.",
    unsupported: "Vehicle integration is not available in this version. Vehicle profile and reminders are still available."
  }[st.id];
  return { id: st.id, label: st.label, kind: st.kind, dot: st.dot, live: st.id === "live", short: st.short, text };
}
function vehicleSubtitle(v) {
  return [v.brand, v.model, v.year].filter(Boolean).join(" ") || "Brand, model and year not set";
}
function vehicleLiveSummary(v) {
  const st = vehicleConnState(v);
  const live = VehicleLive.status(v.id);
  if (st.id === "live") return live.liveFields + " of " + live.totalFields + " fields receiving real data";
  if (st.id === "waiting") return "Integration linked — waiting for the first real reading";
  if (st.id === "lost") return "Connection lost · last reading " + (live.lastAt ? relTime(live.lastAt) : "—");
  const snap = (v.live && v.live.fields) ? Object.keys(v.live.fields).length : 0;
  if (snap) return "Last real snapshot " + relTime(v.live.at) + " · no live integration";
  return "No live vehicle data is currently available.";
}

function nextVehicleReminder(v) {
  const items = [];
  (v.serviceReminders || []).forEach(r => {
    if (r.done) return;
    if (r.dueDate) { const d = daysUntil(r.dueDate); if (d != null) items.push({ label: r.label || serviceLabel(r.type), when: d < 0 ? Math.abs(d) + " days overdue" : d === 0 ? "due today" : "in " + d + " days", days: d, ref: r.id }); }
    if (r.dueKm && v.odometerKm) { const left = Number(r.dueKm) - Number(v.odometerKm); if (!isNaN(left) && left <= 1500) items.push({ label: r.label || serviceLabel(r.type), when: left <= 0 ? "odometer interval reached" : "in about " + Math.round(left) + " km", days: left <= 0 ? -1 : Math.round(left / 400), ref: r.id }); }
  });
  if (v.insurance && v.insurance.expiresOn) { const d = daysUntil(v.insurance.expiresOn); if (d != null) items.push({ label: "Insurance renewal", when: d < 0 ? Math.abs(d) + " days expired" : d === 0 ? "expires today" : "in " + d + " days", days: d, ref: "insurance" }); }
  (v.importantDates || []).forEach(x => { if (!x.date) return; const d = daysUntil(x.date); if (d != null && d >= -30 && d <= 60) items.push({ label: x.label || "Important date", when: d < 0 ? Math.abs(d) + " days ago" : d === 0 ? "today" : "in " + d + " days", days: d, ref: x.id }); });
  if (!items.length) return null;
  items.sort((a, b) => a.days - b.days);
  return items[0];
}
function vehicleReminderList(v) {
  const out = [];
  (v.serviceReminders || []).forEach(r => {
    if (r.done) return;
    if (r.dueDate) { const d = daysUntil(r.dueDate); out.push({ num: d == null ? 9999 : d, label: r.label || serviceLabel(r.type), when: d == null ? "date not set" : (d < 0 ? "overdue by " + Math.abs(d) + " days" : d === 0 ? "due today" : "in " + d + " days"), sub: "dated reminder", id: r.id, r, insurance: false }); }
    else if (r.dueKm) { const left = v.odometerKm == null ? null : Number(r.dueKm) - Number(v.odometerKm); out.push({ num: left == null ? 9999 : left, label: r.label || serviceLabel(r.type), when: v.odometerKm == null ? "at " + nfmt(r.dueKm) + " km" : (left <= 0 ? "due now at " + nfmt(r.dueKm) + " km" : "in " + nfmt(left) + " km"), sub: "odometer reminder", id: r.id, r, insurance: false }); }
    else out.push({ num: 9999, label: r.label || serviceLabel(r.type), when: "no date or odometer set", sub: "reminder", id: r.id, r, insurance: false });
  });
  if (v.insurance && v.insurance.expiresOn) { const d = daysUntil(v.insurance.expiresOn); out.push({ num: d == null ? 9999 : d, label: "Insurance renewal", when: d == null ? "not set" : (d < 0 ? "expired " + Math.abs(d) + " days ago" : "in " + d + " days"), sub: v.insurance.provider || "policy", id: "insurance", insurance: true }); }
  (v.importantDates || []).forEach(x => { const d = daysUntil(x.date); if (d == null) return; out.push({ num: d, label: x.label || "Important date", when: d < 0 ? Math.abs(d) + " days ago" : "in " + d + " days", sub: "personal date", id: x.id, r: x, insurance: false }); });
  return out.sort((a, b) => a.num - b.num);
}
function vehicleCard(v) {
  const t = vehType(v.type);
  const cm = vehicleConnectionMeta(v);
  const img = safeImg(v.photo);
  const isPrimary = Store.data.primaryVehicleId === v.id;
  return '<div class="card veh-card tap" data-vehicle="' + esc(v.id) + '">' +
    '<div class="veh-media">' +
      (img
        ? '<img src="' + esc(img) + '" alt="">'
        : '<div class="veh-ph">' + icon(t.icon, 40) + "<span>No photo yet</span></div>") +
      '<div class="veh-badges">' +
        '<span class="badge-type">' + t.emoji + " " + esc(t.label) + "</span>" +
        (isPrimary ? '<span class="badge-type badge-primary">' + icon("star", 11) + " Primary</span>" : "") +
      "</div>" +
    "</div>" +
    '<div class="veh-body">' +
      '<div><div class="veh-name">' + icon(t.icon, 17) + " " + esc(v.nickname) + "</div>" +
      '<div class="veh-meta">' + esc(vehicleSubtitle(v)) + "</div></div>" +
      '<div class="wrap">' + UI.pill(cm.label, cm.kind, cm.dot, cm.live) + (v.fuel ? '<span class="chip">' + esc(v.fuel) + "</span>" : "") + "</div>" +
      '<div class="dev-note">' + icon("info", 12) + "<span>" + esc(vehicleLiveSummary(v)) + "</span></div>" +
      '<div class="veh-foot">' +
        '<button class="btn btn-sm btn-primary" data-view-vehicle="' + esc(v.id) + '">View dashboard</button>' +
        (isPrimary ? "" : '<button class="btn btn-sm" data-make-primary="' + esc(v.id) + '">' + icon("star", 12) + " Set primary</button>") +
      "</div>" +
    "</div></div>";
}

defRoute("vehicles", {
  title: "Vehicles",
  render(params) {
    const p = params || {};
    const typeF = p.type || "all";
    let list = Store.data.vehicles.slice();
    if (typeF !== "all") list = list.filter(v => v.type === typeF);
    const cars = Store.vehiclesOfType("car").length;
    const bikes = Store.vehiclesOfType("bike").length;
    const primary = Store.primaryVehicle();
    const connected = Store.data.vehicles.filter(v => vehicleConnState(v).id === "live" || vehicleConnState(v).id === "waiting").length;
    const dueSoon = Store.data.vehicles.map(v => ({ v, r: nextVehicleReminder(v) })).filter(x => x.r && x.r.days <= 14).sort((a, b) => a.r.days - b.r.days);

    const caps = Caps.summary();
    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="home" aria-label="Back">' + icon("back", 19) + "</button>",
        "<div><div class=\"eyebrow\">Multi-vehicle hub</div><h2>My Vehicles</h2>" +
        '<p class="sub">Unlimited cars and bikes, each with its own profile, reminders and service history. Live values appear only when a supported integration is genuinely connected.</p></div>',
        '<div class="spacer"></div>',
        '<button class="btn btn-primary" data-add-vehicle="1">' + icon("plus", 15) + " Add vehicle</button>",
      "</div>",

      '<div class="grid grid-4" style="margin-bottom:16px">',
        tile("Vehicles", nfmt(Store.data.vehicles.length), nfmt(cars) + " car" + (cars === 1 ? "" : "s") + " · " + nfmt(bikes) + " bike" + (bikes === 1 ? "" : "s"), "accent"),
        tile("Connected", nfmt(connected), connected ? "integration active" : "no live integration"),
        tile("Primary", primary ? esc(primary.nickname) : "—", primary ? esc(vehType(primary.type).label) : "add a vehicle to choose one"),
        tile("Reminders due", nfmt(dueSoon.length), dueSoon.length ? "within 14 days" : "nothing pending"),
      "</div>",

      (!caps.anyVehicleSource
        ? '<div style="margin-bottom:16px">' + UI.notice("<b>Vehicle integration is not available in this version.</b><br>Vehicle profile and reminders are still available. " + esc(caps.obdBle ? "" : (Caps.webBluetooth.reason || "")), "warn", "warn") + "</div>"
        : '<div style="margin-bottom:16px">' + UI.notice("<b>Real data only.</b> This runtime can reach a vehicle through: " +
            [caps.obdBle ? "Bluetooth OBD-II" : null, caps.endpoint ? "a telemetry endpoint" : null, caps.native ? "the native bridge" : null, caps.gps ? "host-device GPS for location" : null].filter(Boolean).join(", ") +
            ". Anything a source cannot supply is shown as NOT AVAILABLE.", "", "shield") + "</div>"),

      (Store.data.vehicles.length
        ? '<div class="row-between" style="margin-bottom:12px;flex-wrap:wrap;gap:10px">' +
            '<div class="seg">' + [["all", "All " + Store.data.vehicles.length], ["car", "Cars " + cars], ["bike", "Bikes " + bikes]]
              .map(o => '<button data-vfilter="' + o[0] + '" class="' + (typeF === o[0] ? "on" : "") + '">' + o[1] + "</button>").join("") + "</div>" +
            (primary ? '<span class="saved-note">' + icon("star", 12) + " Primary: " + esc(primary.nickname) + "</span>" : "") +
          "</div>"
        : ""),

      (Store.data.vehicles.length
        ? (list.length
            ? '<div class="grid">' + list.map(vehicleCard).join("") + "</div>"
            : UI.emptyState("No vehicles of this type", "You have " + Store.data.vehicles.length + " vehicle(s) saved, but none of this type.", "Show all vehicles", 'data-clear-vfilter="1"', "filter"))
        : UI.emptyState("No vehicles yet", "Add your car or your bike as a profile — photo, details, reminders and service history. A profile never means the vehicle is connected.", "Add your car or bike", 'data-add-vehicle="1"', "car")),

      (dueSoon.length
        ? '<div class="section-title">Reminders coming up</div>' +
          '<div class="card"><div class="list">' + dueSoon.slice(0, 4).map(x =>
            '<div class="row tap" data-vehicle="' + esc(x.v.id) + '"><span class="avatar sm" style="' + (x.r.days < 0 ? "color:var(--bad);border-color:rgba(241,106,106,.3)" : x.r.days <= 7 ? "color:var(--warn);border-color:rgba(231,179,70,.3)" : "") + '">' + icon(x.r.days < 0 ? "alert" : "calendar", 17) + "</span>" +
            '<div class="grow"><div class="name">' + esc(x.r.label) + '</div><div class="meta">' + esc(x.v.nickname) + " · " + esc(x.r.when) + "</div></div>" +
            '<span class="chip">' + esc(vehType(x.v.type).label) + "</span></div>").join("") + "</div></div>"
        : ""),

      '<div class="section-title">How vehicle data works here</div>',
      '<div class="grid grid-4">',
        '<div class="card quiet">' + cardHead("plug", "Bluetooth OBD-II") +
          '<div class="sub">' + (caps.obdBle ? "Available in this browser. Reads real engine data from an ELM327-compatible BLE dongle." : esc(Caps.webBluetooth.reason || "Not available here.")) + "</div></div>",
        '<div class="card quiet">' + cardHead("cloud", "Telematics endpoint") +
          '<div class="sub">' + (caps.endpoint ? "Available. Polls a JSON feed you control and maps only the keys it recognises." : "Unavailable in this runtime.") + "</div></div>",
        '<div class="card quiet">' + cardHead("chip", "Native bridge") +
          '<div class="sub">' + (caps.native ? "A native shell is present and answering." : esc(Caps.nativeBridge.reason || "No native shell detected.")) + "</div></div>",
        '<div class="card quiet">' + cardHead("pin", "Location") +
          '<div class="sub">' + (caps.gps ? "Host-device GPS can fill the Location field while the app is open, clearly attributed." : "No Geolocation API in this runtime.") + "</div></div>",
      "</div>"
    ].join("");
  },
  afterRender(root) {
    bindDeviceInteractions(root);
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(b.dataset.back || "home")));
    $$("[data-add-vehicle]", root).forEach(b => b.addEventListener("click", () => VehicleForm.open(null)));
    $$("[data-vehicle]", root).forEach(el => el.addEventListener("click", e => {
      if (e.target.closest("[data-view-vehicle],[data-make-primary],[data-no-nav]")) return;
      Router.go("vehicle", { id: el.dataset.vehicle });
    }));
    $$("[data-view-vehicle]", root).forEach(b => b.addEventListener("click", e => { e.stopPropagation(); Router.go("vehicle", { id: b.dataset.viewVehicle }); }));
    $$("[data-make-primary]", root).forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      const v = Store.getVehicle(b.dataset.makePrimary);
      Store.setPrimaryVehicle(v.id);
      UI.toast("Primary vehicle set", "“" + v.nickname + "” now appears on Home.", "ok");
      UI.refresh();
    }));
    $$("[data-vfilter]", root).forEach(b => b.addEventListener("click", () => Router.go("vehicles", { type: b.dataset.vfilter })));
    $$("[data-clear-vfilter]", root).forEach(b => b.addEventListener("click", () => Router.go("vehicles")));
  }
});

/* ============================================================
   ADD / EDIT VEHICLE  (type first, then details)
   ============================================================ */
const VehicleForm = {
  draft: null,
  open(existing, presetType, openDb) {
    const self = this;
    this.pickedType = !!existing;
    this.dbOpen = !!openDb;         /* true when the caller goes straight to the database picker */
    this.dbQuery = ""; this.dbSel = null; this.customPicked = false; this.dbDone = false;   /* a brand-new profile always starts on the CAR / BIKE choice */
    this.sel = existing && existing.spec
      ? { brandId: existing.spec.brandId, modelId: existing.spec.modelId, variantIndex: existing.spec.variantIndex, year: existing.spec.year }
      : null;                        /* null = custom profile, no database link */
    this.draft = existing
      ? JSON.parse(JSON.stringify(existing))
      : {
          type: presetType || Store.data.settings.prefs.defaultVehicleType || "car",
          nickname: "", brand: "", model: "", year: "", fuel: "", photo: null,
          plate: "", color: "", odometerKm: null, vin: "", notes: ""
        };

    const stepType = () => [
      '<div class="sheet-head"><div><h3>Add a vehicle</h3><div class="sub">First, what are you adding? Cars and bikes are the only two vehicle types this hub supports.</div></div></div>',
      '<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">' +
        VEHICLE_TYPES.map(t =>
          '<button class="card tap" data-pick-type="' + t.id + '" style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:22px 14px;text-align:center">' +
            '<span style="color:var(--accent)">' + icon(t.icon, 38) + "</span>" +
            '<span style="font-size:15px;font-weight:650">' + t.emoji + " " + esc(t.label) + "</span>" +
            '<span class="sub" style="font-size:11.5px">' + (t.id === "car" ? "Car, SUV, hatchback, sedan…" : "Motorcycle, scooter-class bike, sport bike…") + "</span>" +
          "</button>").join("") +
      "</div>",
      '<div class="sheet-foot" style="gap:8px"><button class="btn btn-ghost" data-close>Cancel</button></div>'
    ].join("");

    /* ── step 2: brand → model → year → variant, from the built-in database ── */
    const stepDatabase = () => {
      const type = this.draft.type;
      const t = vehType(type);
      const q = this.dbQuery || "";
      const sel = this.dbSel || {};
      const brand = sel.brandId ? VehicleDB.brand(sel.brandId) : null;
      const model = sel.brandId && sel.modelId ? VehicleDB.model(sel.brandId, sel.modelId) : null;
      const hits = q ? VehicleDB.search(q, type) : [];

      const brandList = () => '<div class="db-grid">' + VehicleDB.brands(type).map(b =>
        '<button class="db-item' + (sel.brandId === b.id ? " on" : "") + '" data-db-brand="' + esc(b.id) + '"><span class="db-n">' + esc(b.name) + '</span><span class="db-m">' + b.models.length + " model" + (b.models.length === 1 ? "" : "s") + "</span></button>").join("") + "</div>";

      const modelList = () => '<div class="db-list">' + brand.models.map(m =>
        '<button class="db-item wide' + (sel.modelId === m.id ? " on" : "") + '" data-db-model="' + esc(m.id) + '">' +
          '<span class="db-n">' + esc(m.name) + (m.gen ? ' <span class="db-gen">' + esc(m.gen) + "</span>" : "") + "</span>" +
          '<span class="db-m">' + esc(m.body || "Body style not listed") + " · " + esc(VehicleDB.yearLabel(m)) + " · " + m.variants.length + " variant" + (m.variants.length === 1 ? "" : "s") + "</span>" +
        "</button>").join("") + "</div>";

      const variantBlock = () => {
        const vIdx = sel.variantIndex == null ? 0 : sel.variantIndex;
        const yrs = VehicleDB.years(model);
        const year = sel.year || yrs[0];
        return '<div class="db-detail">' +
          '<div class="mini-label">Variant</div>' +
          '<div class="db-list">' + model.variants.map((v, i) =>
            '<button class="db-item wide' + (vIdx === i ? " on" : "") + '" data-db-variant="' + i + '">' +
              '<span class="db-n">' + esc(v.name) + "</span>" +
              '<span class="db-m">' + esc([v.fuel, v.cc ? nfmt(v.cc) + " cc" : "electric", v.trans].filter(Boolean).join(" · ")) + "</span>" +
            "</button>").join("") + "</div>" +
          '<div class="form-grid" style="margin-top:12px">' +
            '<div class="field"><label>Model year</label><select class="select" id="dbYear">' +
              yrs.map(y => '<option value="' + y + '"' + (Number(year) === y ? " selected" : "") + ">" + y + "</option>").join("") +
            '</select><span class="hint">Years covered by this database entry.</span></div>' +
          "</div>" +
        "</div>";
      };

      return [
        '<div class="sheet-head"><div class="card-ico">' + icon(t.icon, 18) + "</div><div><h3>Choose " + esc(t.label.toLowerCase()) + " details</h3>" +
          '<div class="sub">Pick brand, model, year and variant and the hub fills in the published specifications. Not listed? Use a custom profile — you can still record everything by hand.</div></div></div>',

        '<div class="field"><label>Search the database</label><input class="input" id="dbSearch" placeholder="e.g. Swift, Creta, R15, Classic 350…" value="' + esc(q) + '"></div>',

        (q
          ? '<div style="margin-top:12px">' + (hits.length
              ? '<div class="db-list">' + hits.map((h, i) =>
                  '<button class="db-item wide" data-db-hit="' + i + '"><span class="db-n">' + esc(h.brand.name + " " + h.model.name) + (h.model.gen ? ' <span class="db-gen">' + esc(h.model.gen) + "</span>" : "") + "</span>" +
                  '<span class="db-m">' + esc(h.variant.name) + " · " + esc(VehicleDB.yearLabel(h.model)) + "</span></button>").join("") + "</div>"
              : UI.notice("Nothing in the built-in database matches “" + esc(q) + "”. You can add this vehicle as a custom profile and the information rows will say “Information unavailable”.", "warn", "warn")) + "</div>"
          : ""),

        (!q && !brand ? '<div class="mini-label" style="margin-top:14px">Brand</div>' + brandList() : ""),
        (!q && brand && !model ? '<div class="mini-label" style="margin-top:14px">' + esc(brand.name) + " · model</div>" + modelList() : ""),
        (!q && model ? '<div class="mini-label" style="margin-top:14px">' + esc(brand.name) + " " + esc(model.name) + " · details</div>" + variantBlock() : ""),

        '<div class="hr"></div>',
        '<div class="sub" style="line-height:1.6">' + icon("info", 12) + " " + esc(VEHICLE_DB.notice) + "</div>",
        '<div class="sheet-foot" style="gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn-ghost" data-close>Cancel</button>' +
          '<button class="btn" data-db-custom="1">Add as a custom profile</button>' +
          '<button class="btn btn-primary" data-db-use="1"' + (model ? "" : " disabled") + ">" + icon("check", 14) + " Use this information</button>" +
        "</div>"
      ].join("");
    };

    const stepDetails = () => {
      const d = this.draft;
      const t = vehType(d.type);
      const fuels = fuelOptions(d.type);
      if (!d.fuel || fuels.indexOf(d.fuel) === -1) d.fuel = fuels[0] || "Petrol";
      return [
        '<div class="sheet-head"><div class="card-ico">' + icon(t.icon, 18) + "</div><div><h3>" + (existing ? "Edit " : "New ") + esc(t.label.toLowerCase()) +
          '</h3><div class="sub">' + (existing ? "Update this profile. Editing never changes connection state." : "Profile only — the vehicle is not marked connected until a supported integration is actually live.") + "</div></div></div>",
        '<div class="form">',
          '<div class="type-switch seg" style="align-self:flex-start">' +
            VEHICLE_TYPES.map(x => '<button data-set-type="' + x.id + '" class="' + (d.type === x.id ? "on" : "") + '">' + x.emoji + " " + esc(x.label) + "</button>").join("") + "</div>",

          '<div class="upload-box">',
            '<div class="upload-prev wide" id="vehPrev">' + (safeImg(d.photo) ? '<img src="' + esc(safeImg(d.photo)) + '" alt="">' : icon(t.icon, 26)) + "</div>",
            '<div class="grow"><div style="font-weight:600;font-size:13.4px">Vehicle photo</div><div class="hint">Optional. Downscaled and stored locally on this device.</div>' +
            '<div class="btn-row" style="margin-top:9px"><button class="btn btn-sm" data-pick-veh-img="1">' + icon("camera", 13) + ' Choose photo</button><button class="btn btn-sm btn-ghost" data-clear-veh-img="1">Clear</button></div></div>',
          "</div>",

          (self.sel && VehicleDB.entry(self.sel.brandId, self.sel.modelId, self.sel.variantIndex)
            ? '<div class="spec-preview"><div class="mini-label">' + icon("layers", 12) + " Vehicle information from the database</div>" +
              specRowsHtml(Store.specInfo(Object.assign({}, d, { spec: specFromSel(self.sel) })), true, safeImg(d.photo)) + "</div>"
            : ""),

          '<div class="form-grid">',
            '<div class="field"><label>Vehicle nickname *</label><input class="input" id="vNick" value="' + esc(d.nickname) + '" placeholder="' + (d.type === "car" ? "e.g. My Car" : "e.g. My Bike") + '"></div>',
          (self.sel && VehicleDB.entry(self.sel.brandId, self.sel.modelId, self.sel.variantIndex)
            ? '<div class="field"><label>Brand · model · variant · year</label><input class="input" readonly value="' + esc(specTitle(self.sel)) + '" style="opacity:.8"></div>'
            : '<div class="field"><label>Year</label><input class="input" id="vYear" type="number" min="1900" max="2099" value="' + esc(d.year || "") + '" placeholder="e.g. 2024"></div>' +
              '<div class="field"><label>Brand</label><input class="input" id="vBrand" value="' + esc(d.brand) + '" placeholder="' + (d.type === "car" ? "e.g. BMW" : "e.g. Yamaha") + '"></div>' +
              '<div class="field"><label>Model</label><input class="input" id="vModel" value="' + esc(d.model) + '" placeholder="' + (d.type === "car" ? "e.g. 3 Series" : "e.g. R15") + '"></div>' +
              '<div class="field"><label>Fuel type</label><select class="select" id="vFuel">' + fuels.map(f => '<option' + (d.fuel === f ? " selected" : "") + ">" + esc(f) + "</option>").join("") + "</select></div>"),
            '<div class="field"><label>Registration</label><input class="input" id="vPlate" value="' + esc(d.plate) + '" placeholder="optional"></div>',
            '<div class="field"><label>Colour</label><input class="input" id="vColor" value="' + esc(d.color) + '" placeholder="optional"></div>',
            '<div class="field"><label>Odometer (km)</label><input class="input" id="vOdo" type="number" min="0" value="' + esc(d.odometerKm == null ? "" : d.odometerKm) + '" placeholder="what the dash shows"><span class="hint">Self-reported. A connected OBD-II adapter can add a second, ECU-reported reading.</span></div>',
          "</div>",
          '<div class="field"><label>VIN / chassis number</label><input class="input mono" id="vVin" value="' + esc(d.vin) + '" placeholder="optional — an OBD-II adapter can fill this from the ECU"><span class="hint">Stored only on this device.</span></div>',
          '<div class="field"><label>Notes</label><textarea class="textarea" id="vNotes" placeholder="Service centre, tyre brand, insurance agent, anything worth remembering…">' + esc(d.notes) + "</textarea></div>",
          '<div class="notice">' + icon("info", 17) + '<div style="margin-left:2px">Saving this profile will <b>not</b> connect anything. The connection status stays “Integration unavailable” until you connect a supported source from the vehicle dashboard.</div></div>',
        "</div>",
        '<div class="sheet-foot" style="gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn-ghost" data-back-type="1">' + icon("back", 14) + " Back</button>" +
          '<button class="btn" data-db-change="1">' + icon("layers", 14) + " " + (self.sel ? "Change information" : "Use vehicle information") + "</button>" +
          (self.sel ? '<button class="btn btn-ghost" data-db-detach="1">Detach</button>' : "") +
          '<button class="btn btn-primary" data-save-vehicle="1">' + icon("check", 15) + " " + (existing ? "Save changes" : "Create profile") + "</button>" +
        "</div>",
      ].join("");
    };

    const mount = (sheet, close) => {
      const isTypeStep = !!sheet.querySelector("[data-pick-type]");

      $$("[data-pick-type]", sheet).forEach(b => b.addEventListener("click", () => {
        self.draft.type = b.dataset.pickType;
        self.pickedType = true;
        self.dbSel = null; self.dbQuery = ""; self.customPicked = false; self.dbDone = false;
        Store.data.settings.prefs.defaultVehicleType = self.draft.type;
        Store.persist();
        redraw(false);
      }));
      $$("[data-back-type]", sheet).forEach(b => b.addEventListener("click", () => {
        if (existing) { close(); return; }
        self.sel = null; self.dbSel = null; self.dbOpen = true;
        redraw(false);
      }));
      $$("[data-db-change]", sheet).forEach(b => b.addEventListener("click", () => {
        self.dbOpen = true; self.sel = null; self.customPicked = false;
        if (!self.dbSel && !self.dbQuery) self.dbSel = null;
        redraw(false);
      }));
      $$("[data-db-detach]", sheet).forEach(b => b.addEventListener("click", () => {
        self.sel = null; self.dbSel = null; self.customPicked = true; self.dbOpen = false;
        UI.toast("Detached", "This profile will keep its own details, and the information rows will say “Information unavailable”.", "");
        redraw(false);
      }));
      $$("[data-set-type]", sheet).forEach(b => b.addEventListener("click", () => {
        self.draft.type = b.dataset.setType;
        const fuels = fuelOptions(self.draft.type);
        if (fuels.indexOf(self.draft.fuel) === -1) self.draft.fuel = fuels[0];
        redraw();
      }));
      $$("[data-pick-veh-img]", sheet).forEach(b => b.addEventListener("click", () => UI.pickImage(url => {
        self.draft.photo = url;
        const prev = $("#vehPrev", sheet);
        if (prev) prev.innerHTML = '<img src="' + esc(url) + '" alt="">';
      })));
      $$("[data-clear-veh-img]", sheet).forEach(b => b.addEventListener("click", () => {
        self.draft.photo = null;
        const prev = $("#vehPrev", sheet);
        if (prev) prev.innerHTML = icon(vehType(self.draft.type).icon, 26);
      }));
      $$("[data-save-vehicle]", sheet).forEach(b => b.addEventListener("click", () => {
        const nick = $("#vNick", sheet).value.trim();
        if (!nick) { UI.toast("Nickname required", "Give the vehicle a nickname so its card is recognisable.", "warn"); $("#vNick", sheet).focus(); return; }
        const odo = $("#vOdo", sheet).value.trim();
        const linked = !!(self.sel && VehicleDB.entry(self.sel.brandId, self.sel.modelId, self.sel.variantIndex));
        const patch = {
          type: self.draft.type, nickname: nick,
          plate: $("#vPlate", sheet).value.trim(),
          color: $("#vColor", sheet).value.trim(),
          odometerKm: odo === "" ? null : Math.max(0, Number(odo) || 0),
          vin: $("#vVin", sheet).value.trim(),
          notes: $("#vNotes", sheet).value,
          photo: self.draft.photo
        };
        if (!linked) {
          patch.year = $("#vYear", sheet) ? $("#vYear", sheet).value.trim() : "";
          patch.brand = $("#vBrand", sheet) ? $("#vBrand", sheet).value.trim() : "";
          patch.model = $("#vModel", sheet) ? $("#vModel", sheet).value.trim() : "";
          patch.fuel = $("#vFuel", sheet) ? $("#vFuel", sheet).value : "";
        }
        if (existing) {
          Store.updateVehicle(existing.id, patch);
          if (linked) Store.attachSpec(existing.id, self.sel);
          else if (existing.spec) Store.detachSpec(existing.id);
          UI.toast("Vehicle updated", "“" + nick + "” saved. Connection state is unchanged.", "ok");
        } else {
          const created = Store.addVehicle(patch);
          if (linked) {
            Store.attachSpec(created.id, self.sel);
            const info = Store.specInfo(Store.getVehicle(created.id));
            const known = info.rows.filter(r => r.known).length;
            UI.toast("Vehicle information added", known + " published spec field(s) came from the built-in database for “" + nick + "”.", "ok");
          } else {
            UI.toast("Custom profile created", "“" + nick + "” is saved. The information rows will say “Information unavailable” until you link a database entry.", "");
          }
          UI.toast("Vehicle profile created", "“" + created.nickname + "” is a profile only. Status: integration unavailable.", "ok");
          close();
          Router.go("vehicle", { id: created.id });
          return;
        }
        close();
        Router.go("vehicle", { id: existing.id });
      }));
    };

    const redraw = (backToType) => {
      UI.modalStack.slice().forEach(m => m.close && m.close());
      UI.modal({
        wide: true,
        body: (backToType || (!existing && !self.pickedType)) ? stepType()
              : (self.dbOpen ? stepDatabase() : stepDetails()),
        onMount(sheet, close) {
          const isDb = !!sheet.querySelector("[data-db-brand], [data-db-hit], #dbSearch");
          if (isDb) {
            const search = $("#dbSearch", sheet);
            if (search) {
              search.addEventListener("input", () => {
                self.dbQuery = search.value;
                const pos = search.selectionStart;
                redraw(false);
                const again = $("#dbSearch", document);
                if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) {} }
              });
            }
            $$("[data-db-brand]", sheet).forEach(b => b.addEventListener("click", () => {
              self.dbSel = { brandId: b.dataset.dbBrand, modelId: null, variantIndex: 0, year: null };
              redraw(false);
            }));
            $$("[data-db-model]", sheet).forEach(b => b.addEventListener("click", () => {
              const m = VehicleDB.model(self.dbSel.brandId, b.dataset.dbModel);
              self.dbSel = { brandId: self.dbSel.brandId, modelId: b.dataset.dbModel, variantIndex: 0, year: m ? (m.to || new Date().getFullYear()) : null };
              redraw(false);
            }));
            $$("[data-db-variant]", sheet).forEach(b => b.addEventListener("click", () => {
              self.dbSel = Object.assign({}, self.dbSel, { variantIndex: Number(b.dataset.dbVariant) });
              redraw(false);
            }));
            $$("[data-db-hit]", sheet).forEach(b => b.addEventListener("click", () => {
              const hits = VehicleDB.search(self.dbQuery, self.draft.type);
              const h = hits[Number(b.dataset.dbHit)];
              if (!h) return;
              self.dbSel = { brandId: h.brand.id, modelId: h.model.id, variantIndex: h.variantIndex, year: h.model.to || new Date().getFullYear() };
              self.dbQuery = "";
              redraw(false);
            }));
            const yearSel = $("#dbYear", sheet);
            if (yearSel) yearSel.addEventListener("change", () => { self.dbSel = Object.assign({}, self.dbSel, { year: Number(yearSel.value) }); });
            $$("[data-db-custom]", sheet).forEach(b => b.addEventListener("click", () => {
              self.sel = null; self.dbSel = null; self.customPicked = true; self.dbOpen = false;
              redraw(false);
            }));
            $$("[data-db-use]", sheet).forEach(b => b.addEventListener("click", () => {
              self.sel = Object.assign({}, self.dbSel);
              if (!self.draft.nickname) {
                const e = VehicleDB.entry(self.sel.brandId, self.sel.modelId, self.sel.variantIndex);
                if (e) self.draft.nickname = e.model.name;
              }
              self.dbOpen = false;
              redraw(false);
            }));
            $$("[data-close], [data-close-x]", sheet).forEach(x => x.addEventListener("click", close));
            return;
          }

          const isType = !!sheet.querySelector("[data-pick-type]");
          if (isType) {
            $$("[data-pick-type]", sheet).forEach(b => b.addEventListener("click", () => {
              self.draft.type = b.dataset.pickType;
              self.pickedType = true;
              self.dbOpen = true;          /* go on to brand → model → year → variant */
              self.dbSel = null; self.dbQuery = ""; self.customPicked = false; self.dbDone = false;
              Store.data.settings.prefs.defaultVehicleType = self.draft.type;
              Store.persist();
              redraw(false);
            }));
            $$("[data-close]", sheet).forEach(x => x.addEventListener("click", close));
          } else { mount(sheet, close); }
        }
      });
    };
    redraw(false);
  }
};

/* ============================================================
   VEHICLE DASHBOARD
   ============================================================ */
defRoute("vehicle", {
  title: "Vehicle",
  render(params) {
    const v = Store.getVehicle(params.id);
    if (!v) return UI.emptyState("Vehicle not found", "This profile no longer exists.", "Back to vehicles", 'data-go="vehicles"', "car");
    const t = vehType(v.type);
    const cm = vehicleConnectionMeta(v);
    const img = safeImg(v.photo);
    const isPrimary = Store.data.primaryVehicleId === v.id;
    const live = VehicleLive.status(v.id);
    const rems = vehicleReminderList(v);
    const next = nextVehicleReminder(v);
    const st = liveVerdict(v);
    const spec = Store.specInfo(v);

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="vehicles" aria-label="Back to vehicles">' + icon("back", 19) + "</button>",
        '<div><div class="eyebrow">' + esc(t.label) + " dashboard</div><h2>" + esc(v.nickname) + "</h2>" +
        '<p class="sub">' + esc(vehicleSubtitle(v)) + (v.plate ? " · " + esc(v.plate) : "") + " · " + esc(v.fuel || "fuel not set") + "</p></div>",
        '<div class="spacer"></div>',
        '<div class="btn-row">' +
          '<button class="btn" data-edit-vehicle="' + esc(v.id) + '">' + icon("edit", 15) + " Edit</button>" +
          '<button class="btn btn-danger" data-del-vehicle="' + esc(v.id) + '">' + icon("trash", 15) + " Delete</button>" +
        "</div>",
      "</div>",

      /* ── header card: photo, identity, connection ── */
      '<div class="card" style="padding:0;overflow:hidden;margin-bottom:16px">' +
        '<div class="media-frame" style="border:0;border-radius:0">' +
          (img ? '<img src="' + esc(img) + '" alt="">' : '<div class="mf-ph">' + icon(t.icon, 52) + "</div>") +
        "</div>" +
        '<div style="padding:16px">' +
          '<div class="row-between" style="align-items:flex-start;gap:14px;flex-wrap:wrap">' +
            "<div>" +
              '<div class="wrap" style="margin-bottom:9px">' +
                '<span class="badge-type">' + t.emoji + " " + esc(t.label) + "</span>" +
                (isPrimary ? '<span class="badge-type badge-primary">' + icon("star", 11) + " Primary vehicle</span>" : "") +
                (v.vin ? '<span class="chip">VIN ' + esc(v.vin) + "</span>" : "") +
              "</div>" +
              '<h3 style="font-size:clamp(19px,4.6vw,25px)">' + esc(v.nickname) + "</h3>" +
              '<div class="sub" style="margin-top:4px">' + esc(vehicleSubtitle(v)) + "</div>" +
            "</div>" +
            (v.connection.adapterName
              ? '<div class="stack" style="align-items:flex-end"><span class="chip">' + icon("plug", 11) + " " + esc(v.connection.adapterName) + "</span>" +
                (v.connection.since ? '<span class="sub">linked ' + esc(relTime(v.connection.since)) + "</span>" : "") + "</div>"
              : "") +
          "</div>" +
          (v.connection.lastError ? '<div style="margin-top:12px">' + UI.notice(esc(v.connection.lastError), "warn", "warn") + "</div>" : "") +
          '<div class="hr"></div>' +
          '<div class="btn-row">' +
            (st.connected
              ? '<button class="btn" data-connect-vehicle="' + esc(v.id) + '">' + icon("plug", 15) + " Manage connection</button>"
              : "") +
            '<button class="btn" data-add-reminder="' + esc(v.id) + '">' + icon("bell", 15) + " Add reminder</button>" +
            (isPrimary ? "" : '<button class="btn" data-primary-vehicle="' + esc(v.id) + '">' + icon("star", 15) + " Set as primary</button>") +
          "</div>" +
        "</div>" +
      "</div>",

      /* ── VEHICLE INFORMATION (static, from the built-in database) ── */
      '<div class="section-title">Vehicle information <span class="spacer"></span>' +
        (spec.linked
          ? '<span class="chip">' + icon("layers", 11) + " Built-in database · " + esc(VEHICLE_DB.updated) + "</span>"
          : '<span class="chip">No database entry linked</span>') + "</div>",
      '<div class="card" style="margin-bottom:16px">' +
        '<div class="row-between" style="align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:12px">' +
          '<div style="min-width:0">' +
            '<div style="font-size:13.8px;font-weight:620">' + (spec.linked ? esc(specTitle({ brandId: v.spec.brandId, modelId: v.spec.modelId, variantIndex: v.spec.variantIndex, year: v.spec.year })) : "Custom profile") + "</div>" +
            '<div class="sub" style="margin-top:4px;max-width:56ch">' + (spec.linked
              ? "Static manufacturer reference data held by the app. It never changes with the vehicle's state, and it is kept completely apart from live readings." + (v.spec.note ? " " + esc(v.spec.note) : "")
              : "This profile is not linked to the built-in database, so the specification rows below read “Information unavailable” rather than a guess.") + "</div>" +
          "</div>" +
        "</div>" +
        specRowsHtml(spec, false, safeImg(v.photo)) +
        '<div class="hr"></div>' +
        '<div class="btn-row">' +
          '<button class="btn btn-sm" data-db-open="' + esc(v.id) + '">' + icon("layers", 13) + " " + (spec.linked ? "Change vehicle information" : "Link a database entry") + "</button>" +
          (spec.linked ? '<button class="btn btn-sm btn-ghost" data-db-remove="' + esc(v.id) + '">Detach</button>' : "") +
        "</div>" +
        '<div class="hint" style="margin-top:11px;line-height:1.55">' + esc(VEHICLE_DB.notice) + "</div>" +
      "</div>",

      /* ── CONNECTION ── */
      '<div class="section-title">Connection</div>',
      '<div class="card" style="margin-bottom:16px">' +
        '<div class="row-between" style="align-items:flex-start;gap:14px;flex-wrap:wrap">' +
          "<div style=\"min-width:0\">" +
            '<div class="conn-state conn-' + esc(st.state.id) + '" id="connState">' +
              '<span class="conn-dot' + (st.state.dot ? " on" : "") + '"></span>' +
              '<span class="conn-label">' + esc(st.state.label) + "</span>" +
            "</div>" +
            '<div class="sub" style="margin-top:9px;max-width:56ch" id="connMsg">' + esc(st.state.message) + "</div>" +
            (v.connection.lastError ? '<div class="hint" style="margin-top:7px;color:var(--warn)">' + esc(v.connection.lastError) + "</div>" : "") +
          "</div>" +
          '<div class="btn-row" style="justify-content:flex-end">' +
            '<button class="btn btn-primary" data-connect-vehicle="' + esc(v.id) + '">' + icon("plus", 14) + " " + (st.connected ? "Manage connection" : "Connect vehicle") + "</button>" +
          "</div>" +
        "</div>" +
      "</div>",

      /* ── LIVE VEHICLE DATA ── */
      '<div class="section-title">Live vehicle data <span class="spacer"></span><span class="chip">' + st.liveCount + " of " + FIELD_ORDER.length + " received</span></div>",
      '<div class="card" style="margin-bottom:16px">' +
        (st.liveCount > 0
          ? ""
          : '<div class="live-empty">' + icon("gauge", 22) + '<div><div style="font-weight:600">No live vehicle data is currently available.</div>' +
            '<div class="sub" style="margin-top:4px">Values appear here only after a real integration actually receives them. Nothing is estimated or filled in.</div></div></div>') +
        '<div class="live-grid" id="liveGrid">' + FIELD_ORDER.map(fid => liveTileHtml(v.id, fid, true)).join("") + "</div>" +
        '<div style="margin-top:14px" id="liveMsg">' + UI.notice(st.message, st.messageKind, st.messageIcon) + "</div>" +
        (st.problems && st.problems.length
          ? '<div class="hr"></div><div class="mini-label">What the adapter reported</div><div class="wrap" style="margin-top:9px">' + st.problems.map(p => '<span class="chip">' + esc(p) + "</span>").join("") + "</div>"
          : "") +
      "</div>",

      /* ── DATA SOURCE ── */
      '<div class="section-title">Data source</div>',
      '<div class="card" style="margin-bottom:16px">' +
        '<div class="row-between" style="align-items:flex-start;gap:14px;flex-wrap:wrap">' +
          "<div style=\"min-width:0\">" +
            '<div style="font-size:13.8px;font-weight:620" id="liveSourceLabel">' + esc(st.sourceLabel) + "</div>" +
            '<div class="sub" style="margin-top:4px;max-width:52ch">' + esc(st.sourceDetail) + "</div>" +
          "</div>" +
          (st.lastUpdated
            ? '<div style="text-align:right" id="liveLastUpdated">' +
                '<div class="mini-label">Last updated</div>' +
                '<div style="font-size:13.2px;font-weight:600;margin-top:3px">' + esc(fmtTime(st.lastUpdated)) + " · " + esc(fmtDate(st.lastUpdated)) + "</div>" +
                '<div class="sub" style="margin-top:2px">' + esc(relTime(st.lastUpdated)) + " · timestamp of the reading itself</div>" +
              "</div>"
            : '<span class="chip" id="liveLastUpdated">No active integration</span>') +
        "</div>" +
        '<div class="hr"></div>' +
        '<div class="btn-row">' +
          (st.connected
            ? '<button class="btn btn-sm" data-refresh-data="' + esc(v.id) + '">' + icon("refresh", 13) + " Refresh data</button>" +
              '<button class="btn btn-sm btn-ghost" data-quick-disconnect="' + esc(v.id) + '">' + icon("unlink", 13) + " Disconnect vehicle</button>"
            : '<button class="btn btn-sm" data-connect-vehicle="' + esc(v.id) + '">' + icon("plug", 13) + " Connect vehicle</button>") +
        "</div>" +
        '<div class="hint" style="margin-top:11px;line-height:1.55">' + esc(st.footerNote) + "</div>" +
      "</div>",

      /* ── overview + reminders ── */
      '<div class="two-col" style="margin-bottom:16px">',
        '<div class="card">',
          cardHead("note", "Vehicle profile", '<button class="link-btn" data-edit-vehicle="' + esc(v.id) + '">Edit</button>'),
          UI.kv("Nickname", esc(v.nickname), false) +
          UI.kv("Type", t.emoji + " " + esc(t.label), false) +
          UI.kv("Brand", v.brand ? esc(v.brand) : '<span class="dim">not set</span>', false) +
          UI.kv("Model", v.model ? esc(v.model) : '<span class="dim">not set</span>', false) +
          UI.kv("Year", v.year ? esc(v.year) : '<span class="dim">not set</span>', false) +
          UI.kv("Fuel type", esc(v.fuel || "—"), false) +
          UI.kv("Registration", v.plate ? esc(v.plate) : '<span class="dim">not recorded</span>', false) +
          UI.kv("Colour", v.color ? esc(v.color) : '<span class="dim">not recorded</span>', false) +
          UI.kv("Odometer (yours)", v.odometerKm != null ? nfmt(v.odometerKm) + " km" : '<span class="dim">not recorded</span>', false) +
          UI.kv("VIN", v.vin ? esc(v.vin) : '<span class="dim">not recorded</span>', false) +
          UI.kv("Profile created", esc(fmtDate(v.createdAt)), false) +
          (v.notes ? '<div class="hr"></div><div class="sub" style="white-space:pre-wrap">' + esc(v.notes) + "</div>" : ""),
        "</div>",
        '<div class="card">',
          cardHead("wrench", "Service &amp; documents", '<button class="link-btn" data-add-reminder="' + esc(v.id) + '">Add</button>'),
          (next ? '<div class="notice ' + (next.days < 0 ? "bad" : next.days <= 7 ? "warn" : "") + '" style="margin-bottom:12px">' + icon("clock", 17) + "<div style=\"margin-left:2px\"><b>" + esc(next.label) + "</b> — " + esc(next.when) + "</div></div>" : ""),

          '<div class="row" style="margin-bottom:12px"><span class="avatar sm">' + icon("shield", 17) + '</span><div class="grow"><div class="name">Insurance</div><div class="meta">' +
            (v.insurance && (v.insurance.provider || v.insurance.expiresOn)
              ? esc([v.insurance.provider, v.insurance.policyNo].filter(Boolean).join(" · ") || "policy on file") + (v.insurance.expiresOn ? " · expires " + esc(fmtDate(v.insurance.expiresOn)) : "")
              : "no policy details saved") +
            '</div></div><button class="btn btn-sm" data-edit-insurance="' + esc(v.id) + '">' + (v.insurance ? "Edit" : "Add") + "</button></div>",

          (rems.filter(r => !r.insurance).length
            ? '<div class="stack">' + rems.filter(r => !r.insurance).map(r => {
                const cls = r.num < 0 ? "late" : (r.num >= 0 && r.num <= 14 ? "due" : "");
                return '<div class="service-item ' + cls + '"><span class="si-ico">' + icon(r.num < 0 ? "alert" : "calendar", 16) + "</span>" +
                  '<div class="si-body"><div class="si-t">' + esc(r.label) + '</div><div class="si-m">' + esc(r.when) + " · " + esc(r.sub) + "</div></div>" +
                  '<div class="stack" style="gap:6px;align-items:flex-end">' +
                    '<button class="btn btn-sm btn-ok" data-done-reminder="' + esc(r.id) + '">Done</button>' +
                    '<button class="btn btn-sm btn-ghost" data-del-reminder="' + esc(r.id) + '">Remove</button>' +
                  "</div></div>";
              }).join("") + "</div>"
            : '<div class="sub">No service reminders yet. Add oil changes, chain service, PUC, insurance renewal — anything with a date or an odometer reading.</div>'),

          '<div class="hr"></div>',
          '<div class="btn-row">' +
            '<button class="btn btn-sm" data-reminder-task="1">' + icon("tasks", 13) + " Turn a reminder into a task</button>" +
            '<button class="btn btn-sm" data-log-service="' + esc(v.id) + '">' + icon("history", 13) + " Log a service</button>" +
          "</div>",
        "</div>",
      "</div>",

      /* ── service history ── */
      '<div class="card">',
        cardHead("history", "Service history", '<span class="sub">' + (v.history || []).length + " entr" + ((v.history || []).length === 1 ? "y" : "ies") + "</span>"),
        ((v.history || []).length
          ? '<div class="timeline">' + v.history.map(h =>
              '<div class="tl-item evt-add"><div class="tl-t">' + esc(h.label || serviceLabel(h.type)) + " logged</div>" +
              '<div class="tl-d">' + esc(h.notes || "Added to this vehicle's service record.") + (h.km != null ? " · at " + nfmt(h.km) + " km" : "") + (h.cost ? " · " + esc(h.cost) : "") + "</div>" +
              '<div class="tl-w">' + esc(fmtDateTime(h.date)) + " · " + esc(relTime(h.date)) + "</div></div>").join("") + "</div>"
          : '<div class="sub">Nothing logged for this vehicle yet. Completing a reminder, or using “Log a service”, writes a real timestamped entry here.</div>'),
      "</div>",

      '<div style="margin-top:16px">' + UI.notice(st.footerNote, "warn", "warn") + "</div>"
    ].join("");
  },

  afterRender(root, params) {
    bindDeviceInteractions(root);
    const id = params.id;
    const v = Store.getVehicle(id);
    if (!v) return;

    VehicleLive.onChange = changed => {
      if (Router.current !== "vehicle" || Router.params.id !== changed) return;
      VehicleView.paintLive(changed);
    };
    if (Store.data.settings.prefs.keepLiveSnapshot && !VehicleLive.anyValue(id)) VehicleLive.restore(v);

    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(b.dataset.back || "vehicles")));
    $$("[data-edit-vehicle]", root).forEach(b => b.addEventListener("click", () => VehicleForm.open(Store.getVehicle(id))));
    $$("[data-connect-vehicle]", root).forEach(b => b.addEventListener("click", () => Integrations.connectFlow(id)));
    $$("[data-add-reminder]", root).forEach(b => b.addEventListener("click", () => ReminderForm.open(id)));
    $$("[data-primary-vehicle]", root).forEach(b => b.addEventListener("click", () => {
      Store.setPrimaryVehicle(id);
      UI.toast("Primary vehicle set", "“" + v.nickname + "” now appears on Home.", "ok");
      UI.refresh();
    }));
    $$("[data-quick-disconnect]", root).forEach(b => b.addEventListener("click", () => {
      UI.confirm({
        title: "Disconnect this vehicle?",
        message: "The live integration is closed and polling stops. Your profile, photo, reminders, insurance and service history are untouched.",
        confirmText: "Disconnect"
      }).then(async ok => {
        if (!ok) return;
        b.disabled = true;
        await Integrations.disconnectVehicle(id);
        UI.toast("Vehicle disconnected", "No live data will be received until you connect again.", "ok");
        UI.refresh();
      });
    }));
    $$("[data-refresh-data]", root).forEach(b => b.addEventListener("click", async () => {
      const original = b.innerHTML;
      b.disabled = true;
      b.innerHTML = icon("refresh", 15, "spin") + " Refreshing…";
      const r = await Integrations.refresh(id);
      b.disabled = false;
      b.innerHTML = original;
      UI.toast(r.ok ? (r.updated ? "Fresh data received" : "No new values") : "Refresh failed",
        r.reason || (r.updated ? "The integration reported new readings." : "The integration had nothing new to report."),
        r.ok ? (r.updated ? "ok" : "warn") : "warn");
      UI.refresh();
    }));
    $$("[data-db-open]", root).forEach(b => b.addEventListener("click", () => {
      const veh = Store.getVehicle(id);
      VehicleForm.open(veh, null, true);   /* editor, opened on the database picker */
    }));
    $$("[data-db-remove]", root).forEach(b => b.addEventListener("click", () => {
      UI.confirm({
        title: "Detach the database entry?",
        message: "The profile keeps its nickname, photo, reminders, insurance and history. The specification rows will read “Information unavailable” until you link an entry again.",
        confirmText: "Detach"
      }).then(ok => {
        if (!ok) return;
        Store.detachSpec(id);
        UI.toast("Detached", "No specifications are shown for this vehicle now.", "");
        UI.refresh();
      });
    }));
    $$("[data-edit-insurance]", root).forEach(b => b.addEventListener("click", () => InsuranceForm.open(id)));
    $$("[data-del-vehicle]", root).forEach(b => b.addEventListener("click", () => deleteVehicleFlow(v)));
    $$("[data-log-service]", root).forEach(b => b.addEventListener("click", () => ServiceLogForm.open(id)));
    $$("[data-reminder-task]", root).forEach(b => b.addEventListener("click", () => reminderToTaskFlow(id)));
    $$("[data-done-reminder]", root).forEach(b => b.addEventListener("click", () => completeReminderFlow(id, b.dataset.doneReminder)));
    $$("[data-del-reminder]", root).forEach(b => b.addEventListener("click", () => {
      const r = (Store.getVehicle(id).serviceReminders || []).find(x => x.id === b.dataset.delReminder);
      UI.confirm({ title: "Remove this reminder?", message: "“" + ((r && (r.label || serviceLabel(r.type))) || "Reminder") + "” will be deleted from this vehicle.", confirmText: "Remove" })
        .then(ok => { if (!ok) return; Store.deleteReminder(id, b.dataset.delReminder); UI.toast("Reminder removed", "", "ok"); UI.refresh(); });
    }));
  }
});

/* status / message copy for the live data panel */
function liveVerdict(v) {
  const live = VehicleLive.status(v.id);
  const state = vehicleConnState(v);
  const restored = !!(VehicleLive.sessions[v.id] && VehicleLive.sessions[v.id].restored && !live.liveFields);
  const problems = (ObdBle.session && ObdBle.session.vehicleId === v.id && ObdBle.session.lastProblems) || null;
  const anySnap = !!(v.live && v.live.fields && Object.keys(v.live.fields).length);
  const adapter = Adapters.byId(v.connection.adapterId);
  const connecting = state.id === "waiting" || state.id === "live";
  const lastUpdated = VehicleLive.lastUpdatedAt(v.id);

  const sourceLabel = connecting
    ? (live.adapterName || (adapter ? adapter.name : "Connected integration"))
    : (state.id === "lost" ? (v.connection.adapterName || "Integration (lost)") : "No active integration");
  const sourceDetail = connecting
    ? "Values are only ever shown from this source" + (live.vin ? ". ECU VIN " + live.vin : "") + "."
    : (state.id === "lost"
        ? "The link ended at " + fmtDateTime(v.connection.lastLostAt) + "."
        : (state.id === "unsupported"
            ? "This runtime exposes no way to reach a vehicle."
            : "Choose a connection method below to start receiving real values."));

  const message = {
    live: "Values above were reported by " + (live.adapterName || "the connected integration") + ". Each one carries its own timestamp, and a reading that stops arriving fades to STALE before it disappears.",
    waiting: "The integration is linked, but <b>no values have been received yet</b>. Nothing is displayed until the vehicle actually reports something — a link on its own is not data.",
    lost: "<b>CONNECTION LOST.</b> " + esc(v.connection.lastError || "The integration stopped answering.") + (anySnap ? " The last real snapshot is shown with its original timestamp." : ""),
    unsupported: "<b>No live vehicle data is currently available.</b> Vehicle integration is not available in this version. Vehicle profile, reminders, insurance and service history are still available.",
    not_connected: "<b>No live vehicle data is currently available.</b>" + (anySnap ? " The last real snapshot is shown above, with the timestamp of when it was received." : " Connect a supported integration to receive real values.")
  }[state.id];

  return {
    state,
    connected: connecting,
    partial: v.connection.status === "partial",
    liveCount: live.liveFields,
    restored, problems,
    sourceLabel, sourceDetail,
    lastUpdated,
    hasData: live.liveFields > 0 || anySnap,
    polling: connecting && !!(ObdBle.session && ObdBle.session.vehicleId === v.id),
    message,
    messageKind: state.id === "live" ? "ok" : (state.id === "lost" ? "bad" : (state.id === "waiting" ? "" : "warn")),
    messageIcon: state.id === "live" ? "check" : (state.id === "lost" ? "alert" : "warn"),
    footerNote: "Speed, RPM, fuel level, engine temperature, battery voltage, odometer, engine status, tyre pressure and location are never estimated, simulated or filled with demo values. Each one comes from a supported integration or is shown as “Not available” — that is the whole design rule behind this page."
  };
}


function liveTileHtml(vehicleId, fieldId, withIcons) {
  const def = fieldDef(fieldId);
  const st = VehicleLive.fieldState(vehicleId, fieldId);
  const v = Store.getVehicle(vehicleId);
  const vType = vehType(v ? v.type : "car");
  let cls = "live-tile", valueHtml, srcHtml;
  if (st.state === "live" || st.state === "stale") {
    const f = st.field;
    const isNum = typeof f.value === "number";
    /* A reading cannot be called live once the integration that produced it
       has gone away — it becomes a clearly timestamped last-known value. */
    const wentStale = st.state === "live" && typeof vehicleConnState === "function" && vehicleConnState(v).id === "lost";
    if (wentStale) st.state = "stale";
    cls += st.state === "live" ? " is-live" : " is-stale";
    valueHtml = '<div class="live-value">' + esc(isNum ? nfmt(f.value) : f.value) + (f.unit ? '<span class="live-unit">' + esc(f.unit) + "</span>" : "") + "</div>";
    srcHtml = '<div class="live-src">' + (st.state === "live" ? "live · " : "stale · ") + esc(relTime(f.at)) + "<br><b>" + esc(sourceName(f.source)) + "</b>" + (f.note ? " · " + esc(f.note) : "") + "</div>";
  } else {
    cls += " is-na";
    const reason = fieldReason(v, fieldId, vType);
    valueHtml = '<div class="live-na">Not available</div>';
    srcHtml = '<div class="live-src">' + esc(reason.detail) + "</div>";
  }
  return '<div class="' + cls + '" data-live-tile="' + esc(fieldId) + '">' +
    '<div class="live-top">' + (withIcons ? '<span class="live-ico">' + icon(def.icon, 14) + "</span>" : "") + '<span class="live-label">' + esc(def.label) + "</span></div>" +
    valueHtml + srcHtml + "</div>";
}
function sourceName(src) {
  return ({
    "obd-ii": "OBD-II adapter", "obd-ble": "OBD-II adapter",
    "bluetooth": "Bluetooth vehicle interface",
    "manufacturer": "Manufacturer API", "http": "Manufacturer API",
    "native-android": "Native Android integration", "native": "Native Android integration",
    "host-gps": "This device's GPS"
  })[src] || "Integration";
}
function fieldReason(v, fieldId, vType) {
  const connected = v && v.connection && v.connection.status === "connected";
  const adapter = v && v.connection ? v.connection.adapterId : null;
  if (!connected) return { headline: "Not available", detail: "No integration is connected, so this value was never received." };
  if (fieldId === "tyres" && adapter === "obd-ble") return { headline: "Not available", detail: "Tyre pressure is not part of standard OBD-II — add a manufacturer PID for it." };
  if (fieldId === "location") return { headline: "Not available", detail: "This adapter does not report GPS. Enable host-device GPS for a labelled location." };
  if (adapter === "http") return { headline: "Not in payload", detail: "Your endpoint did not include this key on the last poll." };
  return { headline: "Not available", detail: "The " + (adapter === "native" ? "native API" : "adapter") + " has not delivered this value." };
}
/* Repaints the whole live block: the state line, the source card, the
   last-updated stamp and every tile. Called whenever values arrive. */
function paintLiveState(vehicleId) {
  const v = Store.getVehicle(vehicleId);
  if (!v) return;
  const st = liveVerdict(v);
  const conn = $("#connState");
  if (conn) {
    conn.className = "conn-state conn-" + st.state.id;
    conn.innerHTML = '<span class="conn-dot' + (st.state.dot ? " on" : "") + '"></span><span class="conn-label">' + esc(st.state.label) + "</span>";
  }
  const src = $("#liveSourceLabel");
  if (src) src.textContent = st.sourceLabel;
  const lu = $("#liveLastUpdated");
  if (lu && st.lastUpdated) {
    lu.className = "";
    lu.innerHTML = '<div class="mini-label">Last updated</div><div style="font-size:13.2px;font-weight:600;margin-top:3px">' + esc(fmtTime(st.lastUpdated)) + " · " + esc(fmtDate(st.lastUpdated)) +
      '</div><div class="sub" style="margin-top:2px">' + esc(relTime(st.lastUpdated)) + " · timestamp of the reading itself</div>";
  }
  const msgLine = $("#connMsg");
  if (msgLine) msgLine.textContent = st.state.message;
  const liveMsg = $("#liveMsg");
  if (liveMsg) liveMsg.innerHTML = UI.notice(st.message, st.messageKind, st.messageIcon);
  const empty = $("#liveEmpty");
  if (empty && st.liveCount > 0) empty.remove();
  paintLiveGrid(vehicleId);
}

function paintLiveGrid(vehicleId) {
  const grid = $("#liveGrid");
  if (!grid) return;
  FIELD_ORDER.forEach(fid => {
    const tile = grid.querySelector('[data-live-tile="' + fid + '"]');
    if (!tile) return;
    const fresh = document.createElement("div");
    fresh.innerHTML = liveTileHtml(vehicleId, fid, true);
    const el = fresh.firstElementChild;
    tile.className = el.className;
    tile.innerHTML = el.innerHTML;
  });
}
const VehicleView = { paintLive: paintLiveState, paintGrid: paintLiveGrid };

/* ============================================================
   VEHICLE ACTIONS & FORMS
   ============================================================ */
/* Title line for a chosen database entry. */
function specTitle(sel) {
  const e = sel && VehicleDB.entry(sel.brandId, sel.modelId, sel.variantIndex);
  if (!e) return "";
  return [e.brand.name, e.model.name, e.model.gen, e.variant.name, sel.year || (e.model.to || new Date().getFullYear())].filter(Boolean).join(" · ");
}
/* The spec object a selection would produce, without touching the store. */
function specFromSel(sel) {
  const e = sel && VehicleDB.entry(sel.brandId, sel.modelId, sel.variantIndex);
  if (!e) return null;
  return {
    brandId: e.brand.id, modelId: e.model.id, variantIndex: sel.variantIndex || 0,
    year: sel.year || (e.model.to || new Date().getFullYear())
  };
}
/* VEHICLE INFORMATION rows. Values come only from the database entry linked
   to the profile; every other row reads "Information unavailable". */
function specRowsHtml(info, compact, photo) {
  if (!info) return "";
  if (photo) info.rows.forEach(r => { if (r.label === "Image") { r.value = "Photo added by you"; r.known = true; } });
  const rows = info.rows.map(r => '<div class="spec-row' + (r.known ? "" : " unknown") + '"><span class="spec-l">' + esc(r.label) + '</span><span class="spec-v">' + esc(r.value) + "</span></div>").join("");
  const extras = (info.extras || []).map(e => '<div class="spec-row"><span class="spec-l">' + esc(e[0]) + '</span><span class="spec-v">' + esc(e[1]) + "</span></div>").join("");
  return '<div class="spec-table' + (compact ? " compact" : "") + '">' + rows + extras + "</div>";
}

function deleteVehicleFlow(v) {
  if (!v) return;
  UI.confirm({
    title: "Delete “" + v.nickname + "”?",
    message: "The profile, its reminders, insurance details and service history will be removed from this device. This cannot be undone.",
    confirmText: "Delete vehicle"
  }).then(ok => {
    if (!ok) return;
    const adapter = Adapters.byId(v.connection.adapterId);
    if (adapter && v.connection.status === "connected") { try { adapter.disconnect(v.id); } catch (e) {} }
    VehicleLive.clear(v.id);
    Store.deleteVehicle(v.id);
    UI.toast("Vehicle deleted", "“" + v.nickname + "” was removed from the hub.", "ok");
    Router.go("vehicles");
  });
}

function completeReminderFlow(vehicleId, reminderId) {
  const v = Store.getVehicle(vehicleId);
  if (!v) return;
  const r = (v.serviceReminders || []).find(x => x.id === reminderId);
  if (!r) return;
  UI.modal({
    body: [
      '<div class="sheet-head"><div><h3>Log “' + esc(r.label || serviceLabel(r.type)) + '”</h3><div class="sub">It gets a real timestamp, and moves into the service history of ' + esc(v.nickname) + ".</div></div></div>",
      '<div class="form">',
        '<div class="form-grid">',
          '<div class="field"><label>Odometer at service (km)</label><input class="input mono" id="csKm" type="number" min="0" value="' + esc(r.doneKm != null ? r.doneKm : (v.odometerKm == null ? "" : v.odometerKm)) + '"></div>',
          '<div class="field"><label>Cost (optional)</label><input class="input mono" id="csCost" placeholder="e.g. ₹2,400"></div>',
        "</div>",
        '<div class="field"><label>Notes</label><input class="input" id="csNotes" value="' + esc(r.notes || "") + '" placeholder="What was done, where, which parts…"></div>',
        '<div class="notice">' + icon("info", 17) + '<div style="margin-left:2px">Marking this done does not affect any live data. If a connected adapter reports the odometer, that reading is kept separate and labelled.</div></div>',
      "</div>",
      '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-confirm-done="1">' + icon("check", 15) + " Mark completed</button></div>"
    ].join(""),
    onMount(sheet, close) {
      $$("[data-confirm-done]", sheet).forEach(b => b.addEventListener("click", () => {
        const kmRaw = $("#csKm", sheet).value.trim();
        Store.completeServiceReminder(vehicleId, reminderId, {
          km: kmRaw === "" ? null : Number(kmRaw),
          cost: $("#csCost", sheet).value.trim() || null,
          notes: $("#csNotes", sheet).value.trim()
        });
        UI.toast("Service logged", "It is in the service history for “" + v.nickname + "”.", "ok");
        close();
        UI.refresh();
      }));
    }
  });
}

const ReminderForm = {
  open(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    const catalog = catalogFor(v.type);
    UI.modal({
      body: [
        '<div class="sheet-head"><div><h3>Add a reminder</h3><div class="sub">For ' + esc(v.nickname) + " · dates and odometer intervals you control. Nothing contacts your vehicle or insurer.</div></div></div>",
        '<div class="form">',
          '<div class="field"><label>Reminder type</label><select class="select" id="rType">' +
            catalog.map(x => '<option value="' + x.id + '">' + esc(x.label) + " — " + esc(x.interval) + "</option>").join("") + "</select></div>",
          '<div class="field hidden" id="rCustomWrap"><label>Custom title</label><input class="input" id="rCustom" placeholder="e.g. Front tyre replacement"></div>',
          '<div class="form-grid">',
            '<div class="field"><label>Due date (optional)</label><input class="input" id="rDate" type="date"></div>',
            '<div class="field"><label>Due at odometer (km, optional)</label><input class="input mono" id="rKm" type="number" min="0" placeholder="e.g. 40000"></div>',
          "</div>",
          '<div class="field"><label>Notes</label><input class="input" id="rNote" placeholder="optional"></div>',
          '<div class="notice">' + icon("info", 17) + "<div style=\"margin-left:2px\">Set at least one trigger — a date or an odometer reading — so the reminder can actually fire.</div></div>",
        "</div>",
        '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Cancel</button>' +
        '<button class="btn btn-primary" data-save-rem="1">' + icon("plus", 15) + " Add reminder</button></div>"
      ].join(""),
      onMount(sheet, close) {
        const sel = $("#rType", sheet);
        sel.addEventListener("change", () => $("#rCustomWrap", sheet).classList.toggle("hidden", sel.value !== "custom"));
        $$("[data-save-rem]", sheet).forEach(b => b.addEventListener("click", () => {
          const type = sel.value;
          const custom = $("#rCustom", sheet).value.trim();
          const dueDate = $("#rDate", sheet).value;
          const kmRaw = $("#rKm", sheet).value;
          if (!dueDate && !kmRaw) { UI.toast("Add a trigger", "Set a due date or an odometer reading.", "warn"); return; }
          Store.addServiceReminder(vehicleId, {
            type, label: type === "custom" ? (custom || "Custom reminder") : serviceLabel(type),
            dueDate: dueDate || "", dueKm: kmRaw === "" ? null : Number(kmRaw),
            notes: $("#rNote", sheet).value.trim()
          });
          UI.toast("Reminder saved", "Added to “" + v.nickname + "”.", "ok");
          close();
          UI.refresh();
        }));
      }
    });
  }
};

const InsuranceForm = {
  open(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    const ins = v.insurance || { provider: "", policyNo: "", expiresOn: "", notes: "" };
    UI.modal({
      body: [
        '<div class="sheet-head"><div><h3>Insurance details</h3><div class="sub">For ' + esc(v.nickname) + " · typed by you, never verified automatically.</div></div></div>",
        '<div class="form">',
          '<div class="field"><label>Insurer</label><input class="input" id="iProv" value="' + esc(ins.provider) + '" placeholder="e.g. HDFC ERGO"></div>',
          '<div class="field"><label>Policy number</label><input class="input mono" id="iPol" value="' + esc(ins.policyNo) + '" placeholder="optional"></div>',
          '<div class="field"><label>Expires on</label><input class="input" id="iExp" type="date" value="' + esc(ins.expiresOn) + '"></div>',
          '<div class="field"><label>Notes</label><input class="input" id="iNote" value="' + esc(ins.notes || "") + '" placeholder="IDV, add-ons, agent…"></div>',
        "</div>",
        '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-save-ins="1">' + icon("check", 15) + " Save</button></div>"
      ].join(""),
      onMount(sheet, close) {
        $$("[data-save-ins]", sheet).forEach(b => b.addEventListener("click", () => {
          Store.setInsurance(vehicleId, {
            provider: $("#iProv", sheet).value.trim(),
            policyNo: $("#iPol", sheet).value.trim(),
            expiresOn: $("#iExp", sheet).value,
            notes: $("#iNote", sheet).value.trim()
          });
          UI.toast("Insurance saved", "The expiry date now drives a real local reminder.", "ok");
          close();
          UI.refresh();
        }));
      }
    });
  }
};

const ServiceLogForm = {
  open(vehicleId) {
    const v = Store.getVehicle(vehicleId);
    if (!v) return;
    const catalog = catalogFor(v.type);
    UI.modal({
      body: [
        '<div class="sheet-head"><div><h3>Log a service</h3><div class="sub">A record you keep for ' + esc(v.nickname) + ". It is stamped with today's date, or the date you choose.</div></div></div>",
        '<div class="form">',
          '<div class="field"><label>What was done</label><select class="select" id="lsType">' +
            catalog.filter(x => x.id !== "custom").map(x => '<option value="' + x.id + '">' + esc(x.label) + "</option>").join("") +
            '<option value="custom">Something else</option></select></div>',
          '<div class="field hidden" id="lsCustomWrap"><label>Title</label><input class="input" id="lsCustom" placeholder="e.g. Clutch plate replacement"></div>',
          '<div class="form-grid">',
            '<div class="field"><label>Date</label><input class="input" id="lsDate" type="date" value="' + dayKey() + '"></div>',
            '<div class="field"><label>Odometer (km)</label><input class="input mono" id="lsKm" type="number" min="0" value="' + esc(v.odometerKm == null ? "" : v.odometerKm) + '"></div>',
          "</div>",
          '<div class="form-grid">',
            '<div class="field"><label>Cost (optional)</label><input class="input mono" id="lsCost" placeholder="e.g. ₹1,850"></div>',
            '<div class="field"><label>Notes</label><input class="input" id="lsNotes" placeholder="parts, garage, next interval…"></div>',
          "</div>",
        "</div>",
        '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-save-log="1">' + icon("check", 15) + " Save entry</button></div>"
      ].join(""),
      onMount(sheet, close) {
        const sel = $("#lsType", sheet);
        sel.addEventListener("change", () => $("#lsCustomWrap", sheet).classList.toggle("hidden", sel.value !== "custom"));
        $$("[data-save-log]", sheet).forEach(b => b.addEventListener("click", () => {
          const type = sel.value;
          const label = type === "custom" ? ($("#lsCustom", sheet).value.trim() || "Service") : serviceLabel(type);
          const d = $("#lsDate", sheet).value;
          const kmRaw = $("#lsKm", sheet).value.trim();
          Store.addHistoryEntry(vehicleId, {
            type, label,
            date: d ? new Date(d + "T09:00:00").toISOString() : nowIso(),
            km: kmRaw === "" ? null : Number(kmRaw),
            cost: $("#lsCost", sheet).value.trim() || null,
            notes: $("#lsNotes", sheet).value.trim()
          });
          UI.toast("Service logged", label + " added to the history of “" + v.nickname + "”.", "ok");
          close();
          UI.refresh();
        }));
      }
    });
  }
};

function reminderToTaskFlow(vehicleId) {
  const v = Store.getVehicle(vehicleId);
  if (!v) return;
  const open = vehicleReminderList(v).filter(r => !r.insurance);
  const ins = v.insurance && v.insurance.expiresOn ? [{ id: "insurance", label: "Insurance renewal — " + v.nickname, when: "expires " + fmtDate(v.insurance.expiresOn), due: v.insurance.expiresOn }] : [];
  const options = open.map(r => ({ id: r.id, label: (r.label || "Reminder") + " — " + v.nickname, when: r.when, due: r.r && r.r.dueDate ? r.r.dueDate : "" })).concat(ins);
  if (!options.length) { UI.toast("Nothing to convert", "Add a reminder with a date first.", "warn"); return; }
  UI.modal({
    body: [
      '<div class="sheet-head"><div><h3>Convert a reminder into a task</h3><div class="sub">Tasks and reminders stay separate: the reminder keeps tracking the vehicle, the task lands in your planner.</div></div></div>',
      '<div class="list">' + options.map(o =>
        '<div class="row"><span class="avatar sm">' + icon("bell", 16) + '</span><div class="grow"><div class="name">' + esc(o.label) + '</div><div class="meta">' + esc(o.when) + "</div></div>" +
        '<button class="btn btn-sm btn-primary" data-to-task="' + esc(o.id) + '">' + icon("plus", 12) + " Add task</button></div>").join("") + "</div>",
      '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Close</button></div>'
    ].join(""),
    onMount(sheet, close) {
      $$("[data-to-task]", sheet).forEach(b => b.addEventListener("click", () => {
        const o = options.find(x => x.id === b.dataset.toTask);
        Store.addTask({
          title: o.label,
          notes: "From the vehicle hub · " + v.nickname + " · " + o.when,
          priority: "medium",
          due: o.due || "",
          vehicleId: v.id
        });
        UI.toast("Task added", "“" + o.label + "” is in your planner.", "ok");
        close();
        Router.go("tasks");
      }));
    }
  });
}
