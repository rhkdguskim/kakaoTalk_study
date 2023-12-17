import {
  DELETE_USER,
  FIND_ALL_USER,
  FIND_ONE_BY_ID_USER,
  FIND_ONE_USER,
  SIGN_IN,
  SIGN_UP,
  UPDATE_USER,
} from "../authentication.message";
import { ClientTCP, TcpClientOptions } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { User } from "../entity/users.entity";
import {AuthenticationService} from "./authentication.service.interface";
import {CreateUserRequest, LoginUserRequest, UpdateUserRequest} from "@app/authentication/dto/authenticaion.dto";


export class AuthenticationTcpclientService
  implements AuthenticationService
{
  private readonly tcpClientAdaptor : ClientTCP;
  constructor(options: TcpClientOptions) {
    this.tcpClientAdaptor = new ClientTCP(options['options']);
  }
  signIn(payload: LoginUserRequest): Promise<User> {
    return lastValueFrom<User>(this.tcpClientAdaptor.send<User>({ cmd: SIGN_IN }, payload));
  }

  signUp(payload: CreateUserRequest): Promise<User> {
    return lastValueFrom<User>(this.tcpClientAdaptor.send<User>({ cmd: SIGN_UP }, payload));
  }

  update(payload: UpdateUserRequest): Promise<User> {
    return lastValueFrom<User>(this.tcpClientAdaptor.send<User>({ cmd: UPDATE_USER }, payload));
  }
  delete(payload: number): Promise<User> {
    return lastValueFrom<User>(this.tcpClientAdaptor.send<User>({ cmd: DELETE_USER }, payload));
  }
  findOne(payload: number): Promise<User> {
    return lastValueFrom<User>(
        this.tcpClientAdaptor.send<User>({ cmd: FIND_ONE_USER }, payload)
    );
  }
  findOneByID(payload: string): Promise<User> {
    return lastValueFrom<User>(
        this.tcpClientAdaptor.send<User>({ cmd: FIND_ONE_BY_ID_USER }, payload)
    );
  }
  findAll(): Promise<User[]> {
    return lastValueFrom<User[]>(this.tcpClientAdaptor.send<User[]>({ cmd: FIND_ALL_USER }, {}));
  }
}
