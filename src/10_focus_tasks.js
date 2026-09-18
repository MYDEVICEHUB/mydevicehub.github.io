/* ============================================================
   FOCUS TIMER — real elapsed time only, never simulated
   ============================================================ */
const Focus = {
  running: false,
  paused: false,
  startedAt: null,      // when the current run began counting
  elapsedBeforePause: 0,
  _tickId: null,

  cfg() { return Store.data.focus.config; },
  targetSeconds() { return Math.max(1, Math.round((this.cfg().minutes || 25) * 60)); },
  elapsed() {
    if (!this.running || !this.startedAt) return this.elapsedBeforePause;
    if (this.paused) return this.elapsedBeforePause;
    return this.elapsedBeforePause + (Date.now() - this.startedAt) / 1000;
  },
  remaining() { return Math.max(0, this.targetSeconds() - this.elapsed()); },
  progress() { return clamp(this.elapsed() / this.targetSeconds(), 0, 1); },

  start() {
    if (this.running) return;
    this.running = true; this.paused = false;
    this.elapsedBeforePause = 0;
    this.startedAt = Date.now();
    Store.log("focus_start", "Started a " + this.cfg().minutes + "-minute focus session.", null);
    UI.toast("Focus started", this.cfg().minutes + " minutes on the clock. Stay with it.", "ok");
    this.ensureGlobalTick();
    UI.refresh();
  },
  pause() {
    if (!this.running || this.paused) return;
    this.elapsedBeforePause = this.elapsed();
    this.paused = true;
    UI.toast("Paused", "Timer paused at " + mmss(this.elapsedBeforePause) + ".", "warn");
    UI.refresh();
  },
  resume() {
    if (!this.running || !this.paused) return;
    this.startedAt = Date.now();
    this.paused = false;
    UI.toast("Resumed", "Picking up where you left off.", "ok");
    UI.refresh();
  },
  stopSilently() {
    this.running = false; this.paused = false; this.startedAt = null; this.elapsedBeforePause = 0;
    if (Store.data.focus.current) { delete Store.data.focus.current; Store.persistSoon(); }
  },
  /* the running session is written down so a reload cannot silently gain time */
  persistLive() {
    if (this.running) {
      Store.data.focus.current = {
        running: true, paused: this.paused, elapsedSec: Math.round(this.elapsed()),
        target: this.targetSeconds(), savedAt: nowIso()
      };
    } else if (Store.data.focus.current) {
      delete Store.data.focus.current;
    }
    Store.persist();
  },

  finish(manual) {
    const secs = Math.round(this.elapsed());
    const target = this.targetSeconds();
    const completed = secs >= target;
    const startedIso = new Date(Date.now() - secs * 1000).toISOString();
    const session = {
      id: uid("ses"), startedAt: startedIso, endedAt: nowIso(), seconds: secs,
      target, completed: !!completed, minutes: this.cfg().minutes,
      manualEnd: !!manual
    };
    Store.addSession(session);
    Store.log(completed ? "focus_complete" : "focus_cancel",
      completed ? "Completed a " + fmtDur(secs / 60) + " focus session (target " + fmtDur(target / 60) + ")."
                : "Ended a focus session early at " + fmtDur(secs / 60) + " of " + fmtDur(target / 60) + " — the real time was still credited.",
      null);
    this.stopSilently();
    if (completed) {
      UI.toast("Session complete", fmtDur(secs / 60) + " of genuine focus time credited.", "ok");
      if (Store.data.settings.notify.focus) UI.notify("Focus session complete", "You finished " + fmtDur(secs / 60) + " of focused work.", true);
    } else {
      UI.toast("Session ended", fmtDur(secs / 60) + " credited — only real elapsed time is ever recorded.", "warn");
    }
    UI.refresh();
  },

  /* the timer keeps running even when you leave the Focus view */
  ensureGlobalTick() {
    if (this._globalId) return;
    this._globalId = setInterval(() => {
      if (!this.running || this.paused) return;
      if (this.elapsed() >= this.targetSeconds()) {
        this.finish(false);
        Store.persist();
      } else {
        if (Router.current === "focus") Focus.paintLive();
        if (Math.round(this.elapsed()) % 15 === 0) this.persistLive();
      }
    }, 1000);
  },
  paintLive() {
    const t = $("#ringTime");
    if (!t) return;
    t.textContent = mmss(this.remaining());
    const lab = $("#ringLabel"); if (lab) lab.textContent = this.paused ? "paused" : "remaining";
    const c = 2 * Math.PI * 96;
    const rc = $("#ringCircle");
    if (rc) rc.setAttribute("stroke-dashoffset", (c * (1 - this.progress())).toFixed(1));
    const pc = $("#ringPct"); if (pc) pc.textContent = Math.round(this.progress() * 100) + "%";
  }
};

defRoute("focus", {
  title: "Focus",
  render() {
    const s = Store.data;
    const today = todayKey();
    const todaySec = Store.secondsForDay(today);
    const goal = s.settings.prefs.dailyFocusGoal || 120;
    const goalSec = goal * 60;
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      last7.push({ key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: "narrow" }), mins: Math.round(Store.secondsForDay(dayKey(d)) / 60) });
    }
    const sessions = s.focus.sessions.slice(0, 8);
    const avg = s.focus.sessions.length ? Math.round((s.focus.totalSeconds / s.focus.sessions.length) / 60) : 0;
    const presets = [15, 25, 45, 60];

    const timerLabel = Focus.running ? mmss(Focus.remaining()) : mmss(Focus.targetSeconds());

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="home" aria-label="Back">' + icon("back", 19) + "</button>",
        "<div><div class=\"eyebrow\">Productivity</div><h2>Focus</h2>" +
        '<p class="sub">A plain timer that counts real seconds. Leave the page, pause, come back — only the time that genuinely passed is ever credited.</p></div>',
      "</div>",

      '<div class="grid" style="margin-bottom:16px">',
        '<div class="card span-2" style="display:flex;flex-direction:column;align-items:center;gap:18px;padding:22px 16px">',
          '<div class="ring">',
            '<svg viewBox="0 0 220 220" aria-hidden="true">',
              '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent-2)"/></linearGradient></defs>',
              '<circle cx="110" cy="110" r="96" fill="none" stroke="rgba(126,180,255,.12)" stroke-width="12"/>',
              '<circle id="ringCircle" class="rc" cx="110" cy="110" r="96" fill="none" stroke="url(#ringGrad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="603.2" stroke-dashoffset="' + (603.2 * (1 - Focus.progress())).toFixed(1) + '"/>',
            "</svg>",
            '<div class="ring-in">',
              '<div class="ring-time" id="ringTime">' + timerLabel + "</div>",
              '<div class="ring-lab" id="ringLabel">' + (Focus.running ? (Focus.paused ? "paused" : "remaining") : "ready") + "</div>",
              '<div class="ring-sub" id="ringPct">' + Math.round(Focus.progress() * 100) + "% of " + Focus.cfg().minutes + " min</div>",
            "</div>",
          "</div>",

          '<div class="wrap" style="justify-content:center">',
            (!Focus.running
              ? '<button class="btn btn-primary" data-focus="start">' + icon("play", 15) + " Start focus</button>"
              : (Focus.paused
                  ? '<button class="btn btn-primary" data-focus="resume">' + icon("play", 15) + " Resume</button>"
                  : '<button class="btn" data-focus="pause">' + icon("pause", 15) + " Pause</button>") +
                '<button class="btn btn-ok" data-focus="stop">' + icon("stop", 15) + " Finish &amp; save</button>" +
                '<button class="btn btn-ghost" data-focus="discard">Discard</button>'),
          "</div>",

          (!Focus.running
            ? '<div style="width:100%;max-width:460px)">' +
              '<div class="hint" style="text-align:center;margin-bottom:9px">Session length</div>' +
              '<div class="seg" style="justify-content:center;display:flex;flex-wrap:wrap">' +
                presets.map(p => '<button data-min="' + p + '" class="' + (Focus.cfg().minutes === p ? "on" : "") + '">' + p + " min</button>").join("") +
                '<button data-min="custom" class="' + (presets.indexOf(Focus.cfg().minutes) === -1 ? "on" : "") + '">Custom</button>' +
              "</div></div>"
            : '<div class="hint" style="text-align:center">A session in progress uses ' + Focus.cfg().minutes + " minutes. Finish or discard it to change the length.</div>"),
        "</div>",

        '<div class="stack">',
          '<div class="card">',
            cardHead("target", "Today", '<span class="sub">goal ' + goal + " min</span>"),
            '<div class="row" style="background:transparent;border:0;padding:0;gap:14px">',
              UI.miniRing(goalSec ? todaySec / goalSec : 0, Math.round(todaySec / 60) + "m"),
              '<div class="grow"><div class="dev-name">' + fmtDur(todaySec / 60) + " focused</div>" +
              '<div class="dev-sub">' + (todaySec >= goalSec ? "Daily goal reached — well done." : fmtDur((goalSec - todaySec) / 60) + " left to hit your goal") + "</div></div>",
            "</div>",
            '<div class="hr"></div>',
            '<div class="bar-row"><span class="sub nowrap">Progress</span><span class="bar-track"><span class="bar-fill" style="width:' + pct(todaySec, goalSec) + '%"></span></span><span class="mono">' + pct(todaySec, goalSec) + "%</span></div>",
            '<div style="margin-top:12px"><button class="link-btn" data-edit-goal="1">Change daily goal (' + goal + " min)</button></div>",
          "</div>",
          '<div class="card">',
            cardHead("flame", "All-time", '<span class="chip">' + Store.streak() + "-day streak</span>"),
            UI.kv("Total focus time", esc(fmtDur(s.focus.totalSeconds / 60)), false) +
            UI.kv("Sessions recorded", nfmt(s.focus.sessions.length), false) +
            UI.kv("Average session", avg ? avg + " min" : "—", false) +
            UI.kv("Longest session", s.focus.sessions.length ? fmtDur(Math.max(...s.focus.sessions.map(x => x.seconds)) / 60) : "—", false),
          "</div>",
          '<div class="card">',
            cardHead("chart", "Last 7 days"),
            UI.bars(last7.map(d => d.label), last7.map(d => d.mins), { highlight: 6 }),
            '<div class="bar-labels"><span>6 days ago</span><span>today</span></div>',
          "</div>",
        "</div>",
      "</div>",

      '<div class="card" style="margin-bottom:16px">',
        cardHead("clock", "Session history", '<span class="sub">' + s.focus.sessions.length + " total</span>"),
        sessions.length
          ? '<div class="list">' + sessions.map(x =>
              '<div class="row"><span class="avatar sm" style="' + (x.completed ? "" : "color:var(--warn);border-color:rgba(251,191,36,.3)") + '">' + icon(x.completed ? "check" : "stop", 17) + "</span>" +
              '<div class="grow"><div class="name">' + fmtDur(x.seconds / 60) + (x.completed ? " · completed" : " · ended early") + '</div>' +
              '<div class="meta">' + esc(fmtDateTime(x.endedAt)) + " · " + esc(relTime(x.endedAt)) + " · target " + (x.target ? fmtDur(x.target / 60) : "—") + "</div></div>" +
              '<div class="wrap" style="justify-content:flex-end">' + (x.completed ? UI.pill("Goal met", "ok", true) : UI.pill("Partial", "warn", true)) + "</div></div>").join("") + "</div>"
          : '<div class="sub">No sessions yet. Every session you finish appears here with its real start and end time.</div>',
      "</div>",

      '<div>' + UI.notice("This timer measures wall-clock time in your browser. Nothing is tracked in the background after you close the page, and a session that is interrupted is saved with the exact seconds that actually elapsed — never rounded up to look better.", "", "clock") + "</div>"
    ].join("");
  },

  afterRender(root) {
    bindDeviceInteractions(root);
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(b.dataset.back || "home")));
    $$("[data-focus]", root).forEach(b => b.addEventListener("click", () => {
      const a = b.dataset.focus;
      if (a === "start") Focus.start();
      else if (a === "pause") Focus.pause();
      else if (a === "resume") Focus.resume();
      else if (a === "stop") Focus.finish(true);
      else if (a === "discard") {
        UI.confirm({ title: "Discard this session?", message: "The time you have spent will not be recorded at all.", confirmText: "Discard" })
          .then(ok => { if (!ok) return; Focus.stopSilently(); UI.toast("Session discarded", "Nothing was credited.", "warn"); UI.refresh(); });
      }
    }));
    $$("[data-min]", root).forEach(b => b.addEventListener("click", async () => {
      const v = b.dataset.min;
      if (v === "custom") {
        const inp = await UI.prompt({ title: "Custom session length", message: "Enter a length in minutes (1–240).", value: String(Focus.cfg().minutes), placeholder: "e.g. 35" });
        if (inp == null) return;
        const n = clamp(Math.round(Number(inp) || 0), 1, 240);
        Store.data.focus.config.minutes = n;
        Store.persist();
        Store.log("settings_change", "Focus session length set to " + n + " minutes.", null);
        UI.refresh();
      } else {
        Store.data.focus.config.minutes = Number(v);
        Store.persist();
        Store.log("settings_change", "Focus session length set to " + v + " minutes.", null);
        UI.refresh();
      }
    }));
    $$("[data-edit-goal]", root).forEach(b => b.addEventListener("click", async () => {
      const inp = await UI.prompt({ title: "Daily focus goal", message: "How many minutes of focus do you want to average per day?", value: String(Store.data.settings.prefs.dailyFocusGoal || 120), placeholder: "minutes" });
      if (inp == null) return;
      const n = clamp(Math.round(Number(inp) || 0), 5, 720);
      Store.data.settings.prefs.dailyFocusGoal = n;
      Store.persist();
      Store.log("settings_change", "Daily focus goal set to " + n + " minutes.", null);
      UI.toast("Goal updated", "Daily focus goal is now " + n + " minutes.", "ok");
      UI.refresh();
    }));
    UI.every(() => Focus.paintLive(), 1000);
  }
});

/* ============================================================
   TASKS
   ============================================================ */
const PRIORITIES = [
  { id: "high", label: "High", cls: "p1", weight: 3 },
  { id: "medium", label: "Medium", cls: "p2", weight: 2 },
  { id: "low", label: "Low", cls: "p3", weight: 1 }
];
const prioOf = id => PRIORITIES.find(p => p.id === id) || PRIORITIES[1];

function taskRow(t) {
  const p = prioOf(t.priority);
  const dueDays = t.due ? daysUntil(t.due) : null;
  const overdue = dueDays != null && dueDays < 0 && !t.done;
  const device = t.deviceId ? Store.getDevice(t.deviceId) : null;
  const vehicle = t.vehicleId ? Store.getVehicle(t.vehicleId) : null;
  return '<div class="row" data-task-row="' + esc(t.id) + '">' +
    '<button class="avatar sm" data-toggle-task="' + esc(t.id) + '" aria-label="' + (t.done ? "Mark as pending" : "Mark as complete") + '" style="' + (t.done ? "background:rgba(52,211,153,.16);border-color:rgba(52,211,153,.5);color:var(--ok)" : "") + '">' + icon(t.done ? "check" : "target", 17) + "</button>" +
    '<div class="grow" data-edit-task="' + esc(t.id) + '" style="cursor:pointer;min-width:0">' +
      '<div class="name" style="' + (t.done ? "text-decoration:line-through;color:var(--muted)" : "") + '">' + esc(t.title) + "</div>" +
      '<div class="meta">' + [
        t.due ? (overdue ? "overdue by " + Math.abs(dueDays) + " days" : dueDays === 0 ? "due today" : "due " + fmtDate(t.due)) : "no due date",
        device ? device.name : null,
        vehicle ? vehicle.nickname : null,
        t.notes ? "has notes" : null
      ].filter(Boolean).map(esc).join(" · ") + "</div>" +
    "</div>" +
    '<div class="wrap" style="justify-content:flex-end">' +
      (overdue ? UI.pill("Overdue", "bad", true) : (t.done ? UI.pill("Completed", "ok", true) : "")) +
      '<span class="tag ' + p.cls + '">' + esc(p.label) + "</span>" +
      '<button class="icon-btn" style="width:32px;height:32px" data-del-task="' + esc(t.id) + '" aria-label="Delete task">' + icon("trash", 15) + "</button>" +
    "</div></div>";
}

defRoute("tasks", {
  title: "Tasks",
  render(params) {
    const s = Store.data;
    const p = params || {};
    const filter = p.filter || "pending";
    const q = (p.q || "").toLowerCase();
    const sort = p.sort || "smart";

    let list = s.tasks.slice();
    if (filter === "pending") list = list.filter(t => !t.done);
    else if (filter === "completed") list = list.filter(t => t.done);
    else if (filter === "today") list = list.filter(t => t.due === todayKey() || (!t.done && !t.due));
    else if (filter === "overdue") list = list.filter(t => !t.done && t.due && daysUntil(t.due) < 0);
    if (q) list = list.filter(t => (t.title + " " + t.notes).toLowerCase().includes(q));

    const order = { smart: 0, priority: 1, due: 2, created: 3 };
    list.sort((a, b) => {
      if (order[sort] === 1) return prioOf(b.priority).weight - prioOf(a.priority).weight;
      if (order[sort] === 2) return String(a.due || "9999").localeCompare(String(b.due || "9999"));
      if (order[sort] === 3) return new Date(b.createdAt) - new Date(a.createdAt);
      if (a.done !== b.done) return a.done ? 1 : -1;
      return prioOf(b.priority).weight - prioOf(a.priority).weight || String(a.due || "9999").localeCompare(String(b.due || "9999"));
    });

    const todayTasks = s.tasks.filter(t => t.due === todayKey());
    const doneToday = s.tasks.filter(t => t.done && t.completedAt && dayKey(t.completedAt) === todayKey()).length;
    const pending = s.tasks.filter(t => !t.done).length;
    const overdueCount = s.tasks.filter(t => !t.done && t.due && daysUntil(t.due) < 0).length;

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="home" aria-label="Back">' + icon("back", 19) + "</button>",
        "<div><div class=\"eyebrow\">Planner</div><h2>Tasks</h2>" +
        '<p class="sub">Tasks live on this device only. Nothing syncs, nothing is uploaded.</p></div>',
        '<div class="spacer"></div>',
        '<button class="btn btn-primary" data-new-task="1">' + icon("plus", 15) + " Add task</button>",
      "</div>",

      '<div class="grid grid-4" style="margin-bottom:16px">',
        tile("Today's tasks", nfmt(todayTasks.length), todayTasks.length ? "dated today" : "nothing dated today", "accent"),
        tile("Completed", nfmt(doneToday), "finished today"),
        tile("Remaining", nfmt(pending), "still open"),
        tile("Overdue", nfmt(overdueCount), overdueCount ? "needs attention" : "all on track"),
      "</div>",

      '<div class="card flat" style="margin-bottom:16px">',
        '<div class="form-grid">',
          '<div class="field"><label>Quick add</label><input class="input" id="taskQuick" placeholder="Type a task and press Enter"></div>',
          '<div class="field"><label>Priority for quick add</label><div class="seg" id="quickPrio" style="display:flex">' +
            PRIORITIES.slice().reverse().map((x, i) => '<button data-qp="' + x.id + '" class="' + (x.id === "medium" ? "on" : "") + '">' + esc(x.label) + "</button>").join("") + "</div></div>",
        "</div>",
      "</div>",

      '<div class="row-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">',
        '<div class="seg">' +
          [["pending", "Pending"], ["today", "Today"], ["overdue", "Overdue"], ["completed", "Completed"], ["all", "All"]]
            .map(o => '<button data-filter="' + o[0] + '" class="' + (filter === o[0] ? "on" : "") + '">' + o[1] + "</button>").join("") +
        "</div>" +
        '<div class="wrap"><input class="input" id="taskSearch" placeholder="Search tasks…" value="' + esc(p.q || "") + '" style="width:180px">' +
        '<select class="select" id="taskSort" style="width:auto"><option value="smart"' + (sort === "smart" ? " selected" : "") + ">Sort: smart</option>" +
        '<option value="priority"' + (sort === "priority" ? " selected" : "") + ">Sort: priority</option>" +
        '<option value="due"' + (sort === "due" ? " selected" : "") + ">Sort: due date</option>" +
        '<option value="created"' + (sort === "created" ? " selected" : "") + ">Sort: newest</option></select></div>",
      "</div>",

      list.length
        ? '<div class="card"><div class="list">' + list.map(taskRow).join("") + "</div></div>"
        : UI.emptyState(
            filter === "completed" ? "Nothing completed yet" : "No tasks here",
            filter === "completed" ? "Tasks you complete get stamped with the exact time and listed here." : "Add a task above, or use the Add task button to include a due date, priority and a linked device.",
            "Add a task", 'data-new-task="1"', "tasks"),
    ].join("");
  },
  afterRender(root) {
    bindDeviceInteractions(root);
    const params = Router.params || {};
    const go = patch => Router.go("tasks", Object.assign({}, params, patch));
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go("home")));
    $$("[data-filter]", root).forEach(b => b.addEventListener("click", () => go({ filter: b.dataset.filter })));
    const sortSel = $("#taskSort", root); if (sortSel) sortSel.addEventListener("change", () => go({ sort: sortSel.value }));
    const search = $("#taskSearch", root);
    if (search) { let t; search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => go({ q: search.value }), 300); }); }
    let quickPrio = "medium";
    $$("[data-qp]", root).forEach(b => b.addEventListener("click", () => {
      quickPrio = b.dataset.qp;
      $$("[data-qp]", root).forEach(x => x.classList.toggle("on", x === b));
    }));
    const quick = $("#taskQuick", root);
    if (quick) quick.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      const v = quick.value.trim();
      if (!v) return;
      Store.addTask({ title: v, priority: quickPrio, due: params.filter === "today" ? todayKey() : "" });
      UI.toast("Task added", "“" + v + "” is on your list.", "ok");
      UI.refresh();
    });
    $$("[data-new-task]", root).forEach(b => b.addEventListener("click", () => openTaskForm(null)));
    $$("[data-toggle-task]", root).forEach(b => b.addEventListener("click", () => {
      const t = Store.getTask(b.dataset.toggleTask); if (!t) return;
      Store.updateTask(t.id, { done: !t.done });
      if (!t.done) UI.toast("Task completed", "“" + t.title + "” is done.", "ok");
      UI.refresh();
    }));
    $$("[data-edit-task]", root).forEach(b => b.addEventListener("click", () => openTaskForm(b.dataset.editTask)));
    $$("[data-del-task]", root).forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      const t = Store.getTask(b.dataset.delTask); if (!t) return;
      UI.confirm({ title: "Delete this task?", message: "“" + t.title + "” will be removed permanently.", confirmText: "Delete task" })
        .then(ok => { if (!ok) return; Store.deleteTask(t.id); UI.toast("Task deleted", "", "ok"); UI.refresh(); });
    }));
  }
});

function openTaskForm(id) {
  const existing = id ? Store.getTask(id) : null;
  const draft = existing
    ? JSON.parse(JSON.stringify(existing))
    : { title: "", notes: "", priority: "medium", due: "", deviceId: null };
  UI.modal({
    body: [
      '<div class="sheet-head"><div><h3>' + (existing ? "Edit task" : "Add a task") + '</h3><div class="sub">Stored locally with a real created / completed timestamp.</div></div></div>',
      '<div class="form">',
        '<div class="field"><label>Task title *</label><input class="input" id="tTitle" value="' + esc(draft.title) + '" placeholder="e.g. Update laptop firmware"></div>',
        '<div class="field"><label>Priority</label><div class="seg" id="tPrio" style="display:flex">' +
          PRIORITIES.slice().reverse().map(x => '<button data-tp="' + x.id + '" class="' + (draft.priority === x.id ? "on" : "") + '">' + esc(x.label) + "</button>").join("") + "</div></div>",
        '<div class="form-grid">',
          '<div class="field"><label>Due date</label><input class="input" id="tDue" type="date" value="' + esc(draft.due) + '"></div>',
          '<div class="field"><label>Link to a saved device (optional)</label><select class="select" id="tDev"><option value="">— none —</option>' +
            Store.data.devices.map(d => '<option value="' + esc(d.id) + '"' + (draft.deviceId === d.id ? " selected" : "") + ">" + esc(d.name) + "</option>").join("") + "</select></div>",
          '<div class="field"><label>Link to a vehicle (optional)</label><select class="select" id="tVeh"><option value="">— none —</option>' +
            Store.data.vehicles.map(d => '<option value="' + esc(d.id) + '"' + (draft.vehicleId === d.id ? " selected" : "") + ">" + vehType(d.type).emoji + " " + esc(d.nickname) + "</option>").join("") + "</select></div>",
        "</div>",
        '<div class="field"><label>Notes</label><textarea class="textarea" id="tNotes" placeholder="optional details">' + esc(draft.notes) + "</textarea></div>",
        '<div class="row" style="gap:12px"><button class="btn btn-block" data-quick-due="today">' + icon("calendar", 14) + ' Due today</button><button class="btn btn-block" data-quick-due="tomorrow">' + icon("calendar", 14) + " Due tomorrow</button></div>",
      "</div>",
      '<div class="sheet-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-save-task="1">' + icon("check", 15) + " " + (existing ? "Save task" : "Add task") + "</button></div>"
    ].join(""),
    onMount(sheet, close) {
      $$("[data-tp]", sheet).forEach(b => b.addEventListener("click", () => {
        draft.priority = b.dataset.tp;
        $$("[data-tp]", sheet).forEach(x => x.classList.toggle("on", x === b));
      }));
      $$("[data-quick-due]", sheet).forEach(b => b.addEventListener("click", () => {
        const d = new Date();
        if (b.dataset.quickDue === "tomorrow") d.setDate(d.getDate() + 1);
        $("#tDue", sheet).value = dayKey(d);
      }));
      $$("[data-save-task]", sheet).forEach(b => b.addEventListener("click", () => {
        const title = $("#tTitle", sheet).value.trim();
        if (!title) { UI.toast("Title required", "Give the task a short name.", "warn"); return; }
        const patch = {
          title, notes: $("#tNotes", sheet).value, priority: draft.priority,
          due: $("#tDue", sheet).value,
          deviceId: $("#tDev", sheet).value || null,
          vehicleId: $("#tVeh", sheet).value || null
        };
        if (existing) {
          Store.updateTask(existing.id, patch);
          UI.toast("Task updated", "“" + title + "” saved.", "ok");
        } else {
          Store.addTask(patch);
          UI.toast("Task added", "“" + title + "” is on your list.", "ok");
        }
        close();
        if (Router.current === "tasks" || Router.current === "home") UI.refresh();
        else Router.go("tasks");
      }));
    }
  });
}

