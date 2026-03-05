import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Profile {
  @Prop({ type: Types.ObjectId })
  userId?: Types.ObjectId;

  @Prop({ unique: true, sparse: true })
  username?: string;

  @Prop({ maxlength: 50 })
  firstName?: string;

  @Prop({ maxlength: 50 })
  lastName?: string;

  @Prop({ maxlength: 100 })
  displayName?: string;

  @Prop({ maxlength: 1000 })
  bio?: string;

  @Prop({ type: [String], default: [] })
  skills?: string[];

  @Prop({ match: /^\+?[1-9]\d{1,14}$/ })
  phoneNumber?: string;

  @Prop({ maxlength: 200 })
  address?: string;

  @Prop({ maxlength: 100 })
  city?: string;

  @Prop({ maxlength: 100 })
  country?: string;

  @Prop({ maxlength: 20 })
  postalCode?: string;

  @Prop({ type: Date, default: null })
  dateOfBirth?: Date | null;

  @Prop({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  gender?: string;

  @Prop({ maxlength: 100 })
  jobTitle?: string;

  @Prop({ maxlength: 100 })
  company?: string;

  @Prop({ maxlength: 200 })
  education?: string;

  @Prop({ match: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})[\/\w .-]*\/?$/ })
  website?: string;

  @Prop({ type: Object, default: {} })
  socialLinks?: Record<string, string>;

  @Prop({ match: /^(https?:\/\/|\/)?.*$/ })
  avatarUrl?: string;

  @Prop({ match: /^(https?:\/\/|\/)?.*$/ })
  coverImageUrl?: string;

  @Prop({ type: Object, default: {} })
  stats?: {
    followersCount?: number;
    followingCount?: number;
    productsCount?: number;
  };

  @Prop({ type: Object, default: {} })
  settings?: Record<string, any>;

  @Prop({ type: Date, default: null })
  lastSeen?: Date | null;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// Indexes for optimal query performance
ProfileSchema.index({ userId: 1 }, { unique: true, name: 'idx_profiles_user' });
ProfileSchema.index(
  { displayName: 'text', bio: 'text', skills: 'text' },
  { name: 'idx_profiles_text_search' }
);
ProfileSchema.index(
  { country: 1, city: 1 },
  { name: 'idx_profiles_location' }
);
ProfileSchema.index(
  { 'stats.followersCount': -1 },
  { name: 'idx_profiles_followers' }
);
