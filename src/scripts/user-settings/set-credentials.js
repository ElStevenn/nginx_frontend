// =======================
// Entire set-credentials.js
// =======================

// A global to store the user's Bearer token from cookies
let user_bearer_token = null;

// Ensure getCookie and exchangeAPI are defined in a previously loaded script
// If not, define them or verify your script order.

// ---------------------
// 1) Retrieve Cookie
// ---------------------
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

// ---------------------
// 2) Copy to Clipboard
// ---------------------
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

// ---------------------
// 3) Get Proxy IP
// ---------------------
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

// ---------------------
// 4) Validate Credentials
// ---------------------
// Despite the name "validate_credentials," 
// we use it for all exchanges by simply passing 'exchange' parameter.
async function validate_credentials(
    email_address, 
    exchange, 
    api_key, 
    secret_key, 
    account_name, 
    passphrase, 
    ip
) {
    if (!user_bearer_token) {
        throw new Error('User is not authenticated.');
    }

    const url = exchangeAPI + '/auth/register';
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

    console.log("credentials being validated:", data);

    try {
        const response = await fetch(url, { 
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data) 
        });
        if (response.ok) {
            let result = await response.json();
            return result; 
        } else if (response.status === 401) {
            throw new Error('Unauthorized (401): Invalid credentials.');
        } else if (response.status === 400) {
            const errorDetails = await response.json();
            console.error("Error of the API:", errorDetails);
            throw new Error(`${errorDetails.message.detail || 'Failed to authenticate with the given credentials'}`);
        } else {
            throw new Error(`Error ${response.status}: Unexpected response.`);
        }
    } catch (error) {
        console.error('Error validating credentials:', error);
        throw error; // Let the caller handle it
    }
}

// ----------------------------------------------------------------------
// 5) Remove / Add 'required' attributes so hidden fields don't cause
//    "invalid form control not focusable" errors
// ----------------------------------------------------------------------
function removeAllRequiredAttributes() {
    // Bitget
    const bitgetApiKey     = document.getElementById('bitget_api_key');
    const bitgetSecretKey  = document.getElementById('bitget_secret_key');
    const bitgetPassphrase = document.getElementById('bitget_passphrase');
    // Binance
    const binanceApiKey    = document.getElementById('binance_api_key');
    const binanceSecretKey = document.getElementById('binance_secret_key');
    // KuCoin
    const kucoinApiKey     = document.getElementById('kucoin_api_key');
    const kucoinSecretKey  = document.getElementById('kucoin_secret_key');
    const kucoinPassphrase = document.getElementById('kucoin_passphrase');

    if (bitgetApiKey)     bitgetApiKey.removeAttribute('required');
    if (bitgetSecretKey)  bitgetSecretKey.removeAttribute('required');
    if (bitgetPassphrase) bitgetPassphrase.removeAttribute('required');

    if (binanceApiKey)    binanceApiKey.removeAttribute('required');
    if (binanceSecretKey) binanceSecretKey.removeAttribute('required');

    if (kucoinApiKey)     kucoinApiKey.removeAttribute('required');
    if (kucoinSecretKey)  kucoinSecretKey.removeAttribute('required');
    if (kucoinPassphrase) kucoinPassphrase.removeAttribute('required');
}

function addBitgetRequiredAttributes() {
    const bitgetApiKey     = document.getElementById('bitget_api_key');
    const bitgetSecretKey  = document.getElementById('bitget_secret_key');
    const bitgetPassphrase = document.getElementById('bitget_passphrase');

    if (bitgetApiKey)     bitgetApiKey.setAttribute('required', 'true');
    if (bitgetSecretKey)  bitgetSecretKey.setAttribute('required', 'true');
    if (bitgetPassphrase) bitgetPassphrase.setAttribute('required', 'true');
}

function addBinanceRequiredAttributes() {
    const binanceApiKey    = document.getElementById('binance_api_key');
    const binanceSecretKey = document.getElementById('binance_secret_key');

    if (binanceApiKey)    binanceApiKey.setAttribute('required', 'true');
    if (binanceSecretKey) binanceSecretKey.setAttribute('required', 'true');
}

function addKucoinRequiredAttributes() {
    const kucoinApiKey     = document.getElementById('kucoin_api_key');
    const kucoinSecretKey  = document.getElementById('kucoin_secret_key');
    const kucoinPassphrase = document.getElementById('kucoin_passphrase');

    if (kucoinApiKey)     kucoinApiKey.setAttribute('required', 'true');
    if (kucoinSecretKey)  kucoinSecretKey.setAttribute('required', 'true');
    if (kucoinPassphrase) kucoinPassphrase.setAttribute('required', 'true');
}

// ---------------------
// 6) Main Init
// ---------------------
function initializeApp(ip) { 
    const form = document.getElementById('account-form');
    const loadingBar       = document.getElementById('loading-bar');
    const successScreen    = document.getElementById('success-screen');
    const failureScreen    = document.getElementById('failure-screen');
    const successOkButton  = document.getElementById('success-ok-button'); // not in HTML, could remove
    const failureRetryBtn  = document.getElementById('failure-retry-button');
    const failureCancelBtn = document.getElementById('failure-cancel-button');
    const failureMessage   = document.getElementById('failure-message');
    const errorMessage     = document.getElementById('encourage-message'); 
    const ipAddressMain    = document.getElementById('bitget-ip-label');
    // You could also handle ipAddressMain for Binance / KuCoin if needed

    if (ipAddressMain) {
        ipAddressMain.textContent = ip || "Unable to fetch IP";
    }

    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            if (loadingBar) loadingBar.style.display = 'block';
            if (errorMessage) {
                errorMessage.textContent = ''; 
                errorMessage.style.color = '';
            }

            const submitButton = document.getElementById('submit-button');
            if (submitButton) submitButton.disabled = true;

            // Gather form data
            const account_name       = document.getElementById("account_name").value.trim();
            const email_address      = document.getElementById("email").value.trim();
            const exchange_selection = document.getElementById("exchange_selection").value;
            let api_key = "";
            let secret_key = "";
            let passphrase = "";

            if (exchange_selection === "bitget") {
                api_key    = document.getElementById("bitget_api_key").value.trim();
                secret_key = document.getElementById("bitget_secret_key").value.trim();
                passphrase = document.getElementById("bitget_passphrase").value.trim();
            } else if (exchange_selection === "binance") {
                api_key    = document.getElementById("binance_api_key").value.trim();
                secret_key = document.getElementById("binance_secret_key").value.trim();
            } else if (exchange_selection === "kucoin") {
                api_key    = document.getElementById("kucoin_api_key").value.trim();
                secret_key = document.getElementById("kucoin_secret_key").value.trim();
                passphrase = document.getElementById("kucoin_passphrase").value.trim();
            }

            try {
                const response = await validate_credentials(
                    email_address,
                    exchange_selection,
                    api_key,
                    secret_key,
                    account_name,
                    passphrase,
                    ip
                );
                
                if (response) {
                    if (successScreen) successScreen.style.display = 'flex';
                } else {
                    if (failureScreen) {
                        failureMessage.textContent = 'Failed to add account. Please check your credentials and try again.';
                        failureScreen.style.display = 'flex';
                    }
                }
            } catch (error) {
                if (failureScreen) {
                    failureMessage.textContent = error.message || 'An unexpected error occurred.';
                    failureScreen.style.display = 'flex';
                }
            } finally {
                if (loadingBar) loadingBar.style.display = 'none';
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    // ----------------
    // Success Screen
    // ----------------
    // If you have a successOkButton in your HTML, you can handle it
    if (successOkButton) {
        successOkButton.addEventListener('click', function() {
            if (successScreen) successScreen.style.display = 'none';
            if (form) form.reset();
            const bitgetFields   = document.getElementById('bitget-fields');
            const binanceFields  = document.getElementById('binance-fields');
            const kucoinFields   = document.getElementById('kucoin-fields');
            if (bitgetFields)   bitgetFields.style.display   = 'none';
            if (binanceFields)  binanceFields.style.display  = 'none';
            if (kucoinFields)   kucoinFields.style.display   = 'none';
            const exchangeSelectionContainer = document.getElementById('exchange-selection-container');
            if (exchangeSelectionContainer) exchangeSelectionContainer.style.display = 'block';
            const formContainer = document.getElementById('form-container');
            if (formContainer) formContainer.style.display = 'none';
        });
    }

    // ----------------
    // Failure Screen
    // ----------------
    if (failureRetryBtn) {
        failureRetryBtn.addEventListener('click', function() {
            if (failureScreen) failureScreen.style.display = 'none';
            const firstInput = form ? form.querySelector('input') : null;
            if (firstInput) firstInput.focus();
        });
    }

    if (failureCancelBtn) {
        failureCancelBtn.addEventListener('click', function() {
            if (failureScreen) failureScreen.style.display = 'none';
            const formContainer = document.getElementById('form-container');
            const exchangeSelectionContainer = document.getElementById('exchange-selection-container');
            if (formContainer && exchangeSelectionContainer) {
                formContainer.style.display = 'none';
                exchangeSelectionContainer.style.display = 'block';
            }
            if (form) form.reset();
            const bitgetFields  = document.getElementById('bitget-fields');
            const binanceFields = document.getElementById('binance-fields');
            const kucoinFields  = document.getElementById('kucoin-fields');
            if (bitgetFields)  bitgetFields.style.display  = 'none';
            if (binanceFields) binanceFields.style.display = 'none';
            if (kucoinFields)  kucoinFields.style.display  = 'none';
            const exchangeSelectionInput = document.getElementById('exchange_selection');
            if (exchangeSelectionInput) exchangeSelectionInput.value = '';
            const exchangeHeadingText = document.getElementById('exchange-heading-text');
            if (exchangeHeadingText) exchangeHeadingText.textContent = "Connect Exchange";
            const bitgetImage  = document.getElementById('bitget-image');
            const binanceImage = document.getElementById('binance-image');
            const kucoinImage  = document.getElementById('kucoin-image');
            if (bitgetImage)  bitgetImage.style.display  = 'none';
            if (binanceImage) binanceImage.style.display = 'none';
            if (kucoinImage)  kucoinImage.style.display  = 'none';
            const submitButton = document.getElementById('submit-button');
            if (submitButton) {
                submitButton.innerHTML = 'Connect Exchange <img src="/images/lock.png" alt="Secure Submit" class="submit-lock-icon">';
            }
        });
    }

    if (failureScreen) {
        failureScreen.addEventListener('click', (e) => {
            if (e.target === failureScreen) {
                failureScreen.style.display = 'none';
            }
        });
    }
    const closeModalX = document.querySelector('#failure-screen .close-modal');
    if (closeModalX && failureScreen) {
        closeModalX.addEventListener('click', () => {
            failureScreen.style.display = 'none';
        });
    }
}

/**
 * Show the Bitget fields, hide others, 
 * add `required` to Bitget fields, remove from others, etc.
 */
function connectBitget(proxy_ip) {
    removeAllRequiredAttributes();
    addBitgetRequiredAttributes();

    const exchangeSelectionInput     = document.getElementById('exchange_selection');
    const accountNameInput           = document.getElementById('account_name');
    const bitgetIpLabel              = document.getElementById('bitget-ip-label');
    const encourageMessage           = document.getElementById('encourage-message');
    const bitgetSetIp                = document.getElementById('bitget-set-ip');
    const bitgetFields               = document.getElementById('bitget-fields');
    const binanceFields              = document.getElementById('binance-fields');
    const kucoinFields               = document.getElementById('kucoin-fields');
    const kucoinSetIp                = document.getElementById('kucoin-set-ip');
    const exchangeSelectionContainer = document.getElementById('exchange-selection-container');
    const formContainer              = document.getElementById('form-container');
    const exchangeHeadingText        = document.getElementById('exchange-heading-text');
    const bitgetImage                = document.getElementById('bitget-image');
    const binanceImage               = document.getElementById('binance-image');
    const kucoinImage                = document.getElementById('kucoin-image');
    const submitButton               = document.getElementById('submit-button');

    if (exchangeSelectionInput) exchangeSelectionInput.value = 'bitget';
    if (accountNameInput)       accountNameInput.value       = 'My Bitget Account';
    if (bitgetIpLabel)          bitgetIpLabel.textContent    = proxy_ip || "Unable to fetch IP";

    if (encourageMessage) {
        encourageMessage.innerHTML = `Don't have an account? Create a Bitget account 
            <a href="https://www.bitget.com" target="_blank" rel="noopener noreferrer">
              here <svg width="12px" height="12px" class="svg-icon" viewBox="0 0 16 16" fill="none">
                <path fill="currentColor" d="M5.3333 0a.8889.8889 0 110 1.7778H1.7778v12.4444h12.4444v-3.5555a.8889.8889 0 111.7778 0v4.4444a.8889.8889 0 01-.8889.8889H.8889A.8888.8888 0 010 15.1111V.8889A.8889.8889 0 01.8889 0h4.4444zm7.632 1.7778H9.7778a.8889.8889 0 010-1.7778H16v6.2222a.889.889 0 01-1.7778 0V3.0347L8.6284 8.6284a.8887.8887 0 11-1.2568-1.2568l5.5937-5.5938z"/>
              </svg>
            </a>`;
    }

    if (bitgetSetIp)     bitgetSetIp.style.display     = 'block';
    if (bitgetFields)    bitgetFields.style.display    = 'block';
    if (kucoinSetIp)     kucoinSetIp.style.display     = 'none';
    if (kucoinFields)    kucoinFields.style.display    = 'none';
    if (binanceFields)   binanceFields.style.display   = 'none';

    if (exchangeSelectionContainer && formContainer) {
        exchangeSelectionContainer.style.display = 'none';
        formContainer.style.display = 'block';
    }

    if (exchangeHeadingText) exchangeHeadingText.textContent = "Connect Bitget";
    if (bitgetImage)  bitgetImage.style.display   = 'inline-block';
    if (binanceImage) binanceImage.style.display  = 'none';
    if (kucoinImage)  kucoinImage.style.display   = 'none';
    if (submitButton) {
        submitButton.innerHTML = 'Connect Bitget <img src="/images/lock.png" alt="Secure Submit" class="submit-lock-icon">';
    }
}

/**
 * Show the KuCoin fields, hide others,
 * add `required` to KuCoin fields, remove from others, etc.
 */
function connectKucoin(proxy_ip) {
    removeAllRequiredAttributes();
    addKucoinRequiredAttributes();

    const exchangeSelectionInput     = document.getElementById('exchange_selection');
    const accountNameInput           = document.getElementById('account_name');
    const kucoinIpLabel              = document.getElementById('kucoin-ip-label');
    const encourageMessage           = document.getElementById('encourage-message');
    const kucoinSetIp                = document.getElementById('kucoin-set-ip');
    const bitgetSetIp                = document.getElementById('bitget-set-ip');
    const bitgetFields               = document.getElementById('bitget-fields');
    const binanceFields              = document.getElementById('binance-fields');
    const kucoinFields               = document.getElementById('kucoin-fields');
    const exchangeSelectionContainer = document.getElementById('exchange-selection-container');
    const formContainer              = document.getElementById('form-container');
    const exchangeHeadingText        = document.getElementById('exchange-heading-text');
    const bitgetImage                = document.getElementById('bitget-image');
    const binanceImage               = document.getElementById('binance-image');
    const kucoinImage                = document.getElementById('kucoin-image');
    const submitButton               = document.getElementById('submit-button');

    if (exchangeSelectionInput) exchangeSelectionInput.value = 'kucoin';
    if (accountNameInput)       accountNameInput.value       = 'My KuCoin Account';
    if (kucoinIpLabel)          kucoinIpLabel.textContent    = proxy_ip || "Unable to fetch IP";

    if (encourageMessage) {
        encourageMessage.innerHTML = `Don't have an account? Create a KuCoin account 
            <a href="https://www.kucoin.com" target="_blank" rel="noopener noreferrer">
              here <svg width="12px" height="12px" class="svg-icon" viewBox="0 0 16 16" fill="none">
                <path fill="currentColor" d="M5.3333 0a.8889.8889 0 110 1.7778H1.7778v12.4444h12.4444v-3.5555a.8889.8889 0 111.7778 0v4.4444a.8889.8889 0 01-.8889.8889H.8889A.8888.8888 0 010 15.1111V.8889A.8889.8889 0 01.8889 0h4.4444zm7.632 1.7778H9.7778a.8889.8889 0 010-1.7778H16v6.2222a.889.889 0 01-1.7778 0V3.0347L8.6284 8.6284a.8887.8887 0 11-1.2568-1.2568l5.5937-5.5938z"/>
              </svg>
            </a>`;
    }

    if (kucoinSetIp)   kucoinSetIp.style.display   = 'block';
    if (kucoinFields)  kucoinFields.style.display  = 'block';
    if (bitgetSetIp)   bitgetSetIp.style.display   = 'none';
    if (bitgetFields)  bitgetFields.style.display  = 'none';
    if (binanceFields) binanceFields.style.display = 'none';

    if (exchangeSelectionContainer && formContainer) {
        exchangeSelectionContainer.style.display = 'none';
        formContainer.style.display = 'block';
    }

    if (exchangeHeadingText) exchangeHeadingText.textContent = "Connect KuCoin";
    if (kucoinImage)  kucoinImage.style.display   = 'inline-block';
    if (bitgetImage)  bitgetImage.style.display   = 'none';
    if (binanceImage) binanceImage.style.display  = 'none';

    if (submitButton) {
        submitButton.innerHTML = 'Connect KuCoin <img src="/images/lock.png" alt="Secure Submit" class="submit-lock-icon">';
    }
}

// ---------------------
// 7) Display the Page
// ---------------------
async function displayPage() {
    const actualProxyIp = await get_proxy_ip();
    initializeApp(actualProxyIp);
    return actualProxyIp;
}

// ---------------------
// 8) On DOMContentLoaded
// ---------------------
document.addEventListener("DOMContentLoaded", async () => {
    removeAllRequiredAttributes();

    let proxy_ip = null;
    try {
        getAccessKeyFromCookie();
        if (user_bearer_token) {
            proxy_ip = await displayPage();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }

    // DOM elements
    const bitgetOption       = document.getElementById('bitget-option');
    const binanceOption      = document.getElementById('binance-option');
    const kucoinOption       = document.getElementById('kucoin-option');

    const copyBitgetIpButton = document.getElementById('copy-bitget-ip');
    const bitgetIpLabel      = document.getElementById('bitget-ip-label');

    const copyKucoinIpButton = document.getElementById('copy-kucoin-ip');
    const kucoinIpLabel      = document.getElementById('kucoin-ip-label');

    // Copy IP button for Bitget
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

    // Copy IP button for KuCoin
    if (copyKucoinIpButton) {
        copyKucoinIpButton.addEventListener('click', () => {
            const ip = kucoinIpLabel ? kucoinIpLabel.textContent : "";
            if (ip && ip !== "Loading..." && ip !== "Unable to fetch IP") {
                copyToClipboard(ip);
            } else {
                alert('No IP available to copy.');
            }
        });
    }

    // When user clicks "Bitget"
    if (bitgetOption) {
        bitgetOption.addEventListener('click', function() {
            connectBitget(proxy_ip);
        });
    }

    // When user clicks "Binance"
    if (binanceOption) {
        binanceOption.addEventListener('click', function() {
            removeAllRequiredAttributes();
            addBinanceRequiredAttributes();

            const exchangeSelectionInput      = document.getElementById('exchange_selection');
            const account_name                = document.getElementById("account_name");
            const encourageMessage            = document.getElementById('encourage-message');
            const bitgetSetIp                 = document.getElementById('bitget-set-ip');
            const kucoinSetIp                 = document.getElementById('kucoin-set-ip');
            const bitgetFields                = document.getElementById('bitget-fields');
            const binanceFields               = document.getElementById('binance-fields');
            const kucoinFields                = document.getElementById('kucoin-fields');
            const exchangeSelectionContainer  = document.getElementById('exchange-selection-container');
            const formContainer               = document.getElementById('form-container');
            const exchangeHeadingText         = document.getElementById('exchange-heading-text');
            const bitgetImage                 = document.getElementById('bitget-image');
            const binanceImage                = document.getElementById('binance-image');
            const kucoinImage                 = document.getElementById('kucoin-image');
            const submitButton                = document.getElementById('submit-button');

            if (exchangeSelectionInput) exchangeSelectionInput.value = 'binance';
            if (account_name)           account_name.value           = 'My Binance Account';

            if (encourageMessage) {
                encourageMessage.innerHTML = `Don't have an account? Create a Binance account
                    <a href="https://www.binance.com" style="color: #42a5f5;" target="_blank" rel="noopener noreferrer">
                      here <svg width="12px" height="12px" class="svg-icon" viewBox="0 0 16 16" fill="none">
                        <path fill="currentColor" d="M5.3333 0a.8889.8889 0 110 1.7778H1.7778v12.4444h12.4444v-3.5555a.8889.8889 0 111.7778 0v4.4444a.8889.8889 0 01-.8889.8889H.8889A.8888.8888 0 010 15.1111V.8889A.8889.8889 0 01.8889 0h4.4444zm7.632 1.7778H9.7778a.8889.8889 0 010-1.7778H16v6.2222a.889.889 0 01-1.7778 0V3.0347L8.6284 8.6284a.8887.8887 0 11-1.2568-1.2568l5.5937-5.5938z"/>
                      </svg>
                    </a>`;
            }

            if (binanceFields) binanceFields.style.display = 'block';
            if (bitgetFields)  bitgetFields.style.display  = 'none';
            if (kucoinFields)  kucoinFields.style.display  = 'none';
            if (bitgetSetIp)   bitgetSetIp.style.display   = 'none';
            if (kucoinSetIp)   kucoinSetIp.style.display   = 'none';

            if (exchangeSelectionContainer && formContainer) {
                exchangeSelectionContainer.style.display = 'none';
                formContainer.style.display = 'block';
            }

            if (exchangeHeadingText) exchangeHeadingText.textContent = "Connect Binance";
            if (binanceImage) binanceImage.style.display = 'inline-block';
            if (bitgetImage)  bitgetImage.style.display  = 'none';
            if (kucoinImage)  kucoinImage.style.display  = 'none';

            if (submitButton) {
                submitButton.innerHTML = 'Connect Binance <img src="/images/lock.png" alt="Secure Submit" class="submit-lock-icon">';
            }
        });
    }

    // When user clicks "KuCoin"
    if (kucoinOption) {
        kucoinOption.addEventListener('click', function() {
            connectKucoin(proxy_ip);
        });
    }

    const backToExchangeLink = document.getElementById('back-to-exchange');
    if (backToExchangeLink) {
        backToExchangeLink.addEventListener('click', function(e) {
            e.preventDefault();

            // Hide form container
            const formContainer = document.getElementById('form-container');
            const exchangeSelectionContainer = document.getElementById('exchange-selection-container');
            if (formContainer && exchangeSelectionContainer) {
                formContainer.style.display = 'none';
                exchangeSelectionContainer.style.display = 'block';
            }

            // Reset the form
            const form = document.getElementById('account-form');
            if (form) {
                form.reset();
            }

            // Hide exchange-specific fields
            const bitgetFields  = document.getElementById('bitget-fields');
            const binanceFields = document.getElementById('binance-fields');
            const kucoinFields  = document.getElementById('kucoin-fields');
            if (bitgetFields)  bitgetFields.style.display  = 'none';
            if (binanceFields) binanceFields.style.display = 'none';
            if (kucoinFields)  kucoinFields.style.display  = 'none';

            // Clear the exchange_selection <input>, heading text, and logos
            const exchangeSelectionInput = document.getElementById('exchange_selection');
            if (exchangeSelectionInput) exchangeSelectionInput.value = '';

            const exchangeHeadingText = document.getElementById('exchange-heading-text');
            if (exchangeHeadingText) exchangeHeadingText.textContent = 'Connect Exchange';

            const bitgetImage  = document.getElementById('bitget-image');
            const binanceImage = document.getElementById('binance-image');
            const kucoinImage  = document.getElementById('kucoin-image');
            if (bitgetImage)  bitgetImage.style.display  = 'none';
            if (binanceImage) binanceImage.style.display = 'none';
            if (kucoinImage)  kucoinImage.style.display  = 'none';

            // Reset the submit button label
            const submitButton = document.getElementById('submit-button');
            if (submitButton) {
                submitButton.innerHTML = 
                    'Connect Exchange <img src="/images/lock.png" alt="Secure Submit" class="submit-lock-icon">';
            }
        });
    }
});
