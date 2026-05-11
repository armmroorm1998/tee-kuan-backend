import { IsString, MinLength } from 'class-validator';

export class RecoverOwnerDto {
  @IsString()
  @MinLength(16)
  recovery_key: string;
}
