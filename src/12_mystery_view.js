/* ============================================================
   MYSTERY VIEW
   ============================================================ */
const Mystery = {
  answered(caseId, key) {
    const p = mysteryProgress(caseId);
    return p.answers[key];
  },
  answer(caseId, key, optIdx, correctIdx, xpPerItem) {
    const c = MYSTERY_CASES.find(x => x.id === caseId);
    const p = Store.data.mystery.progress[caseId] || (Store.data.mystery.progress[caseId] = { answers: {}, solved: false, xp: 0, revealed: false, startedAt: nowIso() });
    if (p.answers[key] != null) return false;
    p.answers[key] = optIdx;
    const first = p.answers[key] === optIdx;
    if (optIdx === correctIdx) {
      p.xp = (p.xp || 0) + xpPerItem;
      Store.data.mystery.xp = (Store.data.mystery.xp || 0) + xpPerItem;
      Store.log("mystery_answer", "Correct answer in “" + c.title + "” (+" + xpPerItem + " XP).", { type: "case", id: c.id, name: c.title });
      UI.toast("Correct", "+" + xpPerItem + " XP added to your investigation total.", "ok");
    } else {
      Store.log("mystery_answer", "Answer submitted in “" + c.title + "” — it was not correct, so no XP was awarded.", { type: "case", id: c.id, name: c.title });
      UI.toast("Not this time", "No XP for that one, but the explanation is shown below.", "warn");
    }
    Store.persist();
    return true;
  },
  reveal(caseId) {
    const c = MYSTERY_CASES.find(x => x.id === caseId);
    const p = Store.data.mystery.progress[caseId] || (Store.data.mystery.progress[caseId] = { answers: {}, solved: false, xp: 0, revealed: false, startedAt: nowIso() });
    p.revealed = true;
    Store.persist();
    UI.toast("Solution revealed", "Read it carefully — the case stays in your file.", "");
    UI.refresh();
  },
  close(caseId) {
    const c = MYSTERY_CASES.find(x => x.id === caseId);
    const p = Store.data.mystery.progress[caseId];
    if (!p || p.solved) return;
    const total = c.questions.length + 1;
    const correctCount = c.questions.filter((q, i) => p.answers["q" + i] === q.answer).length + (p.answers.puzzle === c.puzzle.answer ? 1 : 0);
    p.solved = true;
    p.solvedAt = nowIso();
    p.score = Math.round((correctCount / total) * 100);
    const bonus = correctCount === total ? Math.round(c.xp * 0.25) : 0;
    if (bonus) { Store.data.mystery.xp += bonus; p.xp = (p.xp || 0) + bonus; }
    Store.log("mystery_solve", "Closed case " + c.num + " “" + c.title + "” with " + correctCount + "/" + total + " correct" + (bonus ? " (+" + bonus + " XP clean-sweep bonus)" : "") + ".", { type: "case", id: c.id, name: c.title });
    UI.toast("Case closed", "“" + c.title + "” is filed away" + (bonus ? " with a clean-sweep bonus of " + bonus + " XP." : "."), "ok");
    Store.persist();
    UI.refresh();
  },
  resetCase(caseId) {
    const c = MYSTERY_CASES.find(x => x.id === caseId);
    const p = Store.data.mystery.progress[caseId];
    if (!p) return;
    Store.data.mystery.xp = Math.max(0, (Store.data.mystery.xp || 0) - (p.xp || 0));
    delete Store.data.mystery.progress[caseId];
    Store.log("mystery_reset", "Reset all progress on “" + c.title + "” and removed the XP it had earned.", { type: "case", id: c.id, name: c.title });
    UI.toast("Case reset", "Answers and XP for this case were cleared.", "warn");
    Store.persist();
    Router.go("mystery");
  }
};

defRoute("mystery", {
  title: "Mystery",
  render(params) {
    const s = Store.data.mystery;
    const rank = mysteryRank(s.xp);
    const solvedCount = MYSTERY_CASES.filter(c => (s.progress[c.id] || {}).solved).length;
    const totalAnswers = MYSTERY_CASES.reduce((a, c) => a + Object.keys((s.progress[c.id] || {}).answers || {}).length, 0);
    const possible = MYSTERY_CASES.reduce((a, c) => a + c.questions.length + 1, 0);

    if (params && params.id) return caseDetail(params.id);

    return [
      '<div class="page-head">',
        '<button class="icon-btn" data-back="home" aria-label="Back">' + icon("back", 19) + "</button>",
        "<div><div class=\"eyebrow\">Fiction · separate from your data</div><h2>Mystery Files</h2>" +
        '<p class="sub">Five original cases with evidence, clues, logic puzzles and full solutions. Nothing here touches your devices, network or car data.</p></div>',
      "</div>",

      '<div class="card" style="margin-bottom:16px">',
        '<div class="row-between" style="flex-wrap:wrap;gap:14px">',
          '<div><div class="eyebrow">Investigator rank</div><div style="font-size:clamp(18px,4vw,23px);font-weight:700">' + esc(rank.current.label) + "</div>" +
          '<div class="sub" style="margin-top:5px">' + nfmt(s.xp) + " XP earned · " + solvedCount + " of " + MYSTERY_CASES.length + " cases closed · " + totalAnswers + "/" + possible + " questions answered</div></div>",
          '<div class="wrap">' + UI.pill(solvedCount + " solved", solvedCount ? "ok" : "", false) + UI.pill(nfmt(s.xp) + " XP", "accent", false) + "</div>",
        "</div>",
        '<div class="hr"></div>',
        (rank.next ? '<div class="bar-row"><span class="sub nowrap">To ' + esc(rank.next.label) + '</span><span class="bar-track"><span class="bar-fill" style="width:' + rank.progress + '%"></span></span><span class="mono">' + rank.progress + "%</span></div>"
                  : '<div class="sub">Highest rank reached. Try a clean sweep on every case for maximum XP.</div>'),
      "</div>",

      '<div class="grid">' + MYSTERY_CASES.map(c => {
        const p = mysteryProgress(c.id);
        const answeredCount = Object.keys(p.answers || {}).length;
        const total = c.questions.length + 1;
        return '<div class="card tap case-card' + (p.solved ? " solved" : "") + '" data-case="' + c.id + '">' +
          '<div class="row-between"><span class="case-num">Case ' + esc(c.num) + "</span>" +
            (p.solved ? UI.pill("Closed · " + (p.score != null ? p.score + "%" : ""), "ok", true) : answeredCount ? UI.pill("In progress", "warn", true) : UI.pill("Unsolved", "", false)) +
          "</div>" +
          '<h3 style="font-size:17px;margin-top:9px">' + esc(c.title) + "</h3>" +
          '<div class="sub" style="margin-top:7px;min-height:52px">' + esc(c.blurb) + "</div>" +
          '<div class="hr" style="margin:11px 0"></div>' +
          '<div class="wrap"><span class="chip">' + esc(c.difficulty) + '</span><span class="chip">' + esc(c.tag) + '</span><span class="chip">' + c.xp + " XP</span><span class=\"chip\">~" + c.minutes + " min</span></div>" +
          '<div style="margin-top:12px" class="bar-row"><span class="bar-track"><span class="bar-fill ' + (p.solved ? "g" : "") + '" style="width:' + pct(answeredCount, total) + '%"></span></span><span class="mono">' + answeredCount + "/" + total + "</span></div>" +
          "</div>";
      }).join("") + "</div>",

      '<div class="card" style="margin-top:16px">',
        cardHead("sparkle", "How scoring works", '<span class="chip">' + nfmt(s.xp) + " XP</span>"),
        '<div class="list">' + [
          ["Answering a question correctly", "XP awarded once per question, on your first attempt only"],
          ["Answering incorrectly", "no XP, but the reasoning is explained so you still learn the trick"],
          ["Answering every question in a case", "the solution unlocks and you can close the case"],
          ["Clean sweep (every answer right)", "an extra 25% bonus on that case's XP"],
          ["Resetting a case", "removes exactly the XP that case earned — your other progress is untouched"]
        ].map(r => '<div class="row" style="padding:9px 11px"><span class="grow" style="font-size:13px">' + r[0] + '</span><span class="chip">' + r[1] + "</span></div>").join("") + "</div>",
      "</div>",

      '<div style="margin-top:16px">' + UI.notice("<b>Separate by design.</b> Mystery XP lives in its own part of the store. It never mixes with device, network, car or task data, and no case depends on your real hardware.", "", "mystery") + "</div>"
    ].join("");
  },
  afterRender(root, params) {
    bindDeviceInteractions(root);
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(b.dataset.back || "home")));
    $$("[data-case]", root).forEach(b => b.addEventListener("click", () => Router.go("mystery", { id: b.dataset.case })));
    if (params && params.id) bindCaseInteractions(root, params.id);
  }
});

function caseDetail(id) {
  const c = MYSTERY_CASES.find(x => x.id === id);
  if (!c) return UI.emptyState("Case not found", "That file is not in this drawer.", "All cases", 'data-go="mystery"', "mystery");
  const p = mysteryProgress(id);
  const perItem = Math.round(c.xp / (c.questions.length + 1));
  const answeredCount = Object.keys(p.answers || {}).length;
  const total = c.questions.length + 1;
  const allAnswered = answeredCount >= total;

  const qHtml = c.questions.map((q, i) => {
    const key = "q" + i;
    const mine = p.answers[key];
    const answered = mine != null;
    return '<div class="card" style="margin-bottom:12px">' +
      '<div class="row-between" style="margin-bottom:11px"><span class="case-num">Question ' + (i + 1) + " of " + (c.questions.length + 1) + '</span>' +
        (answered ? (mine === q.answer ? UI.pill("Correct +" + perItem + " XP", "ok", true) : UI.pill("Answered", "bad", true)) : UI.pill("Open", "", false)) + "</div>" +
      '<div style="font-size:14.5px;font-weight:600;line-height:1.5">' + esc(q.q) + "</div>" +
      '<div class="stack" style="margin-top:12px">' + q.options.map((o, oi) => {
        let cls = "q-opt";
        if (answered) { if (oi === q.answer) cls += " right"; else if (oi === mine) cls += " wrong"; }
        return '<button class="' + cls + '" data-ans="' + key + '" data-opt="' + oi + '" data-answer="' + q.answer + '"' + (answered ? " disabled" : "") + ">" +
          '<span class="ol">' + String.fromCharCode(65 + oi) + "</span><span>" + esc(o) + "</span></button>";
      }).join("") + "</div>" +
      (answered ? '<div class="notice ' + (mine === q.answer ? "ok" : "warn") + '" style="margin-top:12px"><span class="ni">' + icon(mine === q.answer ? "check" : "warn", 17) + "</span><div><b>" + (mine === q.answer ? "Correct." : "The right answer was " + String.fromCharCode(65 + q.answer) + ".") + "</b> " + esc(q.explain) + "</div></div>" : "") +
      "</div>";
  }).join("");

  const pz = c.puzzle;
  const minePz = p.answers.puzzle;
  const pzAnswered = minePz != null;
  const pzHtml = '<div class="card" style="margin-bottom:12px">' +
    '<div class="row-between" style="margin-bottom:11px"><span class="case-num">Logic puzzle · final question</span>' +
      (pzAnswered ? (minePz === pz.answer ? UI.pill("Correct +" + perItem + " XP", "ok", true) : UI.pill("Answered", "bad", true)) : UI.pill("Open", "", false)) + "</div>" +
    '<div style="font-size:14.5px;font-weight:600">' + esc(pz.prompt) + "</div>" +
    '<div class="sub" style="margin-top:8px">' + esc(pz.detail) + "</div>" +
    '<div class="stack" style="margin-top:12px">' + pz.options.map((o, oi) => {
      let cls = "q-opt";
      if (pzAnswered) { if (oi === pz.answer) cls += " right"; else if (oi === minePz) cls += " wrong"; }
      return '<button class="' + cls + '" data-ans="puzzle" data-opt="' + oi + '" data-answer="' + pz.answer + '"' + (pzAnswered ? " disabled" : "") + ">" +
        '<span class="ol">' + (oi + 1) + "</span><span>" + esc(o) + "</span></button>";
    }).join("") + "</div>" +
    (pzAnswered ? '<div class="notice ' + (minePz === pz.answer ? "ok" : "warn") + '" style="margin-top:12px"><span class="ni">' + icon(minePz === pz.answer ? "check" : "warn", 17) + "</span><div>" + esc(pz.explain) + "</div></div>" : "") +
    "</div>";

  return [
    '<div class="page-head">',
      '<button class="icon-btn" data-back="mystery" aria-label="Back to cases">' + icon("back", 19) + "</button>",
      '<div><div class="case-num">Case ' + esc(c.num) + " · " + esc(c.difficulty) + "</div><h2>" + esc(c.title) + "</h2>" +
      '<p class="sub">' + esc(c.blurb) + "</p></div>",
    "</div>",

    '<div class="grid grid-4" style="margin-bottom:16px">',
      tile("Reward", c.xp + " XP", perItem + " XP per correct answer", "accent"),
      tile("Answered", answeredCount + "/" + total, allAnswered ? "solution unlocked" : "keep going"),
      tile("Earned here", (p.xp || 0) + " XP", p.solved ? "case closed" : "not closed yet"),
      tile("Status", p.solved ? "Closed" : answeredCount ? "In progress" : "Unsolved", p.solved && p.score != null ? "score " + p.score + "%" : "unscored"),
    "</div>",

    '<div class="two-col" style="margin-bottom:16px">',
      '<div class="card"><div class="card-head"><span class="card-ico">' + icon("mystery", 18) + '</span><span class="t">The story</span></div>' +
        '<div style="font-size:14.3px;line-height:1.65;color:var(--text-2)">' + esc(c.story) + "</div>" +
        '<div class="hr"></div><div class="sub"><b>Scene:</b> ' + esc(c.setting) + "</div>" +
      "</div>",
      '<div class="card"><div class="card-head"><span class="card-ico">' + icon("layers", 18) + '</span><span class="t">Evidence (' + c.evidence.length + ")</span></div>" +
        '<div class="list">' + c.evidence.map(e => '<div class="evidence"><div class="en">' + esc(e.label) + '</div><div class="ed">' + esc(e.detail) + "</div></div>").join("") + "</div>" +
      "</div>",
    "</div>",

    '<div class="card" style="margin-bottom:16px">',
      cardHead("key", "Clues", '<span class="sub">Think first, then check</span>'),
      '<div class="list">' + c.clues.map((cl, i) => {
        const revealed = (p.clues || {})[i];
        return '<div class="row"><span class="avatar xs">' + (revealed ? "💡" : "❔") + '</span><div class="grow" style="min-width:0">' +
          '<div class="sub" style="' + (revealed ? "color:var(--text-2)" : "") + '"' + (revealed ? "" : ' data-blur="1"') + ">" + (revealed ? esc(cl) : "Clue " + (i + 1) + " hidden — reveal it when you are stuck.") + "</div></div>" +
          (revealed ? "" : '<button class="btn btn-sm" data-clue="' + i + '">Reveal</button>') + "</div>";
      }).join("") + "</div>",
      '<div class="hint" style="margin-top:9px">Revealing a clue is free — clues are there to teach you the pattern, not to test you.</div>',
    "</div>",

    '<div class="section-title">Questions</div>',
    qHtml,
    pzHtml,

    '<div class="card" style="margin-top:16px">',
      cardHead("trophy", "The solution", (allAnswered ? '<span class="sub">every question answered</span>' : '<span class="sub">answer all ' + total + " to unlock</span>")),
      (p.revealed || allAnswered
        ? '<div style="font-size:14.3px;line-height:1.7;color:var(--text-2)">' + esc(c.solution) + "</div>" +
          '<div class="hr"></div><div class="notice ok"><span class="ni">' + icon("sparkle", 17) + "</span><div><b>What this case teaches:</b> " + esc(c.lesson) + "</div></div>"
        : '<div class="sub">Finish the questions above and the full solution appears here. You can also reveal it early — but a case closed without answering all questions earns no clean-sweep bonus.</div>' +
          '<div style="margin-top:12px"><button class="btn" data-reveal="1">' + icon("eye", 15) + " Reveal the solution anyway</button></div>"),
    "</div>",

    '<div class="card" style="margin-top:16px">',
      cardHead("check", "Case actions"),
      '<div class="btn-row">',
        '<button class="btn btn-primary" data-close-case="1"' + (p.solved || !allAnswered ? " disabled" : "") + ">" + icon("check", 15) + " " + (p.solved ? "Case closed" : "Close the case &amp; score it") + "</button>",
        '<button class="btn" data-back="mystery">' + icon("back", 15) + " All cases</button>",
        '<button class="btn btn-danger" data-reset-case="1">' + icon("refresh", 15) + " Reset this case</button>",
      "</div>",
      (!allAnswered && !p.solved ? '<div class="hint" style="margin-top:10px">Scoring unlocks once every question has an answer.</div>' : ""),
    "</div>",

    '<div style="margin-top:16px">' + UI.notice("All five cases, their characters and their evidence are original fiction written for this app. They are not real events, and none of this content mixes with your device data.", "", "mystery") + "</div>"
  ].join("");
}

defRoute("case", {
  title: "Case",
  render(params) { return caseDetail(params.id); },
  afterRender(root, params) { bindCaseInteractions(root, params.id); }
});

function bindCaseInteractions(root, id) {
    bindDeviceInteractions(root);
    $$("[data-back]", root).forEach(b => b.addEventListener("click", () => Router.go(b.dataset.back || "mystery")));
    const c = MYSTERY_CASES.find(x => x.id === id);
    const perItem = c ? Math.round(c.xp / (c.questions.length + 1)) : 0;
    $$("[data-ans]", root).forEach(b => b.addEventListener("click", () => {
      Mystery.answer(id, b.dataset.ans, Number(b.dataset.opt), Number(b.dataset.answer), perItem);
      UI.refresh();
    }));
    $$("[data-clue]", root).forEach(b => b.addEventListener("click", () => {
      const p = Store.data.mystery.progress[id] || (Store.data.mystery.progress[id] = { answers: {}, solved: false, xp: 0, revealed: false, startedAt: nowIso() });
      p.clues = p.clues || {};
      p.clues[b.dataset.clue] = true;
      Store.persist();
      UI.refresh();
    }));
    $$("[data-reveal]", root).forEach(b => b.addEventListener("click", () => {
      UI.confirm({ title: "Reveal the solution early?", message: "You can still answer the questions afterwards, but the clean-sweep bonus needs every answer correct.", confirmText: "Reveal", danger: false })
        .then(ok => { if (ok) Mystery.reveal(id); });
    }));
    $$("[data-close-case]", root).forEach(b => b.addEventListener("click", () => Mystery.close(id)));
    $$("[data-reset-case]", root).forEach(b => b.addEventListener("click", () => {
      UI.confirm({ title: "Reset this case?", message: "Your answers, revealed clues and the XP this case earned will be removed. Other cases are untouched.", confirmText: "Reset case" })
        .then(ok => { if (ok) Mystery.resetCase(id); });
    }));
}

