/* ============================================================
   STATS
   ============================================================ */
defRoute("stats", {
  title: "Stats",
  render() {
    const s = Store.data;
    const focusMin = s.focus.totalSeconds / 60;
    const tasksDone = s.tasks.filter(t => t.done).length;
    const sessions = s.focus.sessions.length;
    const xp = s.mystery.xp;
    const activityCount = s.activity.length;
    const solved = MYSTERY_CASES.filter(c => (s.mystery.progress[c.id] || {}).solved).length;
    const vehCount = s.vehicles.length;
    const cars = Store.vehiclesOfType("car").length;
    const bikes = Store.vehiclesOfType("bike").length;
    const liveIntegrations = s.vehicles.filter(v => ["live", "waiting"].indexOf(vehicleConnState(v).id) > -1).length;
    const serviceEntries = s.vehicles.reduce((a, v) => a + (v.history || []).length, 0);
    const remindersOpen = s.vehicles.reduce((a, v) => a + (v.serviceReminders || []).filter(r => !r.done).length, 0);

    /* focus, last 14 days */
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push({ key: dayKey(d), label: d.toLocaleDateString(undefined, { day: "numeric" }), mins: Math.round(Store.secondsForDay(dayKey(d)) / 60) });
    }
    const maxMins = Math.max(1, ...days.map(d => d.mins));
    const bestDay = days.slice().sort((a, b) => b.mins - a.mins)[0];

    /* tasks, last 7 days */
    const tdays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = dayKey(d);
      tdays.push({ label: d.toLocaleDateString(undefined, { weekday: "narrow" }), v: s.tasks.filter(t => t.done && t.completedAt && dayKey(t.completedAt) === k).length });
    }

    /* device categories */
    const byCat = {};
    s.devices.forEach(d => { byCat[d.category] = (byCat[d.category] || 0) + 1; });
    const catParts = Object.keys(byCat).map(k => ({ label: catOf(k).label, value: byCat[k], color: "hsl(" + (180 + Object.keys(byCat).indexOf(k) * 34) + " 78% 58%)" }));

    /* activity kinds */
    const kinds = {};
    s.activity.forEach(a => { kinds[a.kind || "other"] = (kinds[a.kind || "other"] || 0) + 1; });
    const kindColors = { add: "#34d399", edit: "#60a5fa", del: "#f87171", live: "#22d3ee", warn: "#fbbf24", "": "#8ea4bd", other: "#8ea4bd" };
    const kindLabels = { add: "Created / completed", edit: "Edited", del: "Deleted / cleared", live: "Real connections", warn: "Warnings", other: "Other" };

    /* storage footprint */
    let bytes = 0, imgBytes = 0;
    try { bytes = (localStorage.getItem(STORE_KEY) || "").length; } catch (e) {}
    s.devices.forEach(d => { if (d.image) imgBytes += d.image.length; });
    if (s.car && s.car.photo) imgBytes += s.car.photo.length;

    const week = days.slice(7).reduce((a, d) => a + d.mins, 0);
    const prevWeek = days.slice(0, 7).reduce((a, d) => a + d.mins, 0);
    const delta = prevWeek ? Math.round(((week - prevWeek) / prevWeek) * 100) : null;

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="home" aria-label="Back">' + icon("back", 19) + "</button>",
        "<div><div class=\"eyebrow\">Your numbers</div><h2>Statistics</h2>" +
        '<p class="sub">Every figure below is computed from things that actually happened in this app. Empty means empty — nothing is padded with placeholders.</p></div>',
      "</div>",

      '<div class="grid grid-4" style="margin-bottom:6px">',
        tile("Total devices", nfmt(s.devices.length), s.devices.filter(d => d.status === "connected").length + " connected right now", "accent", "devices"),
        tile("Total vehicles", nfmt(vehCount), nfmt(cars) + " car" + (cars === 1 ? "" : "s") + " · " + nfmt(bikes) + " bike" + (bikes === 1 ? "" : "s"), "", "car"),
        tile("Live integrations", nfmt(liveIntegrations), liveIntegrations ? "delivering real data" : "none connected", liveIntegrations ? "accent" : "", "plug"),
        tile("Service entries", nfmt(serviceEntries), remindersOpen + " reminder" + (remindersOpen === 1 ? "" : "s") + " open", "", "wrench"),
        tile("Focus time", esc(fmtDur(focusMin)), sessions ? sessions + " session" + (sessions === 1 ? "" : "s") : "no sessions yet", "", "focus"),
        tile("Tasks completed", nfmt(tasksDone), s.tasks.filter(t => !t.done).length + " still open", "", "tasks"),
        tile("Mystery progress", nfmt(xp) + " XP", solved + "/" + MYSTERY_CASES.length + " cases closed", "", "mystery"),
        tile("Activity events", nfmt(activityCount), (bytes / 1024).toFixed(1) + " KB stored locally", "", "clock"),
      "</div>",

      '<div class="grid" style="margin-top:14px">',
        '<div class="card span-2">',
          cardHead("chart", "Focus time · last 14 days", '<span class="chip">peak ' + bestDay.mins + " min</span>"),
          UI.bars(days.map(d => d.label), days.map(d => d.mins), { highlight: 13 }),
          '<div class="bar-labels"><span>13 days ago</span><span>7 days ago</span><span>today</span></div>',
          '<div class="row-between" style="margin-top:12px"><span class="sub">This week vs last week</span>' +
            (delta == null ? '<span class="chip">not enough history</span>' : '<span class="pill ' + (delta >= 0 ? "ok" : "warn") + '"><span class="dot"></span>' + (delta >= 0 ? "+" : "") + delta + "%</span>") + "</div>",
        "</div>",

        '<div class="card">',
          cardHead("tasks", "Tasks completed · 7 days"),
          UI.bars(tdays.map(d => d.label), tdays.map(d => d.v), { highlight: 6 }),
          '<div class="bar-labels"><span>6 days ago</span><span>today</span></div>',
          '<div class="hr"></div>' +
          UI.kv("Completion rate", s.tasks.length ? pct(tasksDone, s.tasks.length) + "%" : "—", false) +
          UI.kv("High priority open", nfmt(s.tasks.filter(t => !t.done && t.priority === "high").length), false),
        "</div>",

        '<div class="card">',
          cardHead("devices", "Devices by category"),
          (s.devices.length
            ? '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' + UI.donut(catParts, 150, 16, nfmt(s.devices.length), "devices") +
              '<div class="legend" style="flex:1;min-width:130px">' + catParts.map(p => '<div class="li"><span class="sw" style="background:' + p.color + '"></span>' + esc(p.label) + '<span class="lv">' + p.value + "</span></div>").join("") + "</div></div>"
            : '<div class="sub">No devices saved yet, so there is nothing to break down. Add one and this chart fills itself.</div>'),
        "</div>",

        '<div class="card">',
          cardHead("car", "Vehicles by type"),
          (vehCount
            ? '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
              UI.donut([{ label: "Cars", value: cars, color: "hsl(190 76% 55%)" }, { label: "Bikes", value: bikes, color: "hsl(220 80% 62%)" }].filter(x => x.value), 150, 16, nfmt(vehCount), "vehicles") +
              '<div class="legend" style="flex:1;min-width:120px">' +
                '<div class="li"><span class="sw" style="background:hsl(190 76% 55%)"></span>Cars<span class="lv">' + cars + "</span></div>" +
                '<div class="li"><span class="sw" style="background:hsl(220 80% 62%)"></span>Bikes<span class="lv">' + bikes + "</span></div>" +
                '<div class="li"><span class="sw" style="background:var(--muted)"></span>Primary<span class="lv">' + esc(Store.primaryVehicle() ? Store.primaryVehicle().nickname : "—") + "</span></div>" +
              "</div></div>"
            : '<div class="sub">No vehicles saved yet. Add a car or a bike and this chart fills itself.</div>'),
        "</div>",

        '<div class="card">',
          cardHead("clock", "Activity by type"),
          (activityCount
            ? '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
              UI.donut(Object.keys(kinds).map(k => ({ label: kindLabels[k] || "Other", value: kinds[k], color: kindColors[k] || "#8ea4bd" })), 150, 16, nfmt(activityCount), "events") +
              '<div class="legend" style="flex:1;min-width:130px">' + Object.keys(kinds).map(k => '<div class="li"><span class="sw" style="background:' + (kindColors[k] || "#8ea4bd") + '"></span>' + esc(kindLabels[k] || "Other") + '<span class="lv">' + kinds[k] + "</span></div>").join("") + "</div></div>"
            : '<div class="sub">No activity logged yet. Every real event in the app appears here.</div>'),
        "</div>",

        '<div class="card span-2">',
          cardHead("mystery", "Mystery progress", '<span class="chip">' + nfmt(xp) + " XP · " + esc(mysteryRank(xp).current.label) + "</span>"),
          '<div class="list">' + MYSTERY_CASES.map(c => {
            const p = mysteryProgress(c.id);
            const ans = Object.keys(p.answers || {}).length;
            const tot = c.questions.length + 1;
            return '<div class="row"><span class="avatar sm">' + (p.solved ? "✅" : "🔍") + '</span><div class="grow" style="min-width:0">' +
              '<div class="name">' + esc(c.num) + " · " + esc(c.title) + '</div><div class="meta">' + (p.solved ? "Closed with score " + (p.score != null ? p.score + "%" : "—") : ans + " of " + tot + " answered") + "</div></div>" +
              '<span class="chip">' + (p.xp || 0) + " XP</span></div>";
          }).join("") + "</div>",
        "</div>",
      "</div>",

      '<div style="margin-top:16px">' + UI.notice(
        "<b>How these numbers are produced.</b> Devices come from your saved profiles. Focus time is the sum of real elapsed seconds. Tasks are counted by their stored completion timestamp. Mystery XP is awarded only by the puzzle engine. Activity counts rows in your own log. " +
        "Where there is not enough history, the chart says “not enough data” rather than drawing an invented trend.",
        "", "chart") + "</div>"
    ].join("");
  },
  afterRender(root) {
    bindDeviceInteractions(root);
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(b.dataset.back || "home")));
  }
});

