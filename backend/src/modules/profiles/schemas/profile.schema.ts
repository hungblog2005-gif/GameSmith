import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Profile {
  @Prop({ unique: true, required: true })
  username!: string;

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

  @Prop({ default: '' })
  avatar_url!: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
