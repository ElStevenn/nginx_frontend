/************************************
 *      HEADER MENU 
 ************************************/

function toggleMenu1(event) {
  event.stopPropagation();
  var profileMenu = document.getElementById('profile-menu');

  // Toggle the user profile menu
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
  // Clear auth cookie
  document.cookie = "credentials=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = '/login';
}

// Global references so we can reuse user data when updating
let userDataPromise = null;
let userData = null;

// In the future use this function to get the whole profile
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
        console.log("Redirecting to /login");
        window.location.href = "/login";
        throw new Error("Unauthorized or Bad Request");
      }

      if (response.status === 404) {
        console.log("Credentials not found. Redirecting to /login.");
        window.location.href = "/login";
        throw new Error("Credentials not found");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}, Message: ${errorText}`
        );
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
  // Convert avariable_emails array to a string (if it's an array)
  let avariableEmails = userData.avariable_emails;
  if (Array.isArray(avariableEmails)) {
    avariableEmails = avariableEmails.join(",");
  }

  // Build the POST payload using the final schema
  const payload = {
    // If your schema includes these fields, add them
    // If not, remove them or leave them out
    username: userData.username || "",
    name: userData.name || "",
    email: userData.email || "",

    url_picture: userData.url_picture || "",
    client_timezone: userData.client_timezone || "",
    // Make sure we are sending a boolean, not null
    dark_mode: userData.dark_mode === true || userData.dark_mode === false
      ? userData.dark_mode
      : false,
    currency: userData.currency || "",
    language: userData.language || "",
    notifications: userData.notifications || "",
    // Must be a string according to your schema
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

    // Fetch the elements of user menu
    const user_name = document.getElementById("user-name");
    const user_email = document.getElementById("user-email");
    const profile_picture = document.getElementById("profile-picture");

    // Assign username and email from the API response
    if (user_name && user_email) {
      user_name.textContent = userData.username;
      user_email.textContent = userData.email;
    }

    if (profile_picture) {
      profile_picture.src = userData.url_picture;
    }

    // Fetch the elements of quick configuration
    const language_select = document.getElementById("language-select");
    const currency_select = document.getElementById("currency-select");
    const dark_mode_toggle = document.getElementById("dark-mode-toggle");
    const notifications_select = document.getElementById("notification-order");

    // Assign values from userData
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
  // Fetch user data after DOM is loaded
  function_fetc_data_header();

  // Close the menu when pressing the Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.key === "Esc") {
      closeMenus();
    }
  });

  // Close the menu when clicking outside of it
  document.addEventListener("click", function (event) {
    var profileMenu = document.getElementById("profile-menu");
    if (!profileMenu) return;

    var clickInsideProfileMenu = profileMenu.contains(event.target);
    var isProfileMenuOpen = profileMenu.classList.contains("show");

    // Close the profile menu if open and click is outside
    if (isProfileMenuOpen && !clickInsideProfileMenu) {
      closeMenus();
    }
  });

  // Stop propagation on the profile menu itself
  var profileMenuElement = document.getElementById("profile-menu");
  if (profileMenuElement) {
    profileMenuElement.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  } else {
    console.error("'profile-menu' element not found");
  }
});

// Toggle the Settings Menu
function openSettings(event) {
  event.stopPropagation(); // Prevent clicks on the icon from closing it immediately
  const settingsMenu = document.getElementById("settings-menu");
  settingsMenu.classList.toggle("show");
}

// Close the menu when clicking outside or pressing ESC
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

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" || e.key === "Esc") {
    const settingsMenu = document.getElementById("settings-menu");
    if (settingsMenu.classList.contains("show")) {
      settingsMenu.classList.remove("show");
    }
  }
});
