import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  court_label?: string;

  /** Player IDs participating in this game */
  @IsArray()
  @IsUUID('all', { each: true })
  player_ids: string[];
}
