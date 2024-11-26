
// Everything about user settings here, the screen user settings has to be here


async function get_whole_profile() {
    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("No credentials found");
        window.location.href = '/login';
        throw new Error("No credentials found");
    }
    credentials = credentials.replace(/^"(.*)"$/, '$1');

    const url = globalAPI + "/user/detailed-profile"
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
    const user_data = await get_whole_profile();

    // Fetch static values to HTML
    var user_picture1 = document.getElementById('current-profile-pic');
    var user_picture2 = document.getElementById('user-profile-picture');
    var user_username = document.getElementById('user-name-main');
    var user_fullname = document.getElementById('full-name-main');

    function setImageWithFallback(imageElement, imageUrl, fallbackUrl) {
        const cacheBustedUrl = `${imageUrl}?t=${new Date().getTime()}`;
        imageElement.src = cacheBustedUrl;
        imageElement.onerror = () => {
            console.warn("Image failed to load, using fallback.");
            imageElement.src = fallbackUrl;
        };
    }

    if (user_picture1 && user_data['url_picture']) {
        setImageWithFallback(user_picture1, user_data['url_picture'], '/images/user_default.png');
    } else {
        user_picture1.src = '/images/user_default.png';
    }

    if (user_picture2 && user_data['url_picture']) {
        setImageWithFallback(user_picture2, user_data['url_picture'], '/images/user_default.png');
    } else {
        user_picture2.src = '/images/user_default.png';
    }
    
    if (user_username) {
        user_username.textContent = `@${user_data['username']}`;
    }

    if (user_fullname) {
        user_fullname.textContent = user_data['name'];
    }

    // Fetch inputs to HTML
    var input_first_name = document.getElementById('first-name');
    var input_surname = document.getElementById('surname');
    var textarea_bio = document.getElementById('bio-input');
    var input_url = document.getElementById('url-input');
    var location = document.getElementById('location');
    var select_trading_experience = document.getElementById('trading-experience');

    // Ensure elements exist before assigning values
    if (input_first_name) input_first_name.value = user_data['name'];
    if (input_surname) input_surname.value = user_data['surname'];
    if (textarea_bio) textarea_bio.value = user_data['bio'] || '';
    if (input_url) input_url.value = user_data['webpage_url'] || '';
    if (location) location.value = user_data['location'] || '';
    if (select_trading_experience) select_trading_experience.value = user_data['trading_experience'] || 'none-selected';

    // Set user public email and populate available emails
    var email_select = document.getElementById('public-email');
    var available_emails = user_data['avariable_emails'] || [];
    var public_email = user_data['public_email'];

    if (email_select) {
        email_select.innerHTML = '<option value="non-selected-value">Select a verified email to display</option>';
        
        // Add available emails to the select
        available_emails.forEach(email => {
            const option = document.createElement('option');
            option.value = email;
            option.textContent = email;
            if (email === public_email) {
                option.selected = true;
            }

            email_select.appendChild(option);
        });

        // If no public email is selected, keep the default option (non-selected-value)
        if (!public_email) {
            email_select.value = "non-selected-value"; 
        }
    }
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
    var textarea_bio = document.getElementById('bio-input').value.trim() || '';
    var input_url = document.getElementById('url-input').value.trim() || '';
    var location = document.getElementById('location').value.trim() || '';
    var select_trading_experience = document.getElementById('trading-experience').value || '';
    var selected_email = document.getElementById('public-email').value || '';

    // If the selected value is 'non-selected-value', set selected_email to null
    if (selected_email === 'non-selected-value') {
        selected_email = null;
    }

    const data = {
        "name": input_first_name,
        "surname": input_surname,
        "webpage_url": input_url || null,
        "bio": textarea_bio || null,
        "main_used_exchange": null,
        "trading_experience": select_trading_experience || null,
        "location": location || null,
        "public_email": selected_email 
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

    console.log(`Attempting to show section: ${sectionId}`);

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
        console.log(`Section element with ID '${sectionId}' found.`);
        sectionElement.classList.add('active');
    } else {
        console.error(`Section with ID '${sectionId}' not found.`);
        // Optionally, default to 'profile' section
        showSection('profile');
    }
}


document.querySelector('.edit-profile-pic-button').addEventListener('click', function() {
    document.getElementById('profile-pic-input').click();
});


document.getElementById('profiel-pic-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const img = document.getElementById('current-profile-pic');
        img.src = URL.createObjectURL(file);
    }
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


// v.3.1.0