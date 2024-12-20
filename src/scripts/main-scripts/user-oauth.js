

function showRegister() {
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('register-box').style.display = 'flex';
}

function showLogin() {
    document.getElementById('register-box').style.display = 'none';
    document.getElementById('login-box').style.display = 'flex';
}

// Check URL parameters and display accordingly
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'register') {
        showRegister();
    } else {
        showLogin();
    }
};


function oauth_redirect() {
    window.location.href=  globalAPI + '/oauth/google/login';
}

  // Handle the Forgot Password form submission
  document.getElementById('forgot-password-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Get the email input value
    var emailInput = document.getElementById('email').value;

    // Basic email validation (optional)
    if (!validateEmail(emailInput)) {
        alert('Please enter a valid email address.');
        return;
    }

    // Start the fade-out animation
    var authBox = document.getElementById('forgot-password-box');
    authBox.classList.add('fade-out');

    // Listen for the end of the animation to show the success message
    authBox.addEventListener('animationend', function() {
        // Hide the auth box content
        authBox.style.display = 'none';

        // Show the success message
        var successMessage = document.getElementById('success-message');
        successMessage.style.display = 'block';
    }, { once: true }); // Ensure the event listener is called only once

    // TODO: Implement backend integration here to handle the password reset request
    // Example: Send an AJAX request to your server with the email
});

// Function to validate email format
function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Optional: Remove the fade-in class after animation completes
window.addEventListener('load', function() {
    var authBox = document.getElementById('forgot-password-box');
    authBox.classList.remove('fade-in');
});