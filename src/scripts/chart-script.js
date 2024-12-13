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

function getPointColor(value) {
    if (value > 0) {
        // Green color
        return "#00FF00";
    } else if (value >= -0.5) {
        // Transition from light red to darker red as value goes from -0.5 to 0
        const ratio = (value + 0.5) / 0.5; // Ratio from 0 to 1
        const red = 255;
        const green = Math.round(64 * (1 - ratio)); // From 64 to 0
        const blue = Math.round(64 * (1 - ratio));  // From 64 to 0
        return `rgb(${red}, ${green}, ${blue})`;
    } else if (value >= -3) {
        // Transition from dark red to light red as value goes from -3 to -0.5
        const ratio = (value + 3) / 2.5; // Ratio from 0 to 1
        const red = 139 + Math.round(116 * ratio);  // From 139 to 255
        const green = Math.round(0 + 64 * ratio);   // From 0 to 64
        const blue = Math.round(0 + 64 * ratio);    // From 0 to 64
        return `rgb(${red}, ${green}, ${blue})`;
    } else {
        // For values less than -3, use darkest red
        return "rgb(139, 0, 0)"; // Dark red
    }
}

async function fetch_chart_data(limit) {
    const symbol = getValueAfterCryptoDetail();
    const url = cryptocurrencyAPI + `/funding-rate/history/${symbol}?limit=${limit}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.status === 404) {
            throw new Error('Crypto not found (404)');
        } else if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data; // Return data for further use
    } catch (error) {
        console.error('Fetch Operation Error:', error);
    }
}

function buildChart(data) {
    const ctx = document.getElementById("fundingRateChart").getContext("2d");

    // Ensure data is sorted by date
    data.sort((a, b) => new Date(a.period) - new Date(b.period));

    // Prepare data for Chart.js
    const chartData = data.map(item => {
        // Handle inconsistent index price field names
        const indexPrice = item.period_index_price || item.index_period_price || 0;
        return {
            x: new Date(item.period),
            y: item.funding_rate_value,
            indexPrice: indexPrice
        };
    });

    // Function to compute the color based on funding rate value
    const pointColors = chartData.map(item => getPointColor(item.y));

    // Data for the horizontal line at y = -0.5
    const thresholdLine = [
        { x: chartData[0].x, y: -0.5 },
        { x: chartData[chartData.length - 1].x, y: -0.5 }
    ];

    const verticalLinePlugin = {
        id: 'verticalLinePlugin',
        afterDraw: (chart) => {
            if (chart.tooltip._active && chart.tooltip._active.length) {
                const ctx = chart.ctx;
                const activePoint = chart.tooltip._active[0];
                const x = activePoint.element.x;
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;
    
                // Save the current state
                ctx.save();
    
                // Set the line style
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 0.7;
                ctx.strokeStyle = '#FFFFFF';
                ctx.setLineDash([3, 3]); // Dashed line
                ctx.stroke();
    
                // Restore the state
                ctx.restore();
            }
        }
    };
    
    Chart.register(verticalLinePlugin);


    // Create Historical Funfing rate chart
    new Chart(ctx, {
        type: "line",
        data: {
            datasets: [
                {
                    label: "Funding Rate Value",
                    data: chartData,
                    borderColor: "#ff4081", // Pink color for line
                    backgroundColor: "rgba(255, 64, 129, 0.1)", // Slightly transparent
                    borderWidth: 2,
                    pointBackgroundColor: pointColors,
                    pointRadius: 5,
                    pointBorderWidth: 1,
                    pointBorderColor: "#fff",
                    pointHoverRadius: 7,
                    pointHoverBorderWidth: 2,
                    pointHoverBackgroundColor: pointColors,
                    pointHoverBorderColor: "#fff",
                    fill: false, // Do not fill under the line
                },
                {
                    label: "Threshold",
                    data: thresholdLine,
                    borderColor: "#2196f3", // Blue color
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    borderDash: [5, 5],
                    hoverRadius: 0,
                    hitRadius: 0,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Makes the chart more flexible
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour', // Adjust as needed: 'minute', 'day', etc.
                        displayFormats: {
                            hour: 'dd/MM h a' // Customize date format to day/month hour
                        },
                        tooltipFormat: 'dd/MM h a',
                    },
                    adapters: {
                        date: {} // Ensure the adapter is recognized
                    },
                    ticks: {
                        color: "#e0e0e0", // X-axis labels color
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 20,
                    },
                    grid: {
                        display: false, // Remove X-axis grid lines
                        // Optional: Remove the X-axis border line
                        drawBorder: false,
                    },
                },
                y: {
                    ticks: {
                        color: "#e0e0e0", // Y-axis labels color
                    },
                    grid: {
                        display: false, // Remove Y-axis grid lines
                        // Optional: Remove the Y-axis border line
                        drawBorder: false,
                    },
                    beginAtZero: false, // Adjusts scale based on data
                }
            },
            plugins: {
                legend: {
                    display: false, // Hide the legend
                },
                tooltip: {
                    bodyColor: "#e0e0e0",
                    titleColor: "#e0e0e0",
                    backgroundColor: "#2e2e2e",
                    borderColor: "#817d7d",
                    borderWidth: 1,
                    callbacks: {
                        title: function(tooltipItems) {
                            // Display the period (day/month hour)
                            const date = tooltipItems[0].parsed.x;
                            return `Period: ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            const fundingRate = context.parsed.y;
                            const indexPrice = context.raw.indexPrice;
                            return [
                                `Funding Rate: ${fundingRate}`,
                                `Index Price: ${indexPrice}`
                            ];
                        }
                    }
                },
                // Register the custom plugin here
                verticalLinePlugin: verticalLinePlugin
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            elements: {
                line: {
                    tension: 0, // Straight lines to ensure dots and lines align
                },
                point: {
                    hoverRadius: 7,
                },
            },
        },
        plugins: [verticalLinePlugin] // Add the plugin to the chart
    });
    
}


// Fetch data and build chart
fetch_chart_data(100).then(data => {
    if (data) {
        buildChart(data);
    } else {
        console.error("No data available for the chart.");
    }
});



// TRADING VIEW CHART

(function() {
    // Flag to ensure the TradingView script is loaded only once
    let isTradingViewScriptLoaded = false;

    /**
     * Initializes the TradingView Advanced Chart Widget.
     * @param {Object} options - Configuration options for the widget.
     * @param {string} options.containerId - The ID of the container where the widget will be embedded.
     * @param {string} options.symbol - The default trading symbol (e.g., "NASDAQ:AAPL").
     * @param {string} [options.interval="D"] - The default time interval (e.g., "D" for daily).
     * @param {string} [options.theme="dark"] - The theme of the widget ("dark" or "light").
     * @param {string} [options.locale="en"] - The locale of the widget.
     */
    window.initializeTradingViewWidget = function(options) {
        if (!options || !options.containerId) {
            console.error("initializeTradingViewWidget: 'containerId' is required in options.");
            return;
        }

        // Default configuration
        const config = {
            autosize: true,
            symbol: options.symbol || "NASDAQ:AAPL",
            interval: options.interval || "D",
            timezone: options.timezone || "Etc/UTC",
            theme: options.theme || "dark",
            style: options.style || "1",
            locale: options.locale || "en",
            allow_symbol_change: options.allow_symbol_change !== undefined ? options.allow_symbol_change : true,
            calendar: options.calendar !== undefined ? options.calendar : false,
            support_host: options.support_host || "https://www.tradingview.com"
        };

        // Function to load the TradingView script
        function loadTradingViewScript(callback) {
            if (isTradingViewScriptLoaded) {
                if (callback) callback();
                return;
            }

            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
            script.async = true;
            script.onload = function() {
                isTradingViewScriptLoaded = true;
                if (callback) callback();
            };
            script.onerror = function() {
                console.error("Failed to load TradingView script.");
            };
            document.head.appendChild(script);
        }

        // Function to embed the widget
        function embedWidget() {
            const container = document.getElementById(options.containerId);
            if (!container) {
                console.error(`initializeTradingViewWidget: Container with ID '${options.containerId}' not found.`);
                return;
            }

            // Clear any existing content
            container.innerHTML = '';

            // Create the widget container
            const widgetContainer = document.createElement('div');
            widgetContainer.className = 'tradingview-widget-container';
            widgetContainer.style.height = '100%';
            widgetContainer.style.width = '100%';

            // Inner widget div
            const widgetInner = document.createElement('div');
            widgetInner.className = 'tradingview-widget-container__widget';
            widgetInner.style.height = 'calc(100% - 32px)';
            widgetInner.style.width = '100%';

            // Copyright div
            const copyright = document.createElement('div');
            copyright.className = 'tradingview-widget-copyright';
            copyright.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';

            // Append elements
            widgetContainer.appendChild(widgetInner);
            widgetContainer.appendChild(copyright);
            container.appendChild(widgetContainer);

            // Initialize the widget
            new TradingView.widget({
                ...config,
                container_id: widgetInner.id || options.containerId + "_widget"
            });
        }

        // Ensure the TradingView script is loaded before embedding
        loadTradingViewScript(embedWidget);
    };
})();

