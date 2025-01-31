/************************************
 *      HEADER MENU 
 ************************************/
function toggleMenu1(event) {
  event.stopPropagation();
  var profileMenu = document.getElementById('profile-menu');
  // Toggle the user profile / mobile navigation menu
  profileMenu.classList.toggle('show');
}

function closeMenus() {
  // Closes the profile menu if it’s open
  var profileMenu = document.getElementById('profile-menu');
  if (profileMenu.classList.contains('show')) {
    profileMenu.classList.remove('show');
  }
}

function log_out() {
  // Clear auth cookie and redirect to login page
  document.cookie = "credentials=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = '/login';
}

// Global references so we can reuse user data when updating
let userDataPromise = null;
let userData = null;

// Function to get the header data
async function get_header_data() {
  if (userDataPromise) {
    console.log("Returning cached user data");
    return userDataPromise;
  }

  userDataPromise = (async () => {
    let credentials = getCookie("credentials");

    if (!credentials) {
      console.error("No credentials found, redirecting to login page");
      window.location.href = '/login';
      throw new Error("No credentials found");
    }

    credentials = credentials.replace(/^"(.*)"$/, '$1');
    const url = globalAPI + "/user/configuration";
    const headers = {
      accept: "application/json",
      Authorization: credentials
    };

    try {
      const response = await fetch(url, { headers });

      if (response.status === 401 || response.status === 400) {
        window.location.href = "/login";
        throw new Error("Unauthorized or Bad Request");
      }

      if (response.status === 404) {
        window.location.href = "/login";
        throw new Error("Credentials not found");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching user data:", error.message);
      userDataPromise = null;
      throw error;
    }
  })();

  return userDataPromise;
}

async function updateUserConfiguration() {
  // Convert avariable_emails array to a string if necessary
  let avariableEmails = userData.avariable_emails;
  if (Array.isArray(avariableEmails)) {
    avariableEmails = avariableEmails.join(",");
  }

  // Build the POST payload
  const payload = {
    username: userData.username || "",
    name: userData.name || "",
    email: userData.email || "",
    url_picture: userData.url_picture || "",
    client_timezone: userData.client_timezone || "",
    dark_mode: typeof userData.dark_mode === 'boolean' ? userData.dark_mode : false,
    currency: userData.currency || "",
    language: userData.language || "",
    notifications: userData.notifications || "",
    avariable_emails: avariableEmails || ""
  };

  let credentials = getCookie("credentials");
  credentials = credentials.replace(/^"(.*)"$/, "$1");

  const url = globalAPI + "/user/configuration";
  const headers = {
    accept: "application/json",
    "Content-Type": "application/json",
    Authorization: credentials
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error: ${response.status}, ${errorText}`);
    }

    const updatedData = await response.json();
    console.log("User configuration updated successfully:", updatedData);
  } catch (error) {
    console.error("Error updating user data:", error.message);
  }
}

async function function_fetc_data_header() {
  try {
    userData = await get_header_data();
    if (!userData) {
      console.error("No user data found");
      return;
    }

    // Update profile menu elements with user data
    const user_name = document.getElementById("user-name");
    const user_email = document.getElementById("user-email");
    const profile_picture = document.getElementById("profile-picture");

    if (user_name && user_email) {
      user_name.textContent = userData.username;
      user_email.textContent = userData.email;
    }

    if (profile_picture) {  
      profile_picture.src = userData.url_picture;
    }

    // Quick configuration elements
    const language_select = document.getElementById("language-select");
    const currency_select = document.getElementById("currency-select");
    const dark_mode_toggle = document.getElementById("dark-mode-toggle");
    const notifications_select = document.getElementById("notification-order");

    if (language_select) {
      language_select.value = userData.language || "";
      language_select.addEventListener("change", async () => {
        userData.language = language_select.value;
        await updateUserConfiguration();
      });
    }

    if (currency_select) {
      currency_select.value = userData.currency || "";
      currency_select.addEventListener("change", async () => {
        userData.currency = currency_select.value;
        await updateUserConfiguration();
      });
    }

    if (dark_mode_toggle) {
      dark_mode_toggle.checked = !!userData.dark_mode;
      dark_mode_toggle.addEventListener("change", async () => {
        userData.dark_mode = dark_mode_toggle.checked;
        await updateUserConfiguration();
      });
    }

    if (notifications_select) {
      notifications_select.value = userData.notifications || "";
      notifications_select.addEventListener("change", async () => {
        userData.notifications = notifications_select.value;
        await updateUserConfiguration();
      });
    }
  } catch (error) {
    console.error("Error fetching user data:", error.message);
  }
}

// On DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  function_fetc_data_header();

  // Close profile menu on pressing Escape
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.key === "Esc") {
      closeMenus();
    }
  });

  // Close menus when clicking outside
  document.addEventListener("click", function (event) {
    var profileMenu = document.getElementById("profile-menu");
    if (!profileMenu) return;

    var clickInsideProfileMenu = profileMenu.contains(event.target);
    var isProfileMenuOpen = profileMenu.classList.contains("show");

    if (isProfileMenuOpen && !clickInsideProfileMenu) {
      closeMenus();
    }
  });

  // Prevent click propagation within the profile menu
  var profileMenuElement = document.getElementById("profile-menu");
  if (profileMenuElement) {
    profileMenuElement.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  } else {
    console.error("'profile-menu' element not found");
  }
});

// Toggle Settings Menu
function openSettings(event) {
  event.stopPropagation();
  const settingsMenu = document.getElementById("settings-menu");
  settingsMenu.classList.toggle("show");
}

// Close Settings Menu when clicking outside
window.addEventListener("click", function (e) {
  const settingsMenu = document.getElementById("settings-menu");
  const gearIcon = document.querySelector(".gear-icon");

  if (
    settingsMenu.classList.contains("show") &&
    !settingsMenu.contains(e.target) &&
    e.target !== gearIcon
  ) {
    settingsMenu.classList.remove("show");
  }
});
