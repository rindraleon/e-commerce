import { IsBoolean } from 'class-validator';

export class UpdateSubscriberStatusDto {
  @IsBoolean()
  is_active: boolean;
}
