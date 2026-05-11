import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BillingMode } from '../../common/enums/billing-mode.enum';
import { CourtSplitMode } from '../../common/enums/court-split-mode.enum';

export class CreateSquadDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsEnum(BillingMode)
  default_billing_mode?: BillingMode;

  @IsOptional()
  @IsEnum(CourtSplitMode)
  default_court_split_mode?: CourtSplitMode;
}
