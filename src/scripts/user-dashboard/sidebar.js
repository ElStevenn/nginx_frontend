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
let toggleIcon = null;

if (toggleButton) {
  toggleIcon = toggleButton.querySelector('img');
}

/**
 * checkSidebar()
 * - Runs on load & on window resize.
 * - Decides how the sidebar should look based on screen width
 *   (small => hidden, medium => collapsed, large => expanded).
 * - Then calls initSidebarState() to override with cookie.
 */
function checkSidebar() {
  if (!sidebar || !mainLayout || !toggleButton) {
    console.warn("Sidebar or toggle button elements not found in the DOM.");
    return;
  }

  const width = window.innerWidth;
  console.log(`Window width: ${width}px`);

  if (width < 950) {
    // Hide the sidebar and toggle button
    sidebar.classList.add('hidden');
    toggleButton.classList.add('hidden');

    // Reset main layout margin
    mainLayout.classList.remove('sidebar-collapsed', 'sidebar-expanded');
    mainLayout.style.marginLeft = '0';
    console.log('Sidebar hidden. mainLayout margin-left set to 0.');
  } else {
    // Show the sidebar and toggle button
    sidebar.classList.remove('hidden');
    toggleButton.classList.remove('hidden');

    // Apply cookie-based collapse state
    initSidebarState();
  }
}

/**
 * initSidebarState()
 * - Reads 'sidebarCollapsed' cookie
 * - If 'true', sets the sidebar to collapsed
 * - Otherwise, ensures it is expanded
 */
function initSidebarState() {
  if (!sidebar || !toggleIcon || !mainLayout) {
    console.warn("Sidebar, toggleIcon, or mainLayout elements are missing.");
    return;
  }

  const isCollapsed = getCookie('sidebarCollapsed') === 'true';
  console.log(`Sidebar collapsed state from cookie: ${isCollapsed}`);

  // I WANT TO REMOVE THIS, THIS IS WRONG, USE MARGIN IS WRONG!!! IT IS WRONG!! THE MARGIN MUST BE WITH THE SIDEBAR NOT WITH THE BORDER ORF THE SCREEN!!!
  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    toggleIcon.classList.add('rotated');
    mainLayout.style.marginLeft = '80px'; // Consistent unit
    toggleButton.style.padding = '6px 7px 4px 8px';
    console.log('Sidebar collapsed. mainLayout margin-left set to 80px.');
  } else {
    sidebar.classList.remove('collapsed');
    toggleIcon.classList.remove('rotated');
    mainLayout.style.marginLeft = '250px'; // THIS IS WHAT YOU MUST MODIFY, THIS IS R
    toggleButton.style.padding = '6px 9px 4px 6px';
    console.log('Sidebar expanded. mainLayout margin-left set to 16%.');
  }
}


function onToggleSidebar() {
  const width = window.innerWidth;
  if (width < 950) {
    console.log('Toggle ignored: window width less than 950px.');
    return; // Not used for small screens
  }

  // Toggle collapsed state
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  console.log(`Sidebar toggled to ${isCollapsed ? 'collapsed' : 'expanded'}.`);

  // Save state to cookie (expires in 7 days)
  setCookie('sidebarCollapsed', isCollapsed, 7);

  // Update visuals based on new state
  if (isCollapsed) {
    mainLayout.style.marginLeft = '80px';
    toggleButton.style.padding = '6px 7px 4px 8px';
    toggleIcon.classList.add('rotated');
    console.log('Sidebar collapsed. mainLayout margin-left set to 80px.');
  } else {
    mainLayout.style.marginLeft = '15%';
    toggleButton.style.padding = '6px 9px 4px 6px';
    toggleIcon.classList.remove('rotated');
    console.log('Sidebar expanded. mainLayout margin-left set to 16%.');
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

    console.log('Sidebar initialized successfully.');
  } else {
    console.warn("Sidebar or toggle button elements not found in the DOM.");
  }
});
