// Version 2.0.6

let user_bearer_token = null;

// Ensure getCookie and exchangeAPI are defined in a previously loaded script
// If not, define them before this script.

// Retrieve access key exclusively from cookies
function getAccessKeyFromCookie() {
    let credentials = getCookie("credentials");
    if (!credentials) {
        // No credentials found, just redirect to /login silently
        window.location.href = '/login';
        return;
    }
    const accessKey = credentials.replace(/^"(.*)"$/, '$1');

    if (accessKey) {
        user_bearer_token = accessKey;
    } else {
        user_bearer_token = null;
    }
}

// Copy text to clipboard with fallback
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => alert('Proxy IP copied to clipboard!'))
            .catch(() => alert('Failed to copy IP. Please copy manually.'));
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            alert('Proxy IP copied to clipboard!');
        } catch (err) {
            alert('Failed to copy IP. Please copy manually.');
        }
        document.body.removeChild(textarea);
    }
}

// Fetch proxy IP from the API
async function get_proxy_ip() {
    if (!user_bearer_token) {
        return null;
    }

    const url = `${exchangeAPI}/proxy/public-ip`;
    const headers = {
        "Accept": "application/json",
        "Authorization": user_bearer_token
    };

    try {
        let response = await fetch(url, { method: 'GET', headers: headers });
        if (response.ok) {
            let data = await response.json();
            return data.proxy_ip;
        } else {
            console.error(`Failed to fetch proxy IP. Status: ${response.status}`);
            return null; 
        }
    } catch (error) {
        console.error('Error fetching proxy IP:', error);
        return null; 
    }
}

// Validate credentials by sending them to the API
async function validate_credentials(email_address, exchange, api_key, secret_key, account_name, passphrase, ip) {
    if (!user_bearer_token) {
        throw new Error('User is not authenticated.');
    }

    const url = `${exchangeAPI}/auth/register`;
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": user_bearer_token 
    };
    const data = {
        "email": email_address,
        "exchange": exchange, 
        "account_name": account_name,
        "apikey": api_key,
        "secret_key": secret_key,
        "passphrase": passphrase,
        "ip": ip
    };

    try {
        const response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) });
        if (response.ok) {
            let result = await response.json();
            return result; 
        } else if (response.status === 401) {
            throw new Error('Unauthorized (401): Invalid credentials.');
        } else if (response.status === 400) {
            const errorDetails = await response.json();
            throw new Error(`Bad Request (400): ${errorDetails.message || 'Invalid input data.'}`);
        } else {
            throw new Error(`Error ${response.status}: Unexpected response.`);
        }
    } catch (error) {
        console.error('Error validating credentials:', error);
        throw error; // Propagate the error to be handled in the submit handler
    }
}

// Initialize the application with the user's IP
function initializeApp(ip) { 
    const form = document.getElementById('account-form');
    const loadingBar = document.getElementById('loading-bar');
    const successScreen = document.getElementById('success-screen');
    const failureScreen = document.getElementById('failure-screen');
    const successOkButton = document.getElementById('success-ok-button');
    const failureRetryButton = document.getElementById('failure-retry-button');
    const failureCancelButton = document.getElementById('failure-cancel-button');
    const failureMessage = document.getElementById('failure-message');
    const errorMessage = document.getElementById('encourage-message'); 

    const ipAddressMain = document.getElementById('bitget-ip-label');
    
    if (ipAddressMain) {
        ipAddressMain.textContent = ip || "Unable to fetch IP";
    }

    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            if (loadingBar) loadingBar.style.display = 'block';
            if (errorMessage) {
                errorMessage.textContent = ''; // Clear previous messages
                errorMessage.style.color = ''; // Reset color
            }

            // Disable the submit button to prevent multiple submissions
            const submitButton = document.getElementById('submit-button');
            if (submitButton) submitButton.disabled = true;

            // Gather form data
            const account_name = document.getElementById("account_name").value.trim();
            const email_address = document.getElementById("email").value.trim();
            const exchange_selection = document.getElementById("exchange_selection").value;
            let api_key = "";
            let secret_key = "";
            let passphrase = "";

            if (exchange_selection === "bitget") {
                api_key = document.getElementById("bitget_api_key").value.trim();
                secret_key = document.getElementById("bitget_secret_key").value.trim();
                passphrase = document.getElementById("bitget_passphrase").value.trim();
            } else if (exchange_selection === "binance") {
                api_key = document.getElementById("binance_api_key").value.trim();
                secret_key = document.getElementById("binance_secret_key").value.trim();
            }

            try {
                const response = await validate_credentials(email_address, exchange_selection, api_key, secret_key, account_name, passphrase, ip);
                
                if (response) {
                    // Show success screen
                    if (successScreen) successScreen.style.display = 'flex';
                } else {
                    // Show failure screen with a generic message
                    if (failureScreen) {
                        failureMessage.textContent = 'Failed to add account. Please check your credentials and try again.';
                        failureScreen.style.display = 'flex';
                    }
                }
            } catch (error) {
                // Show failure screen with specific error message
                if (failureScreen) {
                    failureMessage.textContent = error.message || 'An unexpected error occurred.';
                    failureScreen.style.display = 'flex';
                }
            } finally {
                if (loadingBar) loadingBar.style.display = 'none';
                // Re-enable the submit button
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    // Handle success screen OK button
    if (successOkButton) {
        successOkButton.addEventListener('click', function() {
            if (successScreen) successScreen.style.display = 'none';
            // Optionally, reset the form or redirect the user
            if (form) form.reset();
            // Hide exchange-specific fields
            const bitgetFields = document.getElementById('bitget-fields');
            const binanceFields = document.getElementById('binance-fields');
            if (bitgetFields) bitgetFields.style.display = 'none';
            if (binanceFields) binanceFields.style.display = 'none';
            // Show exchange selection container again
            const exchangeSelectionContainer = document.getElementById('exchange-selection-container');
            if (exchangeSelectionContainer) exchangeSelectionContainer.style.display = 'block';
            // Hide form container
            const formContainer = document.getElementById('form-container');
            if (formContainer) formContainer.style.display = 'none';
        });
    }

    // Handle failure screen Retry button
    if (failureRetryButton) {
        failureRetryButton.addEventListener('click', function() {
            if (failureScreen) failureScreen.style.display = 'none';
            // Optionally, focus on the first input field
            const firstInput = form.querySelector('input');
            if (firstInput) firstInput.focus();
        });
    }

    // Handle failure screen Cancel button
    if (failureCancelButton) {
        failureCancelButton.addEventListener('click', function() {
            if (failureScreen) failureScreen.style.display = 'none';
            // Navigate back to exchange selection
            const formContainer = document.getElementById('form-container');
            const exchangeSelectionContainer = document.getElementById('exchange-selection-container');
            if (formContainer && exchangeSelectionContainer) {
                formContainer.style.display = 'none';
                exchangeSelectionContainer.style.display = 'block';
            }
            // Reset form fields if necessary
            if (form) form.reset();
            // Hide exchange-specific fields
            const bitgetFields = document.getElementById('bitget-fields');
            const binanceFields = document.getElementById('binance-fields');
            if (bitgetFields) bitgetFields.style.display = 'none';
            if (binanceFields) binanceFields.style.display = 'none';
            // Reset exchange selection
            const exchangeSelectionInput = document.getElementById('exchange_selection');
            if (exchangeSelectionInput) exchangeSelectionInput.value = '';
            // Reset exchange heading text
            const exchangeHeadingText = document.getElementById('exchange-heading-text');
            if (exchangeHeadingText) exchangeHeadingText.textContent = "Connect Exchange";
            // Hide exchange logos
            const bitgetImage = document.getElementById('bitget-image');
            const binanceImage = document.getElementById('binance-image');
            if (bitgetImage) bitgetImage.style.display = 'none';
            if (binanceImage) binanceImage.style.display = 'none';
            // Reset submit button text
            const submitButton = document.getElementById('submit-button');
            if (submitButton) {
                submitButton.innerHTML = 'Connect Exchange <img src="/images/lock.png" alt="Secure Submit" class="submit-lock-icon">';
            }
        });
    }
}

// Display the page by initializing the app with the proxy IP
async function displayPage() {
    const actualProxyIp = await get_proxy_ip();
    initializeApp(actualProxyIp);
}

// Handle DOMContentLoaded event
document.addEventListener("DOMContentLoaded", async () => {
    try {
        getAccessKeyFromCookie();

        if (user_bearer_token) {
            await displayPage();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        // Optionally, redirect to login or show an error message
    }

    // DOM elements
    const exchangeSelectionContainer = document.getElementById('exchange-selection-container');
    const account_name = document.getElementById("account_name");
    const formContainer = document.getElementById('form-container');
    const bitgetOption = document.getElementById('bitget-option');
    const binanceOption = document.getElementById('binance-option');
    const exchangeSelectionInput = document.getElementById('exchange_selection');
    const bitgetFields = document.getElementById('bitget-fields');
    const binanceFields = document.getElementById('binance-fields');
    const exchangeHeadingText = document.getElementById('exchange-heading-text');
    const bitgetImage = document.getElementById('bitget-image');
    const binanceImage = document.getElementById('binance-image');
    const backToExchangeLink = document.getElementById('back-to-exchange');
    const submitButton = document.getElementById('submit-button');
    const bitgetSetIp = document.getElementById('bitget-set-ip');
    const bitgetIpLabel = document.getElementById('bitget-ip-label');
    const copyBitgetIpButton = document.getElementById('copy-bitget-ip');
    const encourageMessage = document.getElementById('encourage-message');

    // Fetch the actual proxy IP from the API
    const proxy_ip = await get_proxy_ip();

    // Display the proxy IP in bitgetIpLabel if exists
    if (bitgetIpLabel) {
        bitgetIpLabel.textContent = proxy_ip || "Unable to fetch IP";
    }

    // Add copy event listener if button exists
    if (copyBitgetIpButton) {
        copyBitgetIpButton.addEventListener('click', () => {
            const ip = bitgetIpLabel ? bitgetIpLabel.textContent : "";
            if (ip && ip !== "Loading..." && ip !== "Unable to fetch IP") {
                copyToClipboard(ip);
            } else {
                alert('No IP available to copy.');
            }
        });
    }

    // Handle Back to Exchange Selection
    if (backToExchangeLink) {
        backToExchangeLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (formContainer && exchangeSelectionContainer) {
                formContainer.style.display = 'none';
                exchangeSelectionContainer.style.display = 'block';
            }

            if (bitgetSetIp) bitgetSetIp.style.display = 'none';
            if (bitgetFields) bitgetFields.style.display = 'none';
            if (binanceFields) binanceFields.style.display = 'none';

            if (exchangeSelectionInput) exchangeSelectionInput.value = '';
            if (exchangeHeadingText) exchangeHeadingText.textContent = "Connect Exchange";
            if (bitgetImage) bitgetImage.style.display = 'none';
            if (binanceImage) binanceImage.style.display = 'none';
            if (submitButton) submitButton.innerHTML = 'Connect Exchange <img src="/images/lock.png" alt="Secure Submit" class="submit-lock-icon">';
        });
    }

    // Handle Exchange Selection (Bitget)
    if (bitgetOption) {
        bitgetOption.addEventListener('click', function() {
            if (exchangeSelectionInput) exchangeSelectionInput.value = 'bitget';
            if (account_name) account_name.value = 'My Bitget Account';
            if (bitgetIpLabel) bitgetIpLabel.textContent = proxy_ip || "Unable to fetch IP";

            // Encourage message for Bitget
            if (encourageMessage) {
                encourageMessage.innerHTML = `Don't you have an account? Create a Bitget account <a href="https://www.bitget.com" target="_blank" rel="noopener noreferrer">here <svg width="12px" height="12px" class="svg-icon" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M5.3333 0a.8889.8889 0 110 1.7778H1.7778v12.4444h12.4444v-3.5555a.8889.8889 0 111.7778 0v4.4444a.8889.8889 0 01-.8889.8889H.8889A.8888.8888 0 010 15.1111V.8889A.8889.8889 0 01.8889 0h4.4444zm7.632 1.7778H9.7778a.8889.8889 0 010-1.7778H16v6.2222a.889.889 0 01-1.7778 0V3.0347L8.6284 8.6284a.8887.8887 0 11-1.2568-1.2568l5.5937-5.5938z"/></svg></a>`;
            }

            if (bitgetSetIp) bitgetSetIp.style.display = 'block';
            if (bitgetFields) bitgetFields.style.display = 'block';
            if (binanceFields) binanceFields.style.display = 'none';

            if (exchangeSelectionContainer && formContainer) {
                exchangeSelectionContainer.style.display = 'none';
                formContainer.style.display = 'block';
            }

            if (exchangeHeadingText) exchangeHeadingText.textContent = "Connect Bitget";
            if (bitgetImage) bitgetImage.style.display = 'inline-block';
            if (binanceImage) binanceImage.style.display = 'none';
            if (submitButton) submitButton.innerHTML = 'Connect Bitget <img src="/images/lock.png" alt="Secure Submit" class="submit-lock-icon">';
        });
    }

    // Handle Exchange Selection (Binance)
    if (binanceOption) {
        binanceOption.addEventListener('click', function() {
            if (exchangeSelectionInput) exchangeSelectionInput.value = 'binance';
            if (account_name) account_name.value = 'My Binance Account';

            // Encourage message for Binance
            if (encourageMessage) {
                encourageMessage.innerHTML = `Don't you have an account? Create a Binance account <a href="https://www.binance.com" style="color: #42a5f5;" target="_blank" rel="noopener noreferrer">here <svg width="12px" height="12px" class="svg-icon" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M5.3333 0a.8889.8889 0 110 1.7778H1.7778v12.4444h12.4444v-3.5555a.8889.8889 0 111.7778 0v4.4444a.8889.8889 0 01-.8889.8889H.8889A.8888.8888 0 010 15.1111V.8889A.8889.8889 0 01.8889 0h4.4444zm7.632 1.7778H9.7778a.8889.8889 0 010-1.7778H16v6.2222a.889.889 0 01-1.7778 0V3.0347L8.6284 8.6284a.8887.8887 0 11-1.2568-1.2568l5.5937-5.5938z"/></svg></a>`;
            }

            if (binanceFields) binanceFields.style.display = 'block';
            if (bitgetFields) bitgetFields.style.display = 'none';
            if (bitgetSetIp) bitgetSetIp.style.display = 'none';

            if (exchangeSelectionContainer && formContainer) {
                exchangeSelectionContainer.style.display = 'none';
                formContainer.style.display = 'block';
            }

            if (exchangeHeadingText) exchangeHeadingText.textContent = "Connect Binance";
            if (binanceImage) binanceImage.style.display = 'inline-block';
            if (bitgetImage) bitgetImage.style.display = 'none';
            if (submitButton) submitButton.innerHTML = 'Connect Binance <img src="/images/lock.png" alt="Secure Submit" class="submit-lock-icon">';
        });
    }

    // If clicking bitget-option or binance-option does nothing, check the console logs.
    // Ensure that bitget-option and binance-option are present in the HTML.
});