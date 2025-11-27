// This function will be called by each page to load the navbar
async function loadNavbar(placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        console.error('Navbar placeholder not found!');
        return;
    }

    try {
        // 1. Fetch the navbar's HTML structure
        const response = await fetch('/components/navbar.html');
        const navbarHtml = await response.text();
        placeholder.innerHTML = navbarHtml;

        // 2. Add the navbar's CSS to the page's head
        addNavbarStyles();
        
        // 3. Run the logic to set up the links (login vs. profile)
        setupDynamicLinks();

        // 4. Run the logic to activate the hamburger menu
        setupMobileMenu();

    } catch (error) {
        console.error('Failed to load navbar:', error);
    }
}

function addNavbarStyles() {
    // This CSS is a complete overhaul for responsiveness
    const styles = `
        /* --- Navbar Container --- */
        .navbar {
            background-color: white;
            padding: 10px 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative; /* For z-index to work */
            z-index: 1000;
        }
        .navbar .logo { 
            height: 40px; 
            width: auto; 
            display: block; 
        }
        .nav-links { 
            position: relative; 
        }

        /* --- Desktop Navigation --- */
        .desktop-nav {
            display: flex;
            gap: 25px;
            /* Center the nav links in the available space */
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
        }
        .desktop-nav a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            padding: 5px 0;
            border-bottom: 2px solid transparent;
            transition: border-color 0.2s;
        }
        .desktop-nav a:hover {
            border-bottom-color: #3498db;
        }

        /* --- Mobile-Specific Elements (Hidden on Desktop) --- */
        .hamburger-menu { display: none; }
        .mobile-nav-menu { display: none; }
        
        /* --- Dropdown Styles --- */
        .nav-links a.primary-link { text-decoration: none; font-weight: bold; background-color: #3498db; color: white; padding: 8px 15px; border-radius: 5px; }
        #profile-icon { cursor: pointer; width: 40px; height: 40px; border-radius: 50%; background-color: #e0e0e0; display: flex; align-items: center; justify-content: center; }
        .dropdown-menu { display: none; position: absolute; top: 50px; right: 0; background-color: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); min-width: 160px; z-index: 100; overflow: hidden; }
        .dropdown-menu.show { display: block; }
        .dropdown-menu a { display: block; padding: 12px 15px; text-decoration: none; color: #333; }
        .dropdown-menu a:hover { background-color: #f5f5f5; }
        .dropdown-divider { height: 1px; background-color: #eee; margin: 5px 0; }
        
        /* --- MEDIA QUERY for Mobile Devices --- */
        @media (max-width: 768px) {
            .desktop-nav {
                display: none; /* Hide desktop links */
            }
            .navbar {
                justify-content: space-between;
            }
            .logo-link {
                /* This ensures the logo stays in the visual center */
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
            }
            .hamburger-menu {
                display: flex;
                flex-direction: column;
                justify-content: space-around;
                width: 30px;
                height: 25px;
                cursor: pointer;
            }
            .hamburger-menu span {
                width: 100%;
                height: 3px;
                background-color: #333;
                border-radius: 3px;
                transition: all 0.3s ease-in-out;
            }

            /* Hamburger animation */
            .hamburger-menu.open span:nth-child(1) { transform: rotate(45deg) translate(7px, 7px); }
            .hamburger-menu.open span:nth-child(2) { opacity: 0; }
            .hamburger-menu.open span:nth-child(3) { transform: rotate(-45deg) translate(7px, -7px); }

            /* Mobile menu panel */
            .mobile-nav-menu {
                display: block;
                position: fixed;
                top: 60px; /* Position below navbar */
                left: 0;
                width: 80%;
                max-width: 300px;
                height: calc(100% - 60px);
                background-color: #2c3e50;
                box-shadow: 2px 0 5px rgba(0,0,0,0.2);
                transform: translateX(-100%); /* Hidden off-screen */
                transition: transform 0.3s ease-in-out;
                z-index: 999;
                padding-top: 20px;
            }
            .mobile-nav-menu.open {
                transform: translateX(0); /* Slide in */
            }
            .mobile-nav-menu a {
                display: block;
                padding: 15px 25px;
                color: white;
                text-decoration: none;
                font-size: 1.1em;
                border-bottom: 1px solid #34495e;
            }
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

function setupDynamicLinks() {
    const navLinksContainer = document.getElementById('nav-links-container');
    if (!navLinksContainer) return;

    const logoLink = document.querySelector('.navbar a.logo-link');
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // --- LOGGED-IN STATE ---
        logoLink.href = '/homepage.html'; // Logo goes to homepage

        navLinksContainer.innerHTML = `
            <div id="profile-icon" title="My Account">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div id="profile-dropdown" class="dropdown-menu">
                <a href="/homepage.html">Home</a>
                <a href="/profile.html">My Profile</a>
                <div class="dropdown-divider"></div>
                <a href="#" id="logout-btn">Logout</a>
            </div>
        `;
        
        const profileIcon = document.getElementById('profile-icon');
        const profileDropdown = document.getElementById('profile-dropdown');

        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            window.location.href = '/'; // Redirect to login page on logout
        });
    } else {
        // --- LOGGED-OUT STATE ---
        logoLink.href = '/'; // Logo goes to login page
        navLinksContainer.innerHTML = `<a href="/" class="primary-link">Login</a>`;
    }

    // Global listener to close dropdown
    document.addEventListener('click', (e) => {
        const profileDropdown = document.getElementById('profile-dropdown');
        if (profileDropdown && !profileDropdown.contains(e.target) && e.target.id !== 'profile-icon') {
            profileDropdown.classList.remove('show');
        }
    });
}

// Function to handle hamburger menu
function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger-menu');
    const mobileMenu = document.getElementById('mobile-nav-menu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
    }
}

// Export the main function so other scripts can import and use it
export { loadNavbar };