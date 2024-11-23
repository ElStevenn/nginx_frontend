# Trade Visionary - Frontend

Welcome to the frontend repository for **Trade Visionary**, a platform designed for traders and investors to manage cryptocurrency assets, schedule operations, and analyze funding rates. This repository contains the frontend application, which provides an intuitive and dynamic user interface for managing trading-related tasks.

## **Features**

- **Dynamic Dashboard**:
  - Displays an overview of user portfolios, allocation charts, and recent trades.
  - Features navigation buttons for easy access to different sections, including Portfolio, Scheduled Trades, and Market Insights.

- **Cryptocurrency Insights**:
  - Real-time asset charts.
  - Historical funding rates visualization.

- **Modular Design**:
  - Centralized API handling.
  - Reusable cookie management and shared utilities.

## **Tech Stack**

- **Frontend Framework**: JavaScript (Vanilla/ES6)
- **Styling**: CSS
- **Backend Interaction**: RESTful APIs
- **Deployment**: Nginx

## **File Structure**

```plaintext
nginx_frontend/
├── index.html             # Main entry point of the application
├── styles/                # Folder containing CSS files
│   └── main.css           # Primary stylesheet
├── scripts/               # Folder for JavaScript scripts
│   ├── apiService.js      # Handles API calls and data preparation
│   ├── utils.js           # Shared utilities (e.g., cookies handling, global settings)
│   └── main.js            # Core logic for managing the dashboard and interactivity
├── assets/                # Folder for images, icons, etc.
├── README.md              # Documentation for the project
└── nginx.conf             # Configuration file for deploying the frontend with Nginx
