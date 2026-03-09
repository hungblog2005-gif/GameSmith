import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  InternalServerErrorException,
} from '@nestjs/common';

import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('username/:username')
  async getByUsername(@Param('username') username: string) {
    return this.profilesService.findByUsername(username);
  }

  @Patch('username/:username')
  async updateByUsername(
    @Param('username') username: string,
    @Body() dto: UpdateProfileDto,
  ) {
    try {
      return await this.profilesService.upsertByUsername(username, dto);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
