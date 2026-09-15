import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const USERNAME = "karthik5033";

async function fetchStats() {
  const query = `{
    user(login: "${USERNAME}") {
      repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
        totalCount
        nodes { name stargazerCount primaryLanguage { name } }
      }
      contributionsCollection {
        totalCommitContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      followers { totalCount }
      following { totalCount }
      pullRequests(first: 1) { totalCount }
      issues(first: 1) { totalCount }
    }
  }`;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  if (!json.data || !json.data.user) {
    console.error("API Error or Missing Data:", JSON.stringify(json, null, 2));
    throw new Error("Failed to fetch user data.");
  }
  return json.data.user;
}

// Generates custom trophies SVG
function generateTrophiesSVG(user) {
  const stats = {
    stars: user.repositories.nodes.reduce((sum, r) => sum + r.stargazerCount, 0),
    commits: user.contributionsCollection.totalCommitContributions + user.contributionsCollection.restrictedContributionsCount,
    prs: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    repos: user.repositories.totalCount,
    followers: user.followers.totalCount,
  };

  const trophies = [
    { icon: "⭐", label: "Stars", value: stats.stars, thresholds: [1, 10, 50, 100, 500] },
    { icon: "🔥", label: "Commits", value: stats.commits, thresholds: [10, 100, 500, 1000, 5000] },
    { icon: "🔀", label: "PRs", value: stats.prs, thresholds: [1, 10, 50, 100, 500] },
    { icon: "❗", label: "Issues", value: stats.issues, thresholds: [1, 10, 50, 100, 500] },
    { icon: "📦", label: "Repos", value: stats.repos, thresholds: [1, 10, 30, 50, 100] },
    { icon: "👥", label: "Followers", value: stats.followers, thresholds: [1, 10, 50, 100, 500] },
  ];

  const ranks = ["C", "B", "A", "S", "SS", "SSS"];
  const colors = ["#6e6e6e", "#8B7335", "#B8960C", "#DAB20A", "#FFD93D", "#FFF176"];

  let cards = "";
  trophies.forEach((t, i) => {
    let rank = 0;
    for (const th of t.thresholds) { if (t.value >= th) rank++; }
    const x = (i % 6) * 130 + 10;
    const y = Math.floor(i / 6) * 120 + 10;
    cards += `
      <g transform="translate(${x}, ${y})">
        <rect width="120" height="100" rx="8" fill="#161b22" stroke="${colors[rank]}" stroke-width="2"/>
        <text x="60" y="28" text-anchor="middle" font-size="22">${t.icon}</text>
        <text x="60" y="50" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="11" fill="${colors[rank]}" font-weight="bold">${ranks[rank]}</text>
        <text x="60" y="68" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="10" fill="#8b949e">${t.label}</text>
        <text x="60" y="85" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="12" fill="#c9d1d9" font-weight="bold">${t.value}</text>
      </g>
    `;
  });

  return `
    <svg width="800" height="130" viewBox="0 0 800 130" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="800" height="130" fill="transparent"/>
      ${cards}
    </svg>
  `;
}

// Generates the Contribution Grid SVG with animated snake
function generateGridSVG(user) {
  const weeks = user.contributionsCollection.contributionCalendar.weeks;
  const CELL = 14;
  const SIZE = 11;
  const COLS = weeks.length;
  const ROWS = 7;
  const OFFSET_X = 35;
  const OFFSET_Y = 25;
  const SNAKE_COLOR = "#FFD93D";
  const TIERS = ["#4a3700", "#7a5f00", "#C49B00", "#FFD93D"];

  // Build grid data
  const grid = Array.from({ length: COLS }, () => 
    Array.from({ length: ROWS }, () => ({ color: "#161b22", filled: false, count: 0 }))
  );

  weeks.forEach((week, wIdx) => {
    week.contributionDays.forEach((day, dIdx) => {
      let color = "#161b22";
      const count = day.contributionCount;
      if (count === 1) color = "#4a3700";
      if (count > 1 && count <= 3) color = "#7a5f00";
      if (count > 3 && count <= 5) color = "#C49B00";
      if (count > 5) color = "#FFD93D";
      if (dIdx < ROWS) {
        grid[wIdx][dIdx] = { color, filled: count > 0, count };
      }
    });
  });

  // Build Dijkstra-based cell-by-cell pathfinding to ensure we never move over uneaten cells
  const eaten = Array.from({ length: COLS }, () => Array(ROWS).fill(false));
  let toEat = 0;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (grid[c][r].filled) toEat++;
    }
  }

  const pathPoints = []; // discrete cell-by-cell steps
  // Start at either first filled cell, or (0,0)
  let curPos = { c: 0, r: 0 };
  let startFound = false;
  for (let c = 0; c < COLS && !startFound; c++) {
    for (let r = 0; r < ROWS && !startFound; r++) {
      if (grid[c][r].filled) {
        curPos = { c, r };
        startFound = true;
      }
    }
  }

  const opposites = { 0: 1, 1: 0, 2: 3, 3: 2, 4: -1 };
  const moves = [
    { dc: 1, dr: 0, dir: 0 },
    { dc: -1, dr: 0, dir: 1 },
    { dc: 0, dr: 1, dir: 2 },
    { dc: 0, dr: -1, dir: 3 }
  ];
  let curDir = 4; // 4 means any direction (start)

  pathPoints.push(curPos);
  const eatMap = {}; // "c_r" -> index in pathPoints where it is eaten

  if (grid[curPos.c][curPos.r].filled) {
    eaten[curPos.c][curPos.r] = true;
    eatMap[`${curPos.c}_${curPos.r}`] = 0;
    toEat--;
  }

  while (toEat > 0) {
    // 1. Find target tier: the minimum tier among remaining uneaten cells
    let minTier = 5;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[c][r].filled && !eaten[c][r]) {
          let count = grid[c][r].count;
          let tier = count === 1 ? 1 : (count <= 3 ? 2 : (count <= 5 ? 3 : 4));
          if (tier < minTier) minTier = tier;
        }
      }
    }

    // 2. Dijkstra to nearest target
    const dist = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => Array(5).fill(Infinity)));
    const parent = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => Array(5).fill(null)));
    dist[curPos.c][curPos.r][curDir] = 0;
    
    // Simple priority queue logic using an array
    const pq = [];
    pq.push({ c: curPos.c, r: curPos.r, dir: curDir, d: 0 });
    let bestTarget = null;

    while (pq.length > 0) {
      pq.sort((a, b) => a.d - b.d);
      const u = pq.shift();
      if (dist[u.c][u.r][u.dir] < u.d) continue;

      let countU = grid[u.c][u.r].count;
      let tierU = countU === 1 ? 1 : (countU <= 3 ? 2 : (countU <= 5 ? 3 : 4));

      // Is it a target?
      if (grid[u.c][u.r].filled && !eaten[u.c][u.r] && tierU === minTier) {
        bestTarget = u;
        break; // nearest target found!
      }

      for (const m of moves) {
        if (opposites[u.dir] === m.dir) continue; // NO U-TURNS!

        const nc = u.c + m.dc;
        const nr = u.r + m.dr;

        if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
          let cost = 1; // base distance
          if (grid[nc][nr].filled && !eaten[nc][nr]) {
            let countN = grid[nc][nr].count;
            let tierN = countN === 1 ? 1 : (countN <= 3 ? 2 : (countN <= 5 ? 3 : 4));
            // Penalize moving across an uneaten cell heavily (unless it's our target tier)
            if (tierN === minTier) cost = 1;
            else cost = 100 * tierN;
          }
          if (dist[u.c][u.r][u.dir] + cost < dist[nc][nr][m.dir]) {
            dist[nc][nr][m.dir] = dist[u.c][u.r][u.dir] + cost;
            parent[nc][nr][m.dir] = { c: u.c, r: u.r, dir: u.dir };
            pq.push({ c: nc, r: nr, dir: m.dir, d: dist[nc][nr][m.dir] });
          }
        }
      }
    }

    if (!bestTarget) break; // Should not happen

    // Reconstruct path
    const route = [];
    let curr = bestTarget;
    while (curr.c !== curPos.c || curr.r !== curPos.r || curr.dir !== curDir) {
      route.push({ c: curr.c, r: curr.r });
      curr = parent[curr.c][curr.r][curr.dir];
    }
    route.reverse(); // Now from curPos (exclusive) to bestTarget (inclusive)

    // Move snake along route, eating anything filling
    for (const step of route) {
      pathPoints.push(step);
      if (grid[step.c][step.r].filled && !eaten[step.c][step.r]) {
        eaten[step.c][step.r] = true;
        toEat--;
        eatMap[`${step.c}_${step.r}`] = pathPoints.length - 1;
      }
    }
    curDir = bestTarget.dir;
    curPos = { c: bestTarget.c, r: bestTarget.r };
  }

  // Generate SVG path string
  let pathD = '';
  pathPoints.forEach((p, i) => {
    const cx = p.c * CELL + SIZE / 2;
    const cy = p.r * CELL + SIZE / 2;
    pathD += i === 0 ? `M ${cx} ${cy}` : ` L ${cx} ${cy}`;
  });

  // Duration = full cycle
  const DUR = 60;
  let totalSteps = pathPoints.length - 1;
  if (totalSteps <= 0) totalSteps = 1;

  let gridHtml = '';

  weeks.forEach((week, wIdx) => {
    week.contributionDays.forEach((day, dIdx) => {
      const { color, filled } = grid[wIdx][dIdx];
      if (filled) {
        const idx = eatMap[`${wIdx}_${dIdx}`];
        if (idx !== undefined) {
          const frac = idx / totalSteps;
          // Hide after tail passes. 8 body parts * lag(0.12) = 0.96s total tail delay.
          // 0.96 / 60 = 0.016. So block hides when head is already +0.017 past it.
          const f1 = "0";
          const f2 = Math.min(frac, 0.996).toFixed(4); // Arrival of head
          const f3 = Math.min(frac + 0.017, 0.997).toFixed(4); // Tail finishes passing
          const f4 = "0.998"; // Keeps hidden
          const f5 = "1"; // Resets to visible
          
          let anim = `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="${f1};${f2};${f3};${f4};${f5}" dur="${DUR}s" repeatCount="indefinite" />`;
          gridHtml += `<rect x="${wIdx * CELL}" y="${dIdx * CELL}" width="${SIZE}" height="${SIZE}" rx="2" fill="${color}">${anim}</rect>`;
        } else {
          gridHtml += `<rect x="${wIdx * CELL}" y="${dIdx * CELL}" width="${SIZE}" height="${SIZE}" rx="2" fill="${color}"/>`;
        }
      } else {
        gridHtml += `<rect x="${wIdx * CELL}" y="${dIdx * CELL}" width="${SIZE}" height="${SIZE}" rx="2" fill="${color}"/>`;
      }
    });
  });

  // Snake body trails behind head with positive begin delays
  const BODY_COUNT = 8;
  const BODY_LAG = 0.12;
  let snakeSegments = '';
  for (let seg = 0; seg < BODY_COUNT; seg++) {
    const segSize = SIZE - seg * 0.8;
    const opacity = (1 - seg * 0.08).toFixed(2);
    const lag = ((seg + 1) * BODY_LAG).toFixed(2);
    snakeSegments += `<rect x="${-segSize/2}" y="${-segSize/2}" width="${segSize}" height="${segSize}" rx="2" fill="${SNAKE_COLOR}" opacity="${opacity}"><animateMotion dur="${DUR}s" repeatCount="indefinite" begin="${lag}s" path="${pathD}"/></rect>`;
  }

  return `
    <svg width="800" height="150" viewBox="0 0 800 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&amp;display=swap');
        </style>
        <filter id="snakeGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <pattern id="gridPattern" patternUnits="userSpaceOnUse" width="14" height="14">
          <rect width="11" height="11" rx="2" fill="#161b22" opacity="0.3"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="800" height="150" fill="transparent"/>
      <g transform="translate(${OFFSET_X}, ${OFFSET_Y})">
        <rect width="${COLS * CELL}" height="${ROWS * CELL}" fill="url(#gridPattern)"/>
        ${gridHtml}
      </g>
      <g transform="translate(${OFFSET_X}, ${OFFSET_Y})">
        ${snakeSegments}
        <g>
          <animateMotion dur="${DUR}s" repeatCount="indefinite" path="${pathD}"/>
          <rect x="-6.5" y="-6.5" width="13" height="13" rx="3" fill="${SNAKE_COLOR}" filter="url(#snakeGlow)"/>
          <circle cx="-3" cy="-2" r="1.8" fill="#0D1117"/>
          <circle cx="3" cy="-2" r="1.8" fill="#0D1117"/>
          <circle cx="-2.5" cy="-2.5" r="0.7" fill="#FFF"/>
          <circle cx="3.5" cy="-2.5" r="0.7" fill="#FFF"/>
        </g>
      </g>
      <text x="${OFFSET_X}" y="15" font-family="'Press Start 2P', monospace" font-size="10" fill="${SNAKE_COLOR}" filter="drop-shadow(0 0 2px ${SNAKE_COLOR})">> SNAKE_EATING</text>
      <text x="763" y="15" font-family="'Press Start 2P', monospace" font-size="10" fill="#FFD93D" text-anchor="end">${user.contributionsCollection.contributionCalendar.totalContributions} COMMITS</text>
    </svg>
  `;
}

// Generates the pro-developer minion animated divider
function generateDividerSVG() {
  return `
    <svg width="800" height="14" viewBox="0 0 800 14" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glowY" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glowB" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="gradY" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFD93D" stop-opacity="0" />
          <stop offset="50%" stop-color="#FFD93D" stop-opacity="1" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="1" />
        </linearGradient>
        <linearGradient id="gradB" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#4285F4" stop-opacity="0" />
          <stop offset="50%" stop-color="#4285F4" stop-opacity="1" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="1" />
        </linearGradient>
      </defs>
      
      <!-- Background Track -->
      <rect x="0" y="6" width="800" height="2" fill="#21262d" rx="1" />
      
      <!-- Yellow Minion Pulse (Left to Right) -->
      <g filter="url(#glowY)">
        <rect x="-150" y="6" width="150" height="2" fill="url(#gradY)" rx="1">
          <animate attributeName="x" values="-150;800;800" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" />
        </rect>
        <circle cx="0" cy="7" r="2" fill="#FFFFFF">
          <animate attributeName="cx" values="0;950;950" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
      
      <!-- Blue Minion Pulse (Right to Left / Delayed) -->
      <g filter="url(#glowB)">
        <rect x="800" y="6" width="150" height="2" fill="url(#gradB)" rx="1">
          <animate attributeName="x" values="800;-150;-150" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" begin="1.5s" />
        </rect>
        <circle cx="800" cy="7" r="2" fill="#FFFFFF">
          <animate attributeName="cx" values="800;-150;-150" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" begin="1.5s" />
        </circle>
      </g>
      
      <!-- Center Tech Node -->
      <g>
        <rect x="380" y="3" width="40" height="8" fill="#0D1117" stroke="#30363d" stroke-width="1" rx="4"/>
        <text x="400" y="10" text-anchor="middle" font-family="'Segoe UI', Courier, monospace" font-weight="bold" font-size="9">
          <tspan fill="#FFD93D">&lt;</tspan>
          <tspan fill="#8b949e">/</tspan>
          <tspan fill="#4285F4">&gt;</tspan>
        </text>
      </g>
    </svg>
  `;
}

// Generates a local fallback streak SVG matching the Radical theme
function generateLocalStreakSVG(user, existingStreakFile) {
  let prevTotal = 1768;
  let prevLongest = 100;
  let prevLongestRange = "Jan 11 - Apr 20";
  let prevTotalRange = "Sep 20, 2024 - Present";

  if (existingStreakFile && !existingStreakFile.includes("Failed to retrieve")) {
    const totalMatch = existingStreakFile.match(/Total Contributions[\s\S]*?(\d[\d,]+)/);
    if (totalMatch) prevTotal = parseInt(totalMatch[1].replace(/,/g, ""), 10) || prevTotal;
    const longestMatch = existingStreakFile.match(/Longest Streak[\s\S]*?(\d+)/);
    if (longestMatch) prevLongest = parseInt(longestMatch[1], 10) || prevLongest;
    const longestRangeMatch = existingStreakFile.match(/Longest Streak[\s\S]*?<text[^>]*>([A-Za-z0-9,\s\-]+)<\/text>/);
    if (longestRangeMatch) prevLongestRange = longestRangeMatch[1].trim() || prevLongestRange;
  }

  const calendar = user?.contributionsCollection?.contributionCalendar;
  const weeks = calendar?.weeks || [];
  const days = [];
  for (const w of weeks) {
    if (w.contributionDays) {
      days.push(...w.contributionDays);
    }
  }
  days.sort((a, b) => new Date(a.date) - new Date(b.date));

  let currentStreak = 0;
  let streakStart = null;
  let streakEnd = null;
  if (days.length > 0) {
    let idx = days.length - 1;
    if (days[idx].contributionCount === 0 && idx > 0) {
      idx--;
    }
    while (idx >= 0 && days[idx].contributionCount > 0) {
      if (!streakEnd) streakEnd = days[idx].date;
      streakStart = days[idx].date;
      currentStreak++;
      idx--;
    }
  }

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmt = (dStr) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
  };

  const currentRange = (streakStart && streakEnd) ? `${fmt(streakStart)} - ${fmt(streakEnd)}` : "Recent";
  const totalCount = calendar?.totalContributions || prevTotal;

  return `<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'
                style='isolation: isolate' viewBox='0 0 495 195' width='495px' height='195px' direction='ltr'>
        <style>
            @keyframes currstreak {
                0% { font-size: 3px; opacity: 0.2; }
                80% { font-size: 34px; opacity: 1; }
                100% { font-size: 28px; opacity: 1; }
            }
            @keyframes fadein {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
        </style>
        <defs>
            <clipPath id='outer_rectangle'>
                <rect width='495' height='195' rx='4.5'/>
            </clipPath>
            <mask id='mask_out_ring_behind_fire'>
                <rect width='495' height='195' fill='white'/>
                <ellipse id='mask-ellipse' cx='247.5' cy='32' rx='13' ry='18' fill='black'/>
            </mask>
        </defs>
        <g clip-path='url(#outer_rectangle)'>
            <g style='isolation: isolate'>
                <rect stroke='#000000' stroke-opacity='0' fill='#0d1117' rx='4.5' x='0.5' y='0.5' width='494' height='194'/>
            </g>
            <g style='isolation: isolate'>
                <line x1='165' y1='28' x2='165' y2='170' vector-effect='non-scaling-stroke' stroke-width='1' stroke='#ffd93d' stroke-linejoin='miter' stroke-linecap='square' stroke-miterlimit='3'/>
                <line x1='330' y1='28' x2='330' y2='170' vector-effect='non-scaling-stroke' stroke-width='1' stroke='#ffd93d' stroke-linejoin='miter' stroke-linecap='square' stroke-miterlimit='3'/>
            </g>
            <g style='isolation: isolate'>
                <!-- Total Contributions big number -->
                <g transform='translate(82.5, 48)'>
                    <text x='0' y='32' stroke-width='0' text-anchor='middle' fill='#ffffff' stroke='none' font-family='"Segoe UI", Ubuntu, sans-serif' font-weight='700' font-size='28px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.6s'>
                        ${totalCount.toLocaleString()}
                    </text>
                </g>
                <!-- Total Contributions label -->
                <g transform='translate(82.5, 84)'>
                    <text x='0' y='32' stroke-width='0' text-anchor='middle' fill='#ffd93d' stroke='none' font-family='"Segoe UI", Ubuntu, sans-serif' font-weight='400' font-size='14px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.7s'>
                        Total Contributions
                    </text>
                </g>
                <!-- Total Contributions range -->
                <g transform='translate(82.5, 114)'>
                    <text x='0' y='32' stroke-width='0' text-anchor='middle' fill='#8b949e' stroke='none' font-family='"Segoe UI", Ubuntu, sans-serif' font-weight='400' font-size='12px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.8s'>
                        ${prevTotalRange}
                    </text>
                </g>
            </g>
            <g style='isolation: isolate'>
                <!-- Current Streak label -->
                <g transform='translate(247.5, 108)'>
                    <text x='0' y='32' stroke-width='0' text-anchor='middle' fill='#ffd93d' stroke='none' font-family='"Segoe UI", Ubuntu, sans-serif' font-weight='700' font-size='14px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.9s'>
                        Current Streak
                    </text>
                </g>
                <!-- Current Streak range -->
                <g transform='translate(247.5, 145)'>
                    <text x='0' y='21' stroke-width='0' text-anchor='middle' fill='#8b949e' stroke='none' font-family='"Segoe UI", Ubuntu, sans-serif' font-weight='400' font-size='12px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.9s'>
                        ${currentRange}
                    </text>
                </g>
                <!-- Ring around number -->
                <g mask='url(#mask_out_ring_behind_fire)'>
                    <circle cx='247.5' cy='71' r='40' fill='none' stroke='#ffd93d' stroke-width='5' style='opacity: 0; animation: fadein 0.5s linear forwards 0.4s'></circle>
                </g>
                <!-- Fire icon -->
                <g transform='translate(247.5, 19.5)' stroke-opacity='0' style='opacity: 0; animation: fadein 0.5s linear forwards 0.6s'>
                    <path d='M -12 -0.5 L 15 -0.5 L 15 23.5 L -12 23.5 L -12 -0.5 Z' fill='none'/>
                    <path d='M 1.5 0.67 C 1.5 0.67 2.24 3.32 2.24 5.47 C 2.24 7.53 0.89 9.2 -1.17 9.2 C -3.23 9.2 -4.79 7.53 -4.79 5.47 L -4.76 5.11 C -6.78 7.51 -8 10.62 -8 13.99 C -8 18.41 -4.42 22 0 22 C 4.42 22 8 18.41 8 13.99 C 8 8.6 5.41 3.79 1.5 0.67 Z M -0.29 19 C -2.07 19 -3.51 17.6 -3.51 15.86 C -3.51 14.24 -2.46 13.1 -0.7 12.74 C 1.07 12.38 2.9 11.53 3.92 10.16 C 4.31 11.45 4.51 12.81 4.51 14.2 C 4.51 16.85 2.36 19 -0.29 19 Z' fill='#ffa726' stroke-opacity='0'/>
                </g>
                <!-- Current Streak big number -->
                <g transform='translate(247.5, 48)'>
                    <text x='0' y='32' stroke-width='0' text-anchor='middle' fill='#ffffff' stroke='none' font-family='"Segoe UI", Ubuntu, sans-serif' font-weight='700' font-size='28px' font-style='normal' style='animation: currstreak 0.6s linear forwards'>
                        ${currentStreak}
                    </text>
                </g>
            </g>
            <g style='isolation: isolate'>
                <!-- Longest Streak big number -->
                <g transform='translate(412.5, 48)'>
                    <text x='0' y='32' stroke-width='0' text-anchor='middle' fill='#ffffff' stroke='none' font-family='"Segoe UI", Ubuntu, sans-serif' font-weight='700' font-size='28px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 1.2s'>
                        ${prevLongest}
                    </text>
                </g>
                <!-- Longest Streak label -->
                <g transform='translate(412.5, 84)'>
                    <text x='0' y='32' stroke-width='0' text-anchor='middle' fill='#ffd93d' stroke='none' font-family='"Segoe UI", Ubuntu, sans-serif' font-weight='400' font-size='14px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 1.3s'>
                        Longest Streak
                    </text>
                </g>
                <!-- Longest Streak range -->
                <g transform='translate(412.5, 114)'>
                    <text x='0' y='32' stroke-width='0' text-anchor='middle' fill='#8b949e' stroke='none' font-family='"Segoe UI", Ubuntu, sans-serif' font-weight='400' font-size='12px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 1.4s'>
                        ${prevLongestRange}
                    </text>
                </g>
            </g>
        </g>
    </svg>`;
}

async function updateStreakSVG(user, assetsDir) {
  const streakPath = path.join(assetsDir, "custom-streak.svg");
  let existingContent = "";
  if (fs.existsSync(streakPath)) {
    existingContent = fs.readFileSync(streakPath, "utf8");
  }

  const streakUrl = `https://streak-stats.demolab.com?user=${USERNAME}&theme=radical&hide_border=true&background=0D1117&stroke=FFD93D&ring=FFD93D&fire=FFA726&currStreakLabel=FFD93D&sideLabels=FFD93D&currStreakNum=FFFFFF&sideNums=FFFFFF&dates=8B949E&cache_bust=${Date.now()}`;

  let downloadedValid = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(streakUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const svg = await res.text();
      const isError = svg.includes("Failed to retrieve") || 
                      svg.includes("API issue") || 
                      svg.includes("cut-off-area") ||
                      !svg.includes("Total Contributions") || 
                      !svg.includes("Current Streak");
      if (!isError && svg.includes("<svg")) {
        fs.writeFileSync(streakPath, svg);
        console.log("✅ Successfully downloaded custom-streak.svg from streak-stats");
        downloadedValid = true;
      } else {
        console.warn("⚠️ Streak API returned error SVG. Preventing overwrite.");
      }
    }
  } catch (err) {
    console.warn("⚠️ Failed to fetch streak SVG:", err.message);
  }

  if (!downloadedValid) {
    if (!existingContent || existingContent.includes("Failed to retrieve") || existingContent.includes("API issue")) {
      console.log("⚙️ Generating fallback local custom-streak.svg...");
      const localSvg = generateLocalStreakSVG(user, existingContent);
      fs.writeFileSync(streakPath, localSvg);
      console.log("✅ Successfully generated local custom-streak.svg fallback");
    } else {
      console.log("ℹ️ Preserving existing valid custom-streak.svg");
    }
  }
}

// Generates a local contribution activity chart SVG from real data
function generateActivitySVG(user) {
  const weeks = user.contributionsCollection.contributionCalendar.weeks;
  const totalContributions = user.contributionsCollection.contributionCalendar.totalContributions;

  // Flatten all days, keep last 52 weeks (364 days) worth of weekly totals
  const weeklyTotals = weeks.map(week =>
    week.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0)
  );

  // Also flatten daily for the sparkline
  const days = weeks.flatMap(w => w.contributionDays);

  const W = 800;
  const H = 200;
  const PAD_L = 42;
  const PAD_R = 20;
  const PAD_T = 45;
  const PAD_B = 38;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...weeklyTotals, 1);
  const cols = weeklyTotals.length;

  // Build polyline points
  const pts = weeklyTotals.map((v, i) => {
    const x = PAD_L + (i / (cols - 1)) * chartW;
    const y = PAD_T + chartH - (v / maxVal) * chartH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Area fill path
  const areaD = [
    `M ${PAD_L},${PAD_T + chartH}`,
    ...weeklyTotals.map((v, i) => {
      const x = PAD_L + (i / (cols - 1)) * chartW;
      const y = PAD_T + chartH - (v / maxVal) * chartH;
      return `L ${x.toFixed(1)},${y.toFixed(1)}`;
    }),
    `L ${PAD_L + chartW},${PAD_T + chartH}`,
    'Z'
  ].join(' ');

  // Y-axis labels (0, mid, max)
  const yLabels = [0, Math.round(maxVal / 2), maxVal].map((v, idx) => {
    const y = PAD_T + chartH - (v / maxVal) * chartH;
    return `<text x="${PAD_L - 6}" y="${y.toFixed(1)}" text-anchor="end" font-family="'Fira Code',monospace" font-size="9" fill="#8b949e" dominant-baseline="middle">${v}</text>`;
  }).join('');

  // X-axis month labels — one per month boundary
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let lastMonth = -1;
  const xLabels = weeks.map((week, i) => {
    const date = new Date(week.contributionDays[0]?.date || '');
    const mo = date.getMonth();
    if (isNaN(mo) || mo === lastMonth) return '';
    lastMonth = mo;
    const x = PAD_L + (i / (cols - 1)) * chartW;
    return `<text x="${x.toFixed(1)}" y="${H - PAD_B + 14}" text-anchor="middle" font-family="'Fira Code',monospace" font-size="9" fill="#8b949e">${monthNames[mo]}</text>`;
  }).join('');

  // Find peak week for dot annotation
  const peakIdx = weeklyTotals.indexOf(maxVal);
  const peakX = PAD_L + (peakIdx / (cols - 1)) * chartW;
  const peakY = PAD_T + chartH - (maxVal / maxVal) * chartH;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&amp;display=swap');
    </style>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD93D" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#FFD93D" stop-opacity="0"/>
    </linearGradient>
    <filter id="lineGlow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="#0D1117" rx="12"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#161B22" rx="12" opacity="0.6"/>

  <!-- Title -->
  <text x="${PAD_L}" y="22" font-family="'Fira Code',monospace" font-size="13" font-weight="700" fill="#FFD93D">🍌 Contribution Graph</text>
  <text x="${W - PAD_R}" y="22" text-anchor="end" font-family="'Fira Code',monospace" font-size="11" fill="#8b949e">${totalContributions} contributions this year</text>

  <!-- Grid lines -->
  ${[0, 0.25, 0.5, 0.75, 1].map(f => {
    const y = (PAD_T + chartH - f * chartH).toFixed(1);
    return `<line x1="${PAD_L}" y1="${y}" x2="${PAD_L + chartW}" y2="${y}" stroke="#21262d" stroke-width="1"/>`;
  }).join('')}

  <!-- Area fill -->
  <path d="${areaD}" fill="url(#areaGrad)"/>

  <!-- Line -->
  <polyline points="${pts.join(' ')}" fill="none" stroke="#FFD93D" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" filter="url(#lineGlow)"/>

  <!-- Peak dot + label -->
  <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="4" fill="#FFD93D" filter="url(#lineGlow)"/>
  <rect x="${(peakX - 18).toFixed(1)}" y="${(peakY - 22).toFixed(1)}" width="36" height="14" rx="3" fill="#FFD93D"/>
  <text x="${peakX.toFixed(1)}" y="${(peakY - 12).toFixed(1)}" text-anchor="middle" font-family="'Fira Code',monospace" font-size="8" font-weight="700" fill="#0D1117">${maxVal}/wk</text>

  <!-- Y axis -->
  ${yLabels}

  <!-- X axis labels -->
  ${xLabels}

  <!-- Axes -->
  <line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + chartH}" stroke="#30363d" stroke-width="1"/>
  <line x1="${PAD_L}" y1="${PAD_T + chartH}" x2="${PAD_L + chartW}" y2="${PAD_T + chartH}" stroke="#30363d" stroke-width="1"/>
</svg>`;
}

async function run() {
  const user = await fetchStats();

  const gridSVG = generateGridSVG(user);
  const dividerSVG = generateDividerSVG();
  const activitySVG = generateActivitySVG(user);

  const assetsDir = path.join(__dirname, "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  fs.writeFileSync(path.join(assetsDir, "custom-contributions.svg"), gridSVG);
  console.log("✅ Successfully generated custom-contributions.svg");

  fs.writeFileSync(path.join(assetsDir, "custom-divider.svg"), dividerSVG);
  console.log("✅ Successfully generated custom-divider.svg");

  fs.writeFileSync(path.join(assetsDir, "custom-activity.svg"), activitySVG);
  console.log("✅ Successfully generated custom-activity.svg (local)");

  await updateStreakSVG(user, assetsDir);

  await generateAnimatedIcons(assetsDir);
}

async function generateAnimatedIcons(assetsDir) {
  const ICONS = {
    docker: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
    javascript: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
    pandas: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg",
    tensorflow: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg",
    mongoose: "https://cdn.simpleicons.org/mongoose/880000",
    numpy: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/numpy/numpy-original.svg",
    jenkins: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jenkins/jenkins-original.svg",
    prisma: "https://cdn.simpleicons.org/prisma/FFFFFF"
  };

  for (const [name, url] of Object.entries(ICONS)) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let innerSvg = await res.text();
      
      innerSvg = innerSvg.replace(/<\?xml[\s\S]*?\?>/i, "");
      innerSvg = innerSvg.replace(/<!DOCTYPE[\s\S]*?>/gi, "");
      
      innerSvg = innerSvg.replace(/<svg\s+([^>]+)>/i, (match, p1) => {
        let attrs = p1.replace(/\b(width|height)=["'][^"']*["']/gi, "");
        return `<svg width="100%" height="100%" ${attrs}>`;
      });
      
      const dur = (2.2 + (name.length % 3) * 0.4).toFixed(1);
      
      const wrapper = `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  <g>
    <animateTransform attributeName="transform" type="translate" values="0,3; 0,-3; 0,3" dur="${dur}s" repeatCount="indefinite" />
    <svg width="36" height="36" x="7" y="7">
      ${innerSvg}
    </svg>
  </g>
</svg>`;

      fs.writeFileSync(path.join(assetsDir, `icon-${name}.svg`), wrapper);
      console.log(`✅ Successfully generated custom animated icon-${name}.svg`);
    } catch (err) {
      console.error(`❌ Failed to generated icon ${name}:`, err);
    }
  }
}

run();
