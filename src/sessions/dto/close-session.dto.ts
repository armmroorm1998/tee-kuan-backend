import { IsNumber, IsOptional, Min } from 'class-validator';

export class CloseSessionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  shuttles_used?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  court_total?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_total?: number;
}
