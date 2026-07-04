# Test Data for E-Shop Backend

This directory contains JSON files with sample data for all entities in the e-shop application. These files are designed to be used for testing purposes.

## Entities Included

- **users.json** - Sample user accounts with encrypted passwords
- **profiles.json** - User profile information linked to users
- **user-roles.json** - User role assignments (client, admin)
- **categories.json** - Product categories
- **products.json** - Sample products with pricing and stock
- **product-images.json** - Images associated with products
- **addresses.json** - Shipping addresses for users
- **cart-items.json** - Items in user shopping carts
- **orders.json** - Sample orders with different statuses
- **order-items.json** - Individual items within orders
- **payments.json** - Payment records for orders
- **reviews.json** - Product reviews with moderation status
- **returns.json** - Product return requests
- **admin-logs.json** - Administrative action logs

## Usage

The test data can be loaded programmatically using the `TestSeeder` class:

```typescript
import { TestSeeder } from '../test/seed-test-data';

const seeder = new TestSeeder();
const allData = seeder.loadAllDataSync();

// Access specific entity data
const users = allData.users;
const products = seeder.getData('products');
const userData = seeder.loadDataFromFile('users.json');
```

## Data Relationships

The data is structured with proper foreign key relationships:

- Users have profiles and roles
- Products belong to categories
- Orders belong to users and addresses
- Order items link orders to products
- Reviews connect users to products
- Cart items connect users to products
- Payments connect to orders
- Returns connect to orders and users

## ID Conventions

- User IDs: `user-{number}` (e.g., user-1, user-2)
- Product IDs: `prod-{slug}` (e.g., prod-laptop, prod-phone)
- Category IDs: `cat-{slug}` (e.g., cat-electronics, cat-clothing)
- Other entities use descriptive prefixes (e.g., order-1, review-1)

## Notes

- Passwords are hashed using bcrypt with a dummy hash for testing
- Dates are in ISO format and set in the year 2026
- All relationships maintain referential integrity
- The data represents realistic e-commerce scenarios