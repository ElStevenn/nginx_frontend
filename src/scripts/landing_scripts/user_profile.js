



document.addEventListener('DOMContentLoaded', () => {

    const credentials = getCookie("credentials");
    const login_div = document.querySelector('.login-part');
    const signup_element = document.querySelector('.signup');


    if (!credentials) {
        login_div.innerHTML = `
            <a href="/login" class="login">Log in</a>
            <a href="/login?action=register" class="signup">Sign up</a>
        `;
    } else {
        login_div.innerHTML = `
           <a href="/dashboard" class="signup">
                Dashboard <img src="/images/icons/right-up.png" alt="icon" class="icon-nav">
            </a>
        `;

        signup_element.style.margin = '0px';
    }
    
});