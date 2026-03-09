import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, minlength: 2, maxlength: 100 })
  name!: string;

  @Prop({ required: true, unique: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ })
  slug!: string;

  @Prop({ type: Types.ObjectId, default: null })
  parentId?: Types.ObjectId | null;

  @Prop({ maxlength: 50 })
  icon?: string;

  @Prop({ maxlength: 500 })
  description?: string;

  @Prop({ default: 0, type: Number })
  order!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes for optimal query performance
CategorySchema.index(
  { slug: 1 },
  { unique: true, name: 'idx_categories_slug' },
);
CategorySchema.index(
  { parentId: 1, order: 1 },
  { name: 'idx_categories_parent_order' },
);
CategorySchema.index(
  { isActive: 1, order: 1 },
  { name: 'idx_categories_active_order' },
);
