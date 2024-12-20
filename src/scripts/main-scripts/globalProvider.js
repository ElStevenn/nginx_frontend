/*
A utility script that centralizes shared functionality and resources for the application. 
It provides access to cookies, session data, and API configurations like base URLs or 
endpoint paths (but never sensitive data like API keys). This file ensures consistent 
use of API-related variables and avoids duplication of logic, serving as a single source 
of truth for reusable resources and configuration values.
*/

// IPS of the diferents apis
const cryptocurrencyAPI = "http://localhost:8080";
const cryptocurrencyURL = "localhost:8080";
const globalAPI = "https://pauservices.top";
// const globalAPI = "http://localhost:8000";
const exchangeAPI = "http://localhost:8001";

const bitgetAPI = "https://api.bitget.com";

// Cookies handling
function getCookie(name) {
    try {
        const cookieArr = document.cookie.split(';');
        for (let cookie of cookieArr) {
            let [key, value] = cookie.trim().split('=');
            if (key === name) {
                return decodeURIComponent(value);
            }
        }
    } catch (error) {
        console.error("Error retrieving cookie:", error);
    }
    return null;
}


function linkify(text) {
    // Regular expression to match URLs
    var urlPattern = /(https?:\/\/[^\s]+)/g;

    // Replace URLs with anchor tags
    return text.replace(urlPattern, function(url) {
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    });
}

// Show errors
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
