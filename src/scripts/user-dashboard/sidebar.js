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
const mainLayout = document.getElementById('main-layout');
const sidebar = document.querySelector('.sidebar');
const complete_register1 = document.getElementById('complete-register');
const main_content = document.getElementById('main-content');
let toggleIcon = null;

if (toggleButton) {
  toggleIcon = toggleButton.querySelector('img');
}

/**
 * checkSidebar()
 * - Runs on load & on window resize.
 * - If < 750px => Hide the sidebar entirely.
 * - If 750px <= width < 1200px => Collapse the sidebar.
 * - If >= 1200px => Show sidebar & apply cookie-based collapsed state.
 */
function checkSidebar() {
  if (!sidebar || !mainLayout || !toggleButton) {
    console.warn("Sidebar or toggle button elements not found in the DOM.");
    return;
  }

  const width = window.innerWidth;

  if (width < 750) {
    // Hide the sidebar completely
    sidebar.classList.add('hidden');
    sidebar.classList.remove('collapsed');
    toggleButton.classList.add('hidden');
    sidebar.style.display = 'none';
    complete_register1.style.display = 'none';
    mainLayout.style.marginLeft = '0';
    mainLayout.style.padding = '10px';

  } else if (width < 1200) {
    // Collapse the sidebar
    sidebar.style.display = 'flex';
    sidebar.classList.remove('hidden'); 
    sidebar.classList.add('collapsed');
    toggleButton.classList.remove('hidden');
    complete_register1.style.display = 'block';
    mainLayout.style.marginLeft = '80px';
    mainLayout.style.padding = '20px';

  } else {
    // Width >= 1200
    sidebar.style.display = 'flex';
    sidebar.classList.remove('hidden');
    toggleButton.classList.remove('hidden');
    complete_register1.style.display = 'block';
    mainLayout.style.marginLeft = '240px';
    mainLayout.style.padding = '20px';

    // Apply cookie-based collapse state
    initSidebarState();
  }
}

/**
 * initSidebarState()
 * - Reads 'sidebarCollapsed' cookie
 * - If 'true', sets the sidebar to collapsed
 * - Otherwise, sets it to expanded
 */
function initSidebarState() {
  if (!sidebar || !toggleIcon) {
    console.warn("Sidebar or toggleIcon missing.");
    return;
  }

  const isCollapsed = getCookie('sidebarCollapsed') === 'true';

  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    toggleIcon.classList.add('rotated');
  } else {
    sidebar.classList.remove('collapsed');
    toggleIcon.classList.remove('rotated');
  }
}

/**
 * onToggleSidebar()
 * - Toggles the collapsed class only if width >= 1200.
 * - Stores collapsed state in cookie.
 */
function onToggleSidebar() {
  const width = window.innerWidth;
  if (width < 1200) {
    return; 
  }

  // Toggle collapsed state
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');

  // Save state to cookie (expires in 7 days)
  setCookie('sidebarCollapsed', isCollapsed, 7);

  // Update toggle icon rotation
  if (isCollapsed) {
    toggleIcon.classList.add('rotated');
  } else {
    toggleIcon.classList.remove('rotated');
  }
}

/************************************************
  MAIN EXECUTION FLOW
************************************************/
document.addEventListener('DOMContentLoaded', () => {
  if (toggleButton && sidebar && mainLayout) {
    // Initial check on load
    checkSidebar();

    // Re-check on window resize
    window.addEventListener('resize', checkSidebar);

    // Handle toggle click
    toggleButton.addEventListener('click', onToggleSidebar);
  }
});
