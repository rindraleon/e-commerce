# E-Shop Pro Backend

This is the backend for the e-shop-pro project, built with NestJS and using MariaDB as the database.

## Features

- User authentication and authorization (JWT-based)
- Product catalog management
- Shopping cart functionality
- Order processing
- Review and rating system
- Return and refund management
- Admin panel with analytics
- Role-based access control (admin/client)

## Tech Stack

- **Framework**: NestJS
- **Database**: MariaDB
- **ORM**: TypeORM
- **Authentication**: JWT with bcrypt password hashing
- **API**: RESTful endpoints

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and configure your MariaDB connection:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=e_shop_pro
   ```
5. Run the application:
   ```bash
   npm run start:dev
   ```

## Running Migrations

To run database migrations:
```bash
npm run db:migrate
```

## Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/signin` - Sign in a user
- `POST /auth/signout` - Sign out a user
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get a specific product
- `POST /products` - Create a new product (admin only)
- `PUT /products/:id` - Update a product (admin only)
- `DELETE /products/:id` - Delete a product (admin only)

### Cart
- `GET /cart` - Get user's cart
- `POST /cart` - Add item to cart
- `PUT /cart/:id` - Update cart item quantity
- `DELETE /cart/:id` - Remove item from cart

### Orders
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get a specific order
- `POST /orders` - Create a new order
- `PUT /orders/:id/status` - Update order status (admin only)

### Reviews
- `GET /reviews` - Get reviews for a product
- `POST /reviews` - Create a review
- `PUT /reviews/:id` - Update a review
- `DELETE /reviews/:id` - Delete a review

### Admin
- `GET /admin/logs` - Get admin logs
- `POST /admin/log-action` - Log an admin action
- `GET /admin/dashboard-stats` - Get dashboard statistics

## Database Schema

The application uses the following main entities:
- User
- Profile
- UserRole
- Product
- Category
- CartItem
- Order
- OrderItem
- Review
- Return
- Address
- AdminLog

## Environment Variables

- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret for JWT signing