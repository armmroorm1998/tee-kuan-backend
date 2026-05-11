import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BootstrapOwnerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  display_name?: string;
}
