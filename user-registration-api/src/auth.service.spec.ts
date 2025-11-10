import { Test, TestingModule } from "@nestjs/testing";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { UserService } from "./user.service";
import { UserEntity } from "./user.entity";
import { RegisterUserDto } from "./register-user.dto";
import { LoginUserDto } from "./login-user.dto";

describe("AuthService", () => {
  let service: AuthService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [UserEntity],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([UserEntity]),
        JwtModule.register({
          secret: "test-secret",
          signOptions: { expiresIn: "15m" },
        }),
      ],
      providers: [AuthService, UserService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return user without password for valid credentials", async () => {
      const registerDto: RegisterUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      await userService.register(registerDto);

      const result = await service.validateUser(
        "test@example.com",
        "password123"
      );
      expect(result).toHaveProperty("id");
      expect(result.email).toBe("test@example.com");
      expect(result).not.toHaveProperty("password");
    });

    it("should return null for invalid email", async () => {
      const result = await service.validateUser(
        "nonexistent@example.com",
        "password123"
      );
      expect(result).toBeNull();
    });

    it("should return null for invalid password", async () => {
      const registerDto: RegisterUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      await userService.register(registerDto);

      const result = await service.validateUser(
        "test@example.com",
        "wrongpassword"
      );
      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return access and refresh tokens for valid credentials", async () => {
      const registerDto: RegisterUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      await userService.register(registerDto);

      const loginDto: LoginUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await service.login(loginDto);
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      const loginDto: LoginUserDto = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      await expect(service.login(loginDto)).rejects.toThrow();
    });
  });

  describe("refreshToken", () => {
    it("should return new tokens for valid refresh token", async () => {
      const registerDto: RegisterUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      await userService.register(registerDto);

      const loginDto: LoginUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      const tokens = await service.login(loginDto);
      const result = await service.refreshToken(tokens.refreshToken);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
    });

    it("should throw UnauthorizedException for invalid refresh token", async () => {
      await expect(service.refreshToken("invalid-token")).rejects.toThrow();
    });
  });
});
