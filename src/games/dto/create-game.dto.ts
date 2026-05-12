import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  court_label?: string;

  /** Player IDs participating in this game — must be exactly 4 */
  @IsArray()
  @ArrayMinSize(4, { message: '1 เกมส์ต้องมีผู้เล่นพอดี 4 คน' })
  @ArrayMaxSize(4, { message: '1 เกมส์ต้องมีผู้เล่นพอดี 4 คน' })
  @IsUUID('all', { each: true })
  player_ids: string[];
}
