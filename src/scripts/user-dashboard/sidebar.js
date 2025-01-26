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
    mainContent.classList.remove('collapsed');  // remove any leftover class
    toggleButton.classList.add('hidden');

    sidebar.style.display = 'none';

    // Optionally hide "complete-register" on phone
    complete_register1.style.display = 'none';

    // Adjust the main content
    mainContent.style.marginLeft = '0';  // or let .main-content { margin-left:0 } in CSS
    mainContent.style.padding = '10px';

  } else if (width < 1200) {
    // Force the sidebar to collapsed state
    sidebar.style.display = 'flex';
    sidebar.classList.remove('hidden');
    sidebar.classList.add('collapsed');
    mainContent.classList.add('collapsed');  // apply collapsed margin for main
    toggleButton.classList.remove('hidden');

    complete_register1.style.display = 'block';

    mainContent.style.marginLeft = '80px';
    mainContent.style.padding = '20px';

  } else {
    // Width >= 1200 => Show sidebar fully or collapsed depending on cookie
    sidebar.style.display = 'flex';
    sidebar.classList.remove('hidden');
    toggleButton.classList.remove('hidden');

    // Show "complete-register" again
    complete_register1.style.display = 'block';

    // Let initSidebarState() handle actual collapse vs. expand
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
  if (!sidebar || !toggleIcon) {
    console.warn("Sidebar or toggleIcon missing.");
    return;
  }

  // Always ensure we see the default (expanded) first
  sidebar.classList.remove('collapsed');
  mainContent.classList.remove('collapsed');
  toggleIcon.classList.remove('rotated');

  const isCollapsed = getCookie('sidebarCollapsed') === 'true';

  if (isCollapsed) {
    // Collapsed state
    sidebar.classList.add('collapsed');
    mainContent.classList.add('collapsed'); 
    toggleIcon.classList.add('rotated');

    // Update styles if you prefer inline:
    mainContent.style.marginLeft = '80px';
    mainContent.style.maxWidth = '1820px';
  } else {
    // Expanded state
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('collapsed');
    toggleIcon.classList.remove('rotated');

    mainContent.style.maxWidth = '1600px';
    mainContent.style.marginLeft = '270px';
  }
}

/**
 * onToggleSidebar()
 * - Toggles the collapsed class if width >= 1200.
 * - Stores collapsed state in cookie.
 * - Also toggles .collapsed on main-content
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

  // Update toggle icon rotation
  if (isCollapsed) {
    toggleIcon.classList.add('rotated');
    mainContent.style.marginLeft = '80px';
  } else {
    toggleIcon.classList.remove('rotated');
    mainContent.style.marginLeft = '240px';
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
