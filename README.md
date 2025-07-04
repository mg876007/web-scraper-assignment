# Web Scraper Assignment

## Overview
A web scraping tool with a Node.js (Express) backend and a Vue.js frontend. It extracts company name, website, and contact info (emails, phones) from a user-provided URL.

## Features
- Input a company website URL via a web interface
- Scrapes:
  - Company Name (from <h1> or <title>)
  - Website URL
  - Emails and phone numbers
- Displays results in the browser
- Download results as JSON
- Handles errors and invalid URLs gracefully

## Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)

### 1. Backend Setup
```sh
cd backend
npm install
node server.js
```
The backend will run on [http://localhost:3001](http://localhost:3001)

### 2. Frontend Setup
```sh
cd frontend
npm install
npm run dev
```
The frontend will run on [http://localhost:5173](http://localhost:5173) (default Vite port)

## Usage
1. Start both backend and frontend servers as above.
2. Open the frontend URL in your browser.
3. Enter a company website URL and click "Scrape".
4. View and download the extracted data.

## Design Decisions & Assumptions
- Only static HTML is scraped (no JavaScript rendering).
- Company name is heuristically extracted from <h1> or <title>.
- Contact info is found via regex in the page text.
- CORS is enabled for local development.
- Minimal error handling for unreachable or invalid URLs.

## Output Sample
```json
{
  "companyName": "Example Company",
  "website": "https://example.com",
  "emails": ["info@example.com"],
  "phones": ["+1 234-567-8900"]
}
```

## Optional Enhancements
- Add crawling, dynamic content support, or more fields as needed.

---
Assignment details: [Google Doc](https://docs.google.com/document/u/0/d/1UGtH7vResTvmk5jFErHq9yJZJQSjNrUuiC1cHXNnNRE/mobilebasic) 