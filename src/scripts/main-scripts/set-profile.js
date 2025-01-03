function toggleMenu1(event) {
    event.stopPropagation();

    var profileMenu = document.getElementById('profile-menu');
    var listMenu = document.getElementById('list-menu');
    var overlay = document.getElementById('overlay');

    // Close the list menu if it's open
    if (listMenu.classList.contains('show')) {
        listMenu.classList.remove('show');
        overlay.style.display = 'none';
    }

    profileMenu.classList.toggle('show');
}

function toggleMenu2(event) {
    event.stopPropagation();

    var listMenu = document.getElementById('list-menu');
    var profileMenu = document.getElementById('profile-menu');
    var overlay = document.getElementById('overlay');

    // Close the profile menu if it's open
    if (profileMenu.classList.contains('show')) {
        profileMenu.classList.remove('show');
    }

    listMenu.classList.toggle('show');
    overlay.style.display = listMenu.classList.contains('show') ? 'block' : 'none';
}

function closeMenus() {
    var profileMenu = document.getElementById('profile-menu');
    var listMenu = document.getElementById('list-menu');
    var overlay = document.getElementById('overlay');

    if (profileMenu.classList.contains('show')) {
        profileMenu.classList.remove('show');
    }

    if (listMenu.classList.contains('show')) {
        listMenu.classList.remove('show');
        overlay.style.display = 'none'; 
    }
}

function log_out() {
    document.cookie = "credentials=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', function() {
    // Your existing code
    let userDataPromise = null;
    
    function get_user_data() {
        if (userDataPromise) {
            console.log("Returning cached user data");
            return userDataPromise;
        }

        userDataPromise = (async () => {
            let credentials = getCookie("credentials");

            if (!credentials) {
                console.error("No credentials found, now you should be redirected to the login page");
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

            const user_username = document.getElementById('user-username');
            const user_username2 = document.getElementById('user-username2');

            if (user_username) {
                user_username.textContent = `${user_data['username']}`; 
                user_username2.textContent = `@${user_data['username']}`;
            } else {
                console.error("'user-username' element not found");
            }

            const given_name = document.getElementById('given_name');
            const given_name2 = document.getElementById('given_name2');

            if (given_name) {
                given_name.textContent = user_data['name'];
                given_name2.textContent = user_data['name'];
            } else {
                console.error("'given_name' element not found");
            }

            const profile_picture1 = document.getElementById('profile-icon1');
            const profile_picture2 = document.getElementById('profile-icon2');
            const profile_picture3 = document.getElementById('profile-icon3');

            if (profile_picture1) {
                profile_picture1.src = user_data['url_picture'];
                profile_picture2.src = user_data['url_picture'];
                profile_picture3.src = user_data['url_picture'];
            } else {
                console.error("'profile_picture' element not found");
            }
        } catch (error) {
            // Errors are already handled in get_user_data
        }
    }

    // Call the function after DOM is loaded
    function_fetc_data_header();

    // Close the menu when clicking any of the close buttons
    document.querySelectorAll('.close-button').forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent the click from propagating
            closeMenus();
        });
    });

    // Close the menus when pressing the Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' || event.key === 'Esc') { // 'Esc' for older browsers
            closeMenus();
        }
    });

    // Close the menus when clicking outside of them
    document.addEventListener('click', function(event) {
        var listMenu = document.getElementById('list-menu');
        var profileMenu = document.getElementById('profile-menu');

        var clickInsideListMenu = listMenu.contains(event.target);
        var clickInsideProfileMenu = profileMenu.contains(event.target);

        var isListMenuOpen = listMenu.classList.contains('show');
        var isProfileMenuOpen = profileMenu.classList.contains('show');

        // Close the list menu if open and click is outside
        if (isListMenuOpen && !clickInsideListMenu) {
            closeMenus();
        }

        // Close the profile menu if open and click is outside
        if (isProfileMenuOpen && !clickInsideProfileMenu) {
            closeMenus();
        }
    });

    // Prevent clicks inside the profile menu from closing the menu
    var profileMenuElement = document.getElementById('profile-menu');
    if (profileMenuElement) {
        profileMenuElement.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    } else {
        console.error("'profile-menu' element not found");
    }

    // Prevent clicks inside the list menu from closing the menu
    var listMenuElement = document.getElementById('list-menu');
    if (listMenuElement) {
        listMenuElement.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    } else {
        console.error("'list-menu' element not found");
    }

    var overlayElement = document.getElementById('overlay');
    if (overlayElement) {
        overlayElement.addEventListener('click', function(event) {
            closeMenus();
        });
    } else {
        console.error("'overlay' element not found");
    }
});
