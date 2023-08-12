import { IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from "./room.type.dto";
import { User } from "src/users/users.entity";

export class CreateRoom {
  @ApiProperty({ description: '방 이름' })
  room_name!: string;z

  @ApiProperty({ description: '참가유저목록' })
  participant!: User[];
}