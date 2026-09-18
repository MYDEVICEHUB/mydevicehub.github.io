/* ============================================================
   MYSTERY FILES — 100% original fiction.
   This section shares no data and no logic with device management.
   ============================================================ */
const MYSTERY_CASES = [
  {
    id: "case-01", num: "01", title: "The Midnight Signal", difficulty: "Easy", xp: 100, minutes: 6,
    tag: "Observation",
    blurb: "A coastal radio operator logs a distress call that the schedule says could never have happened.",
    story: "The lighthouse at Cape Bellweather has one radio operator, Mira Okonkwo, who keeps a strict log. On the night of 14 March the station received a distress call at 00:20 from a fishing boat called the Kestrel. The trouble is that the Kestrel's radio licence had lapsed eight months earlier and the boat itself was scrapped. Mira, who is famously honest, insists the call was real. The harbourmaster accuses her of inventing it to justify a new radio array.",
    setting: "Cape Bellweather station, a wall of logbooks, one very tired lighthouse keeper, and a harbourmaster who wants a budget cut.",
    evidence: [
      { id: "E1", label: "Receiver strip chart", detail: "The automatic receiver logged a 47-second transmission on 2182 kHz at 00:20:11, matching Mira's logbook to the second." },
      { id: "E2", label: "Weather report", detail: "A gale warning was in force; three vessels were sheltering in the bay, all accounted for and none transmitting." },
      { id: "E3", label: "Old boat registry", detail: "The Kestrel was sold for scrap in July and its call sign reassigned to nobody. The licence lapsed in August." },
      { id: "E4", label: "Mira's shift pattern", detail: "Mira had been on duty for eleven hours straight, her longest shift of the month after a colleague's absence." },
      { id: "E5", label: "Tape recording", detail: "The call was recorded. It contains a voice reading the name 'Kestrel' twice, then ten seconds of interference, then a man humming three notes." }
    ],
    clues: [
      "The strip chart is an automatic device. It cannot be influenced by a tired operator.",
      "A scrapped boat cannot transmit — but its name and call sign can be spoken by anyone with a radio.",
      "The three-note hum was later identified as a shipping forecast interval signal used by a nearby relay station."
    ],
    questions: [
      { q: "Which single piece of evidence rules out the accusation that Mira invented the call?",
        options: ["The weather report, because a gale makes people imagine things", "The strip chart, because it recorded the transmission independently of her", "The boat registry, because it proves the Kestrel existed", "Her long shift, because tired people are honest"],
        answer: 1, explain: "The strip chart is an automatic, tamper-evident record. It confirms a real transmission at the exact minute in her log, independent of her state of mind." },
      { q: "Why does the boat registry matter so much?",
        options: ["It shows the Kestrel was seaworthy", "It proves Mira knew the boat personally", "It shows the name 'Kestrel' was no longer in legitimate use, so anyone could borrow it", "It proves the transmission was illegal"],
        answer: 2, explain: "A dead call sign is a free disguise. The registry removes the innocent explanation that a real Kestrel was transmitting." },
      { q: "The three-note hum points to which explanation?",
        options: ["A malfunction of the lighthouse equipment", "Someone rebroadcasting or relaying from another station", "A whale song misread as a voice", "A recording of an old broadcast"],
        answer: 1, explain: "The hum matches a relay station's interval signal, suggesting the 'distress call' came from equipment, not from a boat in danger." }
    ],
    puzzle: {
      prompt: "Logic grid: Match each transmission time to the station it came from.",
      detail: "Three transmissions were logged that night: 00:20, 01:05 and 01:40. Their sources were the Kestrel call sign, the Northgate relay, and a genuine fishing vessel. The genuine vessel transmitted before the relay. The relay transmitted before the Kestrel call sign. Which transmission came last?",
      options: ["The Kestrel call sign at 01:40", "The Northgate relay at 01:40", "The genuine fishing vessel at 01:40", "It cannot be determined"],
      answer: 0, explain: "Ordering the constraints: vessel → relay → Kestrel call sign, so the last of the three times, 01:40, belongs to the Kestrel call sign."
    },
    solution: "Nobody was in danger and Mira was telling the truth. A relay station testing its emergency equipment transmitted a canned distress script that included a boat name pulled from an outdated list — the Kestrel. The strip chart and tape prove a real signal arrived; the registry proves the name was a ghost. The absurdity in the log was therefore evidence of a technical fault upstream, not of a lying operator. Mira's log was accurate down to the second, which is exactly what vindicates her.",
    lesson: "A record made by a machine, kept independent of the witness, is worth more than any opinion about the witness's character."
  },
  {
    id: "case-02", num: "02", title: "The Silent Auction", difficulty: "Medium", xp: 150, minutes: 9,
    tag: "Deduction",
    blurb: "A painting is swapped during a blackout. Four guests, one minute of darkness, and a chair nobody moved.",
    story: "At the Harrowgate Society's charity auction, the lights failed for ninety seconds at 20:40. When they returned, the framed study of 'Harbour at Dusk' — the centrepiece — was a clever forgery on the same stretcher. The room had four guests and one auctioneer, all of whom swear they did not move. The genuine painting was later found in a service corridor, wrapped in a curtain.",
    setting: "A panelled hall, tall windows facing a lit street, a long table of canapés, and a fire exit that opens onto the corridor.",
    evidence: [
      { id: "E1", label: "Seating plan", detail: "Sir Ian sat nearest the painting. Dr Paul sat at the far end. Miss Wren stood by the windows. Mr Osei stood by the canapé table, beside the fire exit." },
      { id: "E2", label: "Curtain rings", detail: "One curtain was missing from the window beside Miss Wren. It was the curtain wrapped around the painting." },
      { id: "E3", label: "Street lights", detail: "The failure was only indoors: the street lamps outside stayed lit. The window seat remained the brightest spot in the room." },
      { id: "E4", label: "Fuse box", detail: "The trip switch was found manually held down with a wooden chair wedge — deliberately jammed, so the lights could not be restored early." },
      { id: "E5", label: "Timing", detail: "The wedge was a chair from the canapé table. Whoever jammed the fuse box first passed the canapé table." }
    ],
    clues: [
      "The thief needed the painting off the wall and a curtain off the window in the dark.",
      "Miss Wren could not take the curtain without being silhouetted against the lit street.",
      "The wedge came from a chair that only one guest was standing beside."
    ],
    questions: [
      { q: "Why is Miss Wren unlikely to be the thief?",
        options: ["She had no reason to be at the auction", "Taking the curtain would have silhouetted her against the lit street", "She was too far from the painting", "She could not lift a curtain"],
        answer: 1, explain: "The lights failed only indoors. Anyone at that window would be visibly silhouetted from the street, which the thief clearly avoided." },
      { q: "What does the jammed fuse box tell you about the crime?",
        options: ["It was an accident", "The blackout was planned and the thief wanted a controlled window of time", "The building had old wiring", "It was done by a member of staff"],
        answer: 1, explain: "A chair deliberately wedged into the trip switch extends and controls the darkness — the mark of a planned act, not an accident." },
      { q: "Putting the curtain and the wedge together, whose position is most incriminating?",
        options: ["Sir Ian nearest the painting", "Dr Paul at the far end", "Mr Osei, beside both the canapé table and the fire exit", "The auctioneer"],
        answer: 2, explain: "The wedge came from the canapé table where Mr Osei stood, and the fire exit beside him opens onto the corridor where the painting was found." }
    ],
    puzzle: {
      prompt: "Timeline puzzle: reconstruct the ninety seconds.",
      detail: "Four actions happened in some order during the blackout: (A) curtain removed from window, (B) painting taken off the wall, (C) chair wedged into the fuse box, (D) exit through the fire door. The chair had to be wedged before the thief could safely cross the room. The curtain could only be removed once the hall was fully dark, which the wedge provided. The thief could not carry the painting through a door before it was wrapped. What is the correct order?",
      options: ["C → A → B → D", "A → C → B → D", "B → A → C → D", "C → B → D → A"],
      answer: 0, explain: "Wedge first (C) to secure the darkness, then the curtain (A) is safe to remove, then the painting (B) is lifted and wrapped, then the exit (D)."
    },
    solution: "Mr Osei jammed the fuse box with the canapé chair, waited for total darkness, crossed the room, took the painting, wrapped it in the curtain from the window — safe now because even a silhouetted figure could not be identified in a fully dark room — and left through the fire exit at his elbow, hiding the painting in the service corridor to collect later. The 'silent' room was not silent at all; it was simply dark, and every guest truthfully reported standing still.",
    lesson: "Position and timing information can convict without a single eyewitness. Physical constraints beat testimony."
  },
  {
    id: "case-03", num: "03", title: "The Vanishing Violinist", difficulty: "Medium", xp: 150, minutes: 10,
    tag: "Airtight alibi",
    blurb: "A concert violinist disappears between two movements, yet the music never stops.",
    story: "During a live radio broadcast of a chamber concert, soloist Yara Demir vanished between the second and third movements. Her violin, however, kept playing — flawlessly — for the entire third movement. When the lights came up, the soloist's chair was empty and the instrument was on the floor, still warm. Yara was found forty minutes later in a stationery room three floors up, unharmed, with resin dust on her hands.",
    setting: "A radio studio with a glass booth, a live audience of sixty, and a strict rule that no door may open during a broadcast.",
    evidence: [
      { id: "E1", label: "Broadcast tape", detail: "The third movement is note-perfect but contains two phrase endings that are subtly different from Yara's known style — they match the conductor's own violin phrasing from a 2019 recording." },
      { id: "E2", label: "Studio door log", detail: "The electronic log shows a single door opening at 21:07, during the second movement, recorded as maintenance access." },
      { id: "E3", label: "Stationery room", detail: "Yara's hands were covered in powdered rosin — the type used on bow hair, stored in the stationery cupboard that week after a stockroom flood." },
      { id: "E4", label: "Conductor's bow", detail: "The conductor's bow had fresh rosin along its whole length, applied minutes before the concert, though he claims he never plays in this hall." },
      { id: "E5", label: "Microphone layout", detail: "The solo microphone was switched off during the third movement and the booth microphone, hidden behind the orchestra, was faded up." }
    ],
    clues: [
      "Someone had to play in Yara's place — and it was someone who could not be seen from the audience.",
      "Resin dust puts Yara in the stationery cupboard, moving rosin, not fleeing.",
      "Phrase endings are as individual as handwriting."
    ],
    questions: [
      { q: "How could the violin keep playing with an empty chair?",
        options: ["A recording was played", "The conductor played from the booth, using the hidden faded-up microphone", "Another musician moved into her chair", "The tape was spliced afterwards"],
        answer: 1, explain: "The solo microphone was muted while the booth microphone was faded up — and the phrasing heard on air belongs to the conductor." },
      { q: "What does the rosin dust on Yara's hands actually prove?",
        options: ["She was preparing to play later", "She was moving rosin out of the flooded stockroom when she was locked in", "She had been attacked", "She had cleaned the cupboard"],
        answer: 1, explain: "Rosin was stored in that room after a flood. Her hands show she was working with it there — she was trapped, not hiding." },
      { q: "What single detail makes the conductor's claim that he 'never plays in this hall' suspicious?",
        options: ["His bow was freshly rosined along its whole length just before the concert", "He knew the door code", "He was standing near the booth", "He had a copy of the tape"],
        answer: 0, explain: "Rosining an entire bow minutes before a concert he claims not to play in is preparation for performance, not coincidence." }
    ],
    puzzle: {
      prompt: "Logic: who had both opportunity and means?",
      detail: "Constraints: (1) The person playing in the third movement was inside the booth, because only the booth microphone was live. (2) Only two people had booth access: the conductor and the producer. (3) The producer was on air, reading continuity, for the whole movement — recordings of his voice prove it second by second. (4) The playing matched the conductor's phrasing. Who played?",
      options: ["The producer", "The conductor", "A pre-recorded tape", "An unseen session musician"],
      answer: 1, explain: "Eliminating the producer by his continuous live voice leaves the conductor, whose phrasing is on the tape and whose bow was freshly rosined." },
    solution: "The conductor arranged a switch so that the 'soloist' was never needed for the third movement. He muted the solo microphone, faded up the booth microphone, and played from behind the glass — safe because only the booth microphone was live and no camera covered the booth. Yara was deliberately locked in the stationery room, where she had been sent to fetch dry rosin, and the maintenance door log entry at 21:07 was his. The stationery room did not hide her; it held her. The evidence that undid him was the smallest thing in the room: the pattern of rosin on a bow he claimed not to use.",
    lesson: "Style is identity. Two phrase endings were enough to identify a player who never intended to be heard."
  },
  {
    id: "case-04", num: "04", title: "The Locked Greenhouse", difficulty: "Hard", xp: 200, minutes: 12,
    tag: "Physical reasoning",
    blurb: "A prize orchid disappears from a greenhouse locked from the inside — with the only key melted into a candle.",
    story: "At Wexley Gardens, the rafflesia hybrid 'Crown of Ash' was to be unveiled at dawn. At 05:00 the head gardener found the greenhouse door bolted from within, the padlock key fused inside a burnt-down candle on the potting bench, and the orchid gone. The greenhouse has one door, four sealed roof vents, and glass panes intact. Overnight the temperature fell to 4°C and a fine drizzle fell continuously.",
    setting: "A glasshouse with an iron frame, a coal stove long removed, a slate floor, and a bench of wet clay pots.",
    evidence: [
      { id: "E1", label: "Candle and key", detail: "The brass key sat in a pool of cooled wax. The candle had burned for roughly six hours. The wick was trimmed short, so the flame was small and long-lived." },
      { id: "E2", label: "Slate floor", detail: "A single line of dry, dusty footprints leads from the bench to the north-west pane and stops. No footprints return." },
      { id: "E3", label: "North-west pane", detail: "One pane is held by fresh putty and can be lifted out completely — a repair job scheduled for next week. The gap is 24 cm wide." },
      { id: "E4", label: "Rain record", detail: "Drizzle fell from 23:00 to 04:40. Inside the greenhouse, the floor stayed dry except along one wall where the lifted pane was." },
      { id: "E5", label: "Potting bench", detail: "A clay pot was found smashed outside the greenhouse under the north-west pane, and the orchid's root ball was wrapped in sacking beside it." }
    ],
    clues: [
      "A key melted into a candle cannot have been used to lock the door afterwards — the lock must have been closed another way.",
      "The footprints are dry and dusty, but it had been raining for six hours. Dry shoes suggest someone who arrived before the rain.",
      "The gap is 24 cm — wide enough for a wrapped root ball, not for a person."
    ],
    questions: [
      { q: "If the key was inside a burning candle all night, how was the door bolted from within?",
        options: ["The door was never bolted", "The bolt was thrown from outside using the putty gap and a wire", "The gardener lied about the bolt", "A second key existed"],
        answer: 1, explain: "The removable pane gives a 24 cm opening. A wire or rod through it can throw an interior bolt — no key needed, so the melted key is theatre." },
      { q: "Which evidence shows the thief was inside before the rain started?",
        options: ["The candle burned six hours", "The dry, dusty footprints on a floor that had been wet outside for hours", "The smashed pot", "The sacking"],
        answer: 1, explain: "Dry footprints inside, during six hours of drizzle outside, mean the person was already indoors before the rain — a planned, waiting intruder." },
      { q: "Why smash a clay pot outside the window?",
        options: ["Anger", "To create a landing mark so the wrapped orchid could be dropped accurately in the dark", "To distract the gardener", "To prop the pane open"],
        answer: 1, explain: "The pot marks the drop point so a sacked root ball can be released through the gap and recovered in darkness without searching." }
    ],
    puzzle: {
      prompt: "Sequence reasoning: order the escape.",
      detail: "Actions: (A) lift the pane, (B) drop the orchid, (C) throw the interior bolt with a wire, (D) retrieve the orchid below, (E) re-seat the pane. The bolt must be thrown while the gap is open but after the thief has left the building. The pane must be replaced before the drizzle stops, or the floor would show rain inside. What is the order?",
      options: ["A → C → B → E → D", "A → B → C → E → D", "A → B → E → C → D", "B → A → C → E → D"],
      answer: 1, explain: "Lift the pane (A), pass the orchid out (B), throw the bolt with the wire through the still-open gap (C), re-seat the pane (E), then collect the bundle below (D)."
    },
    solution: "The thief entered before the drizzle began, hid in the glasshouse, and waited. When the last patrol passed, they lifted the already-loose north-west pane, wrapped the orchid, dropped it onto a smashed pot that marked the landing spot, then used a hooked wire through the same gap to throw the internal bolt — locking the room behind them without ever holding the key. The key inside the candle was a decoy prepared hours earlier: it explained how the door 'must' have been locked, which is precisely what made everyone stop looking for another way in.",
    lesson: "A locked room is only locked if you accept the lock. Question the mechanism, not just the suspects."
  },
  {
    id: "case-05", num: "05", title: "The Second Shadow", difficulty: "Hard", xp: 250, minutes: 14,
    tag: "Cipher & time",
    blurb: "A ledger, a sundial and a photograph taken at the wrong time of day. Someone has been editing history.",
    story: "Archivist Neel Raghavan was cataloguing the Ledger of the Marchmont Estate when he noticed an entry dated 12 October, written in a hand identical to the estate clerk's — yet that clerk had died in September. Photographic plates in the same box show the courtyard sundial at 09:00 and at 15:00, casting shadows Neel insists are impossible for October. The estate's insurer wants to declare the ledger a modern forgery. Neel disagrees.",
    setting: "A dry archive room, a box of glass plate photographs, a courtyard sundial that has not moved in 130 years, and one very stubborn archivist.",
    evidence: [
      { id: "E1", label: "Ink analysis", detail: "The October entry uses iron-gall ink, but its gum arabic binder matches a supply delivered to the estate in the following February." },
      { id: "E2", label: "Death record", detail: "The clerk, Mr Aldous Pike, died on 29 September. His assistant, a nephew called Samuel, inherited his desk and his pen." },
      { id: "E3", label: "Plate 14", detail: "Shows the sundial — the gnomon casts a shadow 22° west of north, consistent with a mid-morning hour." },
      { id: "E4", label: "Plate 15", detail: "Shows the same dial with the shadow 22° east of north, and the same two pigeons in the same positions on the wall." },
      { id: "E5", label: "Leather sample", detail: "The pigeon feathers visible in both plates moult in spring; the ledgers claim both plates were taken in autumn." },
      { id: "E6", label: "Margin note", detail: "A faint pencil note in Samuel's hand reads: 'Copy the October page from my uncle's rough draft — his hand is easy if the light is right.'" }
    ],
    clues: [
      "Two shadows 22° apart, mirrored about north, are exactly what a sundial shows at symmetric morning and afternoon hours.",
      "Identical pigeons in two photos cannot mean two separate moments.",
      "A binder that arrived in February cannot be in an October entry — unless the entry was written later."
    ],
    questions: [
      { q: "What do the identical pigeons in plates 14 and 15 actually prove?",
        options: ["The plates were taken moments apart on the same day", "Pigeons are loyal to one wall", "The plates are duplicates made in one sitting", "Nothing at all"],
        answer: 2, explain: "Identical birds in identical positions cannot recur hours apart — the two 'different times' are the same moment, rephotographed or staged." },
      { q: "The mirrored 22° shadows tell you which claim is false?",
        options: ["That the plates show different times of day", "That the sundial exists", "That October happened", "That the archive is dry"],
        answer: 0, explain: "Symmetric shadows suggest morning and afternoon, but the pigeons contradict a genuine time gap, so the 'two times' claim is the fabrication." },
      { q: "Why is the ink binder decisive against the insurer's 'modern forgery' theory — and against the ledger being genuine?",
        options: ["It proves the ledger is ancient", "It dates the writing to a period after February, so the October entry was written months late by someone with access to the clerk's hand", "It proves the supplier was lying", "It proves nothing"],
        answer: 1, explain: "The binder places the entry's writing after February — neither an authentic October record nor a modern fake, but a deliberate later insertion by someone copying a style." }
    ],
    puzzle: {
      prompt: "Cipher: the margin ledger code.",
      detail: "Samuel left a code beside the entry: 'QRYHPEHU', with the note 'shift every letter back three places'. Which month does it name?",
      options: ["September", "October", "November", "December"],
      answer: 2, explain: "Shift each letter back three: Q→N, R→O, Y→V, H→E, P→M, E→B, H→E, U→R — NOVEMBER, the month a clerk who died in September could never have written."
    },
    solution: "The ledger is neither authentic nor modern. Samuel Pike copied his uncle's October page months after Aldous died, using the dead man's hand as a template and an ink supply that only existed from February onwards. To support the fiction he staged two photographs from a single sitting — mirrored shadows to fake two times of day, undone by two pigeons who would not hold a pose twice. His own pencil margin note, written carelessly while pleased with the forgery, is the confession he never intended to file. The insurer called it a modern forgery because the ink was wrong for October; Neel proved it was wrong for October and December too, which dated the deception to a very particular window and a very particular desk.",
    lesson: "Symmetric coincidences are the deepest kind of lie. Real time does not repeat its shadows exactly."
  }
];

const MYSTERY_RANKS = [
  { xp: 0,   label: "Curious Bystander" },
  { xp: 150, label: "File Opener" },
  { xp: 400, label: "Evidence Reader" },
  { xp: 700, label: "Case Analyst" },
  { xp: 1000, label: "Chief Investigator" }
];
function mysteryRank(xp) {
  let r = MYSTERY_RANKS[0];
  MYSTERY_RANKS.forEach(x => { if (xp >= x.xp) r = x; });
  const i = MYSTERY_RANKS.indexOf(r);
  const next = MYSTERY_RANKS[i + 1] || null;
  return { current: r, next, progress: next ? pct(xp - r.xp, next.xp - r.xp) : 100 };
}
function mysteryProgress(caseId) {
  const s = Store.data.mystery.progress[caseId];
  return s || { answers: {}, solved: false, xp: 0, revealed: false, startedAt: null };
}

