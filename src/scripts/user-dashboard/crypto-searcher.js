

// Function to get a cookie by name
function getCookie(name) {
    const cookieArr = document.cookie.split(';');
    for (let cookie of cookieArr) {
        let [key, value] = cookie.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

// Function to add a new searched crypto
async function add_new_crypto_searched(symbol, name, picture_url) {
    // User Credentials
    let credentials = getCookie("credentials");
    credentials = credentials.replace(/^"(.*)"$/, '$1');

    // Build request
    const url = globalAPI + "/search/new";
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": credentials
    };

    // Request body
    const data = {
        symbol: symbol,
        name: name,
        picture_url: picture_url
    };

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data)
    });

    // Handle response
    if (response.ok) {
        const jsonResponse = await response.json();
        console.log("Response:", jsonResponse);
    } else {
        const errorResponse = await response.json();
        console.error("Error:", errorResponse);
        alert("Failed to save the crypto.");
    }
   
}

document.addEventListener("DOMContentLoaded", () => {
    // DOM elements and variables
    const searchInput = document.getElementById("crypto-search-input");
    const searchResults = document.getElementById("search-results");
    const searchIcon = document.getElementById("search-icon");
    let websocket;
    const messageQueue = [];

    // Function to display search results
    function displaySearchResults(results, isHistorical = false) {
        console.log("Displaying search results:", results);
        // Clear previous results
        searchResults.innerHTML = "";

        if (!results || results.length === 0) {
            const noResultItem = document.createElement("div");
            noResultItem.classList.add("search-result-item", "no-results");
            noResultItem.textContent = "No results found";
            searchResults.appendChild(noResultItem);
            showSearchResults();
            return;
        }

        if (isHistorical) {
            const header = document.createElement("div");
            const paragraph = document.createElement("p");
            paragraph.className = "p-recent-searches"
            paragraph.textContent = "Recent Searches";
            header.appendChild(paragraph);            
            searchResults.appendChild(header);
        }

        // Populate search results
        results.forEach((crypto) => {
            const item = document.createElement("div");
            item.classList.add("search-result-item");
            item.dataset.symbol = crypto.symbol;

            // Crypto Logo
            const logo = document.createElement("img");
            const imageUrl = isHistorical ? crypto.picture_url : crypto.image;
            logo.src = imageUrl || "/images/default_crypto.png";
            logo.alt = `${crypto.name} Logo`;

            // Crypto Name and Symbol
            const text = document.createElement("span");
            text.textContent = `${crypto.name} (${crypto.symbol})`;

            item.appendChild(logo);
            item.appendChild(text);

            // Click event to handle selection
            item.addEventListener("click", () => {
                selectCrypto(crypto);
            });

            searchResults.appendChild(item);
        });

        showSearchResults();
    }

    async function get_historical_searcher() {
        // User Credentials, url and header
        let credentials = getCookie("credentials");
        if (!credentials) {
            console.error("No credentials found for historical search.");
            return;
        }
        credentials = credentials.replace(/^"(.*)"$/, '$1');
        const url = `${globalAPI}/search/cryptos`;
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": credentials
        };

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            if (response.ok) {
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    const jsonResponse = await response.json();
                    console.log("Historical search data:", jsonResponse);
                    if (jsonResponse && jsonResponse.length > 0) {
                        displaySearchResults(jsonResponse, true);
                    } else {
                        console.log("No historical data found.");
                        hideSearchResults();
                    }
                } else {
                    console.error("Expected JSON response but received:", contentType);
                    alert("Invalid response from the server.");
                }
            } else {
                console.error("Failed to get the historical data. Status:", response.status);
                alert("An error occurred while fetching the historical data from the API");
            }
        } catch (error) {
            console.error("Request failed:", error);
            alert("An error occurred while fetching cryptos.");
        }
    }

    // Function to initialize WebSocket connection
    function initWebSocket() {
        if (typeof cryptocurrencyURL === 'undefined' || !cryptocurrencyURL) {
            console.error("cryptocurrencyURL is not defined or empty.");
            return;
        }

        const credentials = getCookie("credentials")?.replace(/^"(.*)"$/, '$1');
        if (!credentials) {
            console.error("No credentials found for WebSocket authentication.");
            window.location.href = '/login';
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const websocketUrl = `${protocol}${cryptocurrencyURL.replace(/\/$/, '')}/crypto/search/ws?token=${encodeURIComponent(credentials)}`;

        try {
            websocket = new WebSocket(websocketUrl);
        } catch (error) {
            console.error("Failed to create WebSocket:", error);
            return;
        }

        websocket.onopen = () => {
            console.log("WebSocket connection established");
            // Send any queued messages
            while (messageQueue.length > 0) {
                const msg = messageQueue.shift();
                console.log("Sending queued message:", msg);
                websocket.send(JSON.stringify(msg));
            }
        };

        websocket.onmessage = (event) => {
            console.log("WebSocket message received:", event.data);
            try {
                const data = JSON.parse(event.data);
                if (Array.isArray(data)) {
                    console.log("Received search results:", data);
                    displaySearchResults(data);
                } else if (data.error) {
                    console.error("Server Error:", data.error);
                    displayError(data.error);
                } else {
                    console.error("Unexpected data format:", data);
                    displayError("Unexpected server response.");
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
                displayError("Error parsing server response.");
            }
        };

        websocket.onclose = (event) => {
            console.log(`WebSocket connection closed (Code: ${event.code}). Reason: ${event.reason}. Reconnecting in 3 seconds...`);
            setTimeout(initWebSocket, 3000);
        };

        websocket.onerror = (error) => {
            console.error("WebSocket error observed:", error);
            // Optionally, close the WebSocket to trigger reconnection
            websocket.close();
        };
    }

    // Initialize WebSocket on page load
    initWebSocket();

    // Debounce function to limit the rate of function calls
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Handle input event with debounce
    searchInput.addEventListener("input", debounce(handleSearchInput, 300));

    // Function to handle search input
    function handleSearchInput(event) {
        const query = event.target.value.trim();
        console.log(`User input: "${query}"`);

        if (query.length === 0) {
            hideSearchResults();
            return;
        }

        // Show loading indicator
        displayLoading();

        const payload = { query: query, limit: 10 };
        console.log("Preparing to send search query:", payload);

        if (websocket && websocket.readyState === WebSocket.OPEN) {
            console.log("WebSocket is open. Sending message.");
            websocket.send(JSON.stringify(payload));
        } else if (websocket && (websocket.readyState === WebSocket.CONNECTING)) {
            console.warn("WebSocket is connecting. Queuing message.");
            messageQueue.push(payload);
        } else {
            console.error("WebSocket is closed. Cannot send message.");
            displayError("Unable to connect to the server. Please try again later.");
        }
    }

    // Function to display error messages
    function displayError(message) {
        console.log("Displaying error:", message);
        searchResults.innerHTML = "";
        const errorItem = document.createElement("div");
        errorItem.classList.add("search-result-item", "error");
        errorItem.textContent = `Error: ${message}`;
        searchResults.appendChild(errorItem);
        showSearchResults();
    }

    // Function to display a loading indicator
    function displayLoading() {
        searchResults.innerHTML = "";
        const loadingItem = document.createElement("div");
        loadingItem.classList.add("search-result-item", "loading");
        loadingItem.textContent = "Loading...";
        searchResults.appendChild(loadingItem);
        showSearchResults();
    }

    // Function to handle crypto selection
    function selectCrypto(crypto) {
        console.log("Selected crypto:", crypto);

        // Provide a fallback for the image if it's missing
        const pictureUrl = crypto.image || crypto.picture_url || "/images/default_crypto.png";

        // Call add_new_crypto_searched with the required parameters
        add_new_crypto_searched(crypto.symbol, crypto.name, pictureUrl);

        // Redirect to the desired URL format
        window.location.href = `/crypto-detail/${crypto.symbol}`;
    }

    // Function to show the search results dropdown
    function showSearchResults() {
        searchResults.classList.add("visible");
        searchResults.classList.remove("hidden");
    }

    // Function to hide the search results dropdown
    function hideSearchResults() {
        searchResults.classList.remove("visible");
        searchResults.classList.add("hidden");
    }

    // Close the search results when clicking outside
    document.addEventListener("click", (event) => {
        if (
            !searchInput.contains(event.target) &&
            !searchResults.contains(event.target) &&
            !searchIcon.contains(event.target)
        ) {
            hideSearchResults();
        }
    });

    // Handle clicking the search icon to focus the input and show historical searches
    if (searchIcon) {
        searchIcon.addEventListener("click", () => {
            searchInput.focus();
            // If input is empty, show historical searches
            if (searchInput.value.trim().length === 0) {
                get_historical_searcher();
            }
        });
    }

    // Handle clicking on the search input to show historical searches if input is empty
    searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim().length === 0) {
            get_historical_searcher();
        }
    });
});
