import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { BillingMode } from '../../common/enums/billing-mode.enum';
import { CourtSplitMode } from '../../common/enums/court-split-mode.enum';
import { ShuttlePricingMode } from '../../common/enums/shuttle-pricing-mode.enum';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsNotEmpty()
  @IsEnum(BillingMode)
  billing_mode: BillingMode;

  @IsNotEmpty()
  @IsEnum(CourtSplitMode)
  court_split_mode: CourtSplitMode;

  @IsNotEmpty()
  @IsEnum(ShuttlePricingMode)
  shuttle_pricing_mode: ShuttlePricingMode;

  @ValidateIf((o) => o.shuttle_pricing_mode === ShuttlePricingMode.PER_SHUTTLE)
  @IsNumber()
  @IsPositive()
  shuttle_price_per_item?: number;

  @ValidateIf((o) => o.shuttle_pricing_mode === ShuttlePricingMode.PER_TUBE)
  @IsNumber()
  @IsPositive()
  shuttle_price_per_tube?: number;

  @ValidateIf((o) => o.shuttle_pricing_mode === ShuttlePricingMode.PER_TUBE)
  @IsNumber()
  @Min(1)
  shuttles_per_tube?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  court_total?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_total?: number;

  /** Player IDs to include in this session from the squad */
  @IsOptional()
  @IsUUID('all', { each: true })
  player_ids?: string[];
}
