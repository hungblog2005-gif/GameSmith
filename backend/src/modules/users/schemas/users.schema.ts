import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ unique: true, required: true })
  username!: string;

  @Prop({ unique: true, required: true })
  email!: string;

  @Prop({ required: true })
  password_hash!: string;

  @Prop({ enum: ['user', 'creator', 'admin'], default: 'user' })
  role!: 'user' | 'creator' | 'admin';

  @Prop({ default: 0 })
  wallet_balance!: number;

  @Prop({ default: false })
  is_verified!: boolean;

  @Prop({ default: '' })
  avatar_url!: string;

  @Prop({ default: '' })
  first_name!: string;

  @Prop({ default: '' })
  last_name!: string;

  @Prop({ default: '' })
  phone_number!: string;

  @Prop({ default: '' })
  address!: string;

  @Prop({ default: '' })
  city!: string;

  @Prop({ default: '' })
  country!: string;

  @Prop({ default: '' })
  postal_code!: string;

  @Prop({ type: Date, default: null })
  date_of_birth!: Date | null;

  @Prop({ default: '' })
  gender!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
