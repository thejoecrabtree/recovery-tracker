// 12-Week Recovery Workout Program
// Based on Leander Athletic Club CrossFit/HYROX programming
// Modified for 5th metatarsal fracture recovery (Zone 1, right foot)
//
// Training day progression:
//   Weeks 1-2: 4 days (Mon/Tue/Thu/Fri)
//   Weeks 3-4: 5 days (+ Wed HYROX Foundational)
//   Weeks 5-8: 6 days (+ Sat HYROX Engine)
//   Weeks 9-12: 7 days (+ Sun Olympic Lifting)
//
// Strength percentages reference the user's effective 1RM (base + RPE adjustments).
// Sets use { pct, reps } where pct is decimal (0.55 = 55%).

// ─── WARM-UPS ───────────────────────────────────────────
const WARMUPS = {
  legs: {
    title: 'Leg Day Warm-up',
    duration: '7 min',
    movements: [
      '7 Min AMRAP:',
      ':30 Bike/Row/Ski OR 20 Jumping Jacks (no impact: seated bike)',
      '5 Cossack Squats (each side)',
      '10 Kang Squats (bodyweight)',
      '5/5 Deadbugs',
      '5/5 90/90 Switches',
    ],
  },
  upper: {
    title: 'Upper Body Warm-up',
    duration: '7 min',
    movements: [
      '7 Min AMRAP:',
      ':30 Bike/Row/Ski',
      '5 Scap Push-ups',
      '10 Band Pull-aparts',
      '5 Inchworms',
      '10 PVC Pass-throughs',
      ':30 Dead Hang',
    ],
  },
  posterior: {
    title: 'Posterior Chain Warm-up',
    duration: '7 min',
    movements: [
      '7 Min AMRAP:',
      ':30 Bike/Row/Ski',
      '10 Good Mornings (PVC/empty bar)',
      '10 Banded Hip Hinges',
      '5/5 Single-Leg RDL (bodyweight)',
      '5/5 Deadbugs',
    ],
  },
  shoulders: {
    title: 'Shoulders & Glutes Warm-up',
    duration: '7 min',
    movements: [
      '7 Min AMRAP:',
      ':30 Bike/Row/Ski',
      '5 Strict Press (empty bar)',
      '10 Band Pull-aparts',
      '10 Glute Bridges',
      '5/5 World\'s Greatest Stretch',
    ],
  },
  hyrox: {
    title: 'HYROX Warm-up',
    duration: '8 min',
    movements: [
      '400m Row or 1:00 Bike',
      '10 Air Squats',
      '10 Push-ups',
      '10 Ring Rows',
      '200m Row or :30 Bike',
      '5 Burpees (no-jump: up-downs)',
    ],
  },
  oly: {
    title: 'Olympic Lifting Warm-up',
    duration: '10 min',
    movements: [
      '3 Rounds with empty bar:',
      '5 Muscle Cleans',
      '5 Front Squats',
      '5 Push Press',
      '5 Snatch Grip RDL',
      '5 Overhead Squats',
      'Then: 3x3 Power Clean build-up',
    ],
  },
};

// ─── COOLDOWNS ──────────────────────────────────────────
const COOLDOWNS = {
  legs: {
    title: 'Lower Body Mobility',
    movements: [
      '1 min Couch Stretch (each side)',
      '1 min Quad Smash (each side)',
      '1 min Forward Fold',
      '1 min Calf Stretch on Wall (each)',
      '2 min Foam Roll lower body',
    ],
  },
  upper: {
    title: 'Upper Body Mobility',
    movements: [
      '1 min Doorway Pec Stretch (each)',
      '1 min Overhead Lat Stretch (each)',
      '1 min Cross-body Shoulder (each)',
      '2 min Foam Roll upper back',
    ],
  },
  posterior: {
    title: 'Posterior Chain Mobility',
    movements: [
      '1 min Pigeon Stretch (each side)',
      '1 min Seated Hamstring Stretch (each)',
      '1 min Cat-Cow x 10',
      '2 min Foam Roll glutes & hamstrings',
    ],
  },
  shoulders: {
    title: 'Shoulder & Hip Mobility',
    movements: [
      '1 min Puppy Dog Stretch',
      '1 min Thread the Needle (each)',
      '1 min Figure-4 Stretch (each)',
      '1 min Banded Shoulder Distraction (each)',
    ],
  },
  general: {
    title: 'General Cooldown',
    movements: [
      '2 min easy Bike/Row',
      '1 min Forward Fold',
      '1 min Child\'s Pose',
      '1 min Scorpion Stretch (each)',
    ],
  },
};

// ─── FOOT REHAB ─────────────────────────────────────────
const REHAB = {
  daily: {
    title: '5th Metatarsal Rehab (Daily)',
    movements: [
      'Towel scrunches: 3x20',
      'Marble pickups: 2 min',
      'Calf raises (seated): 3x15',
      'Ankle alphabet: 2 sets',
      'Banded ankle dorsiflexion: 2x15',
    ],
  },
  moderate: {
    title: '5th Metatarsal Rehab (3-4x/week)',
    movements: [
      'Single-leg balance: 3x30s (each)',
      'Calf raises (standing): 3x15',
      'Banded ankle eversion: 2x15',
      'Bosu ball balance: 2x30s',
      'Towel scrunches: 2x20',
    ],
  },
  maintenance: {
    title: 'Foot Maintenance (2-3x/week)',
    movements: [
      'Single-leg balance on unstable surface: 2x30s',
      'Standing calf raises: 3x12',
      'Lateral band walks: 2x15 each',
    ],
  },
};

function getRehab(wk) {
  if (wk <= 4) return REHAB.daily;
  if (wk <= 8) return REHAB.moderate;
  return REHAB.maintenance;
}

// ─── FUNCTIONAL PUMPS ───────────────────────────────────
const PUMPS = {
  legsA: {
    title: 'Functional Pumps — Legs A',
    scheme: 'E4MOM x 3 Sets @ RPE 7-8',
    movements: [
      'KB/DB Sumo Squats x 12-15',
      'Rest :30',
      'DB Front Rack Split Squats x 6-10 each',
      'Slider Hamstring Curls x 10-12',
    ],
  },
  legsB: {
    title: 'Functional Pumps — Legs B',
    scheme: 'E4MOM x 3 Sets @ RPE 7-8',
    movements: [
      'Goblet Squats x 12-15',
      'Rest :30',
      'Walking Lunges x 10 each (no impact: stationary)',
      'Leg Extensions or Wall Sit x 30-45s',
    ],
  },
  pushPullA: {
    title: 'Functional Pumps — Push + Pull A',
    scheme: 'E4MOM x 3 Sets @ RPE 7-8',
    movements: [
      'DB Bench Press x 10-12',
      'Rest :30',
      'Bent-over DB Row x 10-12',
      'DB Lateral Raise x 12-15',
    ],
  },
  pushPullB: {
    title: 'Functional Pumps — Push + Pull B',
    scheme: 'E4MOM x 3 Sets @ RPE 7-8',
    movements: [
      'DB Incline Press x 10-12',
      'Rest :30',
      'Single-Arm DB Row x 10-12 each',
      'Cable Face Pulls x 12-15',
    ],
  },
  backBicepsA: {
    title: 'Functional Pumps — Back + Biceps A',
    scheme: 'E4MOM x 3 Sets @ RPE 7-8',
    movements: [
      'Pendlay Rows x 8-10',
      'Rest :30',
      'DB Hammer Curls x 10-12',
      'Banded Face Pulls x 15',
    ],
  },
  backBicepsB: {
    title: 'Functional Pumps — Back + Biceps B',
    scheme: 'E4MOM x 3 Sets @ RPE 7-8',
    movements: [
      'Cable/Band Lat Pulldowns x 10-12',
      'Rest :30',
      'DB Bicep Curls x 10-12',
      'Reverse Flyes x 12-15',
    ],
  },
  shouldersGlutesA: {
    title: 'Functional Pumps — Shoulders + Glutes A',
    scheme: 'E4MOM x 3 Sets @ RPE 7-8',
    movements: [
      'DB Arnold Press x 10-12',
      'Rest :30',
      'Banded Glute Bridges x 15-20',
      'DB Lateral Raise x 12-15',
    ],
  },
  shouldersGlutesB: {
    title: 'Functional Pumps — Shoulders + Glutes B',
    scheme: 'E4MOM x 3 Sets @ RPE 7-8',
    movements: [
      'Z-Press x 8-10',
      'Rest :30',
      'Bulgarian Split Squat x 8-10 each',
      'Banded Pull-aparts x 15-20',
    ],
  },
};

// ─── METCONS (Real Leander AC WODs) ────────────────────
const METCONS = {
  anger: {
    name: 'Anger',
    format: 'intervals',
    description: '2 x 4 min AMRAP, 2 min rest between',
    rx: [
      'Set 1 (4 min AMRAP):',
      '10 DB/KB Alt. Goblet Step-ups (50/35) (24")',
      '10 Burpee Box Get-overs (24") [Sub: Up-downs]',
      '',
      'Rest 2 min',
      '',
      'Set 2 (4 min AMRAP):',
      '12 Alt. DB/KB Snatch (50/35)',
      '12 Alt. Russian KB/DB Swings',
    ],
    scaled: [
      'Set 1 (4 min AMRAP):',
      '10 DB Goblet Step-ups (lighter / BW)',
      '8 Burpee Step-overs [Sub: Up-downs]',
      '',
      'Rest 2 min',
      '',
      'Set 2 (4 min AMRAP):',
      '10 Alt. DB Hang Snatch (lighter)',
      '10 Russian KB/DB Swings (lighter)',
    ],
    timeSeconds: 600,
    target: '~2.5 rounds each set',
  },
  pita: {
    name: 'Pita',
    format: 'forTime',
    description: 'For Time (12 min cap)',
    rx: [
      '21-15-9:',
      'DB Thrusters (50/35)',
      'Pull-ups (sub: Ring Rows)',
      'Bike/Row Cal [Sub: no running]',
    ],
    scaled: [
      '21-15-9:',
      'DB Thrusters (lighter)',
      'Ring Rows',
      'Bike/Row Cal',
    ],
    timeSeconds: 720,
    target: '< 10 min',
  },
  sadness: {
    name: 'Sadness',
    format: 'amrap',
    description: '12 min AMRAP',
    rx: [
      '12 min AMRAP:',
      '15 Wall Balls (20/14)',
      '12 DB Step-overs (50/35) [Sub: Step-ups]',
      '9 Toes-to-Bar (sub: Knee Raises)',
    ],
    scaled: [
      '12 min AMRAP:',
      '12 Wall Balls (14/10)',
      '10 DB Step-ups (lighter)',
      '9 Hanging Knee Raises',
    ],
    timeSeconds: 720,
    target: '4+ rounds',
  },
  wonderBread: {
    name: 'Wonder Bread',
    format: 'forTime',
    description: 'For Time (15 min cap)',
    rx: [
      '5 Rounds:',
      '10 Deadlifts (135/95)',
      '10 Hang Power Cleans (135/95)',
      '15/12 Cal Row [Sub: no running]',
    ],
    scaled: [
      '5 Rounds:',
      '8 Deadlifts (95/65)',
      '8 Hang Power Cleans (95/65)',
      '12/10 Cal Row',
    ],
    timeSeconds: 900,
    target: '< 13 min',
  },
  joy: {
    name: 'Joy',
    format: 'amrap',
    description: '15 min AMRAP',
    rx: [
      '15 min AMRAP:',
      '10 DB Snatches (50/35)',
      '10 Box Step-ups (24") [Sub: no box jumps]',
      '10 Push-ups',
      '200m Row [Sub: no running]',
    ],
    scaled: [
      '15 min AMRAP:',
      '10 DB Snatches (lighter)',
      '10 Box Step-ups (20")',
      '10 Push-ups (from knees)',
      '200m Row',
    ],
    timeSeconds: 900,
    target: '4+ rounds',
  },
  ciabatta: {
    name: 'Ciabatta',
    format: 'forTime',
    description: 'For Time (12 min cap)',
    rx: [
      '3 Rounds:',
      '12 Front Squats (95/65)',
      '12 Bar-facing Burpees [Sub: Up-downs]',
      '12 Chest-to-Bar Pull-ups (sub: Pull-ups/Ring Rows)',
    ],
    scaled: [
      '3 Rounds:',
      '12 Front Squats (65/45)',
      '12 Up-downs',
      '12 Ring Rows',
    ],
    timeSeconds: 720,
    target: '< 10 min',
  },
  annie: {
    name: 'Annie',
    format: 'forTime',
    description: 'For Time',
    rx: [
      '50-40-30-20-10:',
      'Penguin Taps [Sub: no DU until Wk 11]',
      'Sit-ups',
    ],
    scaled: [
      '50-40-30-20-10:',
      'Penguin Taps',
      'Sit-ups',
    ],
    timeSeconds: 600,
    target: '< 8 min',
  },
  disgust: {
    name: 'Disgust',
    format: 'amrap',
    description: '10 min AMRAP',
    rx: [
      '10 min AMRAP:',
      '8 Hang Power Cleans (115/80)',
      '8 Front Squats (115/80)',
      '8 Shoulder-to-Overhead (115/80)',
    ],
    scaled: [
      '10 min AMRAP:',
      '8 Hang Power Cleans (75/55)',
      '8 Front Squats (75/55)',
      '8 Push Press (75/55)',
    ],
    timeSeconds: 600,
    target: '4+ rounds',
  },
  dt: {
    name: 'DT',
    format: 'forTime',
    description: 'For Time (10 min cap)',
    rx: [
      '5 Rounds:',
      '12 Deadlifts (155/105)',
      '9 Hang Power Cleans (155/105)',
      '6 Push Jerks (155/105)',
    ],
    scaled: [
      '5 Rounds:',
      '12 Deadlifts (95/65)',
      '9 Hang Power Cleans (95/65)',
      '6 Push Jerks (95/65)',
    ],
    timeSeconds: 600,
    target: '< 8 min',
  },
  austinPowers: {
    name: 'Austin Powers',
    format: 'forTime',
    description: 'For Time (15 min cap)',
    rx: [
      '3 Rounds:',
      '15 Power Cleans (95/65)',
      '15 Box Step-overs (24") [Sub: step-ups]',
      '15/12 Cal Bike/Row [Sub: no running]',
    ],
    scaled: [
      '3 Rounds:',
      '12 Power Cleans (65/45)',
      '12 Box Step-ups (20")',
      '12/10 Cal Bike/Row',
    ],
    timeSeconds: 900,
    target: '< 12 min',
  },
  merryLiftmas: {
    name: 'Merry Liftmas',
    format: 'forTime',
    description: 'For Time (20 min cap)',
    rx: [
      '1-2-3-4-5-6-7-8-9-10:',
      'Thrusters (95/65)',
      'Bar Muscle-ups (sub: C2B / Pull-ups)',
      '*200m Row after each round [Sub: no running]',
    ],
    scaled: [
      '1-2-3-4-5-6-7-8-9-10:',
      'Thrusters (65/45)',
      'Pull-ups (or Ring Rows)',
      '*200m Row after each round',
    ],
    timeSeconds: 1200,
    target: '< 18 min',
  },
  sourdough: {
    name: 'Sourdough',
    format: 'amrap',
    description: '14 min AMRAP',
    rx: [
      '14 min AMRAP:',
      '8 Deadlifts (185/125)',
      '6 Hang Cleans (185/125)',
      '4 Shoulder-to-Overhead (185/125)',
      '200m Row [Sub: no running]',
    ],
    scaled: [
      '14 min AMRAP:',
      '8 Deadlifts (115/80)',
      '6 Hang Cleans (115/80)',
      '4 Push Press (115/80)',
      '200m Row',
    ],
    timeSeconds: 840,
    target: '4+ rounds',
  },
  chipsAndSalsa: {
    name: 'Chips & Salsa',
    format: 'intervals',
    description: 'Tabata (8 rounds of :20 work/:10 rest per station)',
    rx: [
      'Tabata Rotation (8 rounds each):',
      'Station 1: DB Thrusters',
      'Station 2: Bike Calories',
      'Station 3: KB Swings',
      'Station 4: Row Calories',
      '1 min rest between stations',
    ],
    scaled: [
      'Tabata Rotation (8 rounds each):',
      'Station 1: DB Thrusters (lighter)',
      'Station 2: Bike Calories',
      'Station 3: KB Swings (lighter)',
      'Station 4: Row Calories',
      '1 min rest between stations',
    ],
    timeSeconds: 1200,
    target: 'Max cals/reps each station',
  },
  fearFactor: {
    name: 'Fear Factor',
    format: 'forTime',
    description: 'For Time (12 min cap)',
    rx: [
      '21-15-9:',
      'Cal Row',
      'Burpees [Sub: Up-downs / Sprawls by phase]',
      'DB Devil Press (50/35)',
    ],
    scaled: [
      '21-15-9:',
      'Cal Row',
      'Up-downs',
      'DB Devil Press (35/20)',
    ],
    timeSeconds: 720,
    target: '< 10 min',
  },
  survivor: {
    name: 'Survivor',
    format: 'amrap',
    description: '16 min AMRAP',
    rx: [
      '16 min AMRAP:',
      '15 Wall Balls (20/14)',
      '10 Toes-to-Bar (sub: Knee Raises)',
      '5 Power Cleans (155/105)',
      '250m Row [Sub: no running]',
    ],
    scaled: [
      '16 min AMRAP:',
      '12 Wall Balls (14/10)',
      '10 Hanging Knee Raises',
      '5 Power Cleans (95/65)',
      '250m Row',
    ],
    timeSeconds: 960,
    target: '4+ rounds',
  },
  ouch: {
    name: 'Ouch',
    format: 'forTime',
    description: 'For Time (15 min cap)',
    rx: [
      '4 Rounds:',
      '10 Hang Power Snatches (75/55)',
      '10 Overhead Squats (75/55)',
      '200m Row [Sub: no running]',
    ],
    scaled: [
      '4 Rounds:',
      '8 Hang Power Snatches (55/35)',
      '8 Overhead Squats (55/35)',
      '200m Row',
    ],
    timeSeconds: 900,
    target: '< 12 min',
  },
  sandstorm: {
    name: 'Sandstorm',
    format: 'amrap',
    description: '12 min AMRAP',
    rx: [
      '12 min AMRAP:',
      '12 KB Swings (53/35)',
      '9 Box Step-ups (24") [Sub: no jumps]',
      '6 Ring Dips (sub: Push-ups)',
      '3 Rope Climbs (sub: 6 Strict Pull-ups)',
    ],
    scaled: [
      '12 min AMRAP:',
      '12 KB Swings (35/26)',
      '9 Box Step-ups (20")',
      '6 Push-ups',
      '6 Ring Rows',
    ],
    timeSeconds: 720,
    target: '4+ rounds',
  },
  barbellBanger: {
    name: 'Barbell Banger',
    format: 'forTime',
    description: 'For Time (15 min cap)',
    rx: [
      '3 Rounds:',
      '9 Power Cleans (135/95)',
      '7 Front Squats (135/95)',
      '5 Shoulder-to-Overhead (135/95)',
      '250m Row [Sub: no running]',
    ],
    scaled: [
      '3 Rounds:',
      '9 Power Cleans (85/55)',
      '7 Front Squats (85/55)',
      '5 Push Press (85/55)',
      '250m Row',
    ],
    timeSeconds: 900,
    target: '< 12 min',
  },
  fishAndChips: {
    name: 'Fish & Chips',
    format: 'amrap',
    description: '15 min AMRAP',
    rx: [
      '15 min AMRAP:',
      '12 Cal Bike',
      '10 DB Hang Clean & Jerks (50/35)',
      '8 Burpee Box Step-ups (24") [Sub: up-down step-ups]',
    ],
    scaled: [
      '15 min AMRAP:',
      '10 Cal Bike',
      '8 DB Hang Clean & Jerks (35/20)',
      '8 Up-down Step-ups (20")',
    ],
    timeSeconds: 900,
    target: '5+ rounds',
  },
};

// ─── HYROX SESSIONS ─────────────────────────────────────
const HYROX = {
  foundational37: {
    title: 'HYROX Foundational #37',
    description: 'Zone 2 Conditioning + Station Prep',
    movements: [
      '4 Rounds:',
      '500m Row (Zone 2)',
      '15 Wall Balls (20/14)',
      '200m Bike [Sub: no sled/run until indicated]',
      '15 KB Swings (53/35)',
      'Rest 2:00 between rounds',
    ],
    timeSeconds: 2400,
  },
  foundational39: {
    title: 'HYROX Foundational #39',
    description: 'Station Endurance',
    movements: [
      '5 Rounds:',
      '400m Row',
      '10 Burpee Box Step-ups [Sub: up-down step-ups]',
      '15/12 Cal Bike',
      '12 DB Lunges (50/35) [Sub: stationary in Phase 1]',
      'Rest 1:30 between rounds',
    ],
    timeSeconds: 2400,
  },
  foundational44: {
    title: 'HYROX Foundational #44',
    description: 'Mixed Modality Conditioning',
    movements: [
      '3 Rounds:',
      '1000m Row',
      '20 Wall Balls (20/14)',
      '30 KB Swings (53/35)',
      '20 Box Step-ups (24")',
      'Rest 2:00 between rounds',
    ],
    timeSeconds: 3000,
  },
  engine49: {
    title: 'HYROX Engine #49',
    description: 'Race Simulation Intervals',
    movements: [
      '8 Rounds:',
      '250m Row (race pace)',
      '10 Wall Balls (20/14)',
      'Rest 1:00',
      '*Track split times',
    ],
    timeSeconds: 2400,
  },
  engine52: {
    title: 'HYROX Engine #52',
    description: 'Threshold Capacity',
    movements: [
      '4 Rounds:',
      '500m Row (hard effort)',
      '20 DB Lunges (50/35) [Sub: stationary lunges]',
      '15 Burpee Broad-jumps [Sub: Burpee step-overs]',
      '500m Bike',
      'Rest 2:00 between rounds',
    ],
    timeSeconds: 3000,
  },
  engine55: {
    title: 'HYROX Engine #55',
    description: 'Full Race Prep',
    movements: [
      '2 Rounds:',
      '1000m Row',
      '50 Wall Balls (20/14)',
      '500m Bike',
      '50 KB Swings (53/35)',
      '1000m Row',
      'Rest 3:00 between rounds',
    ],
    timeSeconds: 3600,
  },
};

// ─── OLY SESSIONS ───────────────────────────────────────
const OLY = {
  cleanComplex1: {
    title: 'Clean Complex',
    liftKey: 'powerClean',
    scheme: 'E2MOM x 6 sets',
    description: '1 Power Clean + 1 Hang Squat Clean + 1 Push Jerk',
    notes: 'Build across sets. Hang position only in Phase 2.',
  },
  cleanComplex2: {
    title: 'Clean & Jerk Complex',
    liftKey: 'powerClean',
    scheme: 'E2MOM x 5 sets',
    description: '1 Squat Clean + 1 Front Squat + 1 Split Jerk',
    notes: 'Build to heavy single. Full lifts from floor in Phase 3.',
  },
  snatchWork1: {
    title: 'Snatch Singles',
    liftKey: 'snatch',
    scheme: 'E1.5MOM x 8 sets',
    description: '1 Power Snatch (from hang in Phase 1-2, from floor Phase 3)',
    notes: 'Build to a heavy single. Focus on positions.',
  },
  snatchWork2: {
    title: 'Snatch Complex',
    liftKey: 'snatch',
    scheme: 'E2MOM x 6 sets',
    description: '1 Snatch Pull + 1 Power Snatch + 1 Overhead Squat',
    notes: 'Build across sets. Moderate loads.',
  },
};

// ─── HELPER: Build strength section ─────────────────────
function strength(title, liftKey, scheme, sets) {
  return { type: 'strength', title, liftKey, scheme, sets };
}

// ─── HELPER: Build percentage sets for a phase/week ─────
// Phase 1 (Wk 1-4): 6x6, build from ~45% to top%
// Phase 2 (Wk 5-8): 5x5, build from ~55% to top%
// Phase 3 (Wk 9-12): 4x3/3x3/2x2/test
function sqSets(wk) {
  if (wk === 1) return sixSets(0.45, 0.55, 0.55, 0.60, 0.60, 0.65);
  if (wk === 2) return sixSets(0.50, 0.55, 0.60, 0.60, 0.65, 0.67);
  if (wk === 3) return sixSets(0.50, 0.57, 0.62, 0.62, 0.67, 0.70);
  if (wk === 4) return sixSets(0.45, 0.50, 0.55, 0.55, 0.60, 0.60); // deload
  if (wk === 5) return fiveSets(0.55, 0.62, 0.67, 0.70, 0.72);
  if (wk === 6) return fiveSets(0.57, 0.65, 0.70, 0.75, 0.77);
  if (wk === 7) return fiveSets(0.60, 0.67, 0.72, 0.77, 0.80);
  if (wk === 8) return fiveSets(0.50, 0.55, 0.60, 0.62, 0.65); // deload
  if (wk === 9) return fourTrips(0.65, 0.72, 0.80, 0.85);
  if (wk === 10) return threeTrips(0.70, 0.80, 0.87);
  if (wk === 11) return twoPairs(0.80, 0.90);
  return []; // wk 12 = test
}

function sixSets(a, b, c, d, e, f) {
  return [a, b, c, d, e, f].map((p, i) => ({ pct: p, reps: 6, set: i + 1 }));
}
function fiveSets(a, b, c, d, e) {
  return [a, b, c, d, e].map((p, i) => ({ pct: p, reps: 5, set: i + 1 }));
}
function fourTrips(a, b, c, d) {
  return [a, b, c, d].map((p, i) => ({ pct: p, reps: 3, set: i + 1 }));
}
function threeTrips(a, b, c) {
  return [a, b, c].map((p, i) => ({ pct: p, reps: 3, set: i + 1 }));
}
function twoPairs(a, b) {
  return [a, b].map((p, i) => ({ pct: p, reps: 2, set: i + 1 }));
}

// Similar helpers for other lifts (same periodization model, different starting %)
function dlSets(wk) { return sqSets(wk); } // deadlift follows same progression
function benchSets(wk) { return sqSets(wk); }
function ppSets(wk) { return sqSets(wk); }
function htSets(wk) { return sqSets(wk); }

function olyPcts(wk) {
  // Olympic lifts use lighter percentages
  if (wk <= 4) return [0.50, 0.55, 0.57, 0.60, 0.62, 0.65].map((p, i) => ({ pct: p, reps: 1, set: i + 1 }));
  if (wk <= 8) return [0.55, 0.60, 0.65, 0.70, 0.72].map((p, i) => ({ pct: p, reps: 1, set: i + 1 }));
  return [0.60, 0.67, 0.72, 0.77, 0.80].map((p, i) => ({ pct: p, reps: 1, set: i + 1 }));
}

// ─── METCON ROTATION ────────────────────────────────────
// Each day type has its own metcon pool that rotates across weeks
const METCON_POOLS = {
  monday: ['anger', 'sadness', 'joy', 'annie', 'sandstorm', 'fishAndChips', 'anger', 'sadness', 'joy', 'annie', 'sandstorm', 'fishAndChips'],
  tuesday: ['pita', 'ciabatta', 'fearFactor', 'chipsAndSalsa', 'pita', 'ciabatta', 'fearFactor', 'chipsAndSalsa', 'pita', 'ciabatta', 'fearFactor', 'chipsAndSalsa'],
  thursday: ['wonderBread', 'disgust', 'sourdough', 'dt', 'wonderBread', 'disgust', 'sourdough', 'dt', 'wonderBread', 'disgust', 'sourdough', 'dt'],
  friday: ['austinPowers', 'barbellBanger', 'survivor', 'ouch', 'austinPowers', 'barbellBanger', 'survivor', 'ouch', 'austinPowers', 'barbellBanger', 'survivor', 'ouch'],
  sunday: ['merryLiftmas', 'sourdough', 'disgust', 'barbellBanger', 'merryLiftmas', 'sourdough', 'disgust', 'barbellBanger', 'dt', 'ouch', 'barbellBanger', 'merryLiftmas'],
};

const HYROX_POOLS = {
  wednesday: ['foundational37', 'foundational39', 'foundational44', 'foundational37', 'foundational39', 'foundational44', 'foundational37', 'foundational39', 'foundational44', 'foundational37', 'foundational39', 'foundational44'],
  saturday: ['engine49', 'engine52', 'engine55', 'engine49', 'engine52', 'engine55', 'engine49', 'engine52', 'engine55', 'engine49', 'engine52', 'engine55'],
};

const OLY_POOLS = ['cleanComplex1', 'snatchWork1', 'cleanComplex2', 'snatchWork2', 'cleanComplex1', 'snatchWork1', 'cleanComplex2', 'snatchWork2', 'cleanComplex1', 'snatchWork1', 'cleanComplex2', 'snatchWork2'];

const PUMP_ROTATION = {
  monday: ['legsA', 'legsB', 'legsA', 'legsB', 'legsA', 'legsB', 'legsA', 'legsB', 'legsA', 'legsB', 'legsA', 'legsB'],
  tuesday: ['pushPullA', 'pushPullB', 'pushPullA', 'pushPullB', 'pushPullA', 'pushPullB', 'pushPullA', 'pushPullB', 'pushPullA', 'pushPullB', 'pushPullA', 'pushPullB'],
  thursday: ['backBicepsA', 'backBicepsB', 'backBicepsA', 'backBicepsB', 'backBicepsA', 'backBicepsB', 'backBicepsA', 'backBicepsB', 'backBicepsA', 'backBicepsB', 'backBicepsA', 'backBicepsB'],
  friday: ['shouldersGlutesA', 'shouldersGlutesB', 'shouldersGlutesA', 'shouldersGlutesB', 'shouldersGlutesA', 'shouldersGlutesB', 'shouldersGlutesA', 'shouldersGlutesB', 'shouldersGlutesA', 'shouldersGlutesB', 'shouldersGlutesA', 'shouldersGlutesB'],
};

// ─── GENERATE WEEKLY PROGRAM ────────────────────────────
function buildWeek(wk) {
  const wi = wk - 1; // 0-based index for pool arrays
  const rehab = getRehab(wk);
  const isTest = wk === 12;
  const isDeload = wk === 4 || wk === 8;

  // Determine active days for this week
  let activeDays; // dayIndex values (0=Mon ... 6=Sun)
  if (wk <= 2) activeDays = [0, 1, 3, 4]; // Mon Tue Thu Fri
  else if (wk <= 4) activeDays = [0, 1, 2, 3, 4]; // + Wed
  else if (wk <= 8) activeDays = [0, 1, 2, 3, 4, 5]; // + Sat
  else activeDays = [0, 1, 2, 3, 4, 5, 6]; // + Sun

  const days = [];
  for (let d = 0; d < 7; d++) {
    if (!activeDays.includes(d)) {
      days.push({
        dayIndex: d,
        isRestDay: true,
        label: 'Rest Day',
        sections: [],
      });
      continue;
    }

    const sections = [];
    let label = '';

    // ── MONDAY: Legs ──
    if (d === 0) {
      label = isTest ? 'Back Squat 1RM Test' : isDeload ? 'Legs (Deload)' : 'Legs — Back Squat';
      sections.push({ type: 'warmup', ...WARMUPS.legs });

      if (isTest) {
        sections.push({
          type: 'strength', title: 'Back Squat 1RM Test', liftKey: 'backSquat',
          scheme: 'Build to 1RM', sets: [
            { pct: 0.50, reps: 5, set: 1 }, { pct: 0.60, reps: 3, set: 2 },
            { pct: 0.70, reps: 2, set: 3 }, { pct: 0.80, reps: 1, set: 4 },
            { pct: 0.87, reps: 1, set: 5 }, { pct: 0.93, reps: 1, set: 6 },
            { pct: 0.97, reps: 1, set: 7 }, { pct: 1.0, reps: 1, set: 8 },
          ],
        });
      } else {
        const scheme = wk <= 4 ? 'E2MOM x 6 sets of 6' : wk <= 8 ? 'E2MOM x 5 sets of 5' : wk <= 10 ? 'E2MOM x 4 sets of 3' : 'E2MOM x 2 sets of 2';
        sections.push(strength('Back Squat', 'backSquat', scheme, sqSets(wk)));
      }

      sections.push({ type: 'accessory', ...PUMPS[PUMP_ROTATION.monday[wi]] });

      const metKey = METCON_POOLS.monday[wi];
      sections.push({ type: 'metcon', ...METCONS[metKey] });

      sections.push({ type: 'cooldown', ...COOLDOWNS.legs });
      sections.push({ type: 'rehab', ...rehab });
    }

    // ── TUESDAY: Upper Push/Pull ──
    if (d === 1) {
      label = isTest ? 'Bench Press 1RM Test' : isDeload ? 'Upper Body (Deload)' : 'Upper — Bench Press';
      sections.push({ type: 'warmup', ...WARMUPS.upper });

      if (isTest) {
        sections.push({
          type: 'strength', title: 'Bench Press 1RM Test', liftKey: 'bench',
          scheme: 'Build to 1RM', sets: [
            { pct: 0.50, reps: 5, set: 1 }, { pct: 0.60, reps: 3, set: 2 },
            { pct: 0.70, reps: 2, set: 3 }, { pct: 0.80, reps: 1, set: 4 },
            { pct: 0.87, reps: 1, set: 5 }, { pct: 0.93, reps: 1, set: 6 },
            { pct: 0.97, reps: 1, set: 7 }, { pct: 1.0, reps: 1, set: 8 },
          ],
        });
      } else {
        const scheme = wk <= 4 ? 'E2MOM x 6 sets of 6' : wk <= 8 ? 'E2MOM x 5 sets of 5' : wk <= 10 ? 'E2MOM x 4 sets of 3' : 'E2MOM x 2 sets of 2';
        sections.push(strength('Bench Press', 'bench', scheme, benchSets(wk)));
      }

      sections.push({ type: 'accessory', ...PUMPS[PUMP_ROTATION.tuesday[wi]] });

      const metKey = METCON_POOLS.tuesday[wi];
      sections.push({ type: 'metcon', ...METCONS[metKey] });

      sections.push({ type: 'cooldown', ...COOLDOWNS.upper });
      sections.push({ type: 'rehab', ...rehab });
    }

    // ── WEDNESDAY: HYROX Foundational ──
    if (d === 2) {
      label = 'HYROX Foundational';
      const hKey = HYROX_POOLS.wednesday[wi];
      const hSession = HYROX[hKey];
      sections.push({ type: 'warmup', ...WARMUPS.hyrox });
      sections.push({
        type: 'metcon',
        name: hSession.title,
        format: 'forTime',
        description: hSession.description,
        rx: hSession.movements,
        scaled: hSession.movements.map(m => m.replace(/\(.*?\)/g, '(lighter)')),
        timeSeconds: hSession.timeSeconds,
        target: 'Complete all rounds',
      });
      sections.push({ type: 'cooldown', ...COOLDOWNS.general });
      sections.push({ type: 'rehab', ...rehab });
    }

    // ── THURSDAY: Posterior Chain ──
    if (d === 3) {
      label = isTest ? 'Deadlift 1RM Test' : isDeload ? 'Posterior Chain (Deload)' : 'Posterior — Deadlift';
      sections.push({ type: 'warmup', ...WARMUPS.posterior });

      if (isTest) {
        sections.push({
          type: 'strength', title: 'Deadlift 1RM Test', liftKey: 'deadlift',
          scheme: 'Build to 1RM', sets: [
            { pct: 0.50, reps: 5, set: 1 }, { pct: 0.60, reps: 3, set: 2 },
            { pct: 0.70, reps: 2, set: 3 }, { pct: 0.80, reps: 1, set: 4 },
            { pct: 0.87, reps: 1, set: 5 }, { pct: 0.93, reps: 1, set: 6 },
            { pct: 0.97, reps: 1, set: 7 }, { pct: 1.0, reps: 1, set: 8 },
          ],
        });
      } else {
        const scheme = wk <= 4 ? 'E2MOM x 6 sets of 6' : wk <= 8 ? 'E2MOM x 5 sets of 5' : wk <= 10 ? 'E2MOM x 4 sets of 3' : 'E2MOM x 2 sets of 2';
        sections.push(strength('Deadlift', 'deadlift', scheme, dlSets(wk)));
      }

      sections.push({ type: 'accessory', ...PUMPS[PUMP_ROTATION.thursday[wi]] });

      const metKey = METCON_POOLS.thursday[wi];
      sections.push({ type: 'metcon', ...METCONS[metKey] });

      sections.push({ type: 'cooldown', ...COOLDOWNS.posterior });
      sections.push({ type: 'rehab', ...rehab });
    }

    // ── FRIDAY: Shoulders & Glutes ──
    if (d === 4) {
      label = isTest ? 'Push Press + Hip Thrust Test' : isDeload ? 'Shoulders & Glutes (Deload)' : 'Shoulders & Glutes';
      sections.push({ type: 'warmup', ...WARMUPS.shoulders });

      if (isTest) {
        sections.push({
          type: 'strength', title: 'Push Press 1RM Test', liftKey: 'pushPress',
          scheme: 'Build to 1RM', sets: [
            { pct: 0.50, reps: 5, set: 1 }, { pct: 0.60, reps: 3, set: 2 },
            { pct: 0.70, reps: 2, set: 3 }, { pct: 0.80, reps: 1, set: 4 },
            { pct: 0.87, reps: 1, set: 5 }, { pct: 0.93, reps: 1, set: 6 },
            { pct: 1.0, reps: 1, set: 7 },
          ],
        });
        sections.push({
          type: 'strength', title: 'Hip Thrust 1RM Test', liftKey: 'hipThrust',
          scheme: 'Build to 1RM', sets: [
            { pct: 0.50, reps: 5, set: 1 }, { pct: 0.60, reps: 3, set: 2 },
            { pct: 0.70, reps: 2, set: 3 }, { pct: 0.80, reps: 1, set: 4 },
            { pct: 0.90, reps: 1, set: 5 }, { pct: 1.0, reps: 1, set: 6 },
          ],
        });
      } else {
        const scheme = wk <= 4 ? 'E2MOM x 6 sets of 6' : wk <= 8 ? 'E2MOM x 5 sets of 5' : wk <= 10 ? 'E2MOM x 4 sets of 3' : 'E2MOM x 2 sets of 2';
        sections.push(strength('Push Press', 'pushPress', scheme, ppSets(wk)));
        sections.push(strength('Hip Thrust', 'hipThrust', scheme, htSets(wk)));
      }

      sections.push({ type: 'accessory', ...PUMPS[PUMP_ROTATION.friday[wi]] });

      const metKey = METCON_POOLS.friday[wi];
      sections.push({ type: 'metcon', ...METCONS[metKey] });

      sections.push({ type: 'cooldown', ...COOLDOWNS.shoulders });
      sections.push({ type: 'rehab', ...rehab });
    }

    // ── SATURDAY: HYROX Engine ──
    if (d === 5) {
      label = 'HYROX Engine';
      const hKey = HYROX_POOLS.saturday[wi];
      const hSession = HYROX[hKey];
      sections.push({ type: 'warmup', ...WARMUPS.hyrox });
      sections.push({
        type: 'metcon',
        name: hSession.title,
        format: 'forTime',
        description: hSession.description,
        rx: hSession.movements,
        scaled: hSession.movements.map(m => m.replace(/\(.*?\)/g, '(lighter)')),
        timeSeconds: hSession.timeSeconds,
        target: 'Complete all rounds',
      });
      sections.push({ type: 'cooldown', ...COOLDOWNS.general });
      sections.push({ type: 'rehab', ...rehab });
    }

    // ── SUNDAY: Olympic Lifting ──
    if (d === 6) {
      label = 'Olympic Lifting';
      const oKey = OLY_POOLS[wi];
      const oSession = OLY[oKey];
      sections.push({ type: 'warmup', ...WARMUPS.oly });
      sections.push({
        type: 'strength',
        title: oSession.title,
        liftKey: oSession.liftKey,
        scheme: oSession.scheme,
        sets: olyPcts(wk),
        notes: oSession.description + '. ' + oSession.notes,
      });

      const metKey = METCON_POOLS.sunday[wi];
      sections.push({ type: 'metcon', ...METCONS[metKey] });

      sections.push({ type: 'cooldown', ...COOLDOWNS.general });
      sections.push({ type: 'rehab', ...rehab });
    }

    // Add unique IDs to each section
    sections.forEach((s, i) => {
      s.id = `w${wk}d${d}-${s.type}${i}`;
    });

    days.push({ dayIndex: d, isRestDay: false, label, sections });
  }

  return {
    weekNumber: wk,
    phase: wk <= 4 ? 1 : wk <= 8 ? 2 : 3,
    trainingDays: activeDays.length,
    days,
  };
}

// ─── BUILD FULL PROGRAM ─────────────────────────────────
export const PROGRAM = {
  name: '12-Week Recovery Program',
  description: 'Based on Leander Athletic Club CrossFit/HYROX programming, modified for 5th metatarsal recovery',
  weeks: Array.from({ length: 12 }, (_, i) => buildWeek(i + 1)),
};
