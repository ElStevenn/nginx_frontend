let user_bearer_token = null;
const user_api_ip = "http://localhost:8000";
const exchange_api_ip = "http://localhost:8001"; 



function show403Error() {
    document.body.innerHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>403 Forbidden</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: #121212;
                    color: #e0e0e0;
                    font-family: 'Roboto', sans-serif;
                    text-align: center;
                    padding: 20px;
                }

                .error-container {
                    max-width: 600px;
                    background-color: #1e1e1e;
                    padding: 40px 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                h1 {
                    font-family: 'Montserrat', sans-serif;
                    color: #ff4081;
                    font-size: 48px;
                    margin-bottom: 20px;
                }

                p {
                    font-size: 18px;
                    margin-bottom: 30px;
                    line-height: 1.6;
                }

                a {
                    display: inline-block;
                    padding: 12px 25px;
                    background-color: #ff4081;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                    font-size: 16px;
                    transition: background-color 0.3s ease;
                }

                a:hover {
                    background-color: #e91e63;
                }

                @media (max-width: 480px) {
                    h1 {
                        font-size: 36px;
                    }

                    p {
                        font-size: 16px;
                    }

                    a {
                        padding: 10px 20px;
                        font-size: 14px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1>403 Forbidden</h1>
                <p>Sorry, you don't have permission to access this page.</p>
                <a href="/dashboard">Return to Dashboard</a>
            </div>
        </body>
        </html>
    `;
}

async function get_proxy_ip() {
    const url = exchange_api_ip + '/proxy/public-ip';

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
    const url = `${exchange_api_ip}/auth/register`;
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
        const exchange_api_ip = "http://localhost:8001"; // Adjust this if necessary
        const url = exchange_api_ip + '/proxy/public-ip';

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
        return; // Ensure the rest of the code doesn't run if access is denied
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

// V 2.0.0