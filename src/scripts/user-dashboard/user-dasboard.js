
async function get_accounts() {
    const accounts = getCookie("accounts");
    if (accounts) {
        try {
            return JSON.parse(accounts.replace(/\\054/g, ','));
        } catch (parseError) {
            console.error("Error parsing accounts from cookies:", parseError);
            return null;
        }
    }

    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("Credentials not found.");
        return null;
    }

    credentials = credentials.replace(/^"(.*)"$/, '$1');
    try {
        const response = await fetch(`${exchangeAPI}/accounts`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': credentials
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Accounts:", data);
        return data;
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return null;
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const portfolioOverview = document.querySelector('.portfolio-overview');
    const submenu = document.getElementById('portfolio-submenu');
    const submenuList = document.getElementById('portfolio-submenu-list');
    const accountNameElement = document.querySelector('.account-name');
    const accountBalanceElement = document.querySelector('.account-balance');

    let isSubmenuVisible = false;

    /**
     * Mock function to simulate fetching accounts.
     * Replace this with your actual API call.
     */

    /**
     * Mock function to simulate fetching balance overview.
     * Replace this with your actual API call.
     */
    const get_balance_overview = async (accountId) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Return mock balance data
        return {
            balance: Math.random() * 10000,
            change: (Math.random() * 10 - 5).toFixed(3) // Random change between -5 and +5%
        };
    };


    /**
     * Mock function to get a cookie.
     * Replace or remove if using localStorage or another method.
     */
    const getCookie = (cname) => {
        const name = cname + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    };

    /**
     * Toggles the visibility of the submenu.
     */
    const toggleSubmenu = async () => {
        if (isSubmenuVisible) {
            submenu.classList.remove('show');
            portfolioOverview.setAttribute('aria-expanded', 'false');
            isSubmenuVisible = false;
        } else {
            // Show loading indicator
            submenuList.innerHTML = `
                <li class="submenu-item" id="loading-item">Loading...</li>
                <li class="submenu-separator"></li>
                <li class="submenu-item" id="add-account-item">Add Account</li>
            `;
            submenu.classList.add('show');
            portfolioOverview.setAttribute('aria-expanded', 'true');
            isSubmenuVisible = true;

            // Fetch accounts and populate submenu
            const accounts = await get_accounts();
            if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                populateSubmenu(accounts);
            } else {
                // If no accounts, inform the user
                submenuList.innerHTML = `
                    <li class="submenu-item">No accounts available</li>
                    <li class="submenu-separator"></li>
                    <li class="submenu-item" id="add-account-item">Add Account</li>
                `;
            }
        }
    };

    /**
     * Populates the submenu with the list of accounts.
     * @param {Array} accounts - Array of account objects.
     */
    const populateSubmenu = (accounts) => {
        // Clear existing account items except the "Global" and "Add Account"
        submenuList.innerHTML = `
            <li class="submenu-item" id="global-menu-item">Global</li>
            <li class="submenu-separator"></li>
        `;

        accounts.forEach(account => {
            const li = document.createElement('li');
            li.classList.add('submenu-item');
            li.textContent = account.name || `Account ${account.id}`;
            li.dataset.accountId = account.id;
            submenuList.appendChild(li);
        });

        // Add the "Add Account" item at the end
        const addAccountItem = document.createElement('li');
        addAccountItem.classList.add('submenu-item');
        addAccountItem.textContent = 'Add Account';
        addAccountItem.id = 'add-account-item';
        addAccountItem.addEventListener('click', () => {
            // Implement the "Add Account" functionality here
            console.log('Add Account clicked');
            // Example: Redirect to add account page
            // window.location.href = '/add-account';
        });
        submenuList.appendChild(addAccountItem);

        // Add event listeners to account items
        const accountItems = submenuList.querySelectorAll('.submenu-item');
        accountItems.forEach(item => {
            // Skip the "Add Account" and "Global" items
            if (item.id === 'add-account-item' || item.id === 'global-menu-item') return;

            item.addEventListener('click', () => {
                const accountId = item.dataset.accountId || 'all'; // 'all' for Global
                switchAccount(accountId, item.textContent);
            });
        });

        // Event listener for "Global" account
        const globalMenuItem = document.getElementById('global-menu-item');
        if (globalMenuItem) {
            globalMenuItem.addEventListener('click', () => {
                switchAccount('all', 'Global Account');
            });
        }
    };

    /**
     * Switches the account by updating the UI and fetching new balance data.
     * @param {string} accountId - The ID of the account to switch to.
     * @param {string} accountName - The name of the account.
     */
    const switchAccount = async (accountId, accountName) => {
        // Hide the submenu
        submenu.classList.remove('show');
        portfolioOverview.setAttribute('aria-expanded', 'false');
        isSubmenuVisible = false;

        // Update the account name in the UI
        accountNameElement.textContent = accountName;

        // Optionally, fetch and update the balance overview
        const balanceOverview = await get_balance_overview(accountId);
        if (balanceOverview) {
            // Update the balance display
            accountBalanceElement.innerHTML = `$${balanceOverview.balance.toFixed(2)} <span class="account-balance-increased">(${balanceOverview.change}%)</span>`;
        } else {
            accountBalanceElement.textContent = '$0.00 (+0.000%)';
        }

        // Optionally, store the selected account in a cookie or localStorage
        setCookie('selected_account', accountId, 7); // Example: Store for 7 days
    };

    // Event listener for toggling submenu
    portfolioOverview.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the event from bubbling up
        toggleSubmenu();
    });

    // Event listener to close submenu when clicking outside
    document.addEventListener('click', (e) => {
        if (isSubmenuVisible && !submenu.contains(e.target) && !portfolioOverview.contains(e.target)) {
            submenu.classList.remove('show');
            portfolioOverview.setAttribute('aria-expanded', 'false');
            isSubmenuVisible = false;
        }
    });

    // Initial load: set to Global Account or selected account
    const selectedAccountId = getCookie('selected_account');
    if (selectedAccountId) {
        // Ideally, fetch the account name based on ID from the accounts list
        // For demonstration, using a placeholder account name
        switchAccount(selectedAccountId, `Account ${selectedAccountId}`);
    } else {
        switchAccount('all', 'Global Account');
    }
});
