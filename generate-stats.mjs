import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The GitHub username to fetch stats for
const USERNAME = "karthik5033";
const TOKEN = process.env.GH_TOKEN; // Set this in your environment or .env file

async function fetchStats() {
  if (!TOKEN) {
    console.warn("⚠️ No GH_TOKEN found! Using fallback mock data for testing.");
    return {
      name: "Karthik",
      totalContributions: 852,
      totalStars: 42,
      totalRepos: 15,
      followers: 120,
    };
  }

  console.log("Fetching live data from GitHub GraphQL API...");
  
  const query = `
    query userInfo($login: String!) {
      user(login: $login) {
        name
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
        }
        followers {
          totalCount
        }
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          totalCount
          nodes {
            stargazers {
              totalCount
            }
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: USERNAME } }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error("GraphQL API errors:", data.errors);
      throw new Error("Failed to fetch GitHub data");
    }

    const { user } = data.data;
    const totalStars = user.repositories.nodes.reduce(
      (acc, repo) => acc + repo.stargazers.totalCount,
      0
    );

    // Aggregate Languages across all repos
    const languageCounts = {};
    user.repositories.nodes.forEach(repo => {
      if (repo.languages && repo.languages.edges) {
        repo.languages.edges.forEach(edge => {
          const lang = edge.node.name;
          const color = edge.node.color || '#cccccc';
          if (!languageCounts[lang]) {
            languageCounts[lang] = { size: 0, color: color };
          }
          languageCounts[lang].size += edge.size;
        });
      }
    });

    // Get Top 5 Languages
    const allLanguages = Object.entries(languageCounts).sort((a, b) => b[1].size - a[1].size);
    const topLanguages = allLanguages.slice(0, 5).map(([name, data]) => ({ name, size: data.size, color: data.color }));
    const totalSize = Object.values(languageCounts).reduce((acc, data) => acc + data.size, 0);

    topLanguages.forEach(lang => {
      lang.percentage = ((lang.size / totalSize) * 100).toFixed(1);
    });

    return {
      name: user.name || USERNAME,
      totalContributions: user.contributionsCollection.contributionCalendar.totalContributions,
      totalStars,
      totalRepos: user.repositories.totalCount,
      followers: user.followers.totalCount,
      topLanguages
    };
  } catch (err) {
    console.error("Error fetching stats:", err);
    process.exit(1);
  }
}

// Generates the raw SVG string based on the data
function generateSVG(stats) {
  
  // Render SVG Donut Arcs for Top Languages
  const r = 45;
  const c = 2 * Math.PI * r;
  let currentOffset = 0;
  
  const arcs = stats.topLanguages.map((lang, idx) => {
    const len = (lang.percentage / 100) * c;
    const offset = -currentOffset;
    currentOffset += len;
    
    if (len === 0) return "";
    
    return `
      <!-- ${lang.name} -->
      <circle cx="0" cy="0" r="${r}" fill="transparent" stroke="${lang.color}" stroke-width="14" stroke-dasharray="0 ${c}" stroke-dashoffset="${offset}" filter="drop-shadow(0 0 2px ${lang.color}80)">
        <animate attributeName="stroke-dasharray" values="0 ${c}; ${len} ${c}" dur="1s" begin="${idx * 0.15}s" fill="freeze" />
      </circle>
    `;
  }).join("");

  // Render Legend
  let legendY = 205;
  const legendHTML = stats.topLanguages.map((lang, idx) => {
    const html = `
      <g class="animate-item" style="animation-delay: ${idx * 150}ms">
        <rect x="480" y="${legendY - 10}" width="12" height="12" rx="3" fill="${lang.color}"/>
        <text x="505" y="${legendY}" class="term-key" style="font-size:13px;">${lang.name}</text>
        <text x="750" y="${legendY}" class="term-num" style="font-size:13px;" text-anchor="end">${lang.percentage}%</text>
      </g>
    `;
    legendY += 30;
    return html;
  }).join("");

  // RPG Layout for Left Panel
  const targets = [100, 500, 1000, 2000, 5000, 10000];
  const targetCommits = targets.find(t => t > stats.totalContributions) || targets[targets.length-1];
  const commitPercent = Math.min(100, (stats.totalContributions / targetCommits) * 100);
  const finalProgWidth = (commitPercent / 100) * 220;
  
  const hpPercent = Math.min(100, 30 + (stats.totalRepos * 2));
  const finalHpWidth = (hpPercent / 100) * 220;

  const gameLayout = `
      <g transform="translate(35, 30)">
        <!-- Game Screen Inner Border -->
        <rect x="0" y="0" width="380" height="340" rx="4" fill="#0b0e14" stroke="#444" stroke-width="2"/>
        
        <!-- CRT Scanline Effect Overlay -->
        <rect x="0" y="0" width="380" height="340" fill="url(#scanlines)" opacity="0.3"/>
        
        <text x="20" y="30" class="rpg-title blink-slow" filter="drop-shadow(0 0 5px #FFD93D)">PLAYER 1 START</text>
        <text x="20" y="70" class="rpg-text">CHAR : ${stats.name.toUpperCase()}</text>
        <text x="20" y="100" class="rpg-class">CLASS: WEB WIZARD</text>
        <text x="20" y="130" class="rpg-level">LVL  : ${stats.followers || 1}</text>

        <!-- HP Bar -->
        <text x="20" y="170" class="rpg-stat" fill="#FF3366">HP</text>
        <rect x="60" y="158" width="220" height="14" fill="#222" stroke="#FFF" stroke-width="2"/>
        <rect x="60" y="158" width="0" height="14" fill="#FF3366">
          <animate attributeName="width" from="0" to="${finalHpWidth}" dur="1s" fill="freeze" />
        </rect>

        <!-- EXP Bar -->
        <text x="20" y="200" class="rpg-stat" fill="#FFD93D">XP</text>
        <rect x="60" y="188" width="220" height="14" fill="#222" stroke="#FFF" stroke-width="2"/>
        <rect x="60" y="188" width="0" height="14" fill="#FFD93D">
          <animate attributeName="width" from="0" to="${finalProgWidth}" dur="1.5s" fill="freeze" />
        </rect>
        <text x="295" y="200" class="rpg-small-text">${stats.totalContributions}/${targetCommits}</text>

        <!-- Attributes Grid -->
        <g class="animate-item" style="animation-delay: 500ms;">
          <text x="20" y="250" class="rpg-text">STR (STARS) : <tspan fill="#F8D866">${stats.totalStars}</tspan></text>
          <text x="20" y="280" class="rpg-text">INT (REPOS) : <tspan fill="#F8D866">${stats.totalRepos}</tspan></text>
          <text x="20" y="310" class="rpg-text">AGI (FLLWS) : <tspan fill="#F8D866">${stats.followers}</tspan></text>
        </g>

        <!-- Floating 8-bit Sword Sprite -->
        <g transform="translate(260, 230) scale(1.8)" class="float-sprite">
           <!-- Sword outline -->
           <rect x="0" y="40" width="5" height="5" fill="#555"/>
           <rect x="5" y="35" width="5" height="5" fill="#555"/>
           <rect x="10" y="30" width="5" height="5" fill="#555"/>
           <rect x="15" y="25" width="5" height="5" fill="#555"/>
           <rect x="20" y="20" width="5" height="5" fill="#555"/>
           <rect x="25" y="15" width="5" height="5" fill="#555"/>
           <rect x="30" y="10" width="5" height="5" fill="#555"/>
           
           <rect x="15" y="35" width="5" height="5" fill="#555"/>
           <rect x="20" y="30" width="5" height="5" fill="#555"/>
           
           <rect x="5" y="45" width="5" height="5" fill="#FFF"/>
           <rect x="10" y="50" width="5" height="5" fill="#FFF"/>

           <!-- Blade interior -->
           <path d="M 25 20 L 40 5 L 45 10 L 30 25 Z" fill="#FFD93D"/>
           <!-- Sword Hilt -->
           <rect x="15" y="30" width="5" height="5" fill="#F8D866"/>
           <rect x="5" y="40" width="5" height="5" fill="#F8D866"/>
        </g>
      </g>
  `;

  // Construct Final SVG
  return `
    <svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&amp;display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&amp;display=swap');
          
          .bg { fill: #0D1117; }
          
          .glass-panel {
            fill: #161B22;
            stroke: rgba(255, 255, 255, 0.1);
            stroke-width: 1.5;
            filter: drop-shadow(0 8px 10px rgba(0,0,0,0.5));
          }

          .rpg-title { font-family: 'Press Start 2P', monospace; font-size: 16px; fill: #FFD93D; }
          .rpg-text { font-family: 'Press Start 2P', monospace; font-size: 12px; fill: #FFFFFF; }
          .rpg-class { font-family: 'Press Start 2P', monospace; font-size: 12px; fill: #F8D866; text-shadow: 0 0 5px rgba(248,216,102,0.4); }
          .rpg-level { font-family: 'Press Start 2P', monospace; font-size: 12px; fill: #FFD93D; }
          .rpg-stat { font-family: 'Press Start 2P', monospace; font-size: 12px; }
          .rpg-small-text { font-family: 'Press Start 2P', monospace; font-size: 8px; fill: #FFFFFF; }
          
          .term-key { font-family: 'Fira Code', monospace; fill: #8B949E; font-weight: 400; }
          .term-num { font-family: 'Fira Code', monospace; fill: #c9cacc; font-weight: 400; }

          .title {
            font-family: 'Fira Code', monospace;
            font-size: 18px;
            font-weight: 700;
            fill: #FFFFFF;
            text-shadow: 0 0 5px rgba(255,255,255,0.2);
          }

          .animate-item {
            opacity: 0;
            animation: fadeIn 0.5s ease forwards;
          }

          .blink-slow {
            animation: blink 2s step-end infinite;
          }

          .float-sprite {
            animation: float 3s ease-in-out infinite;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); filter: drop-shadow(0 0 5px #00CCFF); }
          }
        </style>
        
        <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="2" fill="#000" opacity="0.6"/>
          <rect y="2" width="4" height="2" fill="transparent"/>
        </pattern>
      </defs>

      <!-- Main GitHub Background Canvas -->
      <rect x="0" y="0" width="800" height="400" class="bg" rx="15" />

      <!-- Left Panel: RPG Game UI -->
      <rect x="20" y="20" width="410" height="360" rx="15" class="glass-panel" />
      ${gameLayout}

      <!-- Right Panel: Top Languages Donut Chart -->
      <rect x="450" y="20" width="330" height="360" rx="15" class="glass-panel" />
      
      <text x="470" y="55" class="title animate-item" style="animation-delay: 200ms;">🍩 Top Languages</text>
      <line x1="470" y1="70" x2="760" y2="70" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1"/>
      
      <!-- Generated SVG Arcs -->
      <g transform="translate(615, 125) rotate(-90)">
        ${arcs}
      </g>
      
      <!-- Donut Hole Text -->
      <text x="615" y="130" text-anchor="middle" font-family="'Fira Code', monospace" font-size="14" font-weight="700" fill="#FFFFFF">Code</text>

      <!-- Language Legend List -->
      ${legendHTML}

    </svg>
  `;
}

async function run() {
  const stats = await fetchStats();
  const svgContent = generateSVG(stats);

  const assetsDir = path.join(__dirname, "assets");
  
  // Ensure the assets directory exists
  try {
    await fs.access(assetsDir);
  } catch {
    await fs.mkdir(assetsDir, { recursive: true });
  }

  const outputPath = path.join(assetsDir, "custom-stats.svg");
  await fs.writeFile(outputPath, svgContent.trim());
  console.log(`✅ Successfully generated highly customized stats SVG at ${outputPath}`);
}

run();
