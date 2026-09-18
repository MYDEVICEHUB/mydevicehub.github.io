
/* ============================================================
   BUILT-IN VEHICLE INFORMATION DATABASE
   ------------------------------------------------------------
   Static, published manufacturer specifications for the models
   listed below. Nothing here is a reading from a vehicle, and
   nothing here is generated at runtime:
     * only fields that are documented for the entry are stored
     * a field that is not in the database renders as
       "Information unavailable" — it is never estimated
     * years are limited to the generation covered by the entry,
       so a 2015 model is never shown 2024 figures
   Reference figures are for the common/base variant of the
   stated generation in the market noted on the entry.
   ============================================================ */
const VEHICLE_DB = {
  updated: "2026-09",
  market: "India (unless the entry says otherwise)",
  notice: "Reference specifications from the built-in database. These are static published manufacturer figures, not readings from your vehicle. Live values are shown separately, and only when a real integration supplies them.",
  brands: [
    /* ══════════════════ CARS ══════════════════ */
    { id: "maruti", name: "Maruti Suzuki", type: "car", models: [
      { id: "swift-4", name: "Swift", gen: "4th generation", from: 2024, to: null, body: "Hatchback",
        variants: [
          { name: "1.2 Petrol MT / AMT", fuel: "Petrol", cc: 1197, engine: "1.2 L 3-cylinder (Z12E), naturally aspirated", trans: "5-speed manual / AMT", power: "82 PS @ 5,700 rpm", torque: "112 Nm @ 4,300 rpm", seats: 5, dims: "3,860 × 1,735 × 1,520 mm", extra: [["Wheelbase", "2,450 mm"]] }
        ],
        note: "Specifications are for the 4th-generation Swift sold in India." },
      { id: "swift-3", name: "Swift", gen: "3rd generation", from: 2018, to: 2024, body: "Hatchback",
        variants: [
          { name: "1.2 Petrol MT / AMT / CVT", fuel: "Petrol", cc: 1197, engine: "1.2 L 4-cylinder (K12M/K12N)", trans: "5-speed manual / AMT / CVT", power: "83–90 PS @ 6,000 rpm", torque: "113 Nm @ 4,200 rpm", seats: 5, dims: "3,840 × 1,735 × 1,530 mm", extra: [["Wheelbase", "2,450 mm"]] }
        ] },
      { id: "baleno-2", name: "Baleno", gen: "2nd generation", from: 2022, to: null, body: "Hatchback",
        variants: [
          { name: "1.2 Petrol MT / AMT / CVT", fuel: "Petrol", cc: 1197, engine: "1.2 L 4-cylinder (K12N) DualJet", trans: "5-speed manual / AMT / CVT", power: "90 PS @ 6,000 rpm", torque: "113 Nm @ 4,400 rpm", seats: 5, dims: "3,990 × 1,745 × 1,500 mm", extra: [["Wheelbase", "2,520 mm"]] }
        ] },
      { id: "dzire-4", name: "Dzire", gen: "4th generation", from: 2024, to: null, body: "Sedan",
        variants: [
          { name: "1.2 Petrol MT / AMT", fuel: "Petrol", cc: 1197, engine: "1.2 L 3-cylinder (Z12E)", trans: "5-speed manual / AMT", power: "82 PS @ 5,700 rpm", torque: "112 Nm @ 4,300 rpm", seats: 5, dims: "3,995 × 1,735 × 1,525 mm", extra: [["Wheelbase", "2,450 mm"]] }
        ] },
      { id: "wagonr-3", name: "Wagon R", gen: "3rd generation", from: 2019, to: null, body: "Hatchback",
        variants: [
          { name: "1.0 Petrol MT / AMT", fuel: "Petrol", cc: 998, engine: "1.0 L 3-cylinder (K10C), naturally aspirated", trans: "5-speed manual / AMT", power: "67 PS @ 5,500 rpm", torque: "89 Nm @ 3,500 rpm", seats: 5 },
          { name: "1.2 Petrol MT / AMT", fuel: "Petrol", cc: 1197, engine: "1.2 L 4-cylinder (K12N)", trans: "5-speed manual / AMT", power: "90 PS @ 6,000 rpm", torque: "113 Nm @ 4,400 rpm", seats: 5 }
        ] },
      { id: "alto-k10-2", name: "Alto K10", gen: "2nd generation", from: 2022, to: null, body: "Hatchback",
        variants: [
          { name: "1.0 Petrol MT / AMT", fuel: "Petrol", cc: 998, engine: "1.0 L 3-cylinder (K10C)", trans: "5-speed manual / AMT", power: "67 PS @ 5,500 rpm", torque: "89 Nm @ 3,500 rpm", seats: 5, dims: "3,530 × 1,490 × 1,520 mm", extra: [["Wheelbase", "2,380 mm"]] }
        ] },
      { id: "brezza-2", name: "Brezza", gen: "2nd generation", from: 2022, to: null, body: "Compact SUV",
        variants: [
          { name: "1.5 Petrol MT / AT", fuel: "Petrol", cc: 1462, engine: "1.5 L 4-cylinder (K15C) DualJet with mild hybrid", trans: "5-speed manual / 6-speed torque converter", power: "103 PS @ 6,000 rpm", torque: "137 Nm @ 4,400 rpm", seats: 5, dims: "3,995 × 1,790 × 1,685 mm", extra: [["Wheelbase", "2,500 mm"]] }
        ] },
      { id: "ertiga-3", name: "Ertiga", gen: "3rd generation", from: 2022, to: null, body: "MPV",
        variants: [
          { name: "1.5 Petrol MT / AT", fuel: "Petrol", cc: 1462, engine: "1.5 L 4-cylinder (K15C) DualJet with mild hybrid", trans: "5-speed manual / 6-speed torque converter", power: "103 PS @ 6,000 rpm", torque: "137 Nm @ 4,400 rpm", seats: 7, dims: "4,395 × 1,735 × 1,690 mm", extra: [["Wheelbase", "2,740 mm"]] }
        ] },
      { id: "grand-vitara", name: "Grand Vitara", gen: "1st generation (India)", from: 2022, to: null, body: "SUV",
        variants: [
          { name: "1.5 Mild Hybrid MT / AT", fuel: "Petrol", cc: 1462, engine: "1.5 L 4-cylinder (K15C) with mild hybrid", trans: "5-speed manual / 6-speed torque converter", power: "103 PS @ 6,000 rpm", torque: "137 Nm @ 4,400 rpm", seats: 5, dims: "4,345 × 1,795 × 1,645 mm", extra: [["Wheelbase", "2,600 mm"]] },
          { name: "1.5 Strong Hybrid e-CVT", fuel: "Petrol hybrid", cc: 1490, engine: "1.5 L 3-cylinder Atkinson-cycle + electric motor", trans: "e-CVT", power: "116 PS (combined system output)", torque: "141 Nm (engine)", seats: 5, dims: "4,345 × 1,795 × 1,645 mm", extra: [["Wheelbase", "2,600 mm"]] }
        ] }
    ] },

    { id: "hyundai", name: "Hyundai", type: "car", models: [
      { id: "creta-2", name: "Creta", gen: "2nd generation (facelift)", from: 2024, to: null, body: "SUV",
        variants: [
          { name: "1.5 MPi Petrol MT / CVT", fuel: "Petrol", cc: 1497, engine: "1.5 L 4-cylinder naturally aspirated", trans: "6-speed manual / CVT", power: "115 PS @ 6,300 rpm", torque: "144 Nm @ 4,500 rpm", seats: 5, dims: "4,330 × 1,790 × 1,635 mm", extra: [["Wheelbase", "2,610 mm"]] },
          { name: "1.5 T-GDi Petrol 7-DCT", fuel: "Petrol", cc: 1482, engine: "1.5 L 4-cylinder turbocharged", trans: "7-speed dual-clutch", power: "160 PS @ 5,500 rpm", torque: "253 Nm @ 1,500–3,500 rpm", seats: 5, dims: "4,330 × 1,790 × 1,635 mm", extra: [["Wheelbase", "2,610 mm"]] },
          { name: "1.5 CRDi Diesel MT / AT", fuel: "Diesel", cc: 1493, engine: "1.5 L 4-cylinder turbo-diesel", trans: "6-speed manual / 6-speed automatic", power: "116 PS @ 4,000 rpm", torque: "250 Nm @ 1,500–2,750 rpm", seats: 5, dims: "4,330 × 1,790 × 1,635 mm", extra: [["Wheelbase", "2,610 mm"]] }
        ] },
      { id: "i20-3", name: "i20", gen: "3rd generation (facelift)", from: 2023, to: null, body: "Hatchback",
        variants: [
          { name: "1.2 Kappa Petrol MT / IVT", fuel: "Petrol", cc: 1197, engine: "1.2 L 4-cylinder (Kappa)", trans: "5-speed manual / IVT", power: "88 PS @ 6,000 rpm", torque: "115 Nm @ 4,200 rpm", seats: 5, dims: "3,995 × 1,775 × 1,505 mm", extra: [["Wheelbase", "2,580 mm"]] },
          { name: "1.0 T-GDi Petrol 7-DCT", fuel: "Petrol", cc: 998, engine: "1.0 L 3-cylinder turbocharged", trans: "7-speed dual-clutch", power: "120 PS @ 6,000 rpm", torque: "172 Nm @ 1,500–4,000 rpm", seats: 5, dims: "3,995 × 1,775 × 1,505 mm", extra: [["Wheelbase", "2,580 mm"]] }
        ] },
      { id: "venue", name: "Venue", gen: "1st generation (facelift)", from: 2022, to: null, body: "Compact SUV",
        variants: [
          { name: "1.2 Petrol MT", fuel: "Petrol", cc: 1197, engine: "1.2 L 4-cylinder (Kappa)", trans: "5-speed manual", power: "83 PS @ 6,000 rpm", torque: "114 Nm @ 4,000 rpm", seats: 5, dims: "3,995 × 1,770 × 1,617 mm", extra: [["Wheelbase", "2,500 mm"]] },
          { name: "1.0 T-GDi Petrol DCT", fuel: "Petrol", cc: 998, engine: "1.0 L 3-cylinder turbocharged", trans: "7-speed dual-clutch", power: "120 PS @ 6,000 rpm", torque: "172 Nm @ 1,500–4,000 rpm", seats: 5, dims: "3,995 × 1,770 × 1,617 mm", extra: [["Wheelbase", "2,500 mm"]] },
          { name: "1.5 CRDi Diesel MT / AT", fuel: "Diesel", cc: 1493, engine: "1.5 L 4-cylinder turbo-diesel", trans: "6-speed manual / 6-speed automatic", power: "116 PS @ 4,000 rpm", torque: "250 Nm @ 1,500–2,750 rpm", seats: 5, dims: "3,995 × 1,770 × 1,617 mm", extra: [["Wheelbase", "2,500 mm"]] }
        ] },
      { id: "verna-6", name: "Verna", gen: "6th generation", from: 2023, to: null, body: "Sedan",
        variants: [
          { name: "1.5 MPi Petrol MT / CVT", fuel: "Petrol", cc: 1497, engine: "1.5 L 4-cylinder naturally aspirated", trans: "6-speed manual / CVT", power: "115 PS @ 6,300 rpm", torque: "144 Nm @ 4,500 rpm", seats: 5, dims: "4,535 × 1,765 × 1,475 mm", extra: [["Wheelbase", "2,670 mm"]] },
          { name: "1.5 T-GDi Petrol 7-DCT", fuel: "Petrol", cc: 1482, engine: "1.5 L 4-cylinder turbocharged", trans: "7-speed dual-clutch", power: "160 PS @ 5,500 rpm", torque: "253 Nm @ 1,500–3,500 rpm", seats: 5, dims: "4,535 × 1,765 × 1,475 mm", extra: [["Wheelbase", "2,670 mm"]] }
        ] },
      { id: "exter", name: "Exter", gen: "1st generation", from: 2023, to: null, body: "Compact SUV",
        variants: [
          { name: "1.2 Petrol MT / AMT", fuel: "Petrol", cc: 1197, engine: "1.2 L 4-cylinder (Kappa)", trans: "5-speed manual / AMT", power: "83 PS @ 6,000 rpm", torque: "114 Nm @ 4,000 rpm", seats: 5, dims: "3,815 × 1,710 × 1,631 mm", extra: [["Wheelbase", "2,450 mm"]] }
        ] },
      { id: "ioniq5", name: "Ioniq 5", gen: "1st generation", from: 2023, to: null, body: "Electric SUV",
        variants: [
          { name: "72.6 kWh RWD", fuel: "Electric", cc: null, engine: "Permanent-magnet synchronous motor, 72.6 kWh battery", trans: "Single-speed reduction gear", power: "168 kW (228 PS)", torque: "350 Nm", seats: 5, dims: "4,655 × 1,890 × 1,625 mm", extra: [["Wheelbase", "3,000 mm"], ["Battery", "72.6 kWh lithium-ion"], ["Engine capacity", "Not applicable — electric"]] }
        ],
        note: "An EV has no engine displacement, so that field is not applicable rather than blank." }
    ] },

    { id: "tata", name: "Tata Motors", type: "car", models: [
      { id: "nexon-2", name: "Nexon", gen: "2nd generation (facelift)", from: 2023, to: null, body: "Compact SUV",
        variants: [
          { name: "1.2 Turbo Petrol MT / AMT / DCA", fuel: "Petrol", cc: 1199, engine: "1.2 L 3-cylinder turbocharged (Revotron)", trans: "5/6-speed manual / AMT / 7-speed DCA", power: "120 PS @ 5,500 rpm", torque: "170 Nm @ 1,750–4,000 rpm", seats: 5, dims: "3,995 × 1,804 × 1,620 mm", extra: [["Wheelbase", "2,498 mm"]] },
          { name: "1.5 Diesel MT / AMT", fuel: "Diesel", cc: 1497, engine: "1.5 L 4-cylinder turbo-diesel (Revotorq)", trans: "6-speed manual / AMT", power: "115 PS @ 4,000 rpm", torque: "260 Nm @ 1,500–2,750 rpm", seats: 5, dims: "3,995 × 1,804 × 1,620 mm", extra: [["Wheelbase", "2,498 mm"]] }
        ] },
      { id: "nexon-ev", name: "Nexon EV", gen: "2nd generation (facelift)", from: 2023, to: null, body: "Electric compact SUV",
        variants: [
          { name: "45 kWh", fuel: "Electric", cc: null, engine: "Permanent-magnet synchronous motor, 45 kWh battery", trans: "Single-speed automatic", power: "106.4 kW (144.7 PS)", torque: "215 Nm", seats: 5, dims: "3,994 × 1,811 × 1,620 mm", extra: [["Wheelbase", "2,498 mm"], ["Battery", "45 kWh lithium-ion"], ["Charging (DC)", "Up to 70 kW"], ["Engine capacity", "Not applicable — electric"]] }
        ],
        note: "An EV has no engine displacement or gearbox, so those rows are not applicable rather than invented." },
      { id: "punch", name: "Punch", gen: "1st generation", from: 2021, to: null, body: "Micro SUV",
        variants: [
          { name: "1.2 Petrol MT / AMT", fuel: "Petrol", cc: 1199, engine: "1.2 L 3-cylinder naturally aspirated (Revotron)", trans: "5-speed manual / AMT", power: "88 PS @ 6,000 rpm", torque: "115 Nm @ 3,250 rpm", seats: 5, dims: "3,827 × 1,742 × 1,615 mm", extra: [["Wheelbase", "2,445 mm"]] }
        ] },
      { id: "altroz", name: "Altroz", gen: "1st generation", from: 2020, to: null, body: "Hatchback",
        variants: [
          { name: "1.2 Petrol MT / DCA", fuel: "Petrol", cc: 1199, engine: "1.2 L 3-cylinder naturally aspirated", trans: "5-speed manual / 6-speed DCA", power: "88 PS @ 6,000 rpm", torque: "115 Nm @ 3,250 rpm", seats: 5, dims: "3,990 × 1,755 × 1,523 mm", extra: [["Wheelbase", "2,501 mm"]] },
          { name: "1.2 Turbo Petrol MT", fuel: "Petrol", cc: 1199, engine: "1.2 L 3-cylinder turbocharged", trans: "5-speed manual", power: "110 PS @ 5,500 rpm", torque: "140 Nm @ 1,500–5,500 rpm", seats: 5, dims: "3,990 × 1,755 × 1,523 mm", extra: [["Wheelbase", "2,501 mm"]] },
          { name: "1.5 Diesel MT", fuel: "Diesel", cc: 1497, engine: "1.5 L 4-cylinder turbo-diesel", trans: "5-speed manual", power: "90 PS @ 4,000 rpm", torque: "200 Nm @ 1,250–3,000 rpm", seats: 5, dims: "3,990 × 1,755 × 1,523 mm", extra: [["Wheelbase", "2,501 mm"]] }
        ] },
      { id: "harrier-2", name: "Harrier", gen: "2nd generation (facelift)", from: 2023, to: null, body: "SUV",
        variants: [
          { name: "2.0 Diesel MT / AT", fuel: "Diesel", cc: 1956, engine: "2.0 L 4-cylinder turbo-diesel (Kryotec)", trans: "6-speed manual / 6-speed automatic", power: "170 PS @ 3,750 rpm", torque: "350 Nm @ 1,750–2,500 rpm", seats: 5, dims: "4,605 × 1,922 × 1,718 mm", extra: [["Wheelbase", "2,741 mm"]] }
        ] },
      { id: "safari-2", name: "Safari", gen: "2nd generation (facelift)", from: 2023, to: null, body: "SUV",
        variants: [
          { name: "2.0 Diesel MT / AT", fuel: "Diesel", cc: 1956, engine: "2.0 L 4-cylinder turbo-diesel (Kryotec)", trans: "6-speed manual / 6-speed automatic", power: "170 PS @ 3,750 rpm", torque: "350 Nm @ 1,750–2,500 rpm", seats: 7, dims: "4,668 × 1,922 × 1,795 mm", extra: [["Wheelbase", "2,741 mm"]] }
        ] }
    ] },

    { id: "mahindra", name: "Mahindra", type: "car", models: [
      { id: "scorpio-n", name: "Scorpio-N", gen: "1st generation (Z-series)", from: 2022, to: null, body: "SUV",
        variants: [
          { name: "2.0 TGDi Petrol MT / AT", fuel: "Petrol", cc: 1997, engine: "2.0 L 4-cylinder turbo-petrol (mStallion)", trans: "6-speed manual / 6-speed automatic", power: "200 PS @ 5,000 rpm", torque: "370 Nm (MT) / 380 Nm (AT)", seats: 6, dims: "4,662 × 1,917 × 1,857 mm", extra: [["Wheelbase", "2,750 mm"], ["Seating options", "6 or 7 seats"]] },
          { name: "2.2 CRDe Diesel MT / AT", fuel: "Diesel", cc: 2184, engine: "2.2 L 4-cylinder turbo-diesel (mHawk)", trans: "6-speed manual / 6-speed automatic", power: "175 PS (MT) / 185 PS (AT)", torque: "370 Nm (MT) / 400 Nm (AT)", seats: 6, dims: "4,662 × 1,917 × 1,857 mm", extra: [["Wheelbase", "2,750 mm"], ["Seating options", "6 or 7 seats"]] }
        ] },
      { id: "xuv700", name: "XUV700", gen: "1st generation", from: 2021, to: null, body: "SUV",
        variants: [
          { name: "2.0 TGDi Petrol MT / AT", fuel: "Petrol", cc: 1997, engine: "2.0 L 4-cylinder turbo-petrol (mStallion)", trans: "6-speed manual / 6-speed automatic", power: "200 PS @ 5,000 rpm", torque: "380 Nm @ 1,750–3,000 rpm", seats: 7, dims: "4,695 × 1,890 × 1,755 mm", extra: [["Wheelbase", "2,750 mm"], ["Seating options", "5 or 7 seats"]] },
          { name: "2.2 CRDe Diesel MT / AT", fuel: "Diesel", cc: 2198, engine: "2.2 L 4-cylinder turbo-diesel (mHawk)", trans: "6-speed manual / 6-speed automatic", power: "155 PS (MT) / 185 PS (AT)", torque: "360 Nm (MT) / 420 Nm (AT)", seats: 7, dims: "4,695 × 1,890 × 1,755 mm", extra: [["Wheelbase", "2,750 mm"], ["Seating options", "5 or 7 seats"]] }
        ] },
      { id: "thar-2", name: "Thar", gen: "2nd generation", from: 2020, to: null, body: "Off-road SUV",
        variants: [
          { name: "2.0 TGDi Petrol MT / AT", fuel: "Petrol", cc: 1997, engine: "2.0 L 4-cylinder turbo-petrol (mStallion)", trans: "6-speed manual / 6-speed automatic", power: "150 PS @ 5,000 rpm", torque: "300 Nm (MT) / 320 Nm (AT)", seats: 4, dims: "3,985 × 1,820 × 1,850 mm", extra: [["Wheelbase", "2,450 mm"]] },
          { name: "2.2 CRDe Diesel MT / AT", fuel: "Diesel", cc: 2184, engine: "2.2 L 4-cylinder turbo-diesel (mHawk)", trans: "6-speed manual / 6-speed automatic", power: "130 PS @ 3,750 rpm", torque: "300 Nm @ 1,600–2,800 rpm", seats: 4, dims: "3,985 × 1,820 × 1,850 mm", extra: [["Wheelbase", "2,450 mm"]] }
        ] },
      { id: "xuv3xo", name: "XUV 3XO", gen: "1st generation (facelift of XUV300)", from: 2024, to: null, body: "Compact SUV",
        variants: [
          { name: "1.2 TGDi Petrol MT / AT", fuel: "Petrol", cc: 1197, engine: "1.2 L 3-cylinder turbo-petrol (mStallion)", trans: "6-speed manual / 6-speed automatic", power: "110 PS @ 5,000 rpm", torque: "200 Nm @ 1,500–3,500 rpm", seats: 5, dims: "3,990 × 1,821 × 1,647 mm", extra: [["Wheelbase", "2,600 mm"]] },
          { name: "1.5 Diesel MT / AMT", fuel: "Diesel", cc: 1497, engine: "1.5 L 4-cylinder turbo-diesel", trans: "6-speed manual / AMT", power: "117 PS @ 3,750 rpm", torque: "300 Nm @ 1,500–2,500 rpm", seats: 5, dims: "3,990 × 1,821 × 1,647 mm", extra: [["Wheelbase", "2,600 mm"]] }
        ] }
    ] },

    { id: "toyota", name: "Toyota", type: "car", models: [
      { id: "innova-hycross", name: "Innova Hycross", gen: "1st generation", from: 2023, to: null, body: "MPV",
        variants: [
          { name: "2.0 Petrol CVT", fuel: "Petrol", cc: 1987, engine: "2.0 L 4-cylinder naturally aspirated (Dynamic Force)", trans: "CVT", power: "174 PS @ 6,600 rpm", torque: "205 Nm @ 4,500 rpm", seats: 7, dims: "4,755 × 1,850 × 1,795 mm", extra: [["Wheelbase", "2,850 mm"], ["Seating options", "7 or 8 seats"]] },
          { name: "2.0 Strong Hybrid e-CVT", fuel: "Petrol hybrid", cc: 1987, engine: "2.0 L 4-cylinder + electric motor (Toyota hybrid system)", trans: "e-CVT", power: "186 PS (combined system output)", torque: "188 Nm (engine)", seats: 7, dims: "4,755 × 1,850 × 1,795 mm", extra: [["Wheelbase", "2,850 mm"], ["Seating options", "7 or 8 seats"]] }
        ] },
      { id: "fortuner-2", name: "Fortuner", gen: "2nd generation", from: 2016, to: null, body: "SUV",
        variants: [
          { name: "2.7 Petrol MT / AT", fuel: "Petrol", cc: 2694, engine: "2.7 L 4-cylinder (2TR-FE)", trans: "5-speed manual / 6-speed automatic", power: "166 PS @ 5,200 rpm", torque: "245 Nm @ 4,000 rpm", seats: 7, dims: "4,795 × 1,855 × 1,835 mm", extra: [["Wheelbase", "2,745 mm"]] },
          { name: "2.8 Diesel MT / AT", fuel: "Diesel", cc: 2755, engine: "2.8 L 4-cylinder turbo-diesel (1GD-FTV)", trans: "6-speed manual / 6-speed automatic", power: "204 PS @ 3,400 rpm", torque: "420 Nm (MT) / 500 Nm (AT)", seats: 7, dims: "4,795 × 1,855 × 1,835 mm", extra: [["Wheelbase", "2,745 mm"]] }
        ] },
      { id: "glanza-2", name: "Glanza", gen: "2nd generation", from: 2022, to: null, body: "Hatchback",
        variants: [
          { name: "1.2 Petrol MT / AMT / CVT", fuel: "Petrol", cc: 1197, engine: "1.2 L 4-cylinder (K12N) DualJet", trans: "5-speed manual / AMT / CVT", power: "90 PS @ 6,000 rpm", torque: "113 Nm @ 4,400 rpm", seats: 5, dims: "3,990 × 1,745 × 1,500 mm", extra: [["Wheelbase", "2,520 mm"]] }
        ],
        note: "Mechanically the same platform as the Maruti Suzuki Baleno." },
      { id: "hyryder", name: "Urban Cruiser Hyryder", gen: "1st generation", from: 2022, to: null, body: "SUV",
        variants: [
          { name: "1.5 Mild Hybrid MT / AT", fuel: "Petrol", cc: 1462, engine: "1.5 L 4-cylinder with mild hybrid", trans: "5-speed manual / 6-speed torque converter", power: "103 PS @ 6,000 rpm", torque: "137 Nm @ 4,400 rpm", seats: 5, dims: "4,365 × 1,795 × 1,645 mm", extra: [["Wheelbase", "2,600 mm"]] },
          { name: "1.5 Strong Hybrid e-CVT", fuel: "Petrol hybrid", cc: 1490, engine: "1.5 L 3-cylinder Atkinson-cycle + electric motor", trans: "e-CVT", power: "116 PS (combined system output)", torque: "141 Nm (engine)", seats: 5, dims: "4,365 × 1,795 × 1,645 mm", extra: [["Wheelbase", "2,600 mm"]] }
        ] }
    ] },

    { id: "honda", name: "Honda", type: "car", models: [
      { id: "city-5", name: "City", gen: "5th generation", from: 2020, to: null, body: "Sedan",
        variants: [
          { name: "1.5 i-VTEC Petrol MT / CVT", fuel: "Petrol", cc: 1498, engine: "1.5 L 4-cylinder i-VTEC (L15)", trans: "6-speed manual / CVT", power: "121 PS @ 6,600 rpm", torque: "145 Nm @ 4,300 rpm", seats: 5, dims: "4,583 × 1,748 × 1,467 mm", extra: [["Wheelbase", "2,600 mm"]] },
          { name: "1.5 e:HEV Hybrid", fuel: "Petrol hybrid", cc: 1498, engine: "1.5 L Atkinson-cycle + two-motor hybrid system", trans: "e-CVT", power: "126 PS (combined system output)", torque: "253 Nm (electric motor)", seats: 5, dims: "4,583 × 1,748 × 1,467 mm", extra: [["Wheelbase", "2,600 mm"]] }
        ] },
      { id: "amaze-3", name: "Amaze", gen: "3rd generation", from: 2024, to: null, body: "Sedan",
        variants: [
          { name: "1.2 Petrol MT / CVT", fuel: "Petrol", cc: 1199, engine: "1.2 L 4-cylinder i-VTEC", trans: "5-speed manual / CVT", power: "90 PS @ 6,000 rpm", torque: "110 Nm @ 4,800 rpm", seats: 5, dims: "3,995 × 1,733 × 1,500 mm", extra: [["Wheelbase", "2,470 mm"]] }
        ] },
      { id: "elevate", name: "Elevate", gen: "1st generation", from: 2023, to: null, body: "SUV",
        variants: [
          { name: "1.5 i-VTEC Petrol MT / CVT", fuel: "Petrol", cc: 1498, engine: "1.5 L 4-cylinder i-VTEC (L15)", trans: "6-speed manual / CVT", power: "121 PS @ 6,600 rpm", torque: "145 Nm @ 4,300 rpm", seats: 5, dims: "4,312 × 1,790 × 1,650 mm", extra: [["Wheelbase", "2,650 mm"]] }
        ] }
    ] },

    { id: "kia", name: "Kia", type: "car", models: [
      { id: "seltos-2", name: "Seltos", gen: "2nd generation (facelift)", from: 2023, to: null, body: "SUV",
        variants: [
          { name: "1.5 MPi Petrol MT / CVT", fuel: "Petrol", cc: 1497, engine: "1.5 L 4-cylinder naturally aspirated", trans: "6-speed manual / CVT", power: "115 PS @ 6,300 rpm", torque: "144 Nm @ 4,500 rpm", seats: 5, dims: "4,365 × 1,800 × 1,645 mm", extra: [["Wheelbase", "2,610 mm"]] },
          { name: "1.5 T-GDi Petrol 7-DCT", fuel: "Petrol", cc: 1482, engine: "1.5 L 4-cylinder turbocharged", trans: "7-speed dual-clutch", power: "160 PS @ 5,500 rpm", torque: "253 Nm @ 1,500–3,500 rpm", seats: 5, dims: "4,365 × 1,800 × 1,645 mm", extra: [["Wheelbase", "2,610 mm"]] },
          { name: "1.5 CRDi Diesel MT / AT", fuel: "Diesel", cc: 1493, engine: "1.5 L 4-cylinder turbo-diesel", trans: "6-speed manual / 6-speed automatic", power: "116 PS @ 4,000 rpm", torque: "250 Nm @ 1,500–2,750 rpm", seats: 5, dims: "4,365 × 1,800 × 1,645 mm", extra: [["Wheelbase", "2,610 mm"]] }
        ] },
      { id: "sonet-2", name: "Sonet", gen: "1st generation (facelift)", from: 2024, to: null, body: "Compact SUV",
        variants: [
          { name: "1.2 Petrol MT", fuel: "Petrol", cc: 1197, engine: "1.2 L 4-cylinder naturally aspirated", trans: "5-speed manual", power: "83 PS @ 6,000 rpm", torque: "115 Nm @ 4,200 rpm", seats: 5, dims: "3,995 × 1,790 × 1,642 mm", extra: [["Wheelbase", "2,500 mm"]] },
          { name: "1.0 T-GDi Petrol 7-DCT", fuel: "Petrol", cc: 998, engine: "1.0 L 3-cylinder turbocharged", trans: "7-speed dual-clutch", power: "120 PS @ 6,000 rpm", torque: "172 Nm @ 1,500–4,000 rpm", seats: 5, dims: "3,995 × 1,790 × 1,642 mm", extra: [["Wheelbase", "2,500 mm"]] }
        ] },
      { id: "carens", name: "Carens", gen: "1st generation", from: 2022, to: null, body: "MPV",
        variants: [
          { name: "1.5 Petrol MT / IVT", fuel: "Petrol", cc: 1497, engine: "1.5 L 4-cylinder naturally aspirated", trans: "6-speed manual / IVT", power: "115 PS @ 6,300 rpm", torque: "144 Nm @ 4,500 rpm", seats: 7, dims: "4,540 × 1,800 × 1,708 mm", extra: [["Wheelbase", "2,780 mm"], ["Seating options", "6 or 7 seats"]] },
          { name: "1.5 CRDi Diesel MT / AT", fuel: "Diesel", cc: 1493, engine: "1.5 L 4-cylinder turbo-diesel", trans: "6-speed manual / 6-speed automatic", power: "116 PS @ 4,000 rpm", torque: "250 Nm @ 1,500–2,750 rpm", seats: 7, dims: "4,540 × 1,800 × 1,708 mm", extra: [["Wheelbase", "2,780 mm"], ["Seating options", "6 or 7 seats"]] }
        ] }
    ] },

    { id: "skoda", name: "Skoda", type: "car", models: [
      { id: "kushaq", name: "Kushaq", gen: "1st generation", from: 2021, to: null, body: "SUV",
        variants: [
          { name: "1.0 TSI MT / AT", fuel: "Petrol", cc: 999, engine: "1.0 L 3-cylinder TSI turbo-petrol", trans: "6-speed manual / 6-speed automatic", power: "115 PS @ 5,000–5,500 rpm", torque: "178 Nm @ 1,750–4,500 rpm", seats: 5, dims: "4,225 × 1,760 × 1,612 mm", extra: [["Wheelbase", "2,651 mm"]] },
          { name: "1.5 TSI DSG", fuel: "Petrol", cc: 1498, engine: "1.5 L 4-cylinder TSI turbo-petrol", trans: "7-speed DSG", power: "150 PS @ 5,000–6,000 rpm", torque: "250 Nm @ 1,600–3,500 rpm", seats: 5, dims: "4,225 × 1,760 × 1,612 mm", extra: [["Wheelbase", "2,651 mm"]] }
        ] },
      { id: "slavia", name: "Slavia", gen: "1st generation", from: 2022, to: null, body: "Sedan",
        variants: [
          { name: "1.0 TSI MT / AT", fuel: "Petrol", cc: 999, engine: "1.0 L 3-cylinder TSI turbo-petrol", trans: "6-speed manual / 6-speed automatic", power: "115 PS @ 5,000–5,500 rpm", torque: "178 Nm @ 1,750–4,500 rpm", seats: 5, dims: "4,541 × 1,752 × 1,487 mm", extra: [["Wheelbase", "2,651 mm"]] },
          { name: "1.5 TSI DSG", fuel: "Petrol", cc: 1498, engine: "1.5 L 4-cylinder TSI turbo-petrol", trans: "7-speed DSG", power: "150 PS @ 5,000–6,000 rpm", torque: "250 Nm @ 1,600–3,500 rpm", seats: 5, dims: "4,541 × 1,752 × 1,487 mm", extra: [["Wheelbase", "2,651 mm"]] }
        ] }
    ] },

    { id: "volkswagen", name: "Volkswagen", type: "car", models: [
      { id: "taigun", name: "Taigun", gen: "1st generation", from: 2021, to: null, body: "SUV",
        variants: [
          { name: "1.0 TSI MT / AT", fuel: "Petrol", cc: 999, engine: "1.0 L 3-cylinder TSI turbo-petrol", trans: "6-speed manual / 6-speed automatic", power: "115 PS @ 5,000–5,500 rpm", torque: "178 Nm @ 1,750–4,500 rpm", seats: 5, dims: "4,221 × 1,760 × 1,612 mm", extra: [["Wheelbase", "2,651 mm"]] },
          { name: "1.5 TSI DSG", fuel: "Petrol", cc: 1498, engine: "1.5 L 4-cylinder TSI turbo-petrol", trans: "7-speed DSG", power: "150 PS @ 5,000–6,000 rpm", torque: "250 Nm @ 1,600–3,500 rpm", seats: 5, dims: "4,221 × 1,760 × 1,612 mm", extra: [["Wheelbase", "2,651 mm"]] }
        ] },
      { id: "virtus", name: "Virtus", gen: "1st generation", from: 2022, to: null, body: "Sedan",
        variants: [
          { name: "1.0 TSI MT / AT", fuel: "Petrol", cc: 999, engine: "1.0 L 3-cylinder TSI turbo-petrol", trans: "6-speed manual / 6-speed automatic", power: "115 PS @ 5,000–5,500 rpm", torque: "178 Nm @ 1,750–4,500 rpm", seats: 5, dims: "4,561 × 1,752 × 1,507 mm", extra: [["Wheelbase", "2,651 mm"]] },
          { name: "1.5 TSI DSG", fuel: "Petrol", cc: 1498, engine: "1.5 L 4-cylinder TSI turbo-petrol", trans: "7-speed DSG", power: "150 PS @ 5,000–6,000 rpm", torque: "250 Nm @ 1,600–3,500 rpm", seats: 5, dims: "4,561 × 1,752 × 1,507 mm", extra: [["Wheelbase", "2,651 mm"]] }
        ] }
    ] },

    { id: "mg", name: "MG", type: "car", models: [
      { id: "windsor-ev", name: "Windsor EV", gen: "1st generation", from: 2024, to: null, body: "Electric crossover MPV",
        variants: [
          { name: "38 kWh", fuel: "Electric", cc: null, engine: "Permanent-magnet synchronous motor, 38 kWh battery", trans: "Single-speed automatic", power: "100 kW (136 PS)", torque: "200 Nm", seats: 5, extra: [["Battery", "38 kWh lithium-ion"], ["Engine capacity", "Not applicable — electric"]] }
        ] },
      { id: "hector", name: "Hector", gen: "1st generation (facelift)", from: 2023, to: null, body: "SUV",
        variants: [
          { name: "1.5 Turbo Petrol MT / CVT", fuel: "Petrol", cc: 1451, engine: "1.5 L 4-cylinder turbo-petrol", trans: "6-speed manual / CVT", power: "143 PS @ 5,000 rpm", torque: "250 Nm @ 1,600–3,600 rpm", seats: 5, dims: "4,699 × 1,835 × 1,760 mm", extra: [["Wheelbase", "2,750 mm"]] },
          { name: "2.0 Diesel MT", fuel: "Diesel", cc: 1956, engine: "2.0 L 4-cylinder turbo-diesel", trans: "6-speed manual", power: "170 PS @ 4,000 rpm", torque: "350 Nm @ 1,750–2,500 rpm", seats: 5, dims: "4,699 × 1,835 × 1,760 mm", extra: [["Wheelbase", "2,750 mm"]] }
        ] }
    ] },

    { id: "bmw", name: "BMW", type: "car", models: [
      { id: "3-series-g20", name: "3 Series", gen: "G20 / 330i", from: 2019, to: null, body: "Sedan",
        variants: [
          { name: "330i Petrol AT", fuel: "Petrol", cc: 1998, engine: "2.0 L 4-cylinder TwinPower turbo-petrol", trans: "8-speed automatic", power: "258 PS @ 5,000–6,500 rpm", torque: "400 Nm @ 1,550–4,400 rpm", seats: 5, dims: "4,709 × 1,827 × 1,435 mm", extra: [["Wheelbase", "2,851 mm"], ["Drive", "Rear-wheel drive"]] }
        ],
        note: "Figures are for the 330i; other 3 Series variants differ." }
    ] },

    { id: "mercedes", name: "Mercedes-Benz", type: "car", models: [
      { id: "c-class-w206", name: "C-Class", gen: "W206 / C 200", from: 2022, to: null, body: "Sedan",
        variants: [
          { name: "C 200 Petrol AT", fuel: "Petrol", cc: 1496, engine: "1.5 L 4-cylinder turbo-petrol with 48 V mild hybrid", trans: "9-speed automatic", power: "204 PS @ 5,800–6,100 rpm", torque: "300 Nm @ 1,800–4,000 rpm", seats: 5, dims: "4,751 × 1,820 × 1,437 mm", extra: [["Wheelbase", "2,865 mm"]] }
        ],
        note: "Figures are for the C 200; the C 300 and diesel versions differ." }
    ] },

    /* ══════════════════ BIKES (motorcycles) ══════════════════ */
    { id: "yamaha", name: "Yamaha", type: "bike", models: [
      { id: "r15-v4", name: "R15", gen: "V4", from: 2022, to: null, body: "Sport bike",
        variants: [
          { name: "155 cc FI", fuel: "Petrol", cc: 155, engine: "155 cc liquid-cooled SOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "18.4 PS @ 10,000 rpm", torque: "14.2 Nm @ 7,500 rpm", seats: 2, dims: "1,990 × 725 × 1,135 mm", extra: [["Seat height", "815 mm"], ["Kerb weight", "142 kg"], ["Front brake", "Disc with ABS"]] }
        ] },
      { id: "mt-15-v2", name: "MT-15", gen: "V2", from: 2022, to: null, body: "Naked street bike",
        variants: [
          { name: "155 cc FI", fuel: "Petrol", cc: 155, engine: "155 cc liquid-cooled SOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "18.4 PS @ 10,000 rpm", torque: "14.2 Nm @ 7,500 rpm", seats: 2, extra: [["Seat height", "810 mm"], ["Kerb weight", "141 kg"]] }
        ] },
      { id: "fz-s-v4", name: "FZ-S FI", gen: "V4", from: 2024, to: null, body: "Naked street bike",
        variants: [
          { name: "149 cc FI", fuel: "Petrol", cc: 149, engine: "149 cc air-cooled SOHC 2-valve single, fuel injected", trans: "5-speed manual", power: "12.4 PS @ 7,250 rpm", torque: "13.3 Nm @ 5,500 rpm", seats: 2, extra: [["Kerb weight", "136 kg"]] }
        ] }
    ] },

    { id: "royalenfield", name: "Royal Enfield", type: "bike", models: [
      { id: "classic-350-j", name: "Classic 350", gen: "J-series", from: 2021, to: null, body: "Retro roadster",
        variants: [
          { name: "349 cc J-series", fuel: "Petrol", cc: 349, engine: "349 cc air-oil cooled SOHC single, fuel injected", trans: "5-speed manual", power: "20.2 PS @ 6,100 rpm", torque: "27 Nm @ 4,000 rpm", seats: 2, dims: "2,145 × 785 × 1,090 mm", extra: [["Seat height", "805 mm"], ["Kerb weight", "195 kg"]] }
        ] },
      { id: "hunter-350", name: "Hunter 350", gen: "J-series", from: 2022, to: null, body: "Roadster",
        variants: [
          { name: "349 cc J-series", fuel: "Petrol", cc: 349, engine: "349 cc air-oil cooled SOHC single, fuel injected", trans: "5-speed manual", power: "20.2 PS @ 6,100 rpm", torque: "27 Nm @ 4,000 rpm", seats: 2, extra: [["Seat height", "800 mm"], ["Kerb weight", "181 kg"]] }
        ] },
      { id: "bullet-350-j", name: "Bullet 350", gen: "J-series", from: 2023, to: null, body: "Retro roadster",
        variants: [
          { name: "349 cc J-series", fuel: "Petrol", cc: 349, engine: "349 cc air-oil cooled SOHC single, fuel injected", trans: "5-speed manual", power: "20.2 PS @ 6,100 rpm", torque: "27 Nm @ 4,000 rpm", seats: 2, extra: [["Kerb weight", "195 kg"]] }
        ] },
      { id: "meteor-350", name: "Meteor 350", gen: "J-series", from: 2020, to: null, body: "Cruiser",
        variants: [
          { name: "349 cc J-series", fuel: "Petrol", cc: 349, engine: "349 cc air-oil cooled SOHC single, fuel injected", trans: "5-speed manual", power: "20.4 PS @ 6,100 rpm", torque: "27 Nm @ 4,000 rpm", seats: 2, extra: [["Seat height", "765 mm"], ["Kerb weight", "191 kg"]] }
        ] },
      { id: "himalayan-450", name: "Himalayan", gen: "450 (Sherpa)", from: 2024, to: null, body: "Adventure tourer",
        variants: [
          { name: "452 cc Sherpa", fuel: "Petrol", cc: 452, engine: "452 cc liquid-cooled DOHC single (Sherpa 450), fuel injected", trans: "6-speed manual", power: "40.02 PS @ 8,000 rpm", torque: "40 Nm @ 5,500 rpm", seats: 2, extra: [["Seat height", "825 mm (standard)"], ["Kerb weight", "196 kg"], ["Ride modes", "Performance / Eco / Rain"]] }
        ] },
      { id: "interceptor-650", name: "Interceptor 650", gen: "650 twins", from: 2018, to: null, body: "Roadster",
        variants: [
          { name: "648 cc twin", fuel: "Petrol", cc: 648, engine: "648 cc air-oil cooled SOHC parallel twin, fuel injected", trans: "6-speed manual", power: "47.6 PS @ 7,150 rpm", torque: "52 Nm @ 5,250 rpm", seats: 2, extra: [["Kerb weight", "202 kg"]] }
        ] }
    ] },

    { id: "bajaj", name: "Bajaj", type: "bike", models: [
      { id: "pulsar-ns200", name: "Pulsar NS200", gen: "BS6 / current", from: 2020, to: null, body: "Naked street bike",
        variants: [
          { name: "199.5 cc liquid-cooled", fuel: "Petrol", cc: 199.5, engine: "199.5 cc liquid-cooled SOHC 4-valve single (triple-spark), fuel injected", trans: "6-speed manual", power: "24.5 PS @ 9,750 rpm", torque: "18.74 Nm @ 8,000 rpm", seats: 2, extra: [["Kerb weight", "158 kg"], ["Front brake", "Disc with ABS"]] }
        ] },
      { id: "pulsar-150", name: "Pulsar 150", gen: "BS6 / current", from: 2020, to: null, body: "Commuter",
        variants: [
          { name: "149.5 cc", fuel: "Petrol", cc: 149.5, engine: "149.5 cc air-cooled SOHC 2-valve single, fuel injected", trans: "5-speed manual", power: "14 PS @ 8,500 rpm", torque: "13.25 Nm @ 6,500 rpm", seats: 2, extra: [["Kerb weight", "148 kg"]] }
        ] },
      { id: "dominar-400", name: "Dominar 400", gen: "current", from: 2019, to: null, body: "Sport tourer",
        variants: [
          { name: "373.3 cc liquid-cooled", fuel: "Petrol", cc: 373.3, engine: "373.3 cc liquid-cooled DOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "40 PS @ 8,800 rpm", torque: "35 Nm @ 6,500 rpm", seats: 2, extra: [["Kerb weight", "193 kg"], ["Front brake", "Dual disc with ABS"]] }
        ] }
    ] },

    { id: "ktm", name: "KTM", type: "bike", models: [
      { id: "duke-200", name: "200 Duke", gen: "current", from: 2024, to: null, body: "Naked street bike",
        variants: [
          { name: "199.5 cc liquid-cooled", fuel: "Petrol", cc: 199.5, engine: "199.5 cc liquid-cooled DOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "25 PS @ 10,000 rpm", torque: "19.2 Nm @ 8,000 rpm", seats: 2, extra: [["Front brake", "Disc with ABS"]] }
        ] },
      { id: "duke-390", name: "390 Duke", gen: "2024 (LC4c)", from: 2024, to: null, body: "Naked street bike",
        variants: [
          { name: "398.6 cc liquid-cooled", fuel: "Petrol", cc: 398.63, engine: "398.6 cc liquid-cooled DOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "46 PS @ 8,500 rpm", torque: "39 Nm @ 6,500 rpm", seats: 2, extra: [["Seat height", "820 mm"], ["Front brake", "Disc with cornering ABS"]] }
        ] }
    ] },

    { id: "tvs", name: "TVS", type: "bike", models: [
      { id: "apache-rtr-160-4v", name: "Apache RTR 160 4V", gen: "current", from: 2021, to: null, body: "Sport commuter",
        variants: [
          { name: "159.7 cc oil-cooled", fuel: "Petrol", cc: 159.7, engine: "159.7 cc oil-cooled SOHC 4-valve single, fuel injected", trans: "5-speed manual", power: "17.55 PS @ 9,250 rpm", torque: "14.73 Nm @ 7,250 rpm", seats: 2, extra: [["Front brake", "Disc with ABS"]] }
        ] },
      { id: "apache-rtr-200-4v", name: "Apache RTR 200 4V", gen: "current", from: 2021, to: null, body: "Naked street bike",
        variants: [
          { name: "197.75 cc oil-cooled", fuel: "Petrol", cc: 197.75, engine: "197.75 cc oil-cooled SOHC 4-valve single, fuel injected", trans: "5-speed manual", power: "20.8 PS @ 9,000 rpm", torque: "17.25 Nm @ 7,250 rpm", seats: 2, extra: [["Ride modes", "Sport / Urban / Rain"]] }
        ] },
      { id: "apache-rr-310", name: "Apache RR 310", gen: "current", from: 2021, to: null, body: "Sport bike",
        variants: [
          { name: "312.2 cc liquid-cooled", fuel: "Petrol", cc: 312.2, engine: "312.2 cc liquid-cooled DOHC 4-valve single (reverse-inclined), fuel injected", trans: "6-speed manual", power: "34 PS @ 9,700 rpm", torque: "27.3 Nm @ 7,700 rpm", seats: 2, extra: [["Ride modes", "Urban / Sport / Track / Rain"]] }
        ] }
    ] },

    { id: "honda-bike", name: "Honda (two-wheelers)", type: "bike", models: [
      { id: "cb350", name: "CB350 (H'ness)", gen: "current", from: 2020, to: null, body: "Retro roadster",
        variants: [
          { name: "348.36 cc", fuel: "Petrol", cc: 348.36, engine: "348.36 cc air-cooled SOHC single, fuel injected", trans: "5-speed manual", power: "21.07 PS @ 5,500 rpm", torque: "30 Nm @ 3,000 rpm", seats: 2, extra: [["Kerb weight", "181 kg"]] }
        ] },
      { id: "cb350rs", name: "CB350RS", gen: "current", from: 2021, to: null, body: "Scrambler",
        variants: [
          { name: "348.36 cc", fuel: "Petrol", cc: 348.36, engine: "348.36 cc air-cooled SOHC single, fuel injected", trans: "5-speed manual", power: "21.07 PS @ 5,500 rpm", torque: "30 Nm @ 3,000 rpm", seats: 2, extra: [["Kerb weight", "179 kg"]] }
        ] },
      { id: "shine-125", name: "Shine 125", gen: "BS6 / current", from: 2020, to: null, body: "Commuter",
        variants: [
          { name: "123.94 cc", fuel: "Petrol", cc: 123.94, engine: "123.94 cc air-cooled SOHC 2-valve single, fuel injected", trans: "5-speed manual", power: "10.59 PS @ 7,500 rpm", torque: "11 Nm @ 6,000 rpm", seats: 2, extra: [["Kerb weight", "114 kg"]] }
        ] },
      { id: "hornet-2", name: "Hornet 2.0", gen: "current", from: 2020, to: null, body: "Naked street bike",
        variants: [
          { name: "184.4 cc", fuel: "Petrol", cc: 184.4, engine: "184.4 cc air-cooled SOHC 4-valve single, fuel injected", trans: "5-speed manual", power: "17.26 PS @ 8,500 rpm", torque: "16.1 Nm @ 6,000 rpm", seats: 2, extra: [["Front brake", "Disc with ABS"]] }
        ] }
    ] },

    { id: "hero", name: "Hero", type: "bike", models: [
      { id: "splendor-plus", name: "Splendor Plus", gen: "BS6 / current", from: 2020, to: null, body: "Commuter",
        variants: [
          { name: "97.2 cc", fuel: "Petrol", cc: 97.2, engine: "97.2 cc air-cooled OHC single, fuel injected", trans: "4-speed manual", power: "8.02 PS @ 8,000 rpm", torque: "8.05 Nm @ 6,000 rpm", seats: 2, extra: [["Kerb weight", "112 kg"]] }
        ] },
      { id: "xpulse-200-4v", name: "Xpulse 200 4V", gen: "current", from: 2021, to: null, body: "Dual-sport",
        variants: [
          { name: "199.6 cc", fuel: "Petrol", cc: 199.6, engine: "199.6 cc air-cooled SOHC 4-valve single, fuel injected", trans: "5-speed manual", power: "19.1 PS @ 8,500 rpm", torque: "17.35 Nm @ 6,500 rpm", seats: 2, extra: [["Seat height", "825 mm"], ["Kerb weight", "158 kg"]] }
        ] },
      { id: "karizma-xmr", name: "Karizma XMR", gen: "current", from: 2023, to: null, body: "Sport tourer",
        variants: [
          { name: "210 cc liquid-cooled", fuel: "Petrol", cc: 210, engine: "210 cc liquid-cooled DOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "25.5 PS @ 9,250 rpm", torque: "20.4 Nm @ 7,250 rpm", seats: 2, extra: [["Front brake", "Disc with ABS"]] }
        ] }
    ] },

    { id: "suzuki-bike", name: "Suzuki (two-wheelers)", type: "bike", models: [
      { id: "gixxer-sf-250", name: "Gixxer SF 250", gen: "current", from: 2021, to: null, body: "Sport bike",
        variants: [
          { name: "249 cc oil-cooled", fuel: "Petrol", cc: 249, engine: "249 cc oil-cooled SOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "26.5 PS @ 9,300 rpm", torque: "22.2 Nm @ 7,300 rpm", seats: 2, extra: [["Front brake", "Disc with ABS"]] }
        ] },
      { id: "gixxer-250", name: "Gixxer 250", gen: "current", from: 2021, to: null, body: "Naked street bike",
        variants: [
          { name: "249 cc oil-cooled", fuel: "Petrol", cc: 249, engine: "249 cc oil-cooled SOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "26.5 PS @ 9,300 rpm", torque: "22.2 Nm @ 7,300 rpm", seats: 2, extra: [["Front brake", "Disc with ABS"]] }
        ] },
      { id: "v-strom-sx", name: "V-Strom SX 250", gen: "current", from: 2022, to: null, body: "Adventure tourer",
        variants: [
          { name: "249 cc oil-cooled", fuel: "Petrol", cc: 249, engine: "249 cc oil-cooled SOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "26.5 PS @ 9,300 rpm", torque: "22.2 Nm @ 7,300 rpm", seats: 2, extra: [["Kerb weight", "167 kg"]] }
        ] }
    ] },

    { id: "kawasaki", name: "Kawasaki", type: "bike", models: [
      { id: "ninja-300", name: "Ninja 300", gen: "current", from: 2018, to: null, body: "Sport bike",
        variants: [
          { name: "296 cc parallel twin", fuel: "Petrol", cc: 296, engine: "296 cc liquid-cooled DOHC 8-valve parallel twin, fuel injected", trans: "6-speed manual", power: "39 PS @ 11,000 rpm", torque: "27 Nm @ 10,000 rpm", seats: 2, extra: [["Seat height", "785 mm"], ["Kerb weight", "179 kg"], ["Front brake", "Disc with ABS"]] }
        ] },
      { id: "ninja-400", name: "Ninja 400", gen: "current", from: 2018, to: null, body: "Sport bike",
        variants: [
          { name: "399 cc parallel twin", fuel: "Petrol", cc: 399, engine: "399 cc liquid-cooled DOHC 8-valve parallel twin, fuel injected", trans: "6-speed manual", power: "49 PS @ 10,000 rpm", torque: "38 Nm @ 8,000 rpm", seats: 2, extra: [["Kerb weight", "168 kg"]] }
        ] }
    ] },

    { id: "bmw-motorrad", name: "BMW Motorrad", type: "bike", models: [
      { id: "g310r", name: "G 310 R", gen: "current", from: 2021, to: null, body: "Naked street bike",
        variants: [
          { name: "313 cc", fuel: "Petrol", cc: 313, engine: "313 cc liquid-cooled DOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "34 PS @ 9,250 rpm", torque: "28 Nm @ 7,500 rpm", seats: 2, extra: [["Seat height", "785 mm"], ["Kerb weight", "164 kg"], ["Front brake", "Disc with ABS"]] }
        ] },
      { id: "g310gs", name: "G 310 GS", gen: "current", from: 2021, to: null, body: "Adventure tourer",
        variants: [
          { name: "313 cc", fuel: "Petrol", cc: 313, engine: "313 cc liquid-cooled DOHC 4-valve single, fuel injected", trans: "6-speed manual", power: "34 PS @ 9,250 rpm", torque: "28 Nm @ 7,500 rpm", seats: 2, extra: [["Seat height", "835 mm"], ["Kerb weight", "169.5 kg"]] }
        ] }
    ] },

    { id: "harley", name: "Harley-Davidson", type: "bike", models: [
      { id: "x440", name: "X440", gen: "1st generation", from: 2023, to: null, body: "Roadster",
        variants: [
          { name: "440 cc oil-cooled", fuel: "Petrol", cc: 440, engine: "440 cc oil-cooled SOHC single, fuel injected", trans: "6-speed manual", power: "27.4 PS @ 6,000 rpm", torque: "38 Nm @ 4,000 rpm", seats: 2, extra: [["Kerb weight", "190.5 kg"]] }
        ] }
    ] }
  ]
};

/* ============================================================
   DATABASE LOOKUP HELPERS
   Pure reads over the static table above. No value is ever
   synthesised here — a missing field stays missing.
   ============================================================ */
const VehicleDB = {
  brands(type) { return VEHICLE_DB.brands.filter(b => !type || b.type === type); },
  brand(id) { return VEHICLE_DB.brands.find(b => b.id === id) || null; },
  models(brandId, type) {
    const b = this.brand(brandId);
    if (!b) return [];
    if (type && b.type !== type) return [];
    return b.models;
  },
  model(brandId, modelId) { const b = this.brand(brandId); return b ? (b.models.find(m => m.id === modelId) || null) : null; },
  entry(brandId, modelId, variantIndex) {
    const m = this.model(brandId, modelId);
    if (!m) return null;
    const v = m.variants[variantIndex || 0];
    return v ? { brand: this.brand(brandId), model: m, variant: v, variantIndex: variantIndex || 0 } : null;
  },
  years(m) {
    if (!m) return [];
    const to = m.to || new Date().getFullYear();
    const out = [];
    for (let y = to; y >= m.from; y--) out.push(y);
    return out;
  },
  yearLabel(m) { return m.to ? (m.from === m.to ? String(m.from) : m.from + "–" + m.to) : m.from + "–present"; },
  /* Simple search across brand, model and engine text. */
  search(query, type) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    const hits = [];
    this.brands(type).forEach(b => {
      b.models.forEach(m => {
        m.variants.forEach((v, i) => {
          const hay = [b.name, m.name, m.gen, m.body, v.name, v.fuel, v.engine, v.cc].filter(Boolean).join(" ").toLowerCase();
          if (hay.indexOf(q) > -1) hits.push({ brand: b, model: m, variant: v, variantIndex: i });
        });
      });
    });
    return hits.slice(0, 40);
  },
  /* Best match for a brand/model/year the user typed by hand. Returns null
     rather than a guess when nothing lines up. */
  match(brandText, modelText, year, type) {
    const bq = String(brandText || "").trim().toLowerCase();
    const mq = String(modelText || "").trim().toLowerCase();
    if (!mq) return null;
    const y = Number(year) || null;
    let best = null;
    this.brands(type).forEach(b => {
      const brandHit = bq && (b.name.toLowerCase().indexOf(bq) > -1 || bq.indexOf(b.name.toLowerCase()) > -1);
      b.models.forEach(m => {
        const mName = m.name.toLowerCase();
        if (!(mName.indexOf(mq) > -1 || mq.indexOf(mName) > -1)) return;
        if (y && (y < m.from || (m.to && y > m.to))) return;
        const score = (brandHit ? 2 : 0) + (mName === mq ? 2 : 1) + (y ? 1 : 0);
        if (!best || score > best.score) best = { score, brand: b, model: m, variantIndex: 0 };
      });
    });
    if (!best) return null;
    return { brandId: best.brand.id, modelId: best.model.id, variantIndex: best.variantIndex, year: y };
  },

  /* Which of the requested information rows this entry can answer. */
  infoRows(entry, year) {
    const label = "Information unavailable";
    const v = entry && entry.variant ? entry.variant : {};
    const m = entry && entry.model ? entry.model : {};
    const b = entry && entry.brand ? entry.brand : {};
    const rows = [
      ["Brand", b.name],
      ["Model", m.name ? m.name + (m.gen ? " · " + m.gen : "") : null],
      ["Variant", v.name],
      ["Model year", year ? String(year) : null],
      ["Fuel type", v.fuel],
      ["Engine capacity", v.cc ? nfmt(v.cc) + " cc" : (v.extra ? (v.extra.find(e => e[0] === "Engine capacity") || [])[1] : null)],
      ["Engine", v.engine],
      ["Transmission", v.trans],
      ["Power", v.power],
      ["Torque", v.torque],
      ["Seating capacity", v.seats ? v.seats + (v.seats === 2 ? " (rider + pillion)" : " seats") : null],
      ["Dimensions (L × W × H)", v.dims],
      ["Body style", m.body],
      ["Image", null]
    ];
    const extras = (v.extra || []).filter(e => e[0] !== "Engine capacity");
    return { rows: rows.map(r => ({ label: r[0], value: r[1] || label, known: !!r[1] })), extras, missing: label };
  }
};
