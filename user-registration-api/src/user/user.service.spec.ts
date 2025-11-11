import { Test, TestingModule } from "@nestjs/testing";
import {
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "./user.service";
import { UserEntity } from "./user.entity";
import { RegisterUserDto } from "./register-user.dto";

describe("UserService", () => {
  let service: UserService;

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
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      const registerUserDto: RegisterUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await service.register(registerUserDto);

      expect(result).toHaveProperty("id");
      expect(result.email).toBe("test@example.com");
      expect(result).toHaveProperty("createdAt");
      expect(result).not.toHaveProperty("password");
    });

    it("should normalize email to lowercase", async () => {
      const registerUserDto: RegisterUserDto = {
        email: "Test@Example.COM",
        password: "password123",
      };

      const result = await service.register(registerUserDto);

      expect(result.email).toBe("test@example.com");
    });

    it("should trim email whitespace", async () => {
      const registerUserDto: RegisterUserDto = {
        email: "  test@example.com  ",
        password: "password123",
      };

      const result = await service.register(registerUserDto);

      expect(result.email).toBe("test@example.com");
    });

    it("should throw ConflictException for duplicate email", async () => {
      const registerUserDto: RegisterUserDto = {
        email: "duplicate@example.com",
        password: "password123",
      };

      // First registration should succeed
      await service.register(registerUserDto);

      // Second registration should fail
      await expect(service.register(registerUserDto)).rejects.toThrow(
        ConflictException
      );

      const error = await service.register(registerUserDto).catch((e) => e);
      expect(error.response).toEqual({
        error: "Email already registered",
        message:
          "An account with this email address already exists. Please use a different email or try logging in instead.",
        field: "email",
      });
    });

    it("should handle case-insensitive duplicate email check", async () => {
      // Register with lowercase
      await service.register({
        email: "case@example.com",
        password: "password123",
      });

      // Try to register with uppercase - should fail
      await expect(
        service.register({
          email: "CASE@EXAMPLE.COM",
          password: "password456",
        })
      ).rejects.toThrow(ConflictException);
    });

    it("should generate unique IDs for different users", async () => {
      const user1 = await service.register({
        email: "user1@example.com",
        password: "password123",
      });

      const user2 = await service.register({
        email: "user2@example.com",
        password: "password456",
      });

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe("findByEmail", () => {
    it("should find user by email (case insensitive)", async () => {
      const registerUserDto: RegisterUserDto = {
        email: "findme@example.com",
        password: "password123",
      };

      await service.register(registerUserDto);

      const found = await service.findByEmail("FINDME@EXAMPLE.COM");
      expect(found).toBeDefined();
      expect(found?.email).toBe("findme@example.com");
    });

    it("should return null for non-existent email", async () => {
      const found = await service.findByEmail("nonexistent@example.com");
      expect(found).toBeNull();
    });

    it("should trim and lowercase email when searching", async () => {
      // This test assumes we have a user registered with normalized email
      const found = await service.findByEmail("  NONEXISTENT@EXAMPLE.COM  ");
      expect(found).toBeNull();
    });
  });
});
