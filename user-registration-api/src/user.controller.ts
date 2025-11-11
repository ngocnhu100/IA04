import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { UserService, User } from "./user.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "./roles.decorator";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Request() req: any): Promise<User> {
    // The user is attached to the request by the JWT strategy
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin")
  async getAdminData(
    @Request() req: any
  ): Promise<{ message: string; user: any }> {
    return {
      message: "This is admin-only data",
      user: req.user,
    };
  }
}
