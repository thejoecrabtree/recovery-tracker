// Exercise → YouTube video URL mapping.
// Keys are lowercase exercise names. The getVideoUrl() function does fuzzy matching
// by stripping reps, sets, and common prefixes from movement strings.

const VIDEOS = {
  // ─── WARM-UP MOVEMENTS ───────────────────────────
  'cossack squats': 'https://www.youtube.com/watch?v=tpczTeSkHz0',
  'kang squats': 'https://www.youtube.com/watch?v=EN6HAheRHYQ',
  'deadbugs': 'https://www.youtube.com/watch?v=I5xbsA71v1A',
  '90/90 switches': 'https://www.youtube.com/watch?v=dB1yGbUtQfM',
  'scap push-ups': 'https://www.youtube.com/watch?v=_FJOzz_MlSA',
  'band pull-aparts': 'https://www.youtube.com/watch?v=AWoqp7BreJA',
  'inchworms': 'https://www.youtube.com/watch?v=VSp3IFCdYUU',
  'pvc pass-throughs': 'https://www.youtube.com/watch?v=gSfNLRMmdWs',
  'dead hang': 'https://www.youtube.com/watch?v=mPzkkVRNpkE',
  'good mornings': 'https://www.youtube.com/watch?v=YA-h3n9L4YU',
  'banded hip hinges': 'https://www.youtube.com/watch?v=Bak-aWDKjpQ',
  'single-leg rdl': 'https://www.youtube.com/watch?v=_MSXKFbH3ek',
  'strict press': 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
  'glute bridges': 'https://www.youtube.com/watch?v=OUgsJ8-Vi0E',
  'world\'s greatest stretch': 'https://www.youtube.com/watch?v=u40hG6h0fJc',
  'air squats': 'https://www.youtube.com/watch?v=C_VtOYc6j5c',
  'push-ups': 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  'ring rows': 'https://www.youtube.com/watch?v=BxE5ELPTE3k',
  'burpees': 'https://www.youtube.com/watch?v=TU8QYVW0gDU',
  'muscle cleans': 'https://www.youtube.com/watch?v=97Q2B-USqKk',
  'front squats': 'https://www.youtube.com/watch?v=m4ytaCJZpl0',
  'push press': 'https://www.youtube.com/watch?v=X6-DMh-t4nQ',
  'snatch grip rdl': 'https://www.youtube.com/watch?v=Kv8VT4QK-gY',
  'overhead squats': 'https://www.youtube.com/watch?v=pn8M0O-K0I0',
  'power clean': 'https://www.youtube.com/watch?v=GVt3pUfcWFM',

  // ─── COOLDOWN / MOBILITY ─────────────────────────
  'couch stretch': 'https://www.youtube.com/watch?v=JawPBvtf7Qs',
  'quad smash': 'https://www.youtube.com/watch?v=7Yx_RH4KKDY',
  'forward fold': 'https://www.youtube.com/watch?v=g7jb3eJT-Gk',
  'calf stretch': 'https://www.youtube.com/watch?v=acE89Gm74Mw',
  'foam roll': 'https://www.youtube.com/watch?v=t7Gv_2LKHbM',
  'doorway pec stretch': 'https://www.youtube.com/watch?v=2BkXfkGjkWM',
  'overhead lat stretch': 'https://www.youtube.com/watch?v=FaYfMpjRRnI',
  'cross-body shoulder': 'https://www.youtube.com/watch?v=Jd1FOQN8FPg',
  'pigeon stretch': 'https://www.youtube.com/watch?v=_BR0DyPJwMU',
  'seated hamstring stretch': 'https://www.youtube.com/watch?v=FxvRFxrnKWk',
  'cat-cow': 'https://www.youtube.com/watch?v=kqnua4rHVVA',
  'puppy dog stretch': 'https://www.youtube.com/watch?v=J7kqgZs0OGo',
  'thread the needle': 'https://www.youtube.com/watch?v=WAFb4Bkebzg',
  'figure-4 stretch': 'https://www.youtube.com/watch?v=dqMkqe-Q-0U',
  'banded shoulder distraction': 'https://www.youtube.com/watch?v=8Lz8FqaFIGk',
  'child\'s pose': 'https://www.youtube.com/watch?v=2MJGg-dUKh0',
  'scorpion stretch': 'https://www.youtube.com/watch?v=L9bGH4twnCg',

  // ─── REHAB MOVEMENTS ─────────────────────────────
  'towel scrunches': 'https://www.youtube.com/watch?v=lHOe3WRb2yE',
  'marble pickups': 'https://www.youtube.com/watch?v=KQ_tkFjQ6qM',
  'calf raises': 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
  'ankle alphabet': 'https://www.youtube.com/watch?v=TSwgUmxEPi0',
  'banded ankle dorsiflexion': 'https://www.youtube.com/watch?v=Dug3D52ZP6w',
  'single-leg balance': 'https://www.youtube.com/watch?v=7fJrp3f8JBc',
  'banded ankle eversion': 'https://www.youtube.com/watch?v=Kv_y_RLOHFE',
  'bosu ball balance': 'https://www.youtube.com/watch?v=h5bvtPBGBno',
  'lateral band walks': 'https://www.youtube.com/watch?v=7b8Sj4XQ4bE',

  // ─── ACCESSORY MOVEMENTS ─────────────────────────
  'sumo squats': 'https://www.youtube.com/watch?v=_Z9hiJQ7ZiU',
  'goblet squats': 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
  'split squats': 'https://www.youtube.com/watch?v=mNbXPiWMd_c',
  'slider hamstring curls': 'https://www.youtube.com/watch?v=Q0gsh17CHWY',
  'walking lunges': 'https://www.youtube.com/watch?v=L8fvypPH3E4',
  'leg extensions': 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
  'wall sit': 'https://www.youtube.com/watch?v=y-wV4Lz6pkI',
  'db bench press': 'https://www.youtube.com/watch?v=VmB1G1K7v94',
  'bent-over db row': 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ',
  'db lateral raise': 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
  'db incline press': 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
  'single-arm db row': 'https://www.youtube.com/watch?v=xl1YPqAFt7k',
  'cable face pulls': 'https://www.youtube.com/watch?v=rep-qVOkqgk',
  'pendlay rows': 'https://www.youtube.com/watch?v=r0dJApBFaHo',
  'db hammer curls': 'https://www.youtube.com/watch?v=zC3nLlEvin4',
  'banded face pulls': 'https://www.youtube.com/watch?v=MiRAi2KOfRQ',
  'lat pulldowns': 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  'db bicep curls': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'reverse flyes': 'https://www.youtube.com/watch?v=oLrBzIVz-zA',
  'arnold press': 'https://www.youtube.com/watch?v=6Z15_WdXmVw',
  'banded glute bridges': 'https://www.youtube.com/watch?v=xDmFkJxPzeM',
  'z-press': 'https://www.youtube.com/watch?v=ZHNlE7GXJWM',
  'bulgarian split squat': 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
  'banded pull-aparts': 'https://www.youtube.com/watch?v=AWoqp7BreJA',

  // ─── MAIN LIFTS ──────────────────────────────────
  'back squat': 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  'deadlift': 'https://www.youtube.com/watch?v=r4MzxtBKyNE',
  'bench press': 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  'hip thrust': 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
  'power clean': 'https://www.youtube.com/watch?v=GVt3pUfcWFM',
  'snatch': 'https://www.youtube.com/watch?v=tuOepRCJMQs',
};

// Normalize a movement string for matching.
// Strips numbers, reps, sets, durations, parenthetical notes.
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\d+x\d+/g, '')         // "3x20" → ""
    .replace(/x\s*\d+[-–]?\d*/g, '') // "x 12-15" → ""
    .replace(/\d+[-–]?\d*\s*(min|sec|s)\b/gi, '') // "1 min" → ""
    .replace(/:\d+/g, '')            // ":30" → ""
    .replace(/\([^)]*\)/g, '')       // "(each side)" → ""
    .replace(/\[.*?\]/g, '')         // "[Sub: ...]" → ""
    .replace(/each\s*(side)?/gi, '')
    .replace(/\d+\/\d+/g, '')        // "5/5" → ""
    .replace(/\d+/g, '')             // remaining numbers
    .replace(/\s+/g, ' ')
    .trim();
}

export function getVideoUrl(movementString) {
  if (!movementString || movementString.endsWith(':') || movementString === '') return null;

  const norm = normalize(movementString);
  if (!norm) return null;

  // Direct match
  if (VIDEOS[norm]) return VIDEOS[norm];

  // Partial match — find the longest matching key
  let bestMatch = null;
  let bestLen = 0;
  for (const [key, url] of Object.entries(VIDEOS)) {
    if (norm.includes(key) && key.length > bestLen) {
      bestMatch = url;
      bestLen = key.length;
    }
  }

  return bestMatch;
}

export default VIDEOS;
