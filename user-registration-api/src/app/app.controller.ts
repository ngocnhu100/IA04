import {
  Controller,
  Get,
  Post,
  Body,
  ValidationPipe,
  BadRequestException,
} from "@nestjs/common";
import { AppService } from "./app.service";
import { UserService, User } from "../user/user.service";
import { AuthService, AuthTokens } from "../auth/auth.service";
import { RegisterUserDto } from "../user/register-user.dto";
import { LoginUserDto } from "../user/login-user.dto";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  @Get()
  getRoot(): string {
    return this.appService.getHello();
  }

  @Post("user/register")
  async registerUser(
    @Body(new ValidationPipe()) registerUserDto: RegisterUserDto
  ): Promise<User> {
    return this.userService.register(registerUserDto);
  }

  @Post("auth/login")
  async loginUser(
    @Body(new ValidationPipe()) loginUserDto: LoginUserDto
  ): Promise<AuthTokens> {
    return this.authService.login(loginUserDto);
  }

  @Post("auth/refresh")
  async refreshToken(
    @Body("refreshToken") refreshToken: string
  ): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new BadRequestException("Refresh token is required");
    }
    return this.authService.refreshToken(refreshToken);
  }
}
