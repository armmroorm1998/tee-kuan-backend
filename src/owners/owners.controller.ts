import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { OwnersService } from './owners.service';
import { BootstrapOwnerDto } from './dto/bootstrap-owner.dto';
import { RecoverOwnerDto } from './dto/recover-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { Owner } from './entities/owner.entity';

const COOKIE_NAME = 'owner_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
};

@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  /** Create a new anonymous owner identity. Returns recovery key ONCE. */
  @Post('bootstrap')
  @HttpCode(HttpStatus.CREATED)
  async bootstrap(@Body() dto: BootstrapOwnerDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.ownersService.bootstrap(dto);
    res.cookie(COOKIE_NAME, result.raw_token, COOKIE_OPTIONS);
    return {
      owner: result.owner,
      recovery_key: result.recovery_key,
    };
  }

  /** Recover identity using recovery key, issues a new cookie */
  @Post('recover')
  @HttpCode(HttpStatus.OK)
  async recover(@Body() dto: RecoverOwnerDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.ownersService.recover(dto);
    res.cookie(COOKIE_NAME, result.raw_token, COOKIE_OPTIONS);
    return { owner: result.owner };
  }

  @Get('me')
  @UseGuards(OwnerGuard)
  getMe(@CurrentOwner() owner: Owner) {
    const { token_hash: _t, recovery_key_hash: _r, promptpay_value: _p, ...safe } = owner as any;
    return safe;
  }

  @Patch('me')
  @UseGuards(OwnerGuard)
  update(@CurrentOwner() owner: Owner, @Body() dto: UpdateOwnerDto) {
    return this.ownersService.update(owner.id, dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME);
  }
}
