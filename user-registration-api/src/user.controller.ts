import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { UserService, User } from "./user.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Request() req: any): Promise<User> {
    // The user is attached to the request by the JWT strategy
    return req.user;
  }
}
