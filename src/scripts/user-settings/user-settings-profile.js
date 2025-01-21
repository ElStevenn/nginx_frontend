
// Everything about user settings here, the screen user settings has to be here


async function get_whole_settings() {
    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("No credentials found");
        window.location.href = '/login';
        throw new Error("No credentials found");
    }
    credentials = credentials.replace(/^"(.*)"$/, '$1');

    const url = globalAPI + "/user/configuration"
    const headers = {
        "accept": "application/json",
        "Authorization": credentials
    }

    const response = await fetch(url, { headers });
    if (response.status === 404 || response.status === 400) {
        // Handle of user not found or just any error ocurred
        console.log("Redirecting to /login");
        window.location.href = '/login';
        throw new Error("Unauthorized or Bad Request");
    }else if(response.status === 500){
        let error_text = await response.text()
        console.log("Internal server error: ", error_text);
        window.location.href = '/server-error';
        throw new Error("Internal server error");
    }
    
    const data = await response.json();
    return data

}   


async function set_user_profile() {
    const user_data = await get_whole_settings();

    // Fetch static values to HTML
    var user_picture1 = document.getElementById('current-profile-pic');
    var user_picture2 = document.getElementById('user-profile-picture');
    var user_username = document.getElementById('user-name-main');
    var user_fullname = document.getElementById('full-name-main');
    var email_imput = document.getElementById('email-input');

    // dark_mode
    // language
    // notifications
    // currency

    if (user_picture1 && user_data['url_picture']) {
        setImageWithFallback(user_picture1, user_data['url_picture'], '/images//icons/user_default.png');
    } else {
        user_picture1.src = '/images/user_default.png';
    }

    if (user_picture2 && user_data['url_picture']) {
        setImageWithFallback(user_picture2, user_data['url_picture'], '/images/icons/user_default.png');
    } else {
        user_picture2.src = '/images/user_default.png';
    }
    
    if (user_username) {
        user_username.textContent = `@${user_data['username']}`;
    }

    if (user_fullname) {
        user_fullname.textContent = user_data['name'];
    }

    if (user_email) {
        user_email.textContent = user_data['email'];
    }

    // Fetch inputs to HTML
    var input_first_name = document.getElementById('first-name');
    var input_surname = document.getElementById('surname');
    var input_url = document.getElementById('url-input');
    var location = document.getElementById('location');
    var select_trading_experience = document.getElementById('trading-experience');

    // Ensure elements exist before assigning values
    if (input_first_name) input_first_name.value = user_data['name'];
    if (input_surname) input_surname.value = user_data['surname'];
    if (input_url) input_url.value = user_data['webpage_url'] || '';
    if (location) location.value = user_data['location'] || '';
    if (select_trading_experience) select_trading_experience.value = user_data['trading_experience'] || 'none-selected';
}


document.addEventListener('DOMContentLoaded', async function() {
    await set_user_profile();
});


//  - SAVE USER PROFILE -
async function update_user_profile(event) {
    event.preventDefault();

    // Collect form data
    var input_first_name = document.getElementById('first-name').value.trim() || '';
    var input_surname = document.getElementById('surname').value.trim() || '';
    var input_url = document.getElementById('url-input').value.trim() || '';
    var location = document.getElementById('location').value.trim() || '';
    var select_trading_experience = document.getElementById('trading-experience').value || '';
    var selected_email = document.getElementById('public-email').value || '';

    // dark_mode
    // language
    // notifications
    // currency

    // If the selected value is 'non-selected-value', set selected_email to null
    if (selected_email === 'non-selected-value') {
        selected_email = null;
    }

    const data = {
        "name": input_first_name,
    };

    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("No credentials found");
        window.location.href = '/login';
        throw new Error("No credentials found");
    }
    credentials = credentials.replace(/^"(.*)"$/, '$1');

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": credentials
    };
    const url = globalAPI + "/user/profile-configuration";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data) 
        });

        if (response.ok) {
            showNotification("Your profile has been updated successfully!", 'success');
        } else {
            showNotification("Failed to update profile. Please try again.", 'error');
        }
    } catch (error) {
        console.error("Error updating profile:", error);

        // Show error notification
        showNotification("An error occurred. Please try again.", 'error');
    }
}


function showNotification(message, type = 'success') {
    const notificationBar = document.getElementById('notification-bar');
    const notificationMessage = document.getElementById('notification-message');
    notificationMessage.textContent = message;

    // Remove existing type classes
    notificationBar.classList.remove('success', 'error');

    // Add the appropriate type class
    notificationBar.classList.add(type);

    // Add the 'show' class to slide down the notification bar
    notificationBar.classList.add('show');

    // Show notification for 3 secconds
    setTimeout(() => {
        notificationBar.classList.remove('show');
    }, 3000); 
}



// SHOWING SECTIONS SCRIPT
function showSection(sectionId, event) {
    if (event) {
        event.preventDefault();
    }

    // Update the URL without reloading the page
    history.pushState({ sectionId: sectionId }, '', '/settings/' + sectionId);

    // Update the active menu item
    var menuItems = document.querySelectorAll('.settings-menu li');
    menuItems.forEach(function(item) {
        item.classList.remove('active');
    });

    var menuItem = document.querySelector(`.settings-menu li[data-section="${sectionId}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    } else {
        console.error(`Menu item with data-section="${sectionId}" not found.`);
    }

    // Show the selected section
    var sections = document.querySelectorAll('.settings-section');
    sections.forEach(function(section) {
        section.classList.remove('active');
    });

    var sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
        sectionElement.classList.add('active');
    } else {
        showSection('profile');
    }
}


async function delete_user_full_account(event) {
    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("No credentials found");
        window.location.href = '/login';
        throw new Error("No credentials found");
    }

    credentials = credentials.replace(/^"(.*)"$/, '$1');

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": credentials
    };

    const url = globalAPI + "/user/delete-account";

    try {
        const response = await fetch(url, {
            method: "DELETE",
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            window.location.href = data.redirect_url; // Use redirect URL from backend
        } else {
            const errorDetails = await response.json();
            console.error("API Error:", errorDetails);
            showNotification("An error occurred with the API: " + errorDetails.detail, 'error');
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        showNotification("An error occurred, we couldn't delete your account.", 'error');
    }
}




document.querySelector('.edit-profile-pic-button').addEventListener('click', function() {
    document.getElementById('profile-pic-input').click();
});


document.addEventListener('DOMContentLoaded', function() {
    var pathParts = window.location.pathname.split('/');
    var sectionId = pathParts[2] || 'profile'; 
    showSection(sectionId);
});

window.addEventListener('popstate', function(event) {
    var sectionId;

    if (event.state && event.state.sectionId) {
        sectionId = event.state.sectionId;
    } else {
        var pathParts = window.location.pathname.split('/');
        sectionId = pathParts[2] || 'profile';
    }

    // Show the section without adding a new history entry
    showSection(sectionId);
});



// v.3.2.1