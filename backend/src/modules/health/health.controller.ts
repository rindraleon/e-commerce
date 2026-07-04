import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async healthCheck() {
    try {
      // Test database connection by attempting a simple query
      const usersCount = await this.databaseService.findUsers();
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
        usersCount: usersCount.length,
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}