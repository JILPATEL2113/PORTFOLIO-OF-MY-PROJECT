# StellarPort // Premium Interactive GitHub Portfolio

StellarPort is an ultra-modern, high-definition, and beautifully animated single-page portfolio website designed to pull repository details dynamically using the GitHub REST API. Show off your developmental milestones, main programming languages, and GitHub profile stats through a stunning glassmorphic UI.

## Features

- **Drifting Particle Canvas:** An interactive canvas background that moves relative to your cursor and draws glowing constellation links.
- **Dynamic Repository Showcase:** Fetches your repositories in real-time, displaying star count, forks, primary language tags, description, and direct links.
- **Live Search & Filters:** Instantly search through repositories or filter them by language tabs.
- **Interactive Theme Hub:** Switch between **Dark Nebula**, **Cyber Neon**, and **Light Solar** vibes instantly.
- **Profile Card Synchronizer:** Pulls your avatar, bio, location, follower counts, and site link directly from GitHub.
- **Fully Responsive:** Beautifully crafted layouts optimized for Mobile, Tablet, and Desktop displays.

## Quick Start

1. **Locate Files:** All files (`index.html`, `style.css`, `app.js`) are saved in the project subdirectory:
   [index.html](file:///C:/Users/Jil%20Patel/.gemini/antigravity/scratch/github-portfolio/index.html)
2. **Open in Browser:** Simply double-click `index.html` or run a local web server to see the interface.
3. **Change Default Username:**
   - Open [app.js](file:///C:/Users/Jil%20Patel/.gemini/antigravity/scratch/github-portfolio/app.js) in your text editor.
   - On **Line 7**, replace `'octocat'` with your own GitHub username:
     ```javascript
     let githubUsername = localStorage.getItem('stellarport_username') || 'YOUR_USERNAME';
     ```
   - Refresh the page to load your own repositories dynamically!
   - You can also update your username live on the page using the **Configuration Hub** (gear icon in the top right nav).

## Deployment to GitHub Pages

To make this website live on the web:

1. Create a new public repository on GitHub (e.g. `my-portfolio`).
2. Initialize git and upload these files:
   ```bash
   git init
   git add .
   git commit -m "Initialize StellarPort"
   git remote add origin https://github.com/YOUR_USERNAME/my-portfolio.git
   git branch -M main
   git push -u origin main
   ```
3. Go to the repository settings on GitHub, navigate to **Pages** in the left menu, select the `main` branch, and save.
4. Your beautiful portfolio website will be live at `https://YOUR_USERNAME.github.io/my-portfolio/` in a few minutes!
