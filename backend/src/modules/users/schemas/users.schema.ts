import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ unique: true, required: true, minlength: 3, maxlength: 50, match: /^[a-zA-Z0-9_]+$/ })
  username!: string;

  @Prop({ unique: true, required: true, match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ })
  email!: string;

  @Prop({ required: true, minlength: 60 })
  password_hash!: string;

  @Prop({ enum: ['user', 'creator', 'admin', 'moderator'], required: true, default: 'user' })
  role!: 'user' | 'creator' | 'admin' | 'moderator';

  @Prop({ enum: ['active', 'inactive', 'suspended', 'banned'], required: true, default: 'active' })
  status!: 'active' | 'inactive' | 'suspended' | 'banned';

  @Prop({ default: 0, min: 0 })
  wallet_balance!: number;

  @Prop({ type: Date, default: null })
  lastLogin?: Date | null;

  @Prop({ default: '' })
  avatar_url!: string;

  // Assets mà user đã mua
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Asset' }],
    default: [],
  })
  purchased_assets!: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for optimal query performance
UserSchema.index({ username: 1 }, { unique: true, name: 'idx_users_username' });
UserSchema.index({ email: 1 }, { unique: true, name: 'idx_users_email' });
UserSchema.index({ role: 1, status: 1 }, { name: 'idx_users_role_verified' });
UserSchema.index({ created_at: -1 }, { name: 'idx_users_created' });
UserSchema.index({ purchased_assets: 1 }, { name: 'idx_users_purchased_assets' });
