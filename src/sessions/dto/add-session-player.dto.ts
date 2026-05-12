import { IsUUID, IsNotEmpty } from 'class-validator';

export class AddSessionPlayerDto {
  @IsNotEmpty()
  @IsUUID()
  player_id: string;
}
