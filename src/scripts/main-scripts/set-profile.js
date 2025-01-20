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

// On DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  let userDataPromise = null;
  
  // Reusable function to retrieve user data
  function get_user_data() {
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
      const url = globalAPI + "/user/profile";
      const headers = {
        "accept": "application/json",
        "Authorization": credentials
      };

      try {
        const response = await fetch(url, { headers });

        if (response.status === 401 || response.status === 400) {
          console.log("Redirecting to /login");
          window.location.href = '/login';
          throw new Error("Unauthorized or Bad Request");
        }

        if (response.status === 404) {
          console.log("Credentials not found. Redirecting to /login.");
          window.location.href = '/login';
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

  async function function_fetc_data_header() {
    try {
      let user_data = await get_user_data();
      if (!user_data) {
        console.error("No user data found");
        return;
      }

      // Fetch the elements in the UI
      const user_name = document.getElementById('user-name');
      const user_email = document.getElementById('user-email');

      // Assign username and email from the API response
      if (user_name && user_email) {
        user_name.textContent = user_data['username'];    // or user_data['name'] if desired
        user_email.textContent = user_data['email'];
      }

      // Profile pictures (optional, if these elements exist on your page)
      const profile_picture1 = document.getElementById('profile-icon1');
      const profile_picture2 = document.getElementById('profile-icon2');
      const profile_picture3 = document.getElementById('profile-icon3');

      if (profile_picture1 && profile_picture2 && profile_picture3) {
        profile_picture1.src = user_data['url_picture'];
        profile_picture2.src = user_data['url_picture'];
        profile_picture3.src = user_data['url_picture'];
      }
    } catch (error) {
      console.error("Error fetching user data:", error.message);
    }
  }

  // Fetch user data after DOM is loaded
  function_fetc_data_header();

  // Close the menu when pressing the Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      closeMenus();
    }
  });

  // Close the menu when clicking outside of it
  document.addEventListener('click', function(event) {
    var profileMenu = document.getElementById('profile-menu');
    if (!profileMenu) return;

    var clickInsideProfileMenu = profileMenu.contains(event.target);
    var isProfileMenuOpen = profileMenu.classList.contains('show');

    // Close the profile menu if open and click is outside
    if (isProfileMenuOpen && !clickInsideProfileMenu) {
      closeMenus();
    }
  });

  // Stop propagation on the profile menu itself
  var profileMenuElement = document.getElementById('profile-menu');
  if (profileMenuElement) {
    profileMenuElement.addEventListener('click', function(event) {
      event.stopPropagation();
    });
  } else {
    console.error("'profile-menu' element not found");
  }
});

// Toggle the Settings Menu
function openSettings(event) {
  event.stopPropagation(); // Prevent clicks on the icon from closing it immediately
  const settingsMenu = document.getElementById('settings-menu');
  settingsMenu.classList.toggle('show');
}

// Close the menu when clicking outside or pressing ESC
window.addEventListener('click', function(e) {
  const settingsMenu = document.getElementById('settings-menu');
  const gearIcon = document.querySelector('.gear-icon');

  // If menu is open and the click is outside both menu & gear icon
  if (
    settingsMenu.classList.contains('show') &&
    !settingsMenu.contains(e.target) &&
    e.target !== gearIcon
  ) {
    settingsMenu.classList.remove('show');
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    const settingsMenu = document.getElementById('settings-menu');
    if (settingsMenu.classList.contains('show')) {
      settingsMenu.classList.remove('show');
    }
  }
});
