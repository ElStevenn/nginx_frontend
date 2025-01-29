/********************************************************
  SIDEBAR.JS - Handles Sidebar Show/Hide & Cookie Storage
********************************************************/

/**
 * Utility Functions for Cookie Management
 */
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * References to DOM Elements
 */
const toggleButton = document.querySelector('.toggle-button');
const mainContent = document.getElementById('main-content');
const sidebar = document.querySelector('.sidebar');
const complete_register1 = document.getElementById('complete-register');

// If you want to affect multiple nav-buttons, use querySelectorAll:
const navButtons = document.querySelectorAll('.nav-button');
// If you have exactly one nav-button with ID #nav-button, you can do:
// const nav_button = document.getElementById('nav-button');

let toggleIcon = null;

if (toggleButton) {
  toggleIcon = toggleButton.querySelector('img');
}

/**
 * checkSidebar()
 * - Runs on load & on window resize.
 * - If < 750px => Hide the sidebar entirely & main content margin is 0.
 * - If 750px <= width < 1200px => Force the sidebar to collapsed mode (80px).
 * - If >= 1200px => Show sidebar & apply cookie-based collapsed/expanded state.
 */
function checkSidebar() {
  if (!sidebar || !mainContent || !toggleButton) {
    console.warn("Sidebar or toggle button elements not found in the DOM.");
    return;
  }

  const width = window.innerWidth;

  if (width < 750) {
    // Hide the sidebar completely
    sidebar.classList.add('hidden');
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('collapsed');
    toggleButton.classList.add('hidden');

    sidebar.style.display = 'none';

    // Optionally hide "complete-register" on phone
    if (complete_register1) {
      complete_register1.style.display = 'none';
    }

    // Adjust the main content
    mainContent.style.marginLeft = '0';
    mainContent.style.padding = '60px 0px 5px 0px';

  } else if (width < 1200) {
    // Force the sidebar to collapsed state
    sidebar.style.display = 'flex';
    sidebar.classList.remove('hidden');
    sidebar.classList.add('collapsed');
    mainContent.classList.add('collapsed');
    toggleButton.classList.remove('hidden');

    if (complete_register1) {
      complete_register1.style.display = 'block';
    }

    // Collapsed
    sidebar.style.width = '80px';
    mainContent.style.marginLeft = '80px';
    mainContent.style.padding = '60px 20px 20px 20px';

  } else {
    // Width >= 1200 => Show sidebar fully or collapsed depending on cookie
    sidebar.style.display = 'flex';
    sidebar.classList.remove('hidden');
    toggleButton.classList.remove('hidden');
    mainContent.style.padding = '60px 20px';

    // Show "complete-register" again
    if (complete_register1) {
      complete_register1.style.display = 'block';
    }

    // Let initSidebarState() handle collapse vs. expand
    initSidebarState();
  }
}

/**
 * initSidebarState()
 * - Reads 'sidebarCollapsed' cookie
 * - If 'true', sets the sidebar to collapsed & main-content to .collapsed
 * - Otherwise, sets it to expanded
 */
function initSidebarState() {
  if (!sidebar || !toggleIcon || !mainContent) {
    console.warn("Sidebar, toggleIcon, or mainContent missing.");
    return;
  }

  // Reset to default expanded first
  sidebar.classList.remove('collapsed');
  mainContent.classList.remove('collapsed');
  toggleIcon.classList.remove('rotated');

  const isCollapsed = getCookie('sidebarCollapsed') === 'true';

  if (isCollapsed) {
    // Collapsed state
    sidebar.classList.add('collapsed');
    mainContent.classList.add('collapsed');
    toggleIcon.classList.add('rotated');

    // Inline styles to override if needed
    mainContent.style.marginLeft = '80px';
    mainContent.style.maxWidth = '1820px';

    // If sidebar is collapsed => center nav-button
    navButtons.forEach(button => {
      button.style.justifyContent = 'center';
    });

  } else {
    // Expanded state
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('collapsed');
    toggleIcon.classList.remove('rotated');

    mainContent.style.marginLeft = '265px';
    mainContent.style.maxWidth = '1820px';

    // If sidebar is expanded => start nav-button
    navButtons.forEach(button => {
      button.style.justifyContent = 'start'; 
    });
  }
}

/**
 * onToggleSidebar()
 * - Toggle collapsed state if width >= 1200
 * - Save state in cookie for 7 days
 */
function onToggleSidebar() {
  const width = window.innerWidth;
  if (width < 1200) {
    // Do nothing if user tries to toggle below 1200px
    return;
  }

  // Toggle collapsed state
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('collapsed');

  const isCollapsed = sidebar.classList.contains('collapsed');
  setCookie('sidebarCollapsed', isCollapsed, 7);

  // Update toggle icon rotation and margin-left
  if (isCollapsed) {
    toggleIcon.classList.add('rotated');
    mainContent.style.marginLeft = '80px';

    // Collapsed => center
    navButtons.forEach(button => {
      button.style.justifyContent = 'center';
    });

  } else {
    toggleIcon.classList.remove('rotated');
    mainContent.style.marginLeft = '265px';

    // Expanded => start
    navButtons.forEach(button => {
      button.style.justifyContent = 'start';
    });
  }
}

/************************************************
  MAIN EXECUTION FLOW
************************************************/
document.addEventListener('DOMContentLoaded', () => {
  if (toggleButton && sidebar && mainContent) {
    // Initial check on load
    checkSidebar();

    // Re-check on window resize
    window.addEventListener('resize', checkSidebar);

    // Handle toggle click
    toggleButton.addEventListener('click', onToggleSidebar);
  }
});
