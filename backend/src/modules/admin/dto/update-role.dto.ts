import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['user', 'creator', 'admin', 'moderator'])
  role!: 'user' | 'creator' | 'admin' | 'moderator';
}
