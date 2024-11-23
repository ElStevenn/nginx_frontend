
const search_api = 'http://51.158.67.62:8080/';

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
    const url = "http://localhost:8000/new_searched_crypto";
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

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    // DOM elements and variables
    const searchInput = document.getElementById("crypto-search-input");
    const searchResults = document.getElementById("search-results");
    const searchIcon = document.getElementById("search-icon");
    let websocket;

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

    // Function to get historical searches
    async function get_historical_searcher() {
        // User Credentials
        let credentials = getCookie("credentials");
        credentials = credentials.replace(/^"(.*)"$/, '$1');

        // Request URL and headers
        const url = "http://localhost:8000/get_last_searched_cryptos";
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
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        websocket = new WebSocket(`${protocol}51.158.67.62:8080/search-crypto-ws`);

        websocket.onopen = () => {
            console.log("WebSocket connection established");
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
            console.log(`WebSocket connection closed (Code: ${event.code}). Reconnecting in 3 seconds...`);
            setTimeout(initWebSocket, 3000);
        };

        websocket.onerror = (error) => {
            console.error("WebSocket error observed:", error);
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

        // Send the search query via WebSocket
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            const payload = { query: query, limit: 10 };
            console.log("Sending search query:", payload);
            websocket.send(JSON.stringify(payload));
        } else {
            console.warn("WebSocket is not open. ReadyState:", websocket.readyState);
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
