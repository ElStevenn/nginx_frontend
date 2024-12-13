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
        const url = cryptocurrencyAPI + `/crypto/detail/${searched_crypto}USDT`;

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
            
            // Update currentSymbol for the chart based on the searched crypto
            // Since searched_crypto is BTC or ETH, we convert it to BINANCE:BTCUSDT
            currentSymbol = 'BINANCE:' + searched_crypto + 'USDT';

            // If the currently selected left pane is 'chart', re-initialize the chart with the correct symbol
            const savedTab = localStorage.getItem('selectedLeftPane') || 'chart';
            if (savedTab === 'chart') {
                initializeTradingViewWidget({
                    containerId: 'tradingview_chart_container',
                    symbol: currentSymbol,
                    interval: currentInterval,
                    theme: 'dark',
                    locale: 'en',
                    allow_symbol_change: false,
                    calendar: false,
                    support_host: 'https://www.tradingview.com'
                });
            }

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
    }

    // Hide error if shown
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }

    // Update name and symbol
    const cryptoNameElement = document.getElementById('crypto-name');
    if (cryptoNameElement) {
        cryptoNameElement.textContent = name;
    }

    const cryptoSymbolElement = document.getElementById('crypto-symbol2');
    if (cryptoSymbolElement) {
        cryptoSymbolElement.textContent = ` (${symbol})`;
    }

    // Update image
    const cryptoLogoElement = document.getElementById('crypto-logo');
    if (cryptoLogoElement) {
        if (image && image.startsWith('http')) {
            cryptoLogoElement.src = image;
        } else {
            console.error('Invalid image URL:', image);
            cryptoLogoElement.src = '/images/default-crypto-logo.png'; 
        }
    }

    // Start countdown
    if (next_execution_time) {
        startCountdown(next_execution_time);
    }

    // Set up description
    document.getElementById("description-spinner").style.display = "inline";
    document.getElementById("description-content").style.display = "none";
    if (description) {
        setupDescription(description);
    } else {
        const cryptoDescription = document.getElementById('crypto-description');
        if (cryptoDescription) {
            document.getElementById("description-spinner").style.display = "none";
            cryptoDescription.textContent = "Description not available.";
        }
    }
}

var truncateLength = 100;
function setupDescription(fullDescription) {
    document.getElementById("description-spinner").style.display = "none";
    document.getElementById("description-content").style.display = "inline";

    var descriptionShort = document.getElementById("description-short");
    var descriptionFull = document.getElementById("description-full");
    var readMoreLink = document.getElementById("read-more");

    var processedDescription = linkify(fullDescription);

    if (fullDescription.length > truncateLength) {
        descriptionShort.innerHTML = processedDescription.substring(0, truncateLength) + "...";
        descriptionFull.innerHTML = processedDescription.substring(truncateLength);
        descriptionFull.style.display = "none";
        readMoreLink.style.display = "inline";
        readMoreLink.textContent = " Read more";
    } else {
        descriptionShort.innerHTML = processedDescription;
        descriptionFull.style.display = "none";
        readMoreLink.style.display = "none";
    }
}

function toggleDescription(event) {
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

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    const errorContainer = document.getElementById('error-message');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
}

function startCountdown(nextExecutionTime) {
    const countdownElement = document.getElementById('fundingrate-countdown');
    if (!countdownElement) return;

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

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
}

function updatePriceOnScreen(price) {
    const priceElement = document.getElementById('crypto-price');
    const loadingImage = document.getElementById('loading-image');

    if (priceElement) {
        if (loadingImage) {
            loadingImage.style.display = 'none'; 
        }

        let priceNumber = parseFloat(price);
        if (isNaN(priceNumber)) return;

        let decimals = Math.max(4, Math.ceil(-Math.log10(priceNumber)));
        let formattedPrice = priceNumber.toFixed(decimals);

        priceElement.textContent = `$${formattedPrice}`;
    }
}

let socket;
function initializeWebSocket(symbol) {
    if (symbol.startsWith('UX')) {
        symbol = symbol.substring(2);
    }

    // Ensure we form the correct instrument ID for Bitget
    const instId = symbol + 'USDT_UMCBL';

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

    const savedTab = localStorage.getItem('selectedLeftPane') || 'chart';
    switchLeftPane(savedTab);

    // Initialize the resizer
    const resizer = document.getElementById('dragMe');
    const leftPane = document.getElementById('leftPane');
    const rightPane = document.getElementById('rightPane');
    let x = 0;
    let leftWidth = 0;

    resizer.addEventListener('mousedown', mousedownHandler);

    function mousedownHandler(e) {
        x = e.clientX;
        leftWidth = leftPane.getBoundingClientRect().width;

        document.body.classList.add('dragging');
        document.addEventListener('mousemove', mousemoveHandler);
        document.addEventListener('mouseup', mouseupHandler);
    }

    function mousemoveHandler(e) {
        const dx = e.clientX - x;
        let newLeftWidth = leftWidth + dx;

        // Optional: set some min/max widths
        const minWidth = 200;
        const maxWidth = window.innerWidth - 200;
        if (newLeftWidth < minWidth) newLeftWidth = minWidth;
        if (newLeftWidth > maxWidth) newLeftWidth = maxWidth;

        leftPane.style.flexBasis = newLeftWidth + 'px';
    }

    function mouseupHandler() {
        document.body.classList.remove('dragging');
        document.removeEventListener('mousemove', mousemoveHandler);
        document.removeEventListener('mouseup', mouseupHandler);
    }
});


// Retrieve panel info
async function get_main_panle_info() {
    const searched_crypto = getValueAfterCryptoDetail();

    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("Credentials not found.");
        return;
    }
    credentials = credentials.replace(/^"(.*)"$/, '$1');
    const url = globalAPI + `/user/symbol-detail/${searched_crypto}`;
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

        isCryptoStarred = data.is_starred;

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

// Toggle star status
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
            const url = globalAPI + `/user/starred_symbol/${searched_crypto}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: headers
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            isCryptoStarred = false;
            const starIcon = document.getElementById('starred_crypto');
            if (starIcon) {
                starIcon.src = "/images/none-starred.png";
            }
        } else {
            const url = globalAPI + '/user/starred_symbol';
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
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

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
    const exchange_url = bitgetAPI + `/api/v2/mix/market/current-fund-rate?symbol=${symbol}USDT&productType=usdt-futures`; 

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

// ---------------------------------------------------------------------------------------
// PERSISTING THE SELECTED LEFT PANE AND INITIALIZING THE CHART
// ---------------------------------------------------------------------------------------
let currentInterval = '60'; // Default interval, e.g., '60' for 1H
let currentSymbol = 'BINANCE:BTCUSDT'; // Default symbol

// Function to switch left pane (existing functionality)
function switchLeftPane(selectedTab) {
    const tabButtons = document.querySelectorAll('.left-tab-button');
    const tabContents = document.querySelectorAll('.left-pane-content');

    tabButtons.forEach(button => {
        const isActive = button.getAttribute('onclick').includes(`'${selectedTab}'`);
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive);
    });

    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === selectedTab);
    });

    // Store the selected tab in localStorage
    localStorage.setItem('selectedLeftPane', selectedTab);

    // If the Chart tab is activated, initialize the TradingView widget with current interval
    if (selectedTab === 'chart') {
        initializeTradingViewWidget({
            containerId: 'tradingview_chart_container',
            symbol: currentSymbol, 
            interval: currentInterval,
            theme: 'dark',
            locale: 'en',
            allow_symbol_change: false,
            calendar: false,
            support_host: 'https://www.tradingview.com'
        });
    }
}

// Initialize TradingView widget (existing functionality)
function initializeTradingViewWidget({containerId, symbol, interval, theme, locale, allow_symbol_change, calendar, support_host}) {
    if (typeof TradingView === 'undefined') {
        console.error("TradingView library not found. Make sure you included the TradingView script.");
        return;
    }

    // Remove previously initialized widget if exists
    const widgetContainer = document.getElementById(containerId);
    if (widgetContainer) {
        widgetContainer.innerHTML = ''; 
    }

    new TradingView.widget({
        "width": "100%",   
        "height": "700",   
        "symbol": symbol,
        "interval": interval,
        "timezone": "Etc/UTC",
        "theme": theme,
        "style": "1",
        "locale": locale,
        "toolbar_bg": "#2e2e2e",
        "enable_publishing": false,
        "allow_symbol_change": allow_symbol_change,
        "calendar": calendar,
        "container_id": containerId,
        "hide_side_toolbar": false,
        "hide_top_toolbar": true,
        "withdateranges": false,
        "show_popup_button": true,
        "details": false,
        "hotlist": false,
        "save_image": true,
        "studies": [],
        "support_host": support_host,

        "overrides": {
            "paneProperties.background": "#2e2e2e",
            "paneProperties.vertGridProperties.color": "#363c4e",
            "paneProperties.horzGridProperties.color": "#363c4e",
            "scalesProperties.textColor": "#DADADA",
            "scalesProperties.lineColor": "#555",
            "symbolWatermarkProperties.transparency": 90
        },
        "studies_overrides": {}
    });
}

// ---------------------------------------------------------------------------------------
// HANDLING INTERVAL BUTTON CLICK EVENTS AND ACTIVE STATE
// ---------------------------------------------------------------------------------------
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('interval-button')) {
        const newInterval = event.target.getAttribute('data-interval');
        currentInterval = newInterval;

        // Persist the selected interval in localStorage
        localStorage.setItem('selectedInterval', currentInterval);

        // Update active state for interval buttons
        updateActiveIntervalButton(newInterval);

        // Re-initialize the widget with the new interval and current symbol
        initializeTradingViewWidget({
            containerId: 'tradingview_chart_container',
            symbol: currentSymbol,
            interval: currentInterval,
            theme: 'dark',
            locale: 'en',
            allow_symbol_change: false,
            calendar: false,
            support_host: 'https://www.tradingview.com'
        });
    }

    closeMenus(event);
});

function updateActiveIntervalButton(selectedInterval) {
    const intervalButtons = document.querySelectorAll('.interval-button');
    intervalButtons.forEach(button => {
        if (button.getAttribute('data-interval') === selectedInterval) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Placeholder for closeMenus function (If you have this defined elsewhere, keep it)
function closeMenus(event) {
    // Your existing implementation for closing menus
}
