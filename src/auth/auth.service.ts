import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { User } from "../users/users.entity";
import { CreateUserDto } from "../users/dto/users.createuser.dto";
import * as bcrypt from "bcrypt";
import { LoginUserDto } from "../users/dto/users.loginuser.dto";
import { GetUser } from "./get-user.decorator";
import { HttpService } from "@nestjs/axios";
import { Observable, catchError, from } from "rxjs";
import { KakaoAuthRequest, KakaoLoginRequest, KakaoLogoutRequest, KakaoLogoutResponse, KakaoUserResponse } from "./dto/kakao.auth.dto";
import { URLSearchParams } from "url";
import { OAuthData } from "./dto/OAuth.dto";

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private http: HttpService,
  ) {}

  async signIn(loginUser: LoginUserDto): Promise<any> {
    const user = await this.userService.findbyUserId(loginUser.user_id);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await bcrypt.compare(
      loginUser.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload = { id: user.id, user_id: user.user_id };

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: await this.generateRefreshToken(user.id),
    };
  }

  async create(createUserDto: CreateUserDto): Promise<any> {
    const isExist = await this.userService.findbyUserId(createUserDto.user_id);
    if (isExist) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: [`이미 등록된 사용자입니다.`],
        error: "Forbidden",
      });
    }

    return this.userService.createUser(createUserDto);
  }

  private async setRefreshToken(refreshToken: string, userId: number) {
    const currentDateTime = new Date();
    const refreshTokenExpiry = new Date(
      currentDateTime.setMonth(currentDateTime.getMonth() + 1)
    ); // 1달 후 만료로 설정

    await this.userService.updateUser(userId, {
      refreshToken,
      refreshTokenExpiry,
    });
  }

  async generateRefreshToken(userId: number): Promise<string> {
    const refreshTokenPayload = { id: userId, isRefreshToken: true };
    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload);

    this.setRefreshToken(refreshToken, userId);

    return refreshToken;
  }

  async getNewAccessToken(
    refreshToken: string,
    @GetUser() user: User
  ): Promise<string> {
    const isValidRefreshToken = await this.validateRefreshToken(
      refreshToken,
      user
    );

    if (!isValidRefreshToken) {
      throw new UnauthorizedException();
    }

    const payload = this.jwtService.verify(refreshToken);
    if (payload.isRefreshToken) {
      return this.jwtService.signAsync({
        id: payload.id,
        user_id: payload.user_id,
      });
    } else {
      throw new UnauthorizedException();
    }
  }

  private async validateRefreshToken(
    refreshToken: string,
    user: User
  ): Promise<boolean> {
    if (user && user.refreshToken === refreshToken) {
      const currentDateTime = new Date();
      if (user.refreshTokenExpiry > currentDateTime) {
        return true;
      }
    }
    return false;
  }

  async kakaoLogout(url: string, access_token : string, body : KakaoLogoutRequest): Promise<any> {
    const {client_id, logout_redirect_uri, state} = body;
    const headers = {
      Authorization: `Bearer ${access_token}`
    };

    const queryParams = new URLSearchParams({
      client_id,
      logout_redirect_uri,
      state,
    }).toString();

    const fullUrl = `${url}?${queryParams}`;

    return await this.http.get(fullUrl, {headers}).toPromise();
  }

  async OAuthLogin(OAuthData: OAuthData) : Promise<any> {
    let user = await this.userService.findbyUserId(OAuthData.user.user_id);

    if (user) { // 이미 등록된 사용자
      Logger.log("이미 등록된 사용자 입니다.")
    }
    else { // 가입이 되어있지 않다면 Auto Login
      user = await this.userService.createOAuthUser(OAuthData);
    }
    const payload = { id: user.id, user_id: user.user_id };
    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: await this.generateRefreshToken(user.id),
    };
  }

}
