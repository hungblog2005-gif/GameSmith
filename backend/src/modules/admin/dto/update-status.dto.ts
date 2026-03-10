import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['active', 'inactive', 'suspended', 'banned'])
  status!: 'active' | 'inactive' | 'suspended' | 'banned';
}
