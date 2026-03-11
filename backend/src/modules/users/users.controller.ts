import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from './schemas/users.schema';

const sanitizeUser = (user: UserDocument) => {
  const {
    password_hash: _passwordHash,
    refresh_token_hash: _rth,
    ...safeUser
  } = user.toObject();
  return safeUser;
};

const RT_COOKIE_OPTIONS = (production: boolean) => ({
  httpOnly: true,
  secure: production && process.env.COOKIE_SECURE !== 'false',
  sameSite: production ? ('strict' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.usersService.create(dto);
    const safe = sanitizeUser(user);
    const isProd = process.env.NODE_ENV === 'production';
    const accessToken = this.jwtService.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString() },
      { expiresIn: '7d' },
    );
    await this.usersService.saveRefreshToken(user._id.toString(), refreshToken);
    res.cookie('rt', refreshToken, RT_COOKIE_OPTIONS(isProd));
    return { ...safe, token: accessToken };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.usersService.findByEmailForLogin(dto.email);
    const isPasswordValid = await this.usersService.validatePassword(
      dto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== 'active') {
      throw new ForbiddenException(
        user.status === 'banned'
          ? 'Your account has been banned. Please contact support.'
          : 'Your account is suspended. Please contact support.',
      );
    }
    const safe = sanitizeUser(user);
    const isProd = process.env.NODE_ENV === 'production';
    const accessToken = this.jwtService.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString() },
      { expiresIn: '7d' },
    );
    await this.usersService.saveRefreshToken(user._id.toString(), refreshToken);
    res.cookie('rt', refreshToken, RT_COOKIE_OPTIONS(isProd));
    return { ...safe, token: accessToken };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token: string | undefined = (req as any).cookies?.rt;
    if (!token) throw new UnauthorizedException('No refresh token');
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify<{ sub: string }>(token);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.usersService.findByIdAndValidateRefreshToken(
      payload.sub,
      token,
    );
    if (!user) throw new UnauthorizedException('Refresh token revoked');
    const isProd = process.env.NODE_ENV === 'production';
    const newRefreshToken = this.jwtService.sign(
      { sub: user._id.toString() },
      { expiresIn: '7d' },
    );
    await this.usersService.saveRefreshToken(
      user._id.toString(),
      newRefreshToken,
    );
    res.cookie('rt', newRefreshToken, RT_COOKIE_OPTIONS(isProd));
    const accessToken = this.jwtService.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      { expiresIn: '15m' },
    );
    return { ...sanitizeUser(user), token: accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token: string | undefined = (req as any).cookies?.rt;
    if (token) {
      try {
        const payload = this.jwtService.verify<{ sub: string }>(token);
        await this.usersService.revokeRefreshToken(payload.sub);
      } catch {
        /* expired or invalid — still clear cookie */
      }
    }
    res.clearCookie('rt', { path: '/' });
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Must be declared BEFORE @Get(':id') to avoid route shadowing
  @Get('my-assets')
  @UseGuards(JwtAuthGuard)
  getMyAssets(
    @Req() req: Request & { user: { sub: string } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getPurchasedAssets(req.user.sub, page, limit);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('username/:username/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Param('username') username: string,
    @Body() body: { current_password: string; new_password: string },
  ) {
    if (!body.current_password || !body.new_password) {
      throw new BadRequestException(
        'current_password and new_password are required',
      );
    }
    if (body.new_password.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters',
      );
    }
    try {
      await this.usersService.changePassword(
        username,
        body.current_password,
        body.new_password,
      );
    } catch (err: any) {
      if (err.message === 'INVALID_CURRENT_PASSWORD') {
        throw new UnauthorizedException('Current password is incorrect');
      }
      throw err;
    }
  }

  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'avatars');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const user = await this.usersService.updateAvatar(id, avatarUrl);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return sanitizeUser(user);
  }
}
