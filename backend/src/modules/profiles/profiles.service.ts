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

  upsertByUsername(username: string, dto: UpdateProfileDto) {
    return this.profileModel
      .findOneAndUpdate(
        { username },
        { username, ...dto },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
