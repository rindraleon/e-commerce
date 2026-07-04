import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum AdminAction {
  CREATE_PRODUCT = 'create_product',
  UPDATE_PRODUCT = 'update_product',
  DELETE_PRODUCT = 'delete_product',
  CREATE_CATEGORY = 'create_category',
  UPDATE_CATEGORY = 'update_category',
  DELETE_CATEGORY = 'delete_category',
  UPDATE_USER_ROLE = 'update_user_role',
  MANAGE_ORDERS = 'manage_orders',
  MANAGE_REVIEWS = 'manage_reviews',
  MANAGE_RETURNS = 'manage_returns',
  OTHER = 'other',
}

export class LogAdminActionDto {
  @IsEnum(AdminAction)
  action: AdminAction;

  @IsString()
  @IsOptional()
  details?: string;
}