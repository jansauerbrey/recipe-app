# RecipeApp

A comprehensive recipe management and meal planning application that helps users organize recipes, plan meals in advance, and automatically generate shopping lists. The application supports multiple languages (English, German, and Finnish) for ingredients and provides both web and mobile interfaces.

## Features

- **User Management**
  - User registration and authentication with JWT tokens
  - Redis-based session management for better scalability
  - Multi-language interface preferences
  - Customizable user settings (language, week start day)
  - Email verification system with token-based confirmation
  - Secure password reset functionality
  - Admin user management

- **Recipe Management**
  - Store and manage recipes with detailed information including:
    - Name and cooking instructions
    - Preparation, cooking, and waiting times
    - Nutritional information (calories, carbs, fat, protein)
    - Serving size with adjustable portions
    - Multi-language ingredient support
    - Measurement unit conversions
    - Recipe categorization by dish types
    - Custom tags for flexible organization
    - Image upload and management
  - Favorite recipes functionality
  - Recipe search with typeahead suggestions

- **Meal Planning**
  - Plan meals for multiple days in advance
  - Flexible schedule management
  - Adjustable serving sizes per scheduled meal
  - Automatic shopping list generation
  - Week start day customization
  - Calendar view for meal plans
  - Schedule overview and management

- **Shopping List**
  - Automatic generation from meal plans
  - Smart ingredient aggregation
  - Support for frequent shopping items
  - Categorized shopping lists
  - Multi-language ingredient display
  - Custom category ordering
  - Random items suggestions
  - Optional REWE supermarket integration

- **Multi-Platform Support**
  - Responsive web interface
  - Mobile app (Cordova-based) for iOS and Android
  - Offline functionality in mobile app
  - Cross-device synchronization

## Architecture

### Backend Components

```
recipe-app/
├── auth/                   # Authentication system
│   ├── auth.js            # JWT authentication middleware
│   ├── redisHelper.js     # Redis session management
│   └── tokenHelper.js     # Token generation and validation
│
├── models/                 # MongoDB data models
│   ├── User.js            # User accounts and preferences
│   ├── Recipe.js          # Core recipe management
│   ├── Ingredient.js      # Multi-language ingredients
│   ├── Schedule.js        # Meal planning system
│   ├── Shopitem.js        # Shopping list management
│   └── [Other Models]     # Supporting data structures
│
├── routes/                 # API endpoints
│   ├── recipes.js         # Recipe CRUD operations
│   ├── schedules.js       # Meal planning operations
│   ├── shopitems.js       # Shopping list management
│   ├── user.js            # User authentication
│   └── [Other Routes]     # Additional functionality
```

### Frontend Structure

```
cordova-app/
├── www/                   # Web application
│   ├── app/              # AngularJS modules
│   │   ├── recipes/      # Recipe management
│   │   ├── schedules/    # Meal planning
│   │   ├── shopitems/    # Shopping lists
│   │   └── [Others]      # Additional features
│   ├── css/              # Application styles
│   ├── lib/              # Frontend dependencies
│   └── partials/         # Angular templates
│
└── res/                  # Mobile resources
    ├── android/          # Android assets
    ├── ios/              # iOS assets
    └── img/              # Shared images
```

## Technical Stack

### Backend
- **Node.js + Express**: RESTful API server
- **MongoDB + Mongoose**: Data persistence with schemas
- **Redis**: Session management and caching
- **JWT**: Stateless authentication
- **Nodemailer**: Email notifications
- **Multer**: File upload handling

### Frontend
- **AngularJS**: Single-page application
- **Bootstrap**: Responsive UI framework
- **Cordova**: Mobile platform wrapper
- **Angular UI Router**: Application routing
- **UI Bootstrap**: Angular components
- **Font Awesome**: Icon library

### Development Tools
- **Nodemon**: Development server
- **MongoDB**: Local database
- **Redis**: Session store
- **Mailhog**: Email testing
- **PM2**: Process management
- **Nginx**: Reverse proxy

## API Documentation

### Authentication Endpoints

```
POST /api/user/register
- Register a new user
- Body: {
    "username": "johndoe",
    "password": "securepass",
    "passwordConfirmation": "securepass",
    "email": "john@example.com",
    "emailConfirmation": "john@example.com",
    "fullname": "John Doe",
    "settings": {
      "preferredLanguage": "en",
      "spokenLanguages": ["en", "de"]
    }
  }
- Response: 200 OK or 400 with error message

POST /api/user/login
- Authenticate user and get token
- Body: {
    "username": "johndoe",
    "password": "securepass",
    "autologin": false
  }
- Response: {
    "token": "jwt-token-string",
    "is_admin": false,
    "email": "john@example.com",
    "fullname": "John Doe",
    "_id": "user-id",
    "username": "johndoe",
    "settings": {
      "preferredLanguage": "en",
      "spokenLanguages": ["en", "de"],
      "preferredWeekStartDay": 1
    }
  }

GET /api/user/logout
- Invalidate current token
- Headers: Authorization: AUTH [token]
- Response: 200 OK

POST /api/user/forgot
- Request password reset
- Body: { "username": "johndoe" }
- Response: 200 OK

PUT /api/user/reset/:token
- Reset password using token
- Body: {
    "password": "newpass",
    "passwordConfirmation": "newpass"
  }
- Response: 200 OK
```

### Recipe Management

```
GET /api/recipes
- List all recipes
- Query params: ?page=1&limit=10
- Response: [{
    "_id": "recipe-id",
    "name": "Spaghetti Carbonara",
    "instructions": "1. Boil pasta...",
    "cookTime": 20,
    "prepTime": 10,
    "totalTime": 30,
    "yield": 4,
    "ingredients": [{
      "ingredient": {
        "_id": "ingredient-id",
        "name": {
          "en": "Spaghetti",
          "de": "Spaghetti",
          "fi": "Spagetti"
        }
      },
      "unit": {
        "_id": "unit-id",
        "name": {
          "en": "grams",
          "de": "Gramm",
          "fi": "grammaa"
        }
      },
      "qty": 400
    }],
    "dishType": {
      "_id": "dishtype-id",
      "name": "Pasta"
    },
    "tags": ["italian", "pasta", "quick"],
    "author": "user-id",
    "imagePath": "/uploads/carbonara.jpg"
  }]

POST /api/recipes
- Create new recipe
- Headers: Authorization: AUTH [token]
- Body: {
    "name": "Spaghetti Carbonara",
    "instructions": "1. Boil pasta...",
    "cookTime": 20,
    "prepTime": 10,
    "yield": 4,
    "ingredients": [{
      "ingredient": "ingredient-id",
      "unit": "unit-id",
      "qty": 400
    }],
    "dishType": "dishtype-id",
    "tags": ["italian", "pasta", "quick"]
  }
- Response: { created recipe object }

GET /api/recipes/:id
- Get recipe details
- Response: { recipe object }

PUT /api/recipes/:id
- Update recipe
- Headers: Authorization: AUTH [token]
- Body: { updated recipe fields }
- Response: { updated recipe object }

DELETE /api/recipes/:id
- Delete recipe
- Headers: Authorization: AUTH [token]
- Response: 200 OK
```

### Meal Planning

```
GET /api/schedules
- Get meal schedule
- Query params: ?startDate=2024-01-01&endDate=2024-01-07
- Headers: Authorization: AUTH [token]
- Response: [{
    "_id": "schedule-id",
    "date": "2024-01-01T12:00:00Z",
    "recipe": {
      "_id": "recipe-id",
      "name": "Spaghetti Carbonara",
      "yield": 4
    },
    "factor": 1.5,
    "author": "user-id"
  }]

POST /api/schedules
- Add recipe to schedule
- Headers: Authorization: AUTH [token]
- Body: {
    "date": "2024-01-01T12:00:00Z",
    "recipe": "recipe-id",
    "factor": 1.5
  }
- Response: { created schedule object }

PUT /api/schedules/:id
- Update scheduled meal
- Headers: Authorization: AUTH [token]
- Body: {
    "date": "2024-01-01T12:00:00Z",
    "factor": 2
  }
- Response: { updated schedule object }

DELETE /api/schedules/:id
- Remove meal from schedule
- Headers: Authorization: AUTH [token]
- Response: 200 OK
```

### Shopping List Management

```
GET /api/shopitems
- Get shopping list
- Headers: Authorization: AUTH [token]
- Response: [{ shopping items }]

POST /api/shopitems
- Add item to shopping list
- Headers: Authorization: AUTH [token]
- Body: {
    "ingredient": "ingredient-id",
    "unit": "unit-id",
    "qty": 500
  }
- Response: { created item object }

PUT /api/shopitems/:id
- Update shopping item
- Headers: Authorization: AUTH [token]
- Body: {
    "qty": 750,
    "checked": true
  }
- Response: { updated item object }

DELETE /api/shopitems/:id
- Remove item from list
- Headers: Authorization: AUTH [token]
- Response: 200 OK

GET /api/shopitems/generate
- Generate shopping list from schedule
- Query params: ?startDate=2024-01-01&endDate=2024-01-07
- Headers: Authorization: AUTH [token]
- Response: [{
    "ingredient": {
      "_id": "ingredient-id",
      "name": {
        "en": "Spaghetti",
        "de": "Spaghetti",
        "fi": "Spagetti"
      },
      "category": "Pasta"
    },
    "unit": {
      "_id": "unit-id",
      "name": {
        "en": "grams",
        "de": "Gramm",
        "fi": "grammaa"
      }
    },
    "qty": 600,
    "recipes": ["Spaghetti Carbonara", "Pasta Alfredo"]
  }]
```

### Ingredient Management

```
GET /api/ingredients
- List all ingredients
- Query params: ?language=en
- Response: [{
    "_id": "ingredient-id",
    "name": {
      "en": "Spaghetti",
      "de": "Spaghetti",
      "fi": "Spagetti"
    },
    "category": "Pasta",
    "subcategory": "Long Pasta",
    "author": "user-id"
  }]

POST /api/ingredients
- Create new ingredient
- Headers: Authorization: AUTH [token]
- Body: {
    "name": {
      "en": "Spaghetti",
      "de": "Spaghetti",
      "fi": "Spagetti"
    },
    "category": "Pasta",
    "subcategory": "Long Pasta"
  }
- Response: { created ingredient object }

PUT /api/ingredients/:id
- Update ingredient
- Headers: Authorization: AUTH [token]
- Body: { updated ingredient fields }
- Response: { updated ingredient object }
```

### Recipe Organization

```
GET /api/tags
- List all recipe tags
- Response: [{
    "_id": "tag-id",
    "name": "italian"
  }]

GET /api/dishtypes
- List all dish types
- Response: [{
    "_id": "dishtype-id",
    "name": "Pasta"
  }]

GET /api/units
- List measurement units
- Query params: ?language=en
- Response: [{
    "_id": "unit-id",
    "name": {
      "en": "grams",
      "de": "Gramm",
      "fi": "grammaa"
    }
  }]

GET /api/categories
- List shopping categories
- Response: [{
    "_id": "category-id",
    "name": "Pasta",
    "order": 1
  }]
```

### Search and Suggestions

```
GET /api/typeahead/ingredients
- Get ingredient suggestions
- Query params: ?q=spag&language=en
- Response: [{
    "_id": "ingredient-id",
    "name": {
      "en": "Spaghetti"
    }
  }]

GET /api/typeahead/recipes
- Get recipe suggestions
- Query params: ?q=carb
- Response: [{
    "_id": "recipe-id",
    "name": "Spaghetti Carbonara"
  }]

GET /api/randomitems
- Get random recipe suggestions
- Query params: ?limit=5
- Response: [{
    "_id": "recipe-id",
    "name": "Spaghetti Carbonara",
    "imagePath": "/uploads/carbonara.jpg"
  }]
```

### File Management

```
POST /api/upload
- Upload recipe image
- Headers: Authorization: AUTH [token]
- Body: FormData with 'image' field
- Response: {
    "filepath": "/uploads/carbonara.jpg"
  }
```

## Development Setup

1. Install system requirements:
   ```bash
   # Install MongoDB
   sudo apt-get install mongodb

   # Install Redis
   sudo apt-get install redis-server

   # Install Node.js dependencies
   npm install
   ```

2. Configure services:
   - MongoDB running on default port (27017)
   - Redis server active on port 6379
   - Mailhog for email testing (port 1025)

3. Start development server:
   ```bash
   npm run dev
   ```

4. Access the application:
   - Web interface: http://localhost:3000
   - API endpoints: http://localhost:3000/api

## Mobile Development

1. Install Cordova globally:
   ```bash
   npm install -g cordova
   ```

2. Setup mobile platforms:
   ```bash
   cd cordova-app
   cordova platform add ios
   cordova platform add android
   ```

3. Build applications:
   ```bash
   # Build for all platforms
   cordova build

   # Platform specific builds
   cordova build ios
   cordova build android
   ```

## License

The MIT License (MIT)

Copyright (c) 2015-2016 Jan Sauerbrey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
