import { Controller, Get, Post, Body, ValidationPipe } from "@nestjs/common";
import { AppService } from "./app.service";
import { UserService, User } from "./user.service";
import { RegisterUserDto } from "./register-user.dto";
import { LoginUserDto } from "./login-user.dto";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService
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

  @Post("user/login")
  async loginUser(
    @Body(new ValidationPipe()) loginUserDto: LoginUserDto
  ): Promise<User> {
    return this.userService.login(loginUserDto);
  }
}
