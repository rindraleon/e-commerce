import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class SubscribersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async subscribe(subscribeDto: SubscribeDto) {
    const email = subscribeDto.email.trim().toLowerCase();
    const existingSubscriber =
      await this.databaseService.findSubscriberByEmail(email);

    if (existingSubscriber?.isActive) {
      throw new BadRequestException('This email is already subscribed');
    }

    if (existingSubscriber && !existingSubscriber.isActive) {
      return this.databaseService.saveSubscriber({
        ...existingSubscriber,
        email,
        isActive: true,
        source: subscribeDto.source || existingSubscriber.source,
      });
    }

    return this.databaseService.createSubscriber({
      email,
      source: subscribeDto.source || 'website',
      isActive: true,
    });
  }

  async findAll() {
    return this.databaseService.findSubscribers();
  }

  async updateStatus(id: string, isActive: boolean) {
    const subscriber = await this.databaseService.findSubscriberById(id);
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    return this.databaseService.updateSubscriber(id, { isActive });
  }

  async remove(id: string) {
    const subscriber = await this.databaseService.findSubscriberById(id);
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    await this.databaseService.deleteSubscriber(id);
    return { message: 'Subscriber deleted successfully' };
  }
}
