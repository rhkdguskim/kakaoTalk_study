import {Injectable} from "@nestjs/common";
import {TypeormRepository} from "@app/common/typeorm/typeormrepository";
import {ChattingTypeORM} from "@app/common/typeorm/entity/chatting.typeorm.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {ChatRepository} from "@app/chat/repository/chat.repository.interface";
import { ChattingListRequest } from "../dto/chat.dto";

@Injectable()
export class ChatTypeormRepository extends TypeormRepository<ChattingTypeORM> implements ChatRepository {
    constructor(@InjectRepository(ChattingTypeORM)
                private chatRepository: Repository<ChattingTypeORM>
    ) {
        super(chatRepository);
    }

    async findChattingById(id: number): Promise<ChattingTypeORM> {
        return await this.chatRepository.findOne({
            where: {id},
            relations: ["readBys"],
        });
    }
    async findChattingByRoomId(id: number): Promise<ChattingTypeORM[]> {
        return await this.chatRepository.find({
            where: {room: {id}},
            relations: ["readBys"],
        });
    }
    async readChatting(user_id: number, room_id: number): Promise<ChattingTypeORM[]> {
        return await this.chatRepository.find({
            where: {user: {id: user_id}, room: {id: room_id}},
        });
    }
    async getChattingList(chatListRequest: ChattingListRequest): Promise<ChattingTypeORM[]> {
        if ((chatListRequest.cursor as any) == "null") {
            chatListRequest.cursor = 9999999999;
        }

        const {id, cursor} = chatListRequest;

        const chatList = await this.chatRepository
            .createQueryBuilder("chatting")
            .where("chat.room_id = :id", {id})
            .andWhere("chat.id < :cursor", {cursor: cursor})
            .leftJoinAndSelect("chat.user", "user")
            .select([
                "chat.id",
                "chat.message",
                "chat.not_read_chat",
                "chat.createdAt",
                "user.id",
                "chat.room_id",
            ])
            .orderBy("chat.id", "DESC")
            .limit(50)
            .getRawMany();

        return chatList.reverse();
    }
}