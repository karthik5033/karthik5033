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
  let legendY = 85;
  const legendHTML = stats.topLanguages.map((lang, idx) => {
    // Truncate extremely long language names just in case
    const displayName = lang.name.length > 15 ? lang.name.substring(0, 13) + '...' : lang.name;
    const html = `
      <g class="animate-item" style="animation-delay: ${idx * 150}ms">
        <rect x="230" y="${legendY - 10}" width="12" height="12" rx="3" fill="${lang.color}"/>
        <text x="255" y="${legendY}" class="term-key" style="font-size:12px;">${displayName}</text>
        <text x="395" y="${legendY}" class="term-num" style="font-size:12px;" text-anchor="end">${lang.percentage}%</text>
      </g>
    `;
    legendY += 28;
    return html;
  }).join("");

  // Construct Final SVG - 420x240 Standalone Top Languages Card
  return `
    <svg width="420" height="240" viewBox="0 0 420 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&amp;display=swap');
          
          .bg { fill: #0D1117; }
          
          .glass-panel {
            fill: #161B22;
            stroke: rgba(255, 255, 255, 0.1);
            stroke-width: 1.5;
            filter: drop-shadow(0 8px 10px rgba(0,0,0,0.5));
          }
          
          .term-key { font-family: 'Fira Code', monospace; fill: #8B949E; font-weight: 400; }
          .term-num { font-family: 'Fira Code', monospace; fill: #c9cacc; font-weight: 400; }

          .title {
            font-family: 'Fira Code', monospace;
            font-size: 16px;
            font-weight: 700;
            fill: #FFFFFF;
            text-shadow: 0 0 5px rgba(255,255,255,0.2);
          }

          .animate-item {
            opacity: 0;
            animation: fadeIn 0.5s ease forwards;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
        <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="2" fill="#000" opacity="0.6"/>
          <rect y="2" width="4" height="2" fill="transparent"/>
        </pattern>
      </defs>

      <!-- Main GitHub Background Canvas -->
      <rect x="0" y="0" width="420" height="240" class="bg" rx="15" />

      <!-- Top Languages Panel -->
      <rect x="10" y="10" width="400" height="220" rx="10" class="glass-panel" />
      <rect x="10" y="10" width="400" height="220" rx="10" fill="url(#scanlines)" opacity="0.1" />
      
      <text x="210" y="40" text-anchor="middle" class="title animate-item" style="animation-delay: 200ms;">🍩 Top Languages</text>
      <line x1="30" y1="52" x2="390" y2="52" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1"/>
      
      <!-- Generated SVG Arcs -->
      <g transform="translate(130, 135) rotate(-90)">
        ${arcs}
      </g>
      
      <!-- Donut Hole Text -->
      <text x="130" y="140" text-anchor="middle" font-family="'Fira Code', monospace" font-size="13" font-weight="700" fill="#FFFFFF">Code</text>

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
