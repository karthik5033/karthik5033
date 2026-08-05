const fs = require('fs');

let content = fs.readFileSync('README.md', 'utf8');

const newAchievements = `<table border="1" bordercolor="#30363d" cellpadding="15" width="100%" style="border-collapse: collapse;">
<tr>
  <td width="50%" valign="top">
    <div style="font-size: 45px; float: left; margin-right: 15px;">🥉</div>
    <b style="font-size: 16px; color: #FFD93D;">3rd Place — Space Tech National Hackathon</b><br>
    <span style="font-size: 13px; color: #c9d1d9;">Category: Solid Waste Management</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">Secured 3rd place overall at the prestigious national-level space tech hackathon in Bengaluru.</p>
    <span style="font-size: 11px; color: #58a6ff;">March 2026 &bull; Bengaluru</span>
  </td>
  <td width="50%" valign="top">
    <div style="font-size: 45px; float: left; margin-right: 15px;">🥈</div>
    <b style="font-size: 16px; color: #e3e4e5;">2nd Place — Algorithm Roulette</b><br>
    <span style="font-size: 13px; color: #c9d1d9;">Varnotsava National Level Hackathon</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">Showcased exceptional DSA and algorithmic problem-solving skills to secure the runner-up position.</p>
    <span style="font-size: 11px; color: #58a6ff;">SMVITM</span>
  </td>
</tr>
</table>`;

const newFeaturedProjects = `<table border="1" bordercolor="#30363d" cellpadding="15" width="100%" style="border-collapse: collapse;">
<tr>
  <td width="50%" valign="top">
    <img src="./assets/icon-docker.svg" width="65" align="left" style="margin-right: 15px;" alt="Docker">
    <a href="https://github.com/karthik5033/DeviceDNA" style="text-decoration: none; font-size: 16px;"><b>DeviceDNA</b></a><br>
    <span style="font-size: 13px; color: #c9d1d9;">IoT Cybersecurity Platform</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">Software-defined cybersecurity platform purpose-built for IoT point-networks to actively detect, analyze, and isolate system anomalies.</p>
    <span style="font-size: 11px; color: #58a6ff;">Python &bull; Next.js</span>
  </td>
  <td width="50%" valign="top">
    <img src="./assets/icon-javascript.svg" width="65" align="left" style="margin-right: 15px;" alt="JavaScript">
    <a href="https://github.com/karthik5033/FairLearnAI" style="text-decoration: none; font-size: 16px;"><b>FairLearnAI</b></a><br>
    <span style="font-size: 13px; color: #c9d1d9;">AI Safety Interface for Education</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">An intelligent API proxy intercepting unethical LLM usages, effectively filtering academic cheating and systemic AI hallucinations.</p>
    <span style="font-size: 11px; color: #58a6ff;">FastAPI &bull; LangChain &bull; React</span>
  </td>
</tr>

<tr>
  <td width="50%" valign="top">
    <img src="./assets/icon-pandas.svg" width="65" align="left" style="margin-right: 15px;" alt="Pandas">
    <a href="https://github.com/karthik5033/Phishing-detector" style="text-decoration: none; font-size: 16px;"><b>Phishing-detector</b></a><br>
    <span style="font-size: 13px; color: #c9d1d9;">AI-Powered Threat Prediction</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">Comprehensive real-time browser extension that leverages fast supervised ML inference to instantly neutralize malicious domains.</p>
    <span style="font-size: 11px; color: #58a6ff;">Python &bull; FastAPI &bull; Scikit-learn</span>
  </td>
  <td width="50%" valign="top">
    <img src="./assets/icon-tensorflow.svg" width="65" align="left" style="margin-right: 15px;" alt="TensorFlow">
    <a href="https://github.com/karthik5033/MedScanAI" style="text-decoration: none; font-size: 16px;"><b>MedScanAI</b></a><br>
    <span style="font-size: 13px; color: #c9d1d9;">Real-time AI Skin Diagnosis</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">Sophisticated diagnostic aid tool utilizing custom robust computer vision models to precisely analyze patient dermatological imagery.</p>
    <span style="font-size: 11px; color: #58a6ff;">Computer Vision &bull; Supabase &bull; Next.js</span>
  </td>
</tr>

<tr>
  <td width="50%" valign="top">
    <img src="./assets/icon-mongoose.svg" width="65" align="left" style="margin-right: 15px;" alt="Mongoose">
    <a href="https://github.com/karthik5033/AgriConnect" style="text-decoration: none; font-size: 16px;"><b>AgriConnect</b></a><br>
    <span style="font-size: 13px; color: #c9d1d9;">Agricultural Social Network</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">A tightly-coupled production MERN stack network empowering farmers with essential peer communication and regional advisories.</p>
    <span style="font-size: 11px; color: #58a6ff;">MongoDB &bull; React &bull; Node.js</span>
  </td>
  <td width="50%" valign="top">
    <img src="./assets/icon-numpy.svg" width="65" align="left" style="margin-right: 15px;" alt="Numpy">
    <a href="https://github.com/karthik5033/CompostQA" style="text-decoration: none; font-size: 16px;"><b>CompostQA</b></a><br>
    <span style="font-size: 13px; color: #c9d1d9;">Precision ML for Soil Health</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">Analytical predictive system mapping complex laboratory inputs to robust compost maturity insights via machine learning data layers.</p>
    <span style="font-size: 11px; color: #58a6ff;">Machine Learning &bull; Python</span>
  </td>
</tr>

<tr>
  <td width="50%" valign="top">
    <img src="./assets/icon-jenkins.svg" width="65" align="left" style="margin-right: 15px;" alt="Jenkins">
    <a href="https://github.com/karthik5033/MatterGen" style="text-decoration: none; font-size: 16px;"><b>MatterGen</b></a><br>
    <span style="font-size: 13px; color: #c9d1d9;">Discover Novel Stable Crystals</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">Framework accelerating novel stable crystalline structure discovery, massively improving testing workflows through generative architecture.</p>
    <span style="font-size: 11px; color: #58a6ff;">AI &bull; Materials Science</span>
  </td>
  <td width="50%" valign="top">
    <img src="./assets/icon-prisma.svg" width="65" align="left" style="margin-right: 15px;" alt="Prisma">
    <a href="https://github.com/karthik5033/CodeRed-Blue-t30" style="text-decoration: none; font-size: 16px;"><b>AvatarFlowX</b></a><br>
    <span style="font-size: 13px; color: #c9d1d9;">Draw Flowcharts → AI Generates Web Apps</span><br>
    <p style="font-size: 12px; color: #8b949e; margin: 6px 0;">Fully-autonomous generative pipeline translating raw user-drawn application flowcharts into functional, production-ready web apps.</p>
    <span style="font-size: 11px; color: #58a6ff;">Generative AI &bull; Full Stack</span>
  </td>
</tr>
</table>`;


// Locate block 1 (Achievements)
let block1Start = content.indexOf('## <img src="https://media.giphy.com/media/l0ExhcMymdL6TrZ84/giphy.gif" width="28"> Achievements & Hackathons');
let block1TableStart = content.indexOf('<table', block1Start);
let block1TableEnd = content.indexOf('</div>', block1TableStart) - 1; // finding the wrapping </div> is safer 

let block2Start = content.indexOf('## 🏗️ Featured Projects');
let block2TableStart = content.indexOf('<table', block2Start);
let block2TableEnd = content.indexOf('</details>', block2TableStart);
// Actually `</div>\n\n<br/>\n\n<details>` wrapper is what follows.
let trueBlock2TableEnd = content.indexOf('</div>', content.indexOf('<table', content.indexOf('<table', block2TableStart + 1))) - 1;
// Wait, the safest way is substring replacement by index markers.

// A better way: replace everything between `<div align="center">` and `</div>` right under Achievements & Hackathons
let achievementsHeader = '## <img src="https://media.giphy.com/media/l0ExhcMymdL6TrZ84/giphy.gif" width="28"> Achievements & Hackathons\\s*\n*<div align="center">\\s*\n*<table[\\s\\S]*?</table>\\s*\n*</div>';
let featuredHeader = '## 🏗️ Featured Projects\\s*\n*<div align="center">\\s*\n*<table[\\s\\S]*?</table>\\s*\n*</div>';

// Use greedy matches until `</div>` wrapper
let head1 = '## <img src="https://media.giphy.com/media/l0ExhcMymdL6TrZ84/giphy.gif" width="28"> Achievements & Hackathons\n\n<div align="center">\n\n';
let head2 = '## 🏗️ Featured Projects\n\n<div align="center">\n\n';
content = content.replace(/## <img src="https:\/\/media.giphy.com\/media\/l0ExhcMymdL6TrZ84\/giphy.gif" width="28"> Achievements & Hackathons\s*<div align="center">\s*<table[\s\S]*?<\/table>\s*<\/div>/g, head1 + newAchievements + '\n\n</div>');

content = content.replace(/## 🏗️ Featured Projects\s*<div align="center">\s*<table[\s\S]*?<\/table>\s*<\/div>/g, head2 + newFeaturedProjects + '\n\n</div>');

fs.writeFileSync('README.md', content);

console.log('Safe replacement complete');
