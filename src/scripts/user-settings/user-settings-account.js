

function openCredentialsWindow() {
    window.open(
        `/settings/set_credentials`,
        `tinyWindow_${Date.now()}`,
        'width=700,height=700,top=100,left=200'
    );
}

// Function to fetch trading accounts from the API
async function get_trading_accounts() {
    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("No credentials found");
        window.location.href = '/login';
        throw new Error("No credentials found");
    }

    credentials = credentials.replace(/^"(.*)"$/, '$1');
    const url = globalAPI + '/accounts/users';
    const headers = {
        "Accept": "application/json",
        "Authorization": credentials
    };

    try {
        const response = await fetch(url, { headers });
        if (response.status === 404 || response.status === 400) {
            // Handle user not found or any error occurred
            console.log("Redirecting to /login");
            window.location.href = '/login';
            throw new Error("Unauthorized or Bad Request");
        } else if (response.status === 500) {
            const error_text = await response.text();
            console.log("Internal server error: ", error_text);
            window.location.href = '/server-error';
            throw new Error("Internal server error");
        }

        const data = await response.json();
        return data; 
    } catch (error) {
        console.error('Fetch error:', error.message);
        throw error;
    }
}

async function set_user_account() {
    try {
        const user_trading_accounts = await get_trading_accounts();

        // Find the select element in the DOM
        const accountSelector = document.getElementById('trading-account');

        if (!accountSelector) {
            console.error('Select element with ID "trading-account" not found.');
            return;
        }

        // Clear existing options except the first placeholder
        accountSelector.innerHTML = '<option value="no-added">No trading account added</option>';

        // Determine if the response is an array or a single object
        let accountsArray = [];
        if (Array.isArray(user_trading_accounts)) {
            accountsArray = user_trading_accounts;
        } else if (typeof user_trading_accounts === 'object' && user_trading_accounts !== null) {
            accountsArray = [user_trading_accounts];
        } else {
            console.error("Unexpected data format:", user_trading_accounts);
            return;
        }

        // Check if there are trading accounts available
        if (accountsArray.length === 0) {
            return;
        }

        // Populate the select element with account names
        accountsArray.forEach(account => {
            const option = document.createElement('option');
            option.value = account.account_id; 
            option.textContent = account.account_name;

            // If the account is the main account, set it as selected
            if (account.type === "main-account") {
                option.selected = true;
            }

            accountSelector.appendChild(option);
        });
    } catch (error) {
        console.error('Error setting user accounts:', error);
        // Optionally, display an error message to the user
        alert('Failed to load trading accounts. Please try again later.');
    }
}

async function set_account() {
    /* Set user account */
    const account_data = await get_account_data();
    // Add your logic here if needed
}

async function save_account(event) {
    /* Save user profile, at this moment only can save the main trade account */
    event.preventDefault();

    var trading_account = document.getElementById('trading-account').value || '';

    if (trading_account == 'no-added') {
        trading_account = null;
    }    

    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("No credentials found");
        window.location.href = '/login';
        throw new Error("No credentials found");
    }

    credentials = credentials.replace(/^"(.*)"$/, '$1');
    const url = globalAPI + '/accounts/configuration';
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": credentials
    }
    const data = {
        'account_id': trading_account
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });
        
        if (response.ok) {
            showNotification('Your profile has been updated successfully!', 'success');
        } else {
            const errorMessage = await response.text();
            showNotification('Failed to update your profile with the API. ' + errorMessage, 'error');
        }
    } catch(error) {
        console.error("Error updating account:", error);
        showNotification("An error occurred while saving the profile. Please try again", 'error');
    }
}

// Ensure the set_user_account function is called when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    set_user_account();
});

/* ----------------------- */
/* New code starts here    */
/* ----------------------- */

// Function to handle menu highlighting based on URL
document.addEventListener("DOMContentLoaded", function() {
    // Extract the current section from the URL path
    const pathParts = window.location.pathname.split("/");
    let currentSection = pathParts[pathParts.length - 1]; // e.g., 'profile', 'account', etc.

    // If the URL ends with 'settings' or is empty, default to 'profile'
    if (currentSection === 'settings' || currentSection === '') {
        currentSection = 'profile';
    }

    // Query the corresponding menu item
    const currentMenuItem = document.querySelector(`.settings-menu li[data-section="${currentSection}"]`);

    // If it exists, add the 'active' class to highlight the correct section
    if (currentMenuItem) {
        currentMenuItem.classList.add('active');
        showSection(currentSection);
    } else {
        // If no match is found, default to 'profile'
        const defaultItem = document.querySelector('.settings-menu li[data-section="profile"]');
        if (defaultItem) defaultItem.classList.add('active');
        showSection('profile');
    }
});

// Define the showSection function if not already defined
function showSection(sectionId, event) {
    // Prevent default action if this function is called from an event
    if (event) event.preventDefault();

    // Hide all sections
    const sections = document.querySelectorAll('.settings-section');
    sections.forEach(section => section.classList.remove('active'));

    // Remove 'active' class from all menu items
    const menuItems = document.querySelectorAll('.settings-menu li');
    menuItems.forEach(item => item.classList.remove('active'));

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Add 'active' class to the corresponding menu item
    const selectedMenuItem = document.querySelector(`.settings-menu li[data-section="${sectionId}"]`);
    if (selectedMenuItem) {
        selectedMenuItem.classList.add('active');
    }
}

/* ----------------------- */
/* New code ends here      */
/* ----------------------- */
