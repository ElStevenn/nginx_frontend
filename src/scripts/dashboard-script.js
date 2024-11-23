document.addEventListener('DOMContentLoaded', function() {
    const url_base = 'http://localhost:8000/get_hight_founind_rates/-0.1'; 

    // Function to fetch data from the API endpoint
    async function fetchFundingRates() {
        const containerElement = document.getElementById('higer_coins'); 

        // Check if containerElement is null
        if (!containerElement) {
            console.error('Element with ID "higer_coins" not found.');
            return;
        }

        // Show loading spinner
        containerElement.innerHTML = '<div class="spinner"></div>';

        try {
            // Fetch the funding rates data from the API endpoint
            const response = await fetch(url_base);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            createFundingRateElement(data);
        } catch (error) {
            console.error('Error fetching funding rates:', error);
            containerElement.innerHTML = '<p>Error fetching data. Please try again later.</p>';
        }
    }

    function createFundingRateElement(data) {
        const containerElement = document.getElementById('higer_coins'); 
        const loadingElement = document.getElementById('loading');

        if (!containerElement) {
            console.error('Element with ID "higher_coins" not found.');
            return;
        }

        // Clear previous content
        containerElement.innerHTML = '';

        // Hide loading image after data is fetched
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        if (data.length === 0) {
            console.log("There are no cryptos with high funding rate available.");
            containerElement.innerHTML = '<h3 style="font-size: 25px;">FAQ section</h3>';
        } else {
            let pronoun = data.length === 1 ? 'is' : 'are';
            let crypto = data.length === 1 ? 'crypto' : 'cryptos';

            // Create the headline element
            const headline = document.createElement('h3');
            headline.textContent = `There ${pronoun} ${data.length} ${crypto} with high funding rates today.`;

            const ulElement = document.createElement('ul');

            // Loop through each funding rate and create list items
            data.forEach(item => {
                const listItem = create_element(item.symbol, item.fundingRate);
                ulElement.appendChild(listItem);
            });

            containerElement.appendChild(headline);
            containerElement.appendChild(ulElement);
        }
    }

    function create_element(symbol, funding_rate) {
        // Format the funding rate to two decimal places
        const formattedRate = parseFloat(funding_rate).toFixed(2);
        const listItem = document.createElement('li');

        // Create the inner HTML of the list item
        listItem.innerHTML = `
            <a href="/crypto-detail/${symbol}" target="_blank">${symbol}</a> 
            <span class="funding-rate">${formattedRate}%</span>
        `;
        return listItem;
    }

    // Call the function to fetch and display the data
    fetchFundingRates();
});



// Image hover change
document.addEventListener('DOMContentLoaded', function() {
    const calendarImg = document.querySelector('.summary-filters img');

    if (calendarImg) {
        calendarImg.addEventListener('mouseenter', function() {
            this.src = 'images/calendar_2.png';
        });

        calendarImg.addEventListener('mouseleave', function() {
            this.src = 'images/calendar.png';
        });
    } else {
        console.error('Image not found');
    }
});



// Chart
document.addEventListener('DOMContentLoaded', function () {
    fetch('http://localhost/get_historical_founding_rate/DYMUSDT', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Map through the data to extract and convert dates and values
        const chartData = data.map(item => ({
            x: new Date(item[1]), // Convert string date to Date object
            y: item[0] // Use the first value (rate)
        }));

        var ctx = document.getElementById('myChart').getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'line', // Use a line chart to plot time series data
            data: {
                datasets: [{
                    label: 'Historical Funding Rate',
                    data: chartData,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time', // Specify x-axis as time
                        time: {
                            unit: 'day' // Set the time unit to 'day' for better readability
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Rate'
                        }
                    }
                }
            }
        });
    })
    .catch(error => console.error('Error fetching data:', error));
});

