import { Body, Controller, Patch, Param } from '@nestjs/common';

import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Patch('username/:username')
  updateByUsername(
    @Param('username') username: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.upsertByUsername(username, dto);
  }
}
