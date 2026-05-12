import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { PromptPayType } from '../../common/enums/promptpay-type.enum';

export class UpdateOwnerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  display_name?: string;

  @IsOptional()
  @IsEnum(PromptPayType)
  promptpay_type?: PromptPayType;

  /**
   * Mobile: 10-digit Thai number (0XXXXXXXXX)
   * National ID: 13-digit Thai ID card number
   * Sanitized and validated before storage.
   */
  @IsOptional()
  @IsString()
  @Matches(/^(0\d{9}|\d{13})$/, {
    message:
      'promptpay_value must be a 10-digit mobile or 13-digit national ID',
  })
  promptpay_value?: string;
}
