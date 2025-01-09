
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

async function get_balance_overview(account_id = 'all') {
    let credentials = getCookie("credentials");
    
    if (!credentials) {
        console.error("Credentials not found.");
        return null;
    }
    
    // Remove surrounding quotes if they exist
    credentials = credentials.replace(/^"(.*)"$/, '$1');

    // If account_id is 'global', set it to 'all'
    if (account_id === 'global') {
        account_id = 'all';
    }

    const url = `${exchangeAPI}/balance/overview/${account_id}`;
    const headers = {
        'Accept': 'application/json',
        'Authorization': credentials
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
        return data;

    } catch (error) {
        console.error("Error fetching account data:", error);
        return null;
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const portfolioOverview = document.querySelector('.portfolio-overview');
    const submenu = document.getElementById('portfolio-submenu');
    const submenuList = document.getElementById('portfolio-submenu-list');
    const accountNameElement = document.querySelector('.account-name');
    const pictureElement = document.querySelector('.account-icon');
    const assetTitle = document.getElementById('total-assets-title');
    
    const total_assets = document.getElementById('total-assets-value');
    const change24 = document.getElementById('change24');
    const change24_percentage = document.getElementById('change24_percentage');
    const child_account_balance = document.querySelector('.account-balance');

    let user_balance;
    


    /**
     * Toggles the visibility of the submenu.
     */
    let isSubmenuVisible = false;
    function toggleSubmenu() {
        if (isSubmenuVisible) {
            hideSubmenu();
        } else {
            showSubmenu();
        }
    }

    (async () => {
        const selectedAccountId = getCookie('selected_account') || 'all';
    
        // Fetch user balance overview
        user_balance = await get_balance_overview();
    
        if (selectedAccountId) {
            if (selectedAccountId === 'all') {
                // Portfolio content for "all"
                const change24Value = parseFloat(user_balance["24h_change"]);
                const change24Percent = parseFloat(user_balance["24h_change_percentage"]);
    
                total_assets.textContent = '$ ' + parseFloat(user_balance.total).toFixed(2);
                updateChange24(change24Value, change24Percent, user_balance.total);
    
            } else {
                // Ensure user_balance.accounts is defined and find the matching account
                const selectedAccount = user_balance.accounts?.find(
                    account => account.id === selectedAccountId
                );
    
                if (selectedAccount) {
                    // Portfolio content for specific account
                    const change24Value = parseFloat(selectedAccount["24h_change"]);
                    const change24Percent = parseFloat(selectedAccount["24h_change_percentage"]);
    
                    total_assets.textContent = '$ ' + parseFloat(selectedAccount.total).toFixed(2);
                    updateChange24(change24Value, change24Percent, user_balance.total);
    
                } else {
                    console.warn("Account not found for ID:", selectedAccountId);
                }
            }
    
            // Reusable function to update 24h change and percentage
            function updateChange24(change24Value, change24Percent, total_assets) {
                // Update 24h change value and style
                change24.textContent = '$ ' + change24Value.toFixed(2);
                change24.style.color = change24Value < 0 ? "red" : "green";
            
                // Update 24h change percentage and style
                change24_percentage.textContent = `${change24Percent.toFixed(2)}%`;
                change24_percentage.style.color = change24Percent < 0 ? "red" : "green";
            
                // Update account balance value dynamically
                const total_assets_text = '$ ' + parseFloat(total_assets).toFixed(2);
                const change_24_percentage = `${change24Percent.toFixed(2)}%`;
            
                // Clear and rebuild child_account_balance
                child_account_balance.innerHTML = ''; 
            
                const p = document.createElement('p');
                const totalText = document.createTextNode(total_assets_text + ' ');
            
                const span = document.createElement('span');
                span.className = change24Percent < 0 ? "account-balance-decreased" : "account-balance-increased";
                span.textContent = `(${change_24_percentage})`;
                span.style.color = change24Percent < 0 ? "red" : "green";
            
                p.appendChild(totalText);
                p.appendChild(span);
                child_account_balance.appendChild(p);
            }
            
        }
    })();
    
    

    /**
    * Initial load: set to Global Account or selected account
    */
    const selectedAccountId = getCookie('selected_account') || 'all';
    console.log(`Initial selected account ID: ${selectedAccountId}`);

    if (selectedAccountId) {
        // Fetch the accounts to get the actual account name
        (async () => {
            try {
                
                
                if (Array.isArray(accounts)) {
                    const selectedAccount = accounts.find(acc => acc.account_id === selectedAccountId);
                    console.log("selectedAccount ->", selectedAccount);
                    
                    if (selectedAccount) {
                        const accountName = selectedAccount.account_name || `Account ${selectedAccountId}`;
                        // Set the icon to specific account icon
                        pictureElement.src = '/images/icons/icon_account.png';
                        pictureElement.alt = accountName;
                        console.log(`Setting pictureElement to specific account icon: /images/icons/icon_account.png`);
                        assetTitle.textContent = `Total Account (usd)`;
                        switchAccount(selectedAccountId, accountName);

                    } else if (selectedAccountId === 'all') {
                        // Set the icon to global account icon
                        pictureElement.src = '/images/icons/asset-allocation2.png';
                        pictureElement.alt = 'Global Account';
                        console.log(`Setting pictureElement to global account icon: /images/icons/asset-allocation2.png`);
                        assetTitle.textContent = 'Total Portfolio (usd)';
                        switchAccount('all', 'Global Account');
                    } else {
                        // If the selected account ID doesn't match any account, fallback to global
                        pictureElement.src = '/images/icons/asset-allocation2.png';
                        pictureElement.alt = 'Global Account';
                        console.warn("Selected account ID not found. Falling back to Global Account.");
                        assetTitle.textContent = 'Total Portfolio (usd)';
                        switchAccount('all', 'Global Account');
                    }
                } else {
                    console.warn("Accounts data is not an array. Falling back to Global Account.");
                    // Set the icon to global account icon
                    pictureElement.src = '/images/icons/asset-allocation2.png';
                    pictureElement.alt = 'Global Account';
                    switchAccount('all', 'Global Account');
                }
            } catch (error) {
                console.error("Error fetching accounts on initial load:", error);
                showError(submenuList, "Failed to load accounts. Please try again.");
                // Optionally set to global account icon on error
                pictureElement.src = '/images/icons/asset-allocation2.png';
                pictureElement.alt = 'Global Account';
                switchAccount('all', 'Global Account');
            }
        })();
    } else {
        // If no account is selected, default to Global Account
        pictureElement.src = '/images/icons/asset-allocation2.png';
        pictureElement.alt = 'Global Account';
        switchAccount('all', 'Global Account');
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
        `;

        try {
            let accounts = await get_accounts(); 
            console.log("Fetched accounts:", accounts);
            
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
                populateSubmenu(accounts);
            } else if (accounts === null) {
                // Display an error message if fetching failed
                showError(submenuList, "Failed to load accounts. Please try again.");
            } else {
                // If no accounts, inform the user
                submenuList.innerHTML = `
                    <li class="submenu-item">
                        <div class="submenu-item-content">
                            <img src="/images/icons/nopee.png" alt="No Accounts" class="submenu-item-image">
                            <span class="submenu-item-title">No Accounts Available</span>
                        </div>
                    </li>
                    <li class="submenu-separator"></li>
                `;
                addAddAccountItem(); // Add "Add Account" option
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
        console.log('Submenu hidden');
    }

    /**
     * Populates the submenu with the list of accounts.
     * @param {Array} accounts - Array of account objects.
     */
    function populateSubmenu(accounts) {
        const selectedAccountId = getCookie('selected_account') || 'all';

        // Clear existing submenu items and add Global account first

        // console.log("populate submenu -> ", account)
        // const change24Percent = parseFloat(user_balance["24h_change_percentage"]);
        // const change24_color = change24Value < 0 ? "red" : "green";
        // const change24_text = `${change24Percent.toFixed(2)} %`;

        submenuList.innerHTML = `
            <li class="submenu-item ${selectedAccountId === 'all' ? 'selected' : ''}" id="global-menu-item" role="menuitem" tabindex="0">
                <div class="submenu-item-content">
                    <img src="/images/icons/asset-allocation2.png" alt="Global Account" class="submenu-item-image">
                    <div class="submenu-item-text">
                        <span class="submenu-item-title">Global Account</span>
                        <span class="submenu-item-subtext">$0.00 <span class="account-balance-increased">(+ 0.000%)</span></span>
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

        addAddAccountItem(); // Add "Add Account" option
    }

    /**
     * Adds the "Add Account" item to the submenu.
     */
    function addAddAccountItem() {
        const addAccountItem = document.createElement('li');
        addAccountItem.classList.add('submenu-item', 'add-account-item');
        addAccountItem.setAttribute('role', 'menuitem');
        addAccountItem.setAttribute('tabindex', '0');
        addAccountItem.id = 'add-account-item';

        // Add Account Content with Image on the Right
        addAccountItem.innerHTML = `
            <li class="submenu-separator"></li>
            <div class="submenu-item-content add-account-item-content">
                <span class="submenu-item-title">Add Account</span>
                <img src="/images/icons/plus.png" alt="Add Account" class="submenu-item-image add-account-icon">
            </div>
        `;

        // Click event to handle adding account
        addAccountItem.addEventListener('click', () => {
            openAddAccountModal();
            hideSubmenu(); // Close submenu after clicking
        });

        // Keyboard accessibility for Add Account
        addAccountItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log('Add Account clicked via keyboard');
                openAddAccountModal();
                hideSubmenu(); // Close submenu after clicking
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
    }

    /**
     * Switches the account by updating the UI.
     * @param {string} accountId - The ID of the account to switch to.
     * @param {string} accountName - The name of the account.
     */
    function switchAccount(accountId, accountName) {
        hideSubmenu();
        console.log(`Account switched to: ${accountName} (ID: ${accountId})`);

        // Updating the UI
        accountNameElement.textContent = accountName;
        const accountIconElement = document.querySelector('.account-icon');
        const assetTitle = document.querySelector('.total-assets-title');

        if (accountId === 'all') {
            assetTitle.textContent = 'Total Portfolio (usd)';
        }else{
            assetTitle.textContent = `Total Account (usd)`;
        }

        const selectedItem = submenuList.querySelector(`.submenu-item[data-account-id="${accountId}"]`);
    
        if (selectedItem) {
            const selectedImage = selectedItem.querySelector('.submenu-item-image');
            if (selectedImage && accountIconElement) {
                accountIconElement.src = selectedImage.src;
                accountIconElement.alt = accountName;
                console.log(`Account icon updated to: ${selectedImage.src}`);
            }
        } else {
            // Fallback to default image if not found
            accountIconElement.src = '/images/icons/asset-allocation2.png';
            accountIconElement.alt = 'Global Account';
            console.log('Fallback account icon used');
        }

        // Store the selected account in a cookie
        setCookie('selected_account', accountId, 7);
        console.log(`Selected account set to: ${accountId}`);

        // Highlight the selected account in the submenu
        highlightSelectedAccount(accountId);
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
                console.log('Global Account highlighted');
            }
        } else {
            const selectedItem = submenuList.querySelector(`.submenu-item[data-account-id="${accountId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
                console.log(`Account highlighted: ${accountId}`);
            }
        }
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
        addAddAccountItem(); // Ensure "Add Account" is still available after an error
    }

    /**
     * Sets a cookie.
     * @param {string} name - The name of the cookie.
     * @param {string} value - The value of the cookie.
     * @param {number} days - Number of days until the cookie expires.
     */
    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days*24*60*60*1000));
        const expires = "expires="+ d.toUTCString();
        document.cookie = `${name}=${value}; ${expires}; path=/`;
        console.log(`Cookie set: ${name}=${value}`);
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
            console.log('Submenu closed by clicking outside');
        }
    });

    /**
     * Event listener to close submenu with Escape key
     */
    document.addEventListener('keydown', (e) => {
        if (isSubmenuVisible && e.key === 'Escape') {
            hideSubmenu();
            console.log('Submenu closed by Escape key');
        }
    });

  
});