// Function to redirect to home page
function redirectToHome() {
    window.location.href = '/';
}

// Function to get a cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Function to check account deletion status
async function check_deletion() {
    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("No credentials found");
        window.location.href = '/login';
        throw new Error("No credentials found");
    }

    // Remove surrounding quotes if any
    credentials = credentials.replace(/^"(.*)"$/, '$1'); 

    const url = globalAPI + '/user/confirm-delete';
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": credentials
    };

    // Show loading bar and hide message container
    document.getElementById("message-container").style.display = "none";
    document.getElementById("loading-bar").style.display = "flex";

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: headers
        });

        if (response.ok) {
            const data = await response.json(); // Assuming the API returns JSON
            // Hide loading bar and show success message
            document.getElementById("loading-bar").style.display = "none";
            document.getElementById("message-container").classList.remove("error");
            document.getElementById("message-container").classList.add("success");
            document.getElementById("deletion-message").innerText = "Account Successfully Deleted";
            document.getElementById("deletion-details").innerText = "Your Trade Visionary account has been successfully deleted. We're sorry to see you go!";
            document.getElementById("message-container").style.display = "block";
        } else if (response.status === 401) {
            // Hide loading bar and redirect to root
            document.getElementById("loading-bar").style.display = "none";
            window.location.href = '/';
        } else if(response.status == 404){
            // Redirection due the credentials was not found
            document.getElementById("loading-bar").style.display = "none";
            window.location.href = '/';

        } else {
            const errorDetails = await response.json();
            console.error("API Error:", errorDetails);
            // Hide loading bar and show generic error message
            document.getElementById("loading-bar").style.display = "none";
            document.getElementById("message-container").classList.remove("success");
            document.getElementById("message-container").classList.add("error");
            document.getElementById("deletion-message").innerText = "An Error Occurred";
            document.getElementById("deletion-details").innerText = "An unexpected error occurred. Please try again later.";
            document.getElementById("message-container").style.display = "block";
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        // Hide loading bar and show network error message
        document.getElementById("loading-bar").style.display = "none";
        document.getElementById("message-container").classList.remove("success");
        document.getElementById("message-container").classList.add("error");
        document.getElementById("deletion-message").innerText = "Network Error";
        document.getElementById("deletion-details").innerText = "Unable to reach the server. Please check your internet connection and try again.";
        document.getElementById("message-container").style.display = "block";
    }
}