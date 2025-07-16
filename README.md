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

- **Backend:** Node.js, Express.js (located in `backend/`)
- **Database:** PostgreSQL
- **Frontend:** Angular (located in `frontend/`)

## Project Structure

```
url-shortener/
  backend/    # Node.js/Express backend
  frontend/   # Angular frontend
```

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-link>
   cd url-shortener
   ```

2. **Install dependencies for both backend and frontend:**
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   cd ..
   ```

3. **Configure environment variables:**
   - **Backend:**
     - Create a PostgreSQL database.
     - Copy the example file and fill in your values:
       ```bash
       cd backend
       cp .env.example .env
       ```
     - Edit `.env` with your settings. Example:
       ```env
       DATABASE_URL=postgres://user:password@localhost:5432/database_name
       PORT=3000
       JWT_SECRET=your_jwt_secret
       ```
   - **Frontend:**
     - Copy the example file and fill in your values:
       ```bash
       cd ../frontend
       cp .env.example .env
       ```
     - Edit `.env` with your settings. Example:
       ```env
       NG_APP_BACKEND_PORT=3000
       NG_APP_BACKEND_HOST=http://localhost
       ```

4. **Start the application:**
   - **Backend:**
     ```bash
     cd backend
     npm run dev
     ```
   - **Frontend:**
     ```bash
     cd ../frontend
     ng serve
     ```
   - The backend will run by default at [http://localhost:3000](http://localhost:3000).
   - The frontend will typically run at [http://localhost:4200](http://localhost:4200).

## Usage

- Enter your long URL on the main page and click the "Shorten" button.
- Copy and share the generated short URL.
- When the short URL is accessed, the system automatically redirects to the original URL and increments the click count.
- You can view the click count for your short URLs on the links page.

## Development

- To contribute, fork the repository and create a new branch for your feature or bugfix.
- Please follow the code standards and project conventions when submitting pull requests.