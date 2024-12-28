

async function get_accounts_data() {
    let credentials = getCookie("credentials");
    credentials.replace(/^"(.*)"$/, '$1');

    let accounts = getCookie("accounts");
    accounts.replace(/^"(.*)"$/, '$1');
    const accountsArray = JSON.parse(accounts.replace(/\\054/g, ','));
    console.log(credentials);

    console.log(accountsArray)

}


async function get_account_assets(credentials, account_id) {
    const url = exchangeAPI + `accounts/assets${account_id}`;
    const headers = {
        'Accept': 'application/json',
        "Authorization": credentials
    };

    

}

get_account_data();
