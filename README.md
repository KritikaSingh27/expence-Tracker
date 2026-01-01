# MoneyNotes

MoneyNotes is a modern, AI-powered expense tracker designed to help you understand your spending habits with ease. Built with React, Django, and Google Gemini AI, it offers a seamless experience for tracking expenses, categorizing transactions, and gaining personalized financial insights.

## Features

*   **AI-Powered Insights**: Get personalized financial advice and spending analysis powered by Google Gemini 2.5.
*   **Smart Categorization**: Automatically categorizes your expenses based on descriptions using AI.
*   **Real-time Dashboard**: View your spending summaries, category breakdowns, and recent transactions instantly.
*   **Secure Authentication**: Integrated with Clerk for secure and easy user authentication.
*   **Responsive Design**: A beautiful, dark-mode-first UI that works great on desktop and mobile.
*   **Flexible Filtering**: Filter expenses by weekly, monthly, or custom date ranges.

## Tech Stack

*   **Frontend**: React, Vite, Axios, Clerk React SDK
*   **Backend**: Django, Django REST Framework
*   **AI**: Google Gemini API
*   **Database**: SQLite (Default), easily swappable for PostgreSQL
*   **Styling**: Custom CSS with a focus on modern aesthetics

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (v18 or higher)
*   **Python** (v3.10 or higher)
*   **Git**

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MoneyNotes
```

### 2. Backend Setup (Django)

Navigate to the `tracker` directory:

```bash
cd tracker
```

Create and activate a virtual environment:

```bash
# Windows
python -m venv .venv
.\.venv\Scripts\Activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Set up environment variables:
Create a `.env` file in the `tracker` directory and add your keys:

```env
GOOGLE_API_KEY=your_google_gemini_api_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

Run migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

The backend will be running at `http://127.0.0.1:8000`.

### 3. Frontend Setup (React)

Open a new terminal and navigate to the `Frontend/expense-frontend` directory:

```bash
cd Frontend/expense-frontend
```

Install Node dependencies:

```bash
npm install
```

Set up environment variables:
Create a `.env` file in the `Frontend/expense-frontend` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

The frontend will be running at `http://localhost:5173` (or similar).

## Usage

1.  **Sign In**: Use the "Sign In" button to authenticate via Clerk.
2.  **Add Expense**: Click the floating "+" button to add a new expense. Enter the amount and description. The AI will attempt to auto-categorize it.
3.  **View Insights**: The dashboard will automatically generate insights based on your spending patterns once you have enough data.
4.  **Filter**: Use the "Weekly" / "Monthly" toggles or the date pickers to view expenses for specific periods.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open-source and available under the MIT License.