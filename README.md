# 💰 AI-Powered Expense Tracker

A modern, intelligent expense tracking application that helps you understand and reflect on your spending patterns with the power of AI insights.

![Expense Tracker](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![Django](https://img.shields.io/badge/Django-Latest-green)
![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini-orange)

## ✨ Features

### 🎯 Core Functionality
- **Expense Management**: Add, view, and categorize your expenses with ease
- **Smart Categorization**: Automatic expense categorization with manual override
- **Period Filtering**: Switch between weekly and monthly views
- **Real-time Search**: Filter expenses by description, date range, or category

### 🤖 AI-Powered Insights
- **Intelligent Analysis**: Google Gemini AI analyzes your spending patterns
- **Personalized Recommendations**: Get tailored insights about your financial habits
- **Spending Trends**: Understand where your money goes with AI-generated summaries
- **Smart Notifications**: Receive proactive spending alerts and suggestions

### 🎨 Modern UI/UX
- **Dual Theme Support**: Beautiful dark and light themes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Interactive Animations**: Smooth hover effects and transitions
- **Clean Dashboard**: Intuitive overview with cards, charts, and visualizations

### 📊 Data Visualization
- **Category Breakdown**: Interactive pie charts and bar graphs
- **Spending Summary**: Quick overview cards with key metrics
- **Period Comparisons**: Weekly vs monthly spending analysis
- **Visual Trends**: Easy-to-understand spending patterns

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 19.2.0 with modern hooks
- **Build Tool**: Vite for fast development and building
- **Styling**: Custom CSS with advanced animations and themes
- **HTTP Client**: Axios for API communication
- **State Management**: React hooks for local state

### Backend (Django REST Framework)
- **Framework**: Django with REST API endpoints
- **Database**: SQLite (easily configurable to PostgreSQL/MySQL)
- **AI Integration**: Google Gemini API for intelligent insights
- **Authentication**: Django's built-in auth system (optional)
- **API Design**: RESTful endpoints with proper serialization

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **npm or yarn**
- **Google Gemini API Key** (for AI features)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd expense-tracker
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd tracker

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install django djangorestframework django-cors-headers google-generativeai

# Set up environment variables
cp .env.example .env
# Edit .env and add your Google Gemini API key

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd Frontend/expense-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `tracker` directory:

```env
SECRET_KEY=your-django-secret-key
GOOGLE_API_KEY=your-google-gemini-api-key
DEBUG=True
```

### API Endpoints
- `GET /api/expenses/` - List expenses with filtering
- `POST /api/expenses/` - Create new expense
- `GET /api/expenses/summary/` - Get spending summary
- `GET /api/expenses/insights/` - Get AI-powered insights

## 🎨 Themes & Customization

### Theme Switching
The application supports both dark and light themes:
- **Dark Theme**: Default elegant dark mode with green accents
- **Light Theme**: Clean light mode with consistent styling
- **Auto Theme**: Automatically switches based on system preference

### Customization
- Modify CSS variables in `App.css` for color schemes
- Adjust AI insight prompts in Django views
- Configure period calculations in frontend components

## 🤖 AI Features

### Google Gemini Integration
The application uses Google's Gemini AI to provide:
- **Spending Pattern Analysis**: Identifies trends in your expenses
- **Category Insights**: Understands your spending distribution
- **Personalized Recommendations**: Suggests ways to optimize spending
- **Natural Language Summaries**: Easy-to-understand financial insights

### AI Insights Panel
- Prominent AI-powered section with animated elements
- Real-time analysis of spending data
- Visual indicators for AI-generated content
- Fallback states for when insufficient data is available

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop**: Full-featured dashboard with sidebar layout
- **Tablet**: Adapted grid layout with touch-friendly controls
- **Mobile**: Stacked layout with optimized navigation

## 🔒 Security Features

- **Environment Variable Protection**: Sensitive keys stored securely
- **CORS Configuration**: Proper cross-origin request handling
- **Input Validation**: Frontend and backend validation
- **Optional Authentication**: Can work with or without user accounts

## 🛠️ Development

### Project Structure
```
expense-tracker/
├── Frontend/
│   └── expense-frontend/          # React frontend
│       ├── src/
│       │   ├── App.jsx           # Main application component
│       │   ├── App.css           # Styling and themes
│       │   └── main.jsx          # Application entry point
│       └── package.json
├── tracker/                       # Django backend
│   ├── expense/                   # Main app
│   │   ├── models.py             # Database models
│   │   ├── views.py              # API endpoints
│   │   ├── serializers.py        # Data serialization
│   │   └── ai/                   # AI integration
│   ├── tracker/                   # Project settings
│   └── manage.py
└── README.md
```

### Adding New Features
1. **Backend**: Add models, views, and serializers in the `expense` app
2. **Frontend**: Create components and integrate with existing state management
3. **AI**: Extend AI prompts and analysis in the `ai` module
4. **Styling**: Add theme-aware CSS classes for consistent design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent insights
- **React Team** for the amazing frontend framework
- **Django Team** for the robust backend framework
- **Vite** for lightning-fast development experience

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) section
2. Create a new issue with detailed information
3. Provide steps to reproduce any bugs

---

**Built with ❤️ and AI** - Making expense tracking intelligent and beautiful.