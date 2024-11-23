let isCryptoStarred = false; 
let cryptoData = {}; 


function getValueAfterCryptoDetail() {
    const path = window.location.pathname; 
    const parts = path.split('/crypto-detail/');

    if (parts.length > 1) {
        let value = parts[1].split('/')[0].toUpperCase();
        return value;
    } else {
        console.log('No value found after /crypto-detail/');
        return null;
    }
}

function getCryptoData() {
    const searched_crypto = getValueAfterCryptoDetail();
    if (searched_crypto) {
        const url = cryptocurrencyAPI + `/get_detail_event/${searched_crypto}`;

        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.status === 404) {
                throw new Error('Crypto not found (404)');
            } else if (response.ok) {
                return response.json();
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        })
        .then(data => {
            cryptoData = data; 
            displayCryptoData(data.image, data.name, data.symbol, data.next_execution_time, data.description);
            get_main_panle_info();
            startFundingRateUpdates(searched_crypto);
            initializeWebSocket(searched_crypto); 
        })
        .catch(error => {
            console.error('Fetch Operation Error:', error);
            displayError(error.message); 
        });
    } else {
        displayError('Invalid URL. No cryptocurrency specified.');
    }
}

function displayCryptoData(image, name, symbol, next_execution_time, description) {
    // Ensure the main content is visible
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'flex'; 
    } else {
        console.error("Element with ID 'main-content' not found.");
    }

    // Hide the error message if it's visible
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    } else {
        console.error("Element with ID 'error-message' not found.");
    }

    // Update the name and symbol
    const cryptoNameElement = document.getElementById('crypto-name');
    if (cryptoNameElement) {
        cryptoNameElement.textContent = name;
    } else {
        console.error("Element with ID 'crypto-name' not found.");
    }

    const cryptoSymbolElement = document.getElementById('crypto-symbol2');
    if (cryptoSymbolElement) {
        cryptoSymbolElement.textContent = ` (${symbol})`;
    } else {
        console.error("Element with ID 'crypto-symbol2' not found.");
    }

    // Update the image
    const cryptoLogoElement = document.getElementById('crypto-logo');
    if (cryptoLogoElement) {
        if (image && image.startsWith('http')) {
            cryptoLogoElement.src = image;
        } else {
            console.error('Invalid image URL:', image);
            cryptoLogoElement.src = '/images/default-crypto-logo.png'; 
        }
    } else {
        console.error("Element with ID 'crypto-logo' not found.");
    }

    // Start the countdown if next_execution_time is provided
    if (next_execution_time) {
        startCountdown(next_execution_time);
    } else {
        console.error("next_execution_time is not provided.");
    }

    // Display crypto description
    document.getElementById("description-spinner").style.display = "inline";
    document.getElementById("description-content").style.display = "none";
    if (description) {
        setupDescription(description);
    } else {
        console.error("Description of the crypto not available");
        const cryptoDescription = document.getElementById('crypto-description');
        if (cryptoDescription) {
            // Hide the spinner
            document.getElementById("description-spinner").style.display = "none";
            cryptoDescription.textContent = "Description not available.";
        }
    }
}

// Max number of characters
var truncateLength = 100;
function setupDescription(fullDescription) {
    // Hide the spinner and show the description content
    document.getElementById("description-spinner").style.display = "none";
    document.getElementById("description-content").style.display = "inline";

    var descriptionShort = document.getElementById("description-short");
    var descriptionFull = document.getElementById("description-full");
    var readMoreLink = document.getElementById("read-more");

    // Process the full description to convert URLs into clickable links
    var processedDescription = linkify(fullDescription);

    if (fullDescription.length > truncateLength) {
        // Set the truncated and full descriptions
        descriptionShort.innerHTML = processedDescription.substring(0, truncateLength) + "...";
        descriptionFull.innerHTML = processedDescription.substring(truncateLength);
        descriptionFull.style.display = "none"; // Ensure it's hidden initially
        readMoreLink.style.display = "inline";
        readMoreLink.textContent = " Read more";
    } else {
        // If the description is short, display it all and hide the "Read more" link
        descriptionShort.innerHTML = processedDescription;
        descriptionFull.style.display = "none";
        readMoreLink.style.display = "none";
    }
}


function toggleDescription(event) {
    // Function to toggle the description display
    event.preventDefault();
    var descriptionFull = document.getElementById("description-full");
    var readMoreLink = document.getElementById("read-more");

    if (descriptionFull.style.display === "none") {
        descriptionFull.style.display = "inline";
        readMoreLink.textContent = " Read less";
    } else {
        descriptionFull.style.display = "none";
        readMoreLink.textContent = " Read more";
    }
}


function displayError(message) {
    console.log("Displaying Error:", message);

    // Optionally hide the main content when an error occurs
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    const errorContainer = document.getElementById('error-message');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    } else {
        console.error("Element with ID 'error-message' not found.");
    }
}



function startCountdown(nextExecutionTime) {
    const countdownElement = document.getElementById('fundingrate-countdown');
    if (!countdownElement) {
        console.error("Element with ID 'fundingrate-countdown' not found.");
        return;
    }

    function updateCountdown() {
        const now = new Date();
        const executionTime = new Date(nextExecutionTime);

        const timeDiff = executionTime - now; 

        if (timeDiff <= 0) {
            countdownElement.textContent = "00:00:00";
            clearInterval(intervalId);
            return;
        }

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        const formattedTime = 
            (hours < 10 ? '0' + hours : hours) + ':' + 
            (minutes < 10 ? '0' + minutes : minutes) + ':' + 
            (seconds < 10 ? '0' + seconds : seconds);

        countdownElement.textContent = formattedTime;
    }

    updateCountdown(); // Initial call
    const intervalId = setInterval(updateCountdown, 1000);
}

function updatePriceOnScreen(price) {
    const priceElement = document.getElementById('crypto-price');
    const loadingImage = document.getElementById('loading-image');

    if (priceElement) {
        if (loadingImage) {
            loadingImage.style.display = 'none'; 
        }

        // Convert price to a number
        let priceNumber = parseFloat(price);
        if (isNaN(priceNumber)) {
            console.error("Invalid price received:", price);
            return;
        }

        let decimals = Math.max(4, Math.ceil(-Math.log10(priceNumber)));
        let formattedPrice = priceNumber.toFixed(decimals);

        priceElement.textContent = `$${formattedPrice}`;
    }
}

let socket;

function initializeWebSocket(symbol) {
  // Remove any unwanted prefixes from the symbol
  if (symbol.startsWith('UX')) {
    symbol = symbol.substring(2);
  }

  const instId = symbol + '_UMCBL';
  socket = new WebSocket('wss://ws.bitget.com/mix/v1/stream');

  socket.onopen = function () {
    console.log("WebSocket is open now.");
    socket.send(JSON.stringify({
      op: "subscribe",
      args: [
        {
          instType: "USDT-FUTURES",
          channel: "ticker",
          instId: instId
        }
      ]
    }));
  };

  socket.onmessage = function (event) {
    const message = JSON.parse(event.data);
    console.log("Received WebSocket message:", message);

    if (message.data && message.data.length > 0) {
      const price = message.data[0].last;
      updatePriceOnScreen(price);
    } else if (message.event === 'error') {
      console.error(`WebSocket Error: ${message.msg} (Code: ${message.code})`);
    }
  };

  socket.onclose = function () {
    console.log("WebSocket is closed now.");
  };

  socket.onerror = function (error) {
    console.error("WebSocket error:", error);
  };
}




document.addEventListener('DOMContentLoaded', function() {
    getCryptoData();
});

// Fetch whether the crypto is starred or not
async function get_main_panle_info() {
    const searched_crypto = getValueAfterCryptoDetail();

    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("Credentials not found.");
        return;
    }
    credentials = credentials.replace(/^"(.*)"$/, '$1');
    const url = cryptocurrencyAPI + `/get_main_panle_crypto/${searched_crypto}`;
    const headers = {
        'Accept': 'application/json',
        "Authorization": credentials
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Panel info data:", data);

        // Update the starred status
        isCryptoStarred = data.is_starred;

        // Update the star icon based on whether the crypto is starred
        const starIcon = document.getElementById('starred_crypto');
        if (starIcon) {
            if (isCryptoStarred) {
                starIcon.src = "/images/starred.png";
            } else {
                starIcon.src = "/images/none-starred.png";
            }
        }

    } catch (error) {
        console.error("Error fetching panel info:", error);
    }
}

// Toggle the starred status of the crypto
document.getElementById('starred_crypto').addEventListener('click', toggleHighlightCrypto);

async function toggleHighlightCrypto() {
    const searched_crypto = getValueAfterCryptoDetail();

    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("Credentials not found.");
        return;
    }
    credentials = credentials.replace(/^"(.*)"$/, '$1');

    const headers = {
        'Accept': 'application/json',
        "Authorization": credentials,
        'Content-Type': 'application/json'
    };

    try {
        if (isCryptoStarred) {
            // If currently starred, remove it
            const url = cryptocurrencyAPI + `/remove_starred_symbol/${searched_crypto}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Update the UI
            isCryptoStarred = false;
            const starIcon = document.getElementById('starred_crypto');
            if (starIcon) {
                starIcon.src = "/images/none-starred.png";
            }
        } else {
            // If currently not starred, add it
            const url = globalAPI + '/add_new_starred_symbo';
            const body = JSON.stringify({
                symbol: searched_crypto,
                name: cryptoData.name,
                picture_url: cryptoData.image
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Update the UI
            isCryptoStarred = true;
            const starIcon = document.getElementById('starred_crypto');
            if (starIcon) {
                starIcon.src = "/images/starred.png";
            }
        }

    } catch (error) {
        console.error("Error toggling starred crypto:", error);
    }
}

async function get_current_funding_rate(symbol) {
    const exchange_url = bitgetAPI + `/api/v2/mix/market/current-fund-rate?symbol=${symbol}&productType=usdt-futures`; 

    try {
        const api_response = await fetch(exchange_url);
        
        if (!api_response.ok) {
            throw new Error(`Network response was not ok: ${api_response.statusText} (Status Code: ${api_response.status})`);
        }
        
        const data = await api_response.json();
        
        if (data && data.data && data.data.length > 0) {
            return data.data[0].fundingRate * 100; 
        } else {
            throw new Error('Invalid data structure received from API.');
        }
    } catch (error) {
        console.error("Error fetching funding rate:", error);
        return null;
    }
}

async function updateFundingRate(symbol) {
    console.log("Updating funding rate for symbol:", symbol);
    const fundingRate = await get_current_funding_rate(symbol);
    const fundingRateElement = document.getElementById("funding-rate-value");
    
    if (fundingRate !== null) {
        const formattedRate = parseFloat(fundingRate).toFixed(4); 
        fundingRateElement.textContent = `${formattedRate}%`;
    
        if (parseFloat(fundingRate) >= 0) {
            fundingRateElement.classList.add('positive');
            fundingRateElement.classList.remove('negative');
        } else {
            fundingRateElement.classList.add('negative');
            fundingRateElement.classList.remove('positive');
        }
    } else {
        fundingRateElement.textContent = "Error fetching rate";
        fundingRateElement.classList.add('negative');
        fundingRateElement.classList.remove('positive');
    }
}

let fundingRateIntervalId = null;
function startFundingRateUpdates(symbol) {
    updateFundingRate(symbol); 

    if (fundingRateIntervalId) {
        clearInterval(fundingRateIntervalId);
    }

    fundingRateIntervalId = setInterval(() => {
        updateFundingRate(symbol);
    }, 10000);
}

window.addEventListener('beforeunload', function() {
    if (fundingRateIntervalId) {
        clearInterval(fundingRateIntervalId);
    }
});

function openTab(evt, tabName) {
    
    var i, tabcontent, tabbuttons;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tabbuttons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabbuttons.length; i++) {
        tabbuttons[i].className = tabbuttons[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.addEventListener("DOMContentLoaded", function(){
    document.getElementsByClassName("tab-button")[0].click();
});

document.addEventListener('click', function(event) {
    closeMenus(event);
});


// v.2.3.4 - 