import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async healthCheck() {
    try {
      const usersCount = await this.databaseService.countUsers();
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
        usersCount,
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}
