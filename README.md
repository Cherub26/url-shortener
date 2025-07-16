# URL Shortener Application

## Description

This application allows users to easily shorten long URLs and track the click statistics of the generated short links. With a modern and simple interface, users can quickly and securely create, share, and manage their shortened URLs.

## Features

- Shorten long URLs
- Automatic redirection from short URLs to original URLs
- Track click (hit) statistics for each short URL
- Store all URLs and statistics in a PostgreSQL database
- Clean and user-friendly interface

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS, JavaScript

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-link>
   cd url-shortener
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the database:**
   - Create a PostgreSQL database.
   - Set up environment variables in a `.env` file:
     ```
     DATABASE_URL=postgres://user:password@localhost:5432/database_name
     PORT=3000
     ```

4. **Start the application:**
   ```bash
   npm run dev
   ```
   The app will run by default at [http://localhost:3000](http://localhost:3000).

## Usage

- Enter your long URL on the main page and click the "Shorten" button.
- Copy and share the generated short URL.
- When the short URL is accessed, the system automatically redirects to the original URL and increments the click count.
- You can view the click statistics for your short URLs on the statistics page.

## Development

- To contribute, fork the repository and create a new branch for your feature or bugfix.
- Please follow the code standards and project conventions when submitting pull requests.