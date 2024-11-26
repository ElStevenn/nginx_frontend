let user_bearer_token = null;

async function get_proxy_ip() {
    const url = exchangeAPI + '/proxy/public-ip';

    try {
        let response = await fetch(url, {
            method: 'GET'
        });

        if (response.ok) {
            let data = await response.json();
            return data.proxy_ip;
        } else {
            console.error(`HTTP Error: ${response.status}`);
            return null; 
        }
    } catch (error) {
        console.error('Fetch error:', error.message);
        return null; 
    }
}

function getAccessKeyFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const accessKey = urlParams.get("access_key");
    if (accessKey) {
        user_bearer_token = accessKey;
    } else {
        user_bearer_token = null;
    }
}

async function validate_credentials(email_address, api_key, secret_key, account_name, passphrase, ip) {
    const url = `${exchangeAPI}/auth/register`;
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": user_bearer_token // Use the extracted access_key here
    };
    const data = {
        "email": email_address,
        "account_name": account_name,
        "apikey": api_key,
        "secret_key": secret_key,
        "passphrase": passphrase,
        "ip": ip
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Credentials validated successfully:', result);
            return result; 
        } else if (response.status === 401) {
            console.error('Unauthorized: Check API key and secret key.');
            throw new Error('Unauthorized (401): Invalid credentials.');
        } else if (response.status === 400) {
            const errorDetails = await response.json();
            console.error('Bad Request:', errorDetails);
            throw new Error(`Bad Request (400): ${errorDetails.message || 'Invalid input data.'}`);
        } else {
            console.error('Unexpected response status:', response.status);
            throw new Error(`Error ${response.status}: Unexpected response.`);
        }
    } catch (error) {
        console.error('Error while validating credentials:', error);
        throw error; 
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById('account-form');
    const confirmationScreen = document.getElementById('confirmation-screen');
    const yesButton = document.getElementById('yes-button');
    const noButton = document.getElementById('no-button');
    const loadingBar = document.getElementById('loading-bar');
    const urlParams = new URLSearchParams(window.location.search);
    const accessKey = urlParams.get("access_key");

    let proxy_ip = null;

    // Handle access key errors
    if (accessKey == "" || !accessKey){
        show403Error();
        return; // Ensure the rest of the code doesn't run if access is denied
    }

    // Fetch and display the proxy IP
    async function fetchAndDisplayIP() {
        const url = exchangeAPI + '/proxy/public-ip';

        try {
            let response = await fetch(url, {
                method: 'GET'
            });

            if (response.ok) {
                let data = await response.json();
                proxy_ip = data.proxy_ip;
                document.getElementById('ip-address-main').textContent = proxy_ip;
                document.getElementById('ip-address-confirmation').textContent = proxy_ip;
            } else {
                console.error(`HTTP Error: ${response.status}`);
                document.getElementById('ip-address-main').textContent = "Unable to fetch IP";
                document.getElementById('ip-address-confirmation').textContent = "Unable to fetch IP";
            }
        } catch (error) {
            console.error('Fetch error:', error.message);
            document.getElementById('ip-address-main').textContent = "Unable to fetch IP";
            document.getElementById('ip-address-confirmation').textContent = "Unable to fetch IP";
        }
    }

    await fetchAndDisplayIP();

    // Handle form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault(); 
        // Show confirmation screen
        confirmationScreen.style.display = 'flex';
    });

    // YES button click handler
    yesButton.addEventListener('click', async function() {
        confirmationScreen.style.display = 'none';

        // Show the loading bar
        loadingBar.style.display = 'block';

        // Get form data
        var account_name = document.getElementById("account_name").value;
        var email_address = document.getElementById("email").value;
        var api_key = document.getElementById("api_key").value;
        var secret_key = document.getElementById("secret_key").value;
        var passphrase = document.getElementById("passphrase").value;

        try {
            // Call validate_credentials function
            let result = await validate_credentials(email_address, api_key, secret_key, account_name, passphrase, proxy_ip);

            // Handle success, e.g., redirect or show success message
            console.log('Credentials validated successfully:', result);
            // Redirect or show success message
            // For example, redirect to a success page:
            // window.location.href = "/success-page";

        } catch (error) {
            // Handle error, e.g., show error message
            console.error('Error while validating credentials:', error);
            alert('Error: ' + error.message);
        } finally {
            // Hide the loading bar
            loadingBar.style.display = 'none';
        }
    });

    // NO button click handler
    noButton.addEventListener('click', function() {
        // Close the confirmation screen
        confirmationScreen.style.display = 'none';
        // Optionally, you can provide additional instructions
    });
});

document.addEventListener("DOMContentLoaded", () => {
    getAccessKeyFromURL();

    // Handle access key errors
    if (!user_bearer_token) {
        show403Error();
        return; 
    }

    initializeApp();
});

document.addEventListener("DOMContentLoaded", async () => { 
    const urlParams = new URLSearchParams(window.location.search);
    const accessKey = urlParams.get("access_key");

    // Handle access key errors
    if (accessKey == "" || !accessKey){
        show403Error();
        return; 
    }

    // Show public IP
    let proxy_ip = await get_proxy_ip();

    // Update IP address in main form
    var proxy_ip_main = document.getElementById('ip-address-main');
    // Update IP address in confirmation screen
    var proxy_ip_confirmation = document.getElementById('ip-address-confirmation');

    if (proxy_ip && proxy_ip_main && proxy_ip_confirmation) {
        proxy_ip_main.textContent = proxy_ip;
        proxy_ip_confirmation.textContent = proxy_ip;
    } else {
        console.error('Failed to update IP address in the DOM.');
        if (proxy_ip_main) proxy_ip_main.textContent = "Unable to fetch IP";
        if (proxy_ip_confirmation) proxy_ip_confirmation.textContent = "Unable to fetch IP";
    }
});

// V 2.0.1