import * as fs from 'fs';
import * as path from 'path';

interface EntityData {
  id: string;
  [key: string]: any;
}

interface SeedData {
  users: EntityData[];
  profiles: EntityData[];
  userRoles: EntityData[];
  categories: EntityData[];
  products: EntityData[];
  productImages: EntityData[];
  addresses: EntityData[];
  cartItems: EntityData[];
  orders: EntityData[];
  orderItems: EntityData[];
  payments: EntityData[];
  reviews: EntityData[];
  returns: EntityData[];
  adminLogs: EntityData[];
}

/**
 * Load test data for all entities
 */
export class TestSeeder {
  private dataPath: string;

  constructor(dataPath: string = './data') {
    this.dataPath = path.join(__dirname, dataPath);
  }

  /**
   * Load all test data from JSON files
   */
  public async loadAllData(): Promise<SeedData> {
    return {
      users: this.loadDataFromFile('users.json'),
      profiles: this.loadDataFromFile('profiles.json'),
      userRoles: this.loadDataFromFile('user-roles.json'),
      categories: this.loadDataFromFile('categories.json'),
      products: this.loadDataFromFile('products.json'),
      productImages: this.loadDataFromFile('product-images.json'),
      addresses: this.loadDataFromFile('addresses.json'),
      cartItems: this.loadDataFromFile('cart-items.json'),
      orders: this.loadDataFromFile('orders.json'),
      orderItems: this.loadDataFromFile('order-items.json'),
      payments: this.loadDataFromFile('payments.json'),
      reviews: this.loadDataFromFile('reviews.json'),
      returns: this.loadDataFromFile('returns.json'),
      adminLogs: this.loadDataFromFile('admin-logs.json'),
    };
  }

  /**
   * Load data from a specific JSON file
   */
  public loadDataFromFile(filename: string): EntityData[] {
    const filePath = path.join(this.dataPath, filename);
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  }

  /**
   * Save data to a specific JSON file
   */
  public saveDataToFile(filename: string, data: EntityData[]): void {
    const filePath = path.join(this.dataPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Get data for a specific entity
   */
  public getData(entityName: keyof SeedData): EntityData[] {
    const allData = this.loadAllDataSync();
    return allData[entityName];
  }

  /**
   * Synchronous version of loadAllData
   */
  public loadAllDataSync(): SeedData {
    return {
      users: this.loadDataFromFile('users.json'),
      profiles: this.loadDataFromFile('profiles.json'),
      userRoles: this.loadDataFromFile('user-roles.json'),
      categories: this.loadDataFromFile('categories.json'),
      products: this.loadDataFromFile('products.json'),
      productImages: this.loadDataFromFile('product-images.json'),
      addresses: this.loadDataFromFile('addresses.json'),
      cartItems: this.loadDataFromFile('cart-items.json'),
      orders: this.loadDataFromFile('orders.json'),
      orderItems: this.loadDataFromFile('order-items.json'),
      payments: this.loadDataFromFile('payments.json'),
      reviews: this.loadDataFromFile('reviews.json'),
      returns: this.loadDataFromFile('returns.json'),
      adminLogs: this.loadDataFromFile('admin-logs.json'),
    };
  }
}

// Example usage
if (require.main === module) {
  const seeder = new TestSeeder();
  const allData = seeder.loadAllDataSync();

  console.log('Test data loaded successfully!');
  console.log(`Users: ${allData.users.length}`);
  console.log(`Products: ${allData.products.length}`);
  console.log(`Orders: ${allData.orders.length}`);
  console.log(`Reviews: ${allData.reviews.length}`);
}
