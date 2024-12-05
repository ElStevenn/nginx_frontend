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



// Chart (revise this, it doesn't make sense here, 'localhost' cannot be here)
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

