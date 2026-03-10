import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Profile, ProfileDocument } from './schemas/profile.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  findByUsername(username: string) {
    return this.profileModel.findOne({ username }).exec();
  }

  upsertByUsername(username: string, dto: UpdateProfileDto) {
    const update: Record<string, any> = { username };

    if (dto.first_name !== undefined) update.firstName = dto.first_name;
    if (dto.last_name !== undefined) update.lastName = dto.last_name;
    if (dto.phone_number !== undefined) update.phoneNumber = dto.phone_number;
    if (dto.address !== undefined) update.address = dto.address;
    if (dto.city !== undefined) update.city = dto.city;
    if (dto.country !== undefined) update.country = dto.country;
    if (dto.postal_code !== undefined) update.postalCode = dto.postal_code;
    if (dto.date_of_birth !== undefined) update.dateOfBirth = dto.date_of_birth;
    if (dto.gender !== undefined) update.gender = dto.gender;
    if (dto.avatar_url !== undefined) update.avatarUrl = dto.avatar_url;

    return this.profileModel
      .findOneAndUpdate(
        { username },
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
