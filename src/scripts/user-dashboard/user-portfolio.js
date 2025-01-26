/********************************************************
  user-portfolio.js
  A more "made-up" version with random data for Connect Exchange
********************************************************/

/** Sample Data: A few "pre-connected" exchanges. */
let EXCHANGES = [
    {
      id: 101,
      name: "Binance",
      balanceUsd: 58900,
      updatedAt: "2025-02-10",
      assets: [
        { asset: "BTC", amount: 1.2, valueUsd: 35000, percentChange24h: 3.5 },
        { asset: "ETH", amount: 12, valueUsd: 22000, percentChange24h: -0.4 },
        { asset: "BNB", amount: 50, valueUsd: 1900, percentChange24h: 1.2 },
      ],
    },
    {
      id: 202,
      name: "Coinbase",
      balanceUsd: 28000,
      updatedAt: "2025-02-09",
      assets: [
        { asset: "SOL", amount: 120, valueUsd: 3000, percentChange24h: 5.1 },
        { asset: "BTC", amount: 0.5, valueUsd: 15000, percentChange24h: 2.2 },
        { asset: "ADA", amount: 500, valueUsd: 1000, percentChange24h: 0.8 },
      ],
    },
  ];
  
  /** HTML references */
  const mainContent        = document.getElementById("main-content");
  const exchangesList      = document.getElementById("exchangesList");
  const assetsTableBody    = document.getElementById("assetsTableBody");
  const totalValueEl       = document.getElementById("totalValue");
  const percentChangeEl    = document.getElementById("percentChange");
  const activeExchangesEl  = document.getElementById("activeExchanges");
  const topHoldingEl       = document.getElementById("topHolding");
  const topHoldingValueEl  = document.getElementById("topHoldingValue");
  const bestPerformerEl    = document.getElementById("bestPerformer");
  
  // For "Connect Exchange" button
  const connectExchangeBtn = document.getElementById("connectExchangeBtn");
  
  // Chart references
  let distributionChartRef = null;
  let profitLossChartRef   = null;
  
  document.addEventListener("DOMContentLoaded", () => {
    renderExchanges();
    renderAllAssets();
    updatePortfolioStats();
    initDistributionChart();
    initProfitLossChart();
    initSorting();
  
    // Connect Exchange -> add random data
    if (connectExchangeBtn) {
      connectExchangeBtn.addEventListener("click", connectRandomExchange);
    }
  });
  
  /** RENDER EXCHANGES */
  function renderExchanges() {
    if (!exchangesList) return;
    exchangesList.innerHTML = "";
  
    EXCHANGES.forEach((exch) => {
      const div = document.createElement("div");
      div.className = "exchange-card";
      div.innerHTML = `
        <div class="exchange-info">
          <h4>${exch.name}</h4>
          <p>Balance: $${exch.balanceUsd.toLocaleString()}</p>
          <p>Last Update: ${exch.updatedAt}</p>
        </div>
        <button class="remove-exchange-btn" onclick="removeExchange(${exch.id})">
          Remove
        </button>
      `;
      exchangesList.appendChild(div);
    });
  }
  
  /** REMOVE EXCHANGE */
  function removeExchange(id) {
    EXCHANGES = EXCHANGES.filter((ex) => ex.id !== id);
    renderExchanges();
    renderAllAssets();
    updatePortfolioStats();
    updateDistributionChart();
  }
  
  /** RENDER ASSETS TABLE */
  function renderAllAssets() {
    if (!assetsTableBody) return;
    assetsTableBody.innerHTML = "";
  
    const allAssets = EXCHANGES.flatMap((ex) =>
      ex.assets.map((a) => ({
        asset: a.asset,
        amount: a.amount,
        valueUsd: a.valueUsd,
        exchange: ex.name,
        percentChange24h: a.percentChange24h,
        detailString: `From ${ex.name}, last updated on ${ex.updatedAt}.`,
      }))
    );
  
    allAssets.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.asset}</td>
        <td>${row.amount}</td>
        <td>$${row.valueUsd.toLocaleString()}</td>
        <td>${row.exchange}</td>
        <td class="${row.percentChange24h >= 0 ? 'positive' : 'negative'}">
          ${row.percentChange24h.toFixed(2)}%
        </td>
        <td>
          <button class="details-btn" onclick="toggleDetails(this)">Details</button>
          <div class="asset-details">${row.detailString}</div>
        </td>
      `;
      assetsTableBody.appendChild(tr);
    });
  }
  
  /** Toggle hidden details */
  function toggleDetails(btn) {
    const details = btn.parentElement.querySelector(".asset-details");
    details.style.display = (details.style.display === "block") ? "none" : "block";
  }
  
  /** PORTFOLIO STATS */
  function updatePortfolioStats() {
    // total
    let total = 0;
    EXCHANGES.forEach((ex) => total += ex.balanceUsd);
    totalValueEl.textContent = `$${total.toLocaleString()}`;
  
    // active exchanges
    activeExchangesEl.textContent = EXCHANGES.length;
  
    // top holding
    const allAssets = [];
    EXCHANGES.forEach((ex) => {
      ex.assets.forEach((a) => allAssets.push(a));
    });
    allAssets.sort((a, b) => b.valueUsd - a.valueUsd);
    if (allAssets.length > 0) {
      topHoldingEl.textContent = allAssets[0].asset;
      topHoldingValueEl.textContent = `$${allAssets[0].valueUsd.toLocaleString()}`;
    } else {
      topHoldingEl.textContent = "--";
      topHoldingValueEl.textContent = "";
    }
  
    // 24h avg + best performer
    let sumChange = 0;
    let count = 0;
    let best = { asset: null, change: -9999 };
    EXCHANGES.forEach((ex) => {
      ex.assets.forEach((a) => {
        sumChange += a.percentChange24h;
        count++;
        if (a.percentChange24h > best.change) {
          best = { asset: a.asset, change: a.percentChange24h };
        }
      });
    });
    const avg = (count === 0) ? 0 : (sumChange / count);
    percentChangeEl.textContent = avg.toFixed(2) + "%";
    bestPerformerEl.textContent = best.asset 
      ? `Best: ${best.asset} (${best.change.toFixed(2)}%)`
      : "";
  }
  
  /** DISTRIBUTION CHART */
  function initDistributionChart() {
    const ctx = document.getElementById("distributionChart").getContext("2d");
    distributionChartRef = new Chart(ctx, {
      type: "doughnut",
      data: getDistributionData(),
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#ccc",
            },
          },
        },
      },
    });
  }
  function getDistributionData() {
    // sum by asset
    let assetMap = {};
    EXCHANGES.forEach((ex) => {
      ex.assets.forEach((a) => {
        assetMap[a.asset] = (assetMap[a.asset] || 0) + a.valueUsd;
      });
    });
    const labels = Object.keys(assetMap);
    const data = Object.values(assetMap);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#f2a900", "#3c3c3d", "#f3ba2f", "#0033ad",
            "#00ffcc", "#b5179e", "#d32f2f", "#9c27b0",
          ],
          borderColor: "#222",
          borderWidth: 1,
        },
      ],
    };
  }
  function updateDistributionChart() {
    if (!distributionChartRef) return;
    distributionChartRef.data = getDistributionData();
    distributionChartRef.update();
  }
  
  /** PROFIT/LOSS CHART (Static Fake Data) */
  function initProfitLossChart() {
    const ctx = document.getElementById("profitLossChart").getContext("2d");
    // example: last 7 days
    const labels = ["Day -6", "Day -5", "Day -4", "Day -3", "Day -2", "Day -1", "Today"];
    // random series
    const dataSet = [700, 950, 1100, 1300, 1250, 1500, 1600];
  
    profitLossChartRef = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Profit/Loss (USD)",
            data: dataSet,
            borderColor: "#ff75b5",
            backgroundColor: "rgba(255, 117, 181, 0.2)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            ticks: { color: "#ccc" },
            grid: { color: "#555" },
          },
          y: {
            ticks: { color: "#ccc" },
            grid: { color: "#555" },
          },
        },
        plugins: {
          legend: {
            labels: { color: "#ccc" },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
      },
    });
  }
  
  /** SORT TABLE HEADERS */
  function initSorting() {
    const headers = document.querySelectorAll(".assets-table thead th[data-sort]");
    headers.forEach((th) => {
      th.addEventListener("click", () => {
        sortTable(th.getAttribute("data-sort"));
      });
    });
  }
  function sortTable(sortKey) {
    // flatten assets
    const allRows = EXCHANGES.flatMap((ex) =>
      ex.assets.map((a) => ({
        asset: a.asset,
        amount: a.amount,
        valueUsd: a.valueUsd,
        exchange: ex.name,
        percentChange24h: a.percentChange24h,
        detailString: `From ${ex.name}, last updated on ${ex.updatedAt}.`,
      }))
    );
    // sort logic (descending for numeric, alpha for strings)
    allRows.sort((a, b) => {
      if (typeof a[sortKey] === "string") {
        return a[sortKey].localeCompare(b[sortKey]);
      } else {
        return b[sortKey] - a[sortKey];
      }
    });
    // re-render
    assetsTableBody.innerHTML = "";
    allRows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.asset}</td>
        <td>${row.amount}</td>
        <td>$${row.valueUsd.toLocaleString()}</td>
        <td>${row.exchange}</td>
        <td class="${row.percentChange24h >= 0 ? 'positive' : 'negative'}">
          ${row.percentChange24h.toFixed(2)}%
        </td>
        <td>
          <button class="details-btn" onclick="toggleDetails(this)">Details</button>
          <div class="asset-details">${row.detailString}</div>
        </td>
      `;
      assetsTableBody.appendChild(tr);
    });
  }
  
  /** CONNECT EXCHANGE: Just add random data for demonstration */
  function connectRandomExchange() {
    const randomExchanges = [
      {
        name: "Kraken",
        assets: [
          { asset: "BTC", amount: 0.2, valueUsd: 6800, percentChange24h: 1.5 },
          { asset: "ETH", amount: 2, valueUsd: 4000, percentChange24h: 2.1 },
        ],
      },
      {
        name: "KuCoin",
        assets: [
          { asset: "XRP", amount: 300, valueUsd: 180, percentChange24h: -1.2 },
          { asset: "DOT", amount: 50, valueUsd: 600, percentChange24h: 4.5 },
        ],
      },
      {
        name: "eToro",
        assets: [
          { asset: "DOGE", amount: 1000, valueUsd: 120, percentChange24h: 10.2 },
          { asset: "MATIC", amount: 200, valueUsd: 400, percentChange24h: 1.3 },
        ],
      },
      {
        name: "Bybit",
        assets: [
          { asset: "SHIB", amount: 1000000, valueUsd: 150, percentChange24h: 2.2 },
          { asset: "LINK", amount: 20, valueUsd: 320, percentChange24h: 0.5 },
        ],
      },
    ];
    // pick random
    const randomPick = randomExchanges[Math.floor(Math.random() * randomExchanges.length)];
    const randomBalance = randomPick.assets.reduce((acc, cur) => acc + cur.valueUsd, 0);
  
    const newExchange = {
      id: Date.now(),
      name: randomPick.name,
      balanceUsd: randomBalance,
      updatedAt: new Date().toISOString().slice(0, 10),
      assets: randomPick.assets,
    };
  
    EXCHANGES.push(newExchange);
    renderExchanges();
    renderAllAssets();
    updatePortfolioStats();
    updateDistributionChart();
  }
  