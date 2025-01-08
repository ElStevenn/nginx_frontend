
async function get_accounts() {
    const accounts = getCookie("accounts");
    if (accounts) {
        if (accounts.includes('\\054')) {
            const fixedAccounts = accounts.replace(/\\054/g, ',');
            return JSON.parse(fixedAccounts);
        } else {
            return JSON.parse(accounts);
        }
    }

    let credentials = getCookie("credentials");
    if (!credentials) {
        console.error("Credentials not found.");
        return null;
    }

    credentials = credentials.replace(/^"(.*)"$/, '$1');

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

    // Store fetched accounts in cookies for future use
    setCookie("accounts", JSON.stringify(data), 7);

    return data;
   
}


document.addEventListener('DOMContentLoaded', () => {
    const portfolioOverview = document.querySelector('.portfolio-overview');
    const submenu = document.getElementById('portfolio-submenu');
    const submenuList = document.getElementById('portfolio-submenu-list');
    const accountNameElement = document.querySelector('.account-name');

    let isSubmenuVisible = false;

    /**
     * Toggles the visibility of the submenu.
     */
    function toggleSubmenu() {
        if (isSubmenuVisible) {
            hideSubmenu();
        } else {
            showSubmenu();
        }
    }

    /**
     * Shows the submenu and populates it with account data.
     */
    async function showSubmenu() {
        isSubmenuVisible = true;
        submenu.classList.add('show');
        portfolioOverview.setAttribute('aria-expanded', 'true');

        // Show loading indicator while fetching accounts
        submenuList.innerHTML = `
            <li class="submenu-item" id="loading-item">
                <div class="submenu-item-content">
                    <img src="path/to/icon_account.png" alt="Loading" class="submenu-item-image">
                    <div class="submenu-item-text">
                        <span class="submenu-item-title">Loading...</span>
                        <span class="submenu-item-subtext">Please wait</span>
                    </div>
                </div>
            </li>
            <li class="submenu-separator"></li>
            <li class="submenu-item" id="add-account-item">Add Account</li>
        `;

        try {
            let accounts = await get_accounts(); // Ensure get_accounts() is defined and returns a Promise
            console.log("Fetched accounts:", accounts);
            
            // Parse if necessary
            if (typeof accounts === 'string') {
                accounts = JSON.parse(accounts);
            }

            if (Array.isArray(accounts) && accounts.length > 0) {
                populateSubmenu(accounts);
            } else if (accounts === null) {
                // Display an error message if fetching failed
                showError(submenuList, "Failed to load accounts. Please try again.");
            } else {
                // If no accounts, inform the user
                submenuList.innerHTML = `
                    <li class="submenu-item">
                        <div class="submenu-item-content">
                            <img src="path/to/no-account-icon.png" alt="No Accounts" class="submenu-item-image">
                            <div class="submenu-item-text">
                                <span class="submenu-item-title">No Accounts Available</span>
                                <span class="submenu-item-subtext">Please add a new account</span>
                            </div>
                        </div>
                    </li>
                    <li class="submenu-separator"></li>
                    <li class="submenu-item" id="add-account-item">Add Account</li>
                `;
            }
        } catch (error) {
            console.error("Error in showSubmenu:", error);
            showError(submenuList, "An unexpected error occurred. Please try again.");
        }
    }

    /**
     * Hides the submenu.
     */
    function hideSubmenu() {
        isSubmenuVisible = false;
        submenu.classList.remove('show');
        portfolioOverview.setAttribute('aria-expanded', 'false');
    }

    /**
     * Populates the submenu with the list of accounts.
     * @param {Array} accounts - Array of account objects.
     */
    function populateSubmenu(accounts) {
        const selectedAccountId = getCookie('selected_account') || 'all';

        // Clear existing submenu items and add Global account first
        submenuList.innerHTML = `
            <li class="submenu-item ${selectedAccountId === 'all' ? 'selected' : ''}" id="global-menu-item" role="menuitem" tabindex="0">
                <div class="submenu-item-content">
                    <img src="/images/icons/asset-allocation2.png" alt="Global Account" class="submenu-item-image">
                    <div class="submenu-item-text">
                        <span class="submenu-item-title">Global Account</span>
                        <span class="submenu-item-subtext">$0.00 <span class="account-balance-increased">(+0.000 %)</span></span>
                    </div>
                </div>
            </li>
        `;

        // Add each account to the submenu
        accounts.forEach(account => {
            const isSelected = account.account_id === selectedAccountId;
            const li = document.createElement('li');
            li.classList.add('submenu-item');
            if (isSelected) {
                li.classList.add('selected');
            }

            // Create the content container
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('submenu-item-content');

            // Create the image element
            const img = document.createElement('img');
            img.classList.add('submenu-item-image');
            img.src = account.image_url || '/images/icons/icon_account.png';
            img.alt = account.account_name || `Account ${account.account_id}`;

            // Create the text container
            const textDiv = document.createElement('div');
            textDiv.classList.add('submenu-item-text');

            // Create the main title
            const titleSpan = document.createElement('span');
            titleSpan.classList.add('submenu-item-title');
            titleSpan.textContent = account.account_name || `Account ${account.account_id}`;

            // Create the subtext
            const subtextSpan = document.createElement('span');
            subtextSpan.classList.add('submenu-item-subtext');
            subtextSpan.innerHTML = '$0.00 <span class="account-balance-increased">(+0.000 %)</span>';

            // Append elements
            textDiv.appendChild(titleSpan);
            textDiv.appendChild(subtextSpan);
            contentDiv.appendChild(img);
            contentDiv.appendChild(textDiv);
            li.appendChild(contentDiv);
            li.dataset.accountId = account.account_id;

            submenuList.appendChild(li);
        });

        // Add separator and "Add Account" at the end
        const separator = document.createElement('li');
        separator.classList.add('submenu-separator');
        submenuList.appendChild(separator);

        const addAccountItem = document.createElement('li');
        addAccountItem.classList.add('submenu-item');
        addAccountItem.classList.add('add-account-item');
        addAccountItem.setAttribute('role', 'menuitem');
        addAccountItem.setAttribute('tabindex', '0');
        addAccountItem.id = 'add-account-item';

        // **Updated: Add Account Content with Image on the Right**
        addAccountItem.innerHTML = `
            <div class="submenu-item-content add-account-item-content">
                <span class="submenu-item-title">Add Account</span>
                <img src="/images/icons/plus.png" alt="Add Account" class="submenu-item-image add-acount-icon">
            </div>
        `;

        // Add click event
        addAccountItem.addEventListener('click', () => {
            openAddAccountModal();
            hideSubmenu();
        });

        // Add keyboard accessibility
        addAccountItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log('Add Account clicked via keyboard');
                openAddAccountModal();
            }
        });

        submenuList.appendChild(addAccountItem);

        // Add event listeners to account items
        const accountItems = submenuList.querySelectorAll('.submenu-item');
        accountItems.forEach(item => {
            // Skip the "Add Account" and "Global" items
            if (item.id === 'add-account-item' || item.id === 'global-menu-item') return;

            // Click event
            item.addEventListener('click', () => {
                const accountId = item.dataset.accountId;
                const accountName = item.querySelector('.submenu-item-title').textContent;
                switchAccount(accountId, accountName);
            });

            // Keyboard accessibility (Enter and Space)
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const accountId = item.dataset.accountId;
                    const accountName = item.querySelector('.submenu-item-title').textContent;
                    switchAccount(accountId, accountName);
                }
            });
        });

        // Event listener for "Global" account
        const globalMenuItem = document.getElementById('global-menu-item');
        if (globalMenuItem) {
            globalMenuItem.addEventListener('click', () => {
                switchAccount('all', 'Global Account');
            });

            // Keyboard accessibility for Global account
            globalMenuItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    switchAccount('all', 'Global Account');
                }
            });
        }

        // Highlight the selected account initially
        highlightSelectedAccount(selectedAccountId);
    }

    /**
     * Highlights the selected account in the submenu.
     * @param {string} accountId - The ID of the account to highlight.
     */
    function highlightSelectedAccount(accountId) {
        // Remove 'selected' class from all submenu items
        const allSubmenuItems = submenuList.querySelectorAll('.submenu-item');
        allSubmenuItems.forEach(item => {
            item.classList.remove('selected');
        });

        // Add 'selected' class to the chosen submenu item
        if (accountId === 'all') {
            const globalItem = document.getElementById('global-menu-item');
            if (globalItem) {
                globalItem.classList.add('selected');
            }
        } else {
            const selectedItem = submenuList.querySelector(`.submenu-item[data-account-id="${accountId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
        }
    }

    /**
     * Switches the account by updating the UI.
     * @param {string} accountId - The ID of the account to switch to.
     * @param {string} accountName - The name of the account.
     */
    function switchAccount(accountId, accountName) {
        hideSubmenu();
    
        // Update the account name in the UI
        accountNameElement.textContent = accountName;
    
        // Update the account icon image
        const accountIconElement = document.querySelector('.account-icon');
        const selectedItem = submenuList.querySelector(`.submenu-item[data-account-id="${accountId}"]`);
    
        if (selectedItem) {
            const selectedImage = selectedItem.querySelector('.submenu-item-image');
            if (selectedImage && accountIconElement) {
                accountIconElement.src = selectedImage.src;
                accountIconElement.alt = accountName;
            }
        } else {
            // Fallback to default image if not found
            accountIconElement.src = '/images/icons/asset-allocation2.png';
            accountIconElement.alt = 'Global Account';
        }
    
        // Store the selected account in a cookie
        setCookie('selected_account', accountId, 7);
    
        // Highlight the selected account in the submenu
        highlightSelectedAccount(accountId);
    }

    /**
     * Opens the "Add Account" modal or redirects to the add account page.
     * Implement this function based on your application's requirements.
     */
    function openAddAccountModal() {
        // Example: Redirect to add account page
        // window.location.href = '/add-account';

        // Example: Open a modal (assuming you have a modal implementation)
        /*
        const modal = document.getElementById('add-account-modal');
        if (modal) {
            modal.classList.add('open');
        }
        */
        alert('Add Account functionality to be implemented.');
    }

    /**
     * Shows an error message within a specified container.
     * @param {HTMLElement} container - The DOM element to display the error message in.
     * @param {string} message - The error message to display.
     */
    function showError(container, message) {
        container.innerHTML = `
            <li class="submenu-item error">
                <div class="submenu-item-content">
                    <img src="path/to/error-icon.png" alt="Error" class="submenu-item-image">
                    <div class="submenu-item-text">
                        <span class="submenu-item-title">Error</span>
                        <span class="submenu-item-subtext">${message}</span>
                    </div>
                </div>
            </li>
        `;
    }

    /**
     * Hides the submenu.
     */
    function hideSubmenu() {
        isSubmenuVisible = false;
        submenu.classList.remove('show');
        portfolioOverview.setAttribute('aria-expanded', 'false');
    }

    /**
     * Event listener for toggling submenu
     */
    portfolioOverview.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the event from bubbling up
        toggleSubmenu();
    });

    /**
     * Event listener for keyboard navigation (Enter and Space)
     */
    portfolioOverview.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { // Enter or Space key
            e.preventDefault();
            toggleSubmenu();
        }
    });

    /**
     * Event listener to close submenu when clicking outside
     */
    document.addEventListener('click', (e) => {
        if (isSubmenuVisible && !submenu.contains(e.target) && !portfolioOverview.contains(e.target)) {
            hideSubmenu();
        }
    });

    /**
     * Event listener to close submenu with Escape key
     */
    document.addEventListener('keydown', (e) => {
        if (isSubmenuVisible && e.key === 'Escape') {
            hideSubmenu();
        }
    });

    /**
     * Initial load: set to Global Account or selected account
     */
    const selectedAccountId = getCookie('selected_account') || 'all';
    if (selectedAccountId) {
        // Fetch the accounts to get the actual account name
        (async () => {
            let accounts = await get_accounts(); // Ensure get_accounts() is defined and returns a Promise
            console.log("accounts -> ", accounts);
            
            // Parse accounts if it's a string
            if (typeof accounts === 'string') {
                try {
                    accounts = JSON.parse(accounts);
                } catch (error) {
                    console.error("Error parsing accounts JSON:", error);
                    accounts = null;
                }
            }
            
            if (Array.isArray(accounts) && accounts.length > 0) {
                const selectedAccount = accounts.find(acc => acc.account_id === selectedAccountId); // Use 'account_id'
                const accountName = selectedAccount ? selectedAccount.account_name : `Account ${selectedAccountId}`; // Use 'account_name'
                switchAccount(selectedAccountId, accountName);
            } else {
                console.warn("Selected account not found or accounts not an array. Falling back to Global Account.");
                switchAccount('all', 'Global Account');
            }
        })();
    } else {
        switchAccount('all', 'Global Account');
    }
});
