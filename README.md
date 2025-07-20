# URL Shortener Application

## Description

This application allows users to easily shorten long URLs and track the click statistics of the generated short links. With a modern and simple interface, users can quickly and securely create, share, and manage their shortened URLs.

## Features

- Shorten long URLs
- Automatic redirection from short URLs to original URLs
- Track click (hit) statistics for each short URL
- Store all URLs and statistics in a PostgreSQL database
- User authentication (login/registration)
- Clean and user-friendly interface

## Technologies Used

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS, JavaScript
- **Authentication:** JWT tokens

## Project Structure

```
url-shortener/
├── src/                    # TypeScript source code
│   ├── controllers/        # Route controllers
│   ├── db/                # Database configuration
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── server.ts          # Main server file
├── public/                # Static frontend files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── app.js            # Frontend JavaScript
├── package.json           # Node.js dependencies
└── tsconfig.json         # TypeScript configuration
```

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

3. **Configure environment variables:**
   - Create a PostgreSQL database
   - Copy the example file and fill in your values:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your settings. Example:
     ```env
     DATABASE_URL=postgres://user:password@localhost:5432/database_name
     PORT=3000
     JWT_SECRET=your_jwt_secret
     ```

4. **Start the application:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```
   
   The application will run at [http://localhost:3000](http://localhost:3000).

## Usage

- Enter your long URL on the main page and click the "Shorten" button
- Copy and share the generated short URL
- When the short URL is accessed, the system automatically redirects to the original URL and increments the click count
- You can view the click count for your short URLs on the links page
- Register/login to manage your shortened links

## API Endpoints

- `POST /api/user/login` - User login
- `POST /api/user/register` - User registration
- `POST /api/shorten` - Create short URL
- `GET /api/user/links` - Get user's links
- `GET /:shortCode` - Redirect to original URL

## Development

- The backend is written in TypeScript with Express.js
- The frontend uses vanilla HTML, CSS, and JavaScript for simplicity and performance
- No build process required for the frontend - just serve the static files
- To contribute, fork the repository and create a new branch for your feature or bugfix
- Please follow the code standards and project conventions when submitting pull requests

## Performance Benefits

- **Fast Loading**: No framework overhead
- **Small Bundle Size**: Minimal dependencies
- **Better SEO**: Server-side rendering friendly
- **Lower Memory Usage**: No framework runtime
- **Easier Deployment**: Simple static file serving