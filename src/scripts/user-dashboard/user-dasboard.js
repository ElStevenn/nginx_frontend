
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




async function get_started() {
    // Get started references
    const complete_register_box = document.getElementById('complete-register');
    const welcome_register = document.getElementById('welcome-register');
    const complete_register1 = document.getElementById('cmplt-reg-box-1');
    const complete_register2 = document.getElementById('cmplt-reg-box-2');
    const complete_register3 = document.getElementById('cmplt-reg-box-3');

    const progres_stage1 = document.getElementById('progress-stage-1');
    const progres_stage2 = document.getElementById('progress-stage-2');
    const progres_stage3 = document.getElementById('progress-stage-3');

    // Ensure userDataPromise is resolved
    if (!userDataPromise) {
        userDataPromise = get_header_data();
    }

    const userData = await userDataPromise;


    // Set different states for each register step
    if (userData.register_status === 'complete') {
        complete_register_box.style.display = 'none';
        welcome_register.style.display = 'none';
    } else if (userData.register_status === '1') {
        complete_register_box.style.display = 'block';
        complete_register1.classList.add('highlight'); 
        progres_stage1.classList.add('active');
        welcome_register.style.display = 'flex';
    } else if (userData.register_status === '2') {
        complete_register_box.style.display = 'block';
        complete_register2.classList.add('highlight'); 
        progres_stage2.classList.add('active');
        welcome_register.style.display = 'flex';
    } else if (userData.register_status === '3') {
        complete_register_box.style.display = 'block';
        complete_register3.classList.add('highlight'); 
        progres_stage3.classList.add('active');
        welcome_register.style.display = 'flex';
    }
}

function showToast(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function loadPositionsFromCookie() {
    const cookieVal = getCookie("account_positions");
    if (!cookieVal) return {};
    try {
        return JSON.parse(cookieVal);
    } catch(e) {
        console.warn("Could not parse account_positions cookie:", e);
        return {};
    }
}

function savePositionsToCookie(positions) {
    setCookie("account_positions", JSON.stringify(positions), 7);
}


function saveWidgetOrder() {
    const container = document.getElementById('linked-account-content');
    const items = container.querySelectorAll('.linked-account[data-account-id]');
    const idsInOrder = [];
    items.forEach(item => {
      idsInOrder.push(item.getAttribute('data-account-id'));
    });
    setCookie('widgetOrder', JSON.stringify(idsInOrder), 7);
}

function applyWidgetOrder() {
    const container = document.getElementById('linked-account-content');
    const storedOrder = getCookie('widgetOrder');
    if (!storedOrder) return;
    let ids = [];
    try {
        ids = JSON.parse(storedOrder);
    } catch(e) {
        console.warn("Could not parse stored widget order:", e);
        return;
    }
    ids.forEach(id => {
        const item = container.querySelector(`.linked-account[data-account-id="${id}"]`);
        if (item) container.appendChild(item);
    });
}

// DRAG & DROP LOGIC
let dragSrcEl = null;      
let placeholderEl = null;   
let dragSrcId = null;     


function handleDragStart(e) {
    dragSrcEl = this;
    dragSrcId = this.getAttribute('data-account-id');
    this.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrcId); 
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const container = document.getElementById('linked-account-content');
    const target = e.target.closest('.linked-account[data-account-id]');

    if (
      target &&
      target.parentNode === container &&
      target !== dragSrcEl &&
      target !== placeholderEl
    ) {
        container.insertBefore(placeholderEl, target);
    } else if (!target && container.lastElementChild !== placeholderEl) {
        container.appendChild(placeholderEl);
    }
}

function handleDragEnter(e) {
    e.preventDefault();
}

function handleDragLeave(e) {
    // not used
}


function handleDrop(e) {
    e.preventDefault();
    const container = document.getElementById('linked-account-content');
    if (placeholderEl && dragSrcEl) {
        container.insertBefore(dragSrcEl, placeholderEl);
    }
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    if (placeholderEl) {
      placeholderEl.remove();
      placeholderEl = null;
    }
    saveWidgetOrder();
}

function initDragAndDrop() {
    const container = document.getElementById('linked-account-content');
    const items = container.querySelectorAll('.linked-account[data-account-id]');

    items.forEach(item => {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });

    placeholderEl = document.createElement('div');
    placeholderEl.classList.add('placeholder');

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
}


/* 
   Attach drag events to a single .linked-account container.
   - The user must click on the .account-icon to begin dragging.
   - Once dragging, we do position:absolute on the .linked-account,
     and let the user move it anywhere in the viewport.
   - On mouse up, we store the final position into the cookie
     so it persists across refresh.
*/
function enableWidgetDragging(widget, accountId) {
    const accountIcon = widget.querySelector('.account-icon');
    if (!accountIcon) return;
  
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let positions = loadPositionsFromCookie();
  
    if (positions[accountId]) {
      widget.style.position = 'absolute';
      widget.style.top = positions[accountId].top;
      widget.style.left = positions[accountId].left;
    }
  
    accountIcon.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      widget.style.position = 'absolute';
      offsetX = e.clientX - widget.offsetLeft;
      offsetY = e.clientY - widget.offsetTop;
    });
  
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const newLeft = e.clientX - offsetX;
      const newTop  = e.clientY - offsetY;
      widget.style.left = newLeft + 'px';
      widget.style.top  = newTop  + 'px';
    });
  
    document.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      positions[accountId] = {
        top: widget.style.top,
        left: widget.style.left
      };
      savePositionsToCookie(positions);
    });
  }

  async function fetch_linked_accounts(accounts) {
    const linked_account_main_div = document.getElementById('linked-account-content');
    linked_account_main_div.innerHTML = '';
  
    if (!accounts || !Array.isArray(accounts)) {
        linked_account_main_div.innerHTML = '<p>No accounts found.</p>';
        return;
    }
  
    accounts.forEach(account => {
        if (!account.accounts) {
            console.warn("Skipping account because 'accounts' is undefined:", account);
            return;
        }
  
        const linked_account = document.createElement('div');
        linked_account.classList.add('linked-account');
        linked_account.setAttribute('data-account-id', account.id);
  
        const accountTypes = ['spot', 'margin', 'futures'];
        let accountsListHTML = '';
        accountTypes.forEach(type => {
            const rawVal = account.accounts[type];
            if (rawVal !== undefined && rawVal !== 0) {
                const val = Number(rawVal).toFixed(2);
                accountsListHTML += `<li><strong>${capitalizeFirstLetter(type)}</strong>: $${val}</li>`;
            }
        });
  
        linked_account.innerHTML = `
          <div class="linked-account-header">
            <div class="account-info">
              <img src="/images/icons/carousel-navigation-control.png" class="account-icon" alt="Navigation">
              <div class="account-info-text">
                <h3>${account.account_name || 'N/A'}</h3>
                <p>${capitalizeFirstLetter(account.exchange || '')}</p>
              </div>
            </div>
            <button title="Transfer assets across ${account.account_name || 'N/A'} account" class="transfer-btn">
              <img src="/images/icons/arrow-each-other.png" alt="Arrows icon">
            </button>
            <button title="See the details of your account" class="details-btn">
              <img src="/images/icons/eye.png" alt="Eye Icon">
            </button>
            <button  title="Delete your linked account" class="disconnect-btn"
                    onclick="delete_account(event, '${account.id}', 
                     '${(account.account_name||'').replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">
              <img src="/images/icons/trash-can.png" alt="Trash Icon">
            </button>
          </div>
          
          <div class="linked-account-body">
            <div class="linked-account-chart">
              <canvas id="accountChart-${account.id}"></canvas>
            </div>
            <div class="linked-account-data">
              <h3>Overview</h3>
              <ul>
                <li><strong>Total Balance</strong>: $${Number(account.total || 0).toFixed(2)}</li>
                <li><strong>24h Change</strong>: ${Number(account['24h_change_percentage'] || 0).toFixed(2)}%</li>
              </ul>
              <h3>Accounts</h3>
              <ul>${accountsListHTML}</ul>
            </div>
          </div>
        `;
  
        linked_account_main_div.appendChild(linked_account);
  
        const spotVal    = account.accounts.spot    || 0;
        const marginVal  = account.accounts.margin  || 0;
        const futuresVal = account.accounts.futures || 0;
        createDoughnutChart(`accountChart-${account.id}`, [spotVal, marginVal, futuresVal]);
    });
  
    // The "Connect Exchange" card
    const connectAccountCard = document.createElement('div');
    connectAccountCard.classList.add('linked-account', 'connect-account-card');
    connectAccountCard.innerHTML = `
      <button class="connect-exchange-btn" onclick="openAddAccountModal()">
          <i class="fas fa-plus"></i> Connect an Exchange
          <img src="/images/icons/plus.png" alt="Plus Icon">
      </button>
    `;
    linked_account_main_div.appendChild(connectAccountCard);

    applyWidgetOrder();
    initDragAndDrop();
}

// Helper function to capitalize the first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function createDoughnutChart(canvasId, dataValues) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: dataValues,
                backgroundColor: ['#f2a900', '#3c3c3d', '#00ffcc'],
                borderColor: '#141414',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}



async function fetch_active_bots() {

}

/**
 * Opens the delete modal and, on confirmation, sends a DELETE request.
 * After successful deletion, apply a fade-out class to the account card,
 * then remove it from DOM after 0.5s, and finally re-fetch all accounts.
 */
async function delete_account(event, account_id, account_name) {
    event.preventDefault(); 
    const deleteAccountDiv = document.getElementById('delete-account');
    const messageElement    = document.getElementById('delete-account-message');
    const confirmBtn        = document.getElementById('confirm-delete-btn');
    const cancelBtn         = document.getElementById('cancel-delete-btn');

    messageElement.innerHTML = `
      Are you sure you want to delete the account
      <strong>${account_name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>?
    `;
    deleteAccountDiv.style.display = 'block';

    confirmBtn.onclick = async () => {
        try {
            // 1) Delete account on the server
            await API_delete_account(account_id);
            
            // 2) Re-fetch from server to get the new updated list
            const updatedAccounts = await get_accounts();
            
            // 3) Store the updated list in the cookie so future loads remain correct
            setCookie("accounts", JSON.stringify(updatedAccounts), 7);

            // 4) Fade out only the card for the deleted account
            const card = document.querySelector(`.linked-account[data-account-id="${account_id}"]`);
            if (card) {
                card.classList.add('removing'); // triggers 0.5s fade-out
                card.addEventListener('transitionend', function onTransitionEnd(e) {
                    if (e.target === card) {
                        card.removeEventListener('transitionend', onTransitionEnd);
                        card.remove(); // physically remove from the DOM

                        // 5) Finally, re-draw accounts if you want a full refresh
                        //    so the UI always matches what's on the server
                        fetch_linked_accounts(updatedAccounts || []);
                    }
                });
            } else {
                // Edge case: if there's no matching card, just refresh everything
                fetch_linked_accounts(updatedAccounts || []);
            }

            showToast('Account deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting account:', error);
            showToast('Failed to delete account', 'error');
        } finally {
            deleteAccountDiv.style.display = 'none';
        }
    };

    cancelBtn.onclick = () => {
        deleteAccountDiv.style.display = 'none';
    };
}


// Add global listeners to close modal on outside click / Esc
document.addEventListener('DOMContentLoaded', () => {
    const deleteAccountDiv = document.getElementById('delete-account');

    deleteAccountDiv.addEventListener('click', (e) => {
        if (e.target === deleteAccountDiv) {
            deleteAccountDiv.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            deleteAccountDiv.style.display = 'none';
        }
    });
});

async function API_delete_account(account_id) {
    let credentials = getCookie("credentials");
    if (!credentials) throw new Error("Credentials not found.");
    credentials = credentials.replace(/^"(.*)"$/, '$1');

    const url = globalAPI + `/accounts/${account_id}`;
    const result = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': credentials
        }
    });

    if (result.status === 404 || result.status === 401) {
        throw new Error('Not Found or Unauthorized');
    } else if (result.status === 500) {
        throw new Error('Internal Server Error');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Grab main content and a loading overlay restricted to that area
    const mainContent = document.querySelector('.main-content');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Hide the main content initially
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    // Show the overlay if present
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }

    console.log("user data -> ",userDataPromise)

    // DOM references
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

    let user_balance = null;
    let isSubmenuVisible = false;

    // We'll store the accounts from the API in this variable (fetched only once).
    let accountsGlobal = null;

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
     * Main initialization function: fetch data once, then update UI.
     */
    async function initPage() {
        const selectedAccountId = getCookie('selected_account') || 'all';

        // 1) Fetch the overall balance (which also includes user_balance.accounts)
        user_balance = await get_balance_overview();

        // 2) Update UI for the selected account's balance
        if (selectedAccountId && user_balance) {
            if (selectedAccountId === 'all') {
                const change24Value = parseFloat(user_balance["24h_change"]);
                const change24Percent = parseFloat(user_balance["24h_change_percentage"]);
                total_assets.textContent = '$ ' + parseFloat(user_balance.total).toFixed(2);
                updateChange24(change24Value, change24Percent, user_balance.total);
            } else {
                // find the account
                const selectedAccount = user_balance.accounts?.find(acc => acc.id == selectedAccountId);
                if (selectedAccount) {
                    const change24Value = parseFloat(selectedAccount["24h_change"]);
                    const change24Percent = parseFloat(selectedAccount["24h_change_percentage"]);
                    total_assets.textContent = '$ ' + parseFloat(selectedAccount.total).toFixed(2);
                    updateChange24(change24Value, change24Percent, selectedAccount.total);
                } else {
                    console.warn("Account not found for ID:", selectedAccountId);
                }
            }

            // Update the linked accounts
            await fetch_linked_accounts(user_balance.accounts);
        }

        // 3) Fetch all accounts only once
        try {
            accountsGlobal = await get_accounts();
        } catch (error) {
            console.error("Error fetching accounts:", error);
            accountsGlobal = null; 
        }

        // 4) Decide which icon/name to show
        if (selectedAccountId) {
            handleSelectedAccountUI(selectedAccountId);
        } else {
            // Default to Global if none selected
            pictureElement.src = '/images/icons/asset-allocation2.png';
            pictureElement.alt = 'Global Account';
            switchAccount('all', 'Global Account');
        }

        // 5) Hide loading overlay, show main content
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        if (mainContent) {
            mainContent.style.display = 'block';
        }

        // Check if user is registered
        await get_started();
    }

    /**
     * Adjusts the UI for the selected account using accountsGlobal
     * (purely for setting the icon + name).
     */
    function handleSelectedAccountUI(selectedAccountId) {
        try {
            let localAccounts = accountsGlobal;
            if (typeof localAccounts === 'string') {
                try {
                    localAccounts = JSON.parse(localAccounts);
                } catch (error) {
                    console.error("Error parsing accounts JSON:", error);
                    localAccounts = null;
                }
            }

            if (Array.isArray(localAccounts)) {
                const selectedAccount = localAccounts.find(acc => acc.account_id === selectedAccountId);
                if (selectedAccount) {
                    // We found the account in the list
                    const accountName = selectedAccount.account_name || `Account ${selectedAccountId}`;
                    pictureElement.src = '/images/icons/icon_account.png';
                    pictureElement.alt = accountName;
                    assetTitle.textContent = `Total Account (usd)`;
                    switchAccount(selectedAccountId, accountName);
                } else if (selectedAccountId === 'all') {
                    pictureElement.src = '/images/icons/asset-allocation2.png';
                    pictureElement.alt = 'Global Account';
                    assetTitle.textContent = 'Total Portfolio (usd)';
                    switchAccount('all', 'Global Account');
                } else {
                    // The selected account ID doesn't match anything
                    pictureElement.src = '/images/icons/asset-allocation2.png';
                    pictureElement.alt = 'Global Account';
                    console.warn("Selected account ID not found. Falling back to Global.");
                    assetTitle.textContent = 'Total Portfolio (usd)';
                    switchAccount('all', 'Global Account');
                }
            } else {
                console.warn("Accounts data is not an array. Falling back to Global Account.");
                pictureElement.src = '/images/icons/asset-allocation2.png';
                pictureElement.alt = 'Global Account';
                switchAccount('all', 'Global Account');
            }
        } catch (error) {
            console.error("Error handling selected account UI:", error);
            showError(submenuList, "Failed to load accounts. Please try again.");
            pictureElement.src = '/images/icons/asset-allocation2.png';
            pictureElement.alt = 'Global Account';
            switchAccount('all', 'Global Account');
        }
    }

    /**
     * Updates the 24h change/percentage text and styles in the UI.
     */
    function updateChange24(change24Value, change24Percent, total_assets_param) {
        change24.textContent = '$ ' + change24Value.toFixed(2);
        change24.style.color = change24Value < 0 ? "red" : "#71ef71";

        change24_percentage.textContent = `${change24Percent.toFixed(2)}%`;
        change24_percentage.style.color = change24Percent < 0 ? "red" : "#71ef71";

        const total_assets_text = '$ ' + parseFloat(total_assets_param).toFixed(2);
        const change_24_percentage = `${change24Percent.toFixed(2)}%`;

        child_account_balance.innerHTML = '';
        const p = document.createElement('p');
        const totalText = document.createTextNode(total_assets_text + ' ');

        const span = document.createElement('span');
        span.className = (change24Percent < 0) ? "account-balance-decreased" : "account-balance-increased";
        span.textContent = `(${change_24_percentage})`;
        span.style.color = (change24Percent < 0) ? "red" : "#71ef71";

        p.appendChild(totalText);
        p.appendChild(span);
        child_account_balance.appendChild(p);
    }

    /**
     * Shows the submenu (if hidden) and populates it with accounts.
     */
    async function showSubmenu() {
        isSubmenuVisible = true;
        submenu.classList.add('show');
        portfolioOverview.setAttribute('aria-expanded', 'true');

        // Temporary loading state
        submenuList.innerHTML = `
            <li class="submenu-item" id="loading-item">
                <div class="submenu-item-content">
                    <img src="/images/icons/icon_account.png" alt="Loading" class="submenu-item-image">
                    <div class="submenu-item-text">
                        <span class="submenu-item-title">Loading...</span>
                        <span class="submenu-item-subtext">Please wait</span>
                    </div>
                </div>
            </li>
            <li class="submenu-separator"></li>
        `;

        try {
            let localAccounts = accountsGlobal;
            if (typeof localAccounts === 'string') {
                try {
                    localAccounts = JSON.parse(localAccounts);
                } catch (error) {
                    console.error("Error parsing accounts JSON:", error);
                    localAccounts = null;
                }
            }

            if (Array.isArray(localAccounts) && localAccounts.length > 0) {
                populateSubmenu(localAccounts);
            } else if (localAccounts === null) {
                showError(submenuList, "Failed to load accounts. Please try again.");
            } else {
                // If no accounts
                submenuList.innerHTML = `
                    <li class="submenu-item">
                        <div class="submenu-item-content">
                            <img src="/images/icons/nopee.png" alt="No Accounts" class="submenu-item-image">
                            <span class="submenu-item-title">No Accounts Available</span>
                        </div>
                    </li>
                    <li class="submenu-separator"></li>
                `;
                addAddAccountItem();
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
     * Populates the submenu with the full list of accounts, using actual balances
     * from user_balance (for both "Global" and each account).
     */
    function populateSubmenu(accounts) {
        const selectedAccountId = getCookie('selected_account') || 'all';

        // 1) Build the Global account item with real data from user_balance if available
        let globalBalance = 0.0;
        let globalChange = 0.0;
        let globalChangePct = 0.0;
        if (user_balance) {
            globalBalance   = parseFloat(user_balance.total || 0);
            globalChange    = parseFloat(user_balance["24h_change"] || 0);
            globalChangePct = parseFloat(user_balance["24h_change_percentage"] || 0);
        }

        // color
        const globalChangeColor = (globalChange < 0) ? 'red' : '#71ef71';
        // build subtext for global
        const globalSubtext = `$${globalBalance.toFixed(2)} <span style="color:${globalChangeColor}" class="${
          globalChange < 0 ? 'account-balance-decreased' : 'account-balance-increased'
        }">(${globalChangePct.toFixed(2)}%)</span>`;

        // Start from scratch
        submenuList.innerHTML = `
            <li class="submenu-item ${selectedAccountId === 'all' ? 'selected' : ''}" 
                id="global-menu-item" role="menuitem" tabindex="0">
                <div class="submenu-item-content">
                    <img src="/images/icons/asset-allocation2.png" alt="Global Account" class="submenu-item-image">
                    <div class="submenu-item-text">
                        <span class="submenu-item-title">Global Account</span>
                        <span class="submenu-item-subtext">${globalSubtext}</span>
                    </div>
                </div>
            </li>
        `;

        // 2) For each real account, show actual total and 24h%
        accounts.forEach(account => {
            const isSelected = (account.account_id === selectedAccountId);

            // If we have user_balance, find the matching account data in user_balance.accounts
            let thisAccountData = null;
            if (user_balance && Array.isArray(user_balance.accounts)) {
                thisAccountData = user_balance.accounts.find(acc => acc.id == account.account_id);
            }

            let accountBalance = 0.0;
            let accountChange  = 0.0;
            let accountChangePct = 0.0;

            if (thisAccountData) {
                accountBalance   = parseFloat(thisAccountData.total || 0);
                accountChange    = parseFloat(thisAccountData["24h_change"] || 0);
                accountChangePct = parseFloat(thisAccountData["24h_change_percentage"] || 0);
            }

            const changeColor = (accountChange < 0) ? 'red' : '#71ef71';
            const subtextHTML = `$${accountBalance.toFixed(2)} <span style="color:${changeColor}" class="${
              accountChange < 0 ? 'account-balance-decreased' : 'account-balance-increased'
            }">(${accountChangePct.toFixed(2)}%)</span>`;

            // Build the list item
            const li = document.createElement('li');
            li.classList.add('submenu-item');
            if (isSelected) {
                li.classList.add('selected');
            }
            li.dataset.accountId = account.account_id;

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('submenu-item-content');

            const img = document.createElement('img');
            img.classList.add('submenu-item-image');
            img.src = account.image_url || '/images/icons/icon_account.png';
            img.alt = account.account_name || `Account ${account.account_id}`;

            const textDiv = document.createElement('div');
            textDiv.classList.add('submenu-item-text');

            const titleSpan = document.createElement('span');
            titleSpan.classList.add('submenu-item-title');
            titleSpan.textContent = account.account_name || `Account ${account.account_id}`;

            const subtextSpan = document.createElement('span');
            subtextSpan.classList.add('submenu-item-subtext');
            subtextSpan.innerHTML = subtextHTML;

            textDiv.appendChild(titleSpan);
            textDiv.appendChild(subtextSpan);
            contentDiv.appendChild(img);
            contentDiv.appendChild(textDiv);
            li.appendChild(contentDiv);

            submenuList.appendChild(li);
        });

        // 3) Add a separator, then "Add Account"
        const separator = document.createElement('li');
        separator.classList.add('submenu-separator');
        submenuList.appendChild(separator);

        addAddAccountItem();
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

        addAccountItem.innerHTML = `
            <li class="submenu-separator"></li>
            <div class="submenu-item-content add-account-item-content">
                <span class="submenu-item-title">Connect an Exchanget</span>
                <img src="/images/icons/add.png" alt="Connect an Exchange" class="submenu-item-image add-account-icon">
            </div>
        `;

        addAccountItem.addEventListener('click', () => {
            openAddAccountModal();
            hideSubmenu();
        });

        addAccountItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openAddAccountModal();
                hideSubmenu();
            }
        });

        submenuList.appendChild(addAccountItem);

        // Now attach the click/keydown to each real account item
        const accountItems = submenuList.querySelectorAll('.submenu-item');
        accountItems.forEach(item => {
            // Skip "Connect an Exchange" and "Global"
            if (item.id === 'add-account-item' || item.id === 'global-menu-item') return;

            item.addEventListener('click', () => {
                const accountId = item.dataset.accountId;
                const accountName = item.querySelector('.submenu-item-title').textContent;
                switchAccount(accountId, accountName);
            });

            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const accountId = item.dataset.accountId;
                    const accountName = item.querySelector('.submenu-item-title').textContent;
                    switchAccount(accountId, accountName);
                }
            });
        });

        // Handle the Global account item
        const globalMenuItem = document.getElementById('global-menu-item');
        if (globalMenuItem) {
            globalMenuItem.addEventListener('click', () => {
                switchAccount('all', 'Global Account');
            });
            globalMenuItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    switchAccount('all', 'Global Account');
                }
            });
        }
    }

    /**
     * Switches the account, updates the UI, and updates displayed balances.
     * => This is where we forcibly close the submenu by calling hideSubmenu().
     */
    function switchAccount(accountId, accountName) {
        // Force submenu closed
        hideSubmenu();

        // Update the UI
        accountNameElement.textContent = accountName;
        if (accountId === 'all') {
            assetTitle.textContent = 'Total Portfolio (usd)';
            pictureElement.src = '/images/icons/asset-allocation2.png';
            pictureElement.alt = 'Global Account';

            // Update the displayed data from the global (all) data in user_balance
            if (user_balance) {
                const ch24Value = parseFloat(user_balance["24h_change"] || 0);
                const ch24Percent = parseFloat(user_balance["24h_change_percentage"] || 0);
                const totalVal = parseFloat(user_balance.total || 0);

                // Update main area
                total_assets.textContent = '$ ' + totalVal.toFixed(2);
                updateChange24(ch24Value, ch24Percent, totalVal);
            }
        } else {
            assetTitle.textContent = 'Total Account (usd)';

            // If we can find the selected item in the submenu, update the icon
            const selectedItem = submenuList.querySelector(`.submenu-item[data-account-id="${accountId}"]`);
            if (selectedItem) {
                const selectedImage = selectedItem.querySelector('.submenu-item-image');
                if (selectedImage && pictureElement) {
                    pictureElement.src = selectedImage.src;
                    pictureElement.alt = accountName;
                }
            }

            // If user_balance is loaded, find the data for this account
            if (user_balance && Array.isArray(user_balance.accounts)) {
                const selectedAcc = user_balance.accounts.find(acc => acc.id == accountId);
                if (selectedAcc) {
                    const ch24Value = parseFloat(selectedAcc["24h_change"] || 0);
                    const ch24Percent = parseFloat(selectedAcc["24h_change_percentage"] || 0);
                    const totalVal = parseFloat(selectedAcc.total || 0);

                    // Update main area
                    total_assets.textContent = '$ ' + totalVal.toFixed(2);
                    updateChange24(ch24Value, ch24Percent, totalVal);
                } else {
                    console.warn(`switchAccount: Could not find account data for ID ${accountId}`);
                }
            }
        }

        // Store the selected account in a cookie (7 days)
        setCookie('selected_account', accountId, 7);

        // Highlight in submenu
        highlightSelectedAccount(accountId);
    }

    /**
     * Highlights the chosen account in the submenu.
     */
    function highlightSelectedAccount(accountId) {
        const allSubmenuItems = submenuList.querySelectorAll('.submenu-item');
        allSubmenuItems.forEach(item => {
            item.classList.remove('selected');
        });

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

    function openAddAccountModal() {
        window.open(
            `/settings/set_credentials`,
            `tinyWindow_${Date.now()}`,
            'width=700,height=700,top=100,left=200'
        );
    }


    function showError(container, message) {
        container.innerHTML = `
            <li class="submenu-item error">
                <div class="submenu-item-content">
                    <img src="/images/icons/close_red.png" alt="Error" class="submenu-item-image">
                    <div class="submenu-item-text">
                        <span class="submenu-item-title">Error</span>
                        <span class="submenu-item-subtext">${message}</span>
                    </div>
                </div>
            </li>
        `;
        addAddAccountItem(); 
    }





    /**
     * Sets a cookie.
     */
    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days*24*60*60*1000));
        const expires = "expires="+ d.toUTCString();
        document.cookie = `${name}=${value}; ${expires}; path=/`;
    }

    // Toggling/hiding submenu
    portfolioOverview.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSubmenu();
    });

    portfolioOverview.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSubmenu();
        }
    });

    document.addEventListener('click', (e) => {
        if (isSubmenuVisible && !submenu.contains(e.target) && !portfolioOverview.contains(e.target)) {
            hideSubmenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (isSubmenuVisible && e.key === 'Escape') {
            hideSubmenu();
        }
    });

    

    // Initialize page (calls get_accounts once)
    initPage();
});



