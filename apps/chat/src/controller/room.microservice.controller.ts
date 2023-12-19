import { Body, Controller, Post, Get, Param } from "@nestjs/common";
import { RoomLocalService } from "../providers/room.local.service";
import { ApiTags } from "@nestjs/swagger";
import {
  CreateRoomResponse,
  RoomInfoResponse,
  InviteRoomRequest, CreateRoomRequest,
} from "../dto/room.dto";
import { MessagePattern } from "@nestjs/microservices";
import {
  CREATE_ROOM,
  FIND_ALL_PARTICIPANT,
  FIND_ALL_ROOM,
  FIND_ROOM,
  INVITE_ROOM,
  UPDATE_ROOM,
} from "../room.message";
import {RoomTypeORM} from "@app/common/typeorm/entity/room.typeorm.entity";
import {ParticipantTypeORM} from "@app/common/typeorm/entity/participant.typeorm.entity";
import {UserTypeORM} from "@app/common/typeorm/entity/users.typeorm.entity";
import {RoomEntity} from "@app/chat/entity/room.entity";

@Controller("room")
@ApiTags("채팅방")
export class RoomMicroserviceController {
  constructor(private roomService: RoomLocalService) {}

  @MessagePattern({ cmd: FIND_ALL_ROOM })
  GetRoomList(payload: number): Promise<Array<RoomInfoResponse>> {
    return this.roomService.GetUserRooms(payload);
  }

  @MessagePattern({ cmd: FIND_ROOM })
  findRoom(payload: number): Promise<RoomEntity> {
    return this.roomService.getRoomByID(payload);
  }

  @MessagePattern({ cmd: UPDATE_ROOM })
  updateRoom(payload: RoomTypeORM) {
    return this.roomService.updateRoomStatus(payload);
  }

  @MessagePattern({ cmd: CREATE_ROOM })
  CreateRoom(payload: CreateRoomRequest): Promise<CreateRoomResponse> {
    return this.roomService.createRoom(payload);
  }
  @MessagePattern({ cmd: INVITE_ROOM })
  InviteRoom(payload: InviteRoomRequest): Promise<ParticipantTypeORM[]> {
    return this.roomService.InviteRoom(payload);
  }

  @MessagePattern({ cmd: FIND_ALL_PARTICIPANT })
  findParticipant(payload: UserTypeORM) {
    //return this.roomService.GetParticipants(payload);
  }
}
