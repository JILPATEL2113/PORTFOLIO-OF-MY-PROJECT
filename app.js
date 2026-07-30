/* ==========================================================================
   STELLARPORT // LOGIC SYSTEMS
   Interactive canvas animations, GitHub Integration, Theme controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // Default configuration (using a placeholder or standard account first)
    let githubUsername = localStorage.getItem('stellarport_username') || 'octocat';
    let currentTheme = localStorage.getItem('stellarport_theme') || 'dark';
    let particleCountSetting = parseInt(localStorage.getItem('stellarport_particles') || '80');

    // UI Cache Elements
    const body = document.body;
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    
    // Modal controls
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const usernameInput = document.getElementById('github-username-input');
    const saveUsernameBtn = document.getElementById('save-username-btn');
    const particleDensitySlider = document.getElementById('particle-density');
    const densityValLabel = document.getElementById('density-val');
    const themeSelectButtons = document.querySelectorAll('.theme-select-btn');
    const themeBtn = document.getElementById('theme-btn');

    // Profile Card Cache
    const profileCardDisplay = document.getElementById('profile-card-display');
    const skeletonLoader = document.getElementById('profile-loading-skeleton');
    const realContentLoader = document.getElementById('profile-real-content');
    const userAvatar = document.getElementById('user-avatar');
    const userFullName = document.getElementById('user-fullname');
    const userGithubLink = document.getElementById('user-github-link');
    const userBio = document.getElementById('user-bio');
    const statRepos = document.getElementById('stat-repos');
    const statFollowers = document.getElementById('stat-followers');
    const statGists = document.getElementById('stat-gists');
    const metaLocation = document.getElementById('meta-location');
    const metaBlog = document.getElementById('meta-blog');
    const profileStatus = document.getElementById('profile-status');

    // Projects Grid Cache
    const projectsGridContainer = document.getElementById('projects-grid-container');
    const searchInput = document.getElementById('project-search');
    const languageFilterContainer = document.getElementById('language-filter-container');
    const emptyState = document.getElementById('empty-state');

    // Global Repository Storage for filtering & searching
    let fetchedRepositories = [];
    let activeLanguageFilter = 'all';
    let searchQuery = '';

    // ==========================================================================
    // THEME & INITIAL SETTINGS CONFIGURATION
    // ==========================================================================
    
    // Initialize Theme
    body.setAttribute('data-theme', currentTheme);
    updateThemeSelectorUI(currentTheme);
    updateThemeIcon(currentTheme);

    // Initialize Inputs
    usernameInput.value = githubUsername;
    particleDensitySlider.value = particleCountSetting;
    densityValLabel.textContent = `${particleCountSetting} particles`;

    // Event Listeners for settings
    settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    closeModalBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('active');
    });

    // Theme selector click events in modal
    themeSelectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme-val');
            setTheme(theme);
        });
    });

    // Quick toggle theme button on floating nav
    themeBtn.addEventListener('click', () => {
        const nextTheme = body.getAttribute('data-theme') === 'dark' ? 'cyberpunk' : 
                          body.getAttribute('data-theme') === 'cyberpunk' ? 'light' : 'dark';
        setTheme(nextTheme);
    });

    // Slider for particle density
    particleDensitySlider.addEventListener('input', (e) => {
        particleCountSetting = parseInt(e.target.value);
        densityValLabel.textContent = `${particleCountSetting} particles`;
        localStorage.setItem('stellarport_particles', particleCountSetting);
        initParticles(); // Rebuild particle arrays
    });

    // Save Username details
    saveUsernameBtn.addEventListener('click', () => {
        const inputVal = usernameInput.value.trim();
        if (inputVal) {
            githubUsername = inputVal;
            localStorage.setItem('stellarport_username', githubUsername);
            settingsModal.classList.remove('active');
            fetchGitHubData(githubUsername);
        }
    });

    function setTheme(theme) {
        body.setAttribute('data-theme', theme);
        localStorage.setItem('stellarport_theme', theme);
        updateThemeSelectorUI(theme);
        updateThemeIcon(theme);
        initParticles(); // Recolor particles based on theme variables
    }

    function updateThemeSelectorUI(theme) {
        themeSelectButtons.forEach(btn => {
            if (btn.getAttribute('data-theme-val') === theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function updateThemeIcon(theme) {
        const icon = themeBtn.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fa-solid fa-moon';
        } else if (theme === 'cyberpunk') {
            icon.className = 'fa-solid fa-bolt-lightning';
        } else {
            icon.className = 'fa-solid fa-sun';
        }
    }

    // ==========================================================================
    // INTERACTIVE PARTICLE CANVAS BACKGROUND
    // ==========================================================================

    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }

    class Particle {
        constructor(x, y, dx, dy, size, color) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.size = size;
            this.color = color;
            this.baseSize = size;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            // Boundary Collision
            if (this.x + this.size > canvas.width || this.x - this.size < 0) {
                this.dx = -this.dx;
            }
            if (this.y + this.size > canvas.height || this.y - this.size < 0) {
                this.dy = -this.dy;
            }

            this.x += this.dx;
            this.y += this.dy;

            // Mouse interaction: grow particles near mouse
            if (mouse.x && mouse.y) {
                let diffX = mouse.x - this.x;
                let diffY = mouse.y - this.y;
                let distance = Math.sqrt(diffX * diffX + diffY * diffY);

                if (distance < mouse.radius) {
                    if (this.size < this.baseSize * 2.5) {
                        this.size += 0.2;
                    }
                    // Subtle hover gravity effect
                    this.x += diffX * 0.01;
                    this.y += diffY * 0.01;
                } else if (this.size > this.baseSize) {
                    this.size -= 0.1;
                }
            } else if (this.size > this.baseSize) {
                this.size -= 0.1;
            }

            this.draw();
        }
    }

    function initParticles() {
        particles = [];
        const theme = body.getAttribute('data-theme');
        let color = 'rgba(139, 92, 246, 0.4)'; // Default Dark Nebula: Violet accent
        
        if (theme === 'cyberpunk') {
            color = 'rgba(0, 255, 204, 0.5)'; // Cyber Neon: Cyan
        } else if (theme === 'light') {
            color = 'rgba(13, 148, 136, 0.3)'; // Light Solar: Teal
        }

        for (let i = 0; i < particleCountSetting; i++) {
            let size = Math.random() * 3 + 1;
            let x = Math.random() * (innerWidth - size * 2) + size;
            let y = Math.random() * (innerHeight - size * 2) + size;
            let dx = (Math.random() - 0.5) * 0.8;
            let dy = (Math.random() - 0.5) * 0.8;

            particles.push(new Particle(x, y, dx, dy, size, color));
        }
    }

    function drawLines() {
        const theme = body.getAttribute('data-theme');
        let lineColor = 'rgba(139, 92, 246, 0.05)';
        let lineDistanceThreshold = 120;
        
        if (theme === 'cyberpunk') {
            lineColor = 'rgba(255, 0, 127, 0.08)'; // Cyber: Neon pink line web
            lineDistanceThreshold = 100;
        } else if (theme === 'light') {
            lineColor = 'rgba(13, 148, 136, 0.06)';
        }

        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dist = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) + 
                           ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                
                if (dist < lineDistanceThreshold * lineDistanceThreshold) {
                    let alpha = 1 - (dist / (lineDistanceThreshold * lineDistanceThreshold));
                    ctx.strokeStyle = lineColor.replace(/[\d\.]+\)$/, `${alpha * 0.25})`);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        
        drawLines();
        requestAnimationFrame(animateParticles);
    }

    // Set initial size and run Canvas loops
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
    animateParticles();

    // ==========================================================================
    // DYNAMIC GITHUB API INTEGRATION
    // ==========================================================================

    async function fetchGitHubData(username) {
        showSkeletonLoaders();
        profileStatus.textContent = "Syncing with GitHub...";

        try {
            // 1. Fetch User Profile
            const profileResponse = await fetch(`https://api.github.com/users/${username}`);
            if (!profileResponse.ok) throw new Error('User not found');
            const profileData = await profileResponse.ok ? await profileResponse.json() : getMockProfileData(username);

            // 2. Fetch User Repositories
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
            let reposData = [];
            if (reposResponse.ok) {
                reposData = await reposResponse.json();
            } else {
                console.warn("GitHub rate limit reached, loading local simulation dataset.");
                reposData = getMockReposData(username);
            }

            // Bind values
            bindProfileCard(profileData);
            fetchedRepositories = reposData.filter(repo => !repo.fork); // exclude forks for project portfolios
            
            // Build dynamic filters and cards list
            buildLanguageFilters(fetchedRepositories);
            renderProjectCards();
            profileStatus.textContent = "Data Online";

        } catch (error) {
            console.error('Error contacting GitHub API:', error);
            profileStatus.textContent = "Offline Simulation Mode";
            
            // Gracefully load Mock Data so the website is functional and looks beautiful!
            const mockProfile = getMockProfileData(username);
            const mockRepos = getMockReposData(username);
            
            bindProfileCard(mockProfile);
            fetchedRepositories = mockRepos;
            
            buildLanguageFilters(fetchedRepositories);
            renderProjectCards();
        }
    }

    function showSkeletonLoaders() {
        skeletonLoader.classList.remove('hidden');
        realContentLoader.classList.add('hidden');
        
        // Show placeholders in project cards list
        projectsGridContainer.innerHTML = `
            <div class="glass-card project-card skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width: 90%;"></div>
                <div class="skeleton skeleton-text" style="width: 75%;"></div>
                <div class="skeleton-meta-row">
                    <div class="skeleton skeleton-tag"></div>
                </div>
            </div>
            <div class="glass-card project-card skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width: 80%;"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
                <div class="skeleton-meta-row">
                    <div class="skeleton skeleton-tag"></div>
                </div>
            </div>
            <div class="glass-card project-card skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width: 95%;"></div>
                <div class="skeleton skeleton-text" style="width: 85%;"></div>
                <div class="skeleton-meta-row">
                    <div class="skeleton skeleton-tag"></div>
                </div>
            </div>
        `;
    }

    function bindProfileCard(profile) {
        userAvatar.src = profile.avatar_url;
        userFullName.textContent = profile.name || profile.login;
        userGithubLink.textContent = `@${profile.login}`;
        userGithubLink.href = profile.html_url;
        userBio.textContent = profile.bio || "No biography provided by user.";
        
        statRepos.textContent = profile.public_repos;
        statFollowers.textContent = profile.followers;
        statGists.textContent = profile.public_gists;

        // Meta location
        if (profile.location) {
            metaLocation.querySelector('span').textContent = profile.location;
            metaLocation.classList.remove('hidden');
        } else {
            metaLocation.classList.add('hidden');
        }

        // Meta blog link
        if (profile.blog) {
            let blogUrl = profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`;
            metaBlog.querySelector('span').innerHTML = `<a href="${blogUrl}" target="_blank">Live Site</a>`;
            metaBlog.classList.remove('hidden');
        } else {
            metaBlog.classList.add('hidden');
        }

        // Switch load state
        skeletonLoader.classList.add('hidden');
        realContentLoader.classList.remove('hidden');
    }

    // Dynamic Filter Generator
    function buildLanguageFilters(repos) {
        // Find all unique languages in repositories
        const languages = new Set();
        repos.forEach(repo => {
            if (repo.language) languages.add(repo.language);
        });

        // Clear existing except "All"
        languageFilterContainer.innerHTML = `<button class="filter-btn active" data-filter="all">All Projects</button>`;

        // Add filter buttons
        languages.forEach(lang => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-filter', lang.toLowerCase());
            btn.textContent = lang;
            languageFilterContainer.appendChild(btn);
        });

        // Bind filter event listener to newly injected filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeLanguageFilter = btn.getAttribute('data-filter');
                renderProjectCards();
            });
        });
    }

    // Projects Grid Renderer
    function renderProjectCards() {
        projectsGridContainer.innerHTML = '';
        
        // Filter Repositories based on inputs
        const filtered = fetchedRepositories.filter(repo => {
            const matchesLang = activeLanguageFilter === 'all' || 
                                (repo.language && repo.language.toLowerCase() === activeLanguageFilter);
            
            const matchName = repo.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDesc = (repo.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesLang && (matchName || matchDesc);
        });

        // If empty
        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');

        // Render card layouts
        filtered.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'glass-card project-card';
            
            // Format updated timestamp
            const updateDate = new Date(repo.updated_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short'
            });

            card.innerHTML = `
                <h3>${repo.name}</h3>
                <p class="project-desc">${repo.description || 'No description provided. Click repo link to view source files.'}</p>
                <div class="project-footer">
                    <div class="project-languages">
                        ${repo.language ? `<span class="language-pill">${repo.language}</span>` : '<span class="language-pill">Text</span>'}
                    </div>
                    <div class="project-metrics">
                        <span class="metric-item" title="Stars"><i class="fa-solid fa-star"></i> ${repo.stargazers_count}</span>
                        <span class="metric-item" title="Forks"><i class="fa-solid fa-code-fork"></i> ${repo.forks_count}</span>
                    </div>
                </div>
                <div class="project-links">
                    <a href="${repo.html_url}" target="_blank" title="GitHub Repository"><i class="fa-brands fa-github"></i> Repository</a>
                    ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" title="Live Application Link"><i class="fa-solid fa-globe"></i> Live App</a>` : ''}
                </div>
            `;
            projectsGridContainer.appendChild(card);
        });
    }

    // Search input listener
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProjectCards();
    });

    // ==========================================================================
    // BACKUP SIMULATOR DATA (For offline mode, rate limits, or placeholders)
    // ==========================================================================

    function getMockProfileData(username) {
        return {
            login: username,
            name: `${username.charAt(0).toUpperCase() + username.slice(1)} Architect`,
            avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
            html_url: `https://github.com/${username}`,
            bio: "Designing clean code architectures, reactive web structures, and beautiful user interfaces. Fully interactive digital explorer.",
            public_repos: 42,
            followers: 124,
            public_gists: 8,
            location: "Metropolis, Earth",
            blog: "stellarport.io"
        };
    }

    function getMockReposData(username) {
        return [
            {
                name: "quantum-ui",
                description: "A high-performance CSS component toolkit featuring futuristic glassmorphism properties, atomic grids, and custom variables.",
                language: "CSS",
                stargazers_count: 345,
                forks_count: 52,
                html_url: `https://github.com/${username}/quantum-ui`,
                homepage: "https://example.com/quantum-ui",
                updated_at: "2026-07-28T10:00:00Z"
            },
            {
                name: "gravity-physics-engine",
                description: "Particle simulation engine built in clean JavaScript. Utilizes HTML5 Canvas elements to calculate collision vectors and gravitational pull.",
                language: "JavaScript",
                stargazers_count: 812,
                forks_count: 140,
                html_url: `https://github.com/${username}/gravity-physics`,
                homepage: "",
                updated_at: "2026-06-15T10:00:00Z"
            },
            {
                name: "cyber-security-bot",
                description: "Python automation script that scans local packages for vulnerabilities and triggers webhook reports upon discovering breaches.",
                language: "Python",
                stargazers_count: 156,
                forks_count: 23,
                html_url: `https://github.com/${username}/cyber-bot`,
                homepage: "",
                updated_at: "2026-07-02T10:00:00Z"
            },
            {
                name: "neural-network-model",
                description: "Minimalist self-contained neural classification project. Classifies patterns with visual logs outputted direct to HTML reports.",
                language: "Python",
                stargazers_count: 241,
                forks_count: 31,
                html_url: `https://github.com/${username}/neural-net`,
                homepage: "https://example.com/neural",
                updated_at: "2026-05-19T10:00:00Z"
            },
            {
                name: "nebula-node-server",
                description: "Robust asynchronous Express API boilerplate featuring ready-made OAuth systems, token storage, and WebSockets setup.",
                language: "JavaScript",
                stargazers_count: 189,
                forks_count: 48,
                html_url: `https://github.com/${username}/nebula-server`,
                homepage: "",
                updated_at: "2026-07-29T10:00:00Z"
            },
            {
                name: "stellar-port-portfolio",
                description: "The source code for this beautiful portfolio. Includes theme loaders, particle canvas nodes, and direct link connectors to GitHub's REST API.",
                language: "HTML",
                stargazers_count: 94,
                forks_count: 12,
                html_url: `https://github.com/${username}/stellar-port`,
                homepage: "https://example.com/stellarport",
                updated_at: "2026-07-30T10:00:00Z"
            }
        ];
    }

    // ==========================================================================
    // SCROLL REVEAL TRIGGERS (Intersection Observer)
    // ==========================================================================

    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                
                // If it is the tech stack section, trigger animating progress bars
                if (entry.target.classList.contains('skills-grid')) {
                    animateSkillsProgress();
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    function animateSkillsProgress() {
        const progressBars = document.querySelectorAll('.skill-progress-bar');
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }

    // Initialize Page Loading
    fetchGitHubData(githubUsername);
});
