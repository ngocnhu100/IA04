import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, QueryFailedError } from "typeorm";
import * as bcrypt from "bcrypt";
import { UserEntity } from "./user.entity";
import { RegisterUserDto } from "./register-user.dto";
import { LoginUserDto } from "./login-user.dto";

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<User> {
    try {
      const { email, password } = registerUserDto;

      // Validate input data
      if (!email || typeof email !== "string") {
        throw new BadRequestException({
          error: "Invalid email",
          message: "Email address is required and must be a valid string.",
          field: "email",
        });
      }

      if (!password || typeof password !== "string") {
        throw new BadRequestException({
          error: "Invalid password",
          message: "Password is required and must be a valid string.",
          field: "password",
        });
      }

      // Normalize email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();

      // Validate email format after normalization
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new BadRequestException({
          error: "Invalid email format",
          message:
            "Please provide a valid email address (e.g., user@example.com).",
          field: "email",
        });
      }

      // Check if user already exists
      let existingUser: UserEntity | null;
      try {
        existingUser = await this.userRepository.findOne({
          where: { email: normalizedEmail },
        });
      } catch (error) {
        throw new ServiceUnavailableException({
          error: "Database connection error",
          message: "Unable to verify email uniqueness. Please try again later.",
          field: "general",
        });
      }

      if (existingUser) {
        throw new ConflictException({
          error: "Email already registered",
          message:
            "An account with this email address already exists. Please use a different email or try logging in instead.",
          field: "email",
        });
      }

      // Hash the password
      let hashedPassword: string;
      try {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");
        hashedPassword = await bcrypt.hash(password, saltRounds);
      } catch (error) {
        throw new InternalServerErrorException({
          error: "Password processing failed",
          message:
            "Unable to securely process your password. Please try again.",
          field: "password",
        });
      }

      // Create new user
      let newUser: UserEntity;
      try {
        newUser = this.userRepository.create({
          email: normalizedEmail,
          password: hashedPassword,
        });

        await this.userRepository.save(newUser);
      } catch (error) {
        // Handle specific database errors
        if (error instanceof QueryFailedError) {
          const dbError = error as any;

          // Handle unique constraint violations
          if (dbError.code === "23505" || dbError.code === "ER_DUP_ENTRY") {
            throw new ConflictException({
              error: "Email already registered",
              message:
                "An account with this email address was just created. Please try logging in instead.",
              field: "email",
            });
          }

          // Handle connection or other database errors
          throw new ServiceUnavailableException({
            error: "Database operation failed",
            message:
              "Unable to save your account information. Please try again later.",
            field: "general",
          });
        }

        throw new InternalServerErrorException({
          error: "Account creation failed",
          message:
            "Unable to create your account due to an unexpected error. Please try again.",
          field: "general",
        });
      }

      // Return user without password for security
      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword as User;
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException ||
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error during user registration:", error);
      throw new InternalServerErrorException({
        error: "Registration failed",
        message:
          "An unexpected error occurred during registration. Please try again later.",
        field: "general",
      });
    }
  }

  // Helper method to find user by email (for future use)
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      if (!email || typeof email !== "string") {
        throw new BadRequestException({
          error: "Invalid email",
          message: "Email address must be a valid string.",
          field: "email",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      return await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error("Error finding user by email:", error);
      throw new ServiceUnavailableException({
        error: "Database query failed",
        message:
          "Unable to search for user information. Please try again later.",
        field: "general",
      });
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<User> {
    try {
      const { email, password } = loginUserDto;

      // Validate input data
      if (!email || typeof email !== "string") {
        throw new BadRequestException({
          error: "Invalid email",
          message: "Email address is required and must be a valid string.",
          field: "email",
        });
      }

      if (!password || typeof password !== "string") {
        throw new BadRequestException({
          error: "Invalid password",
          message: "Password is required and must be a valid string.",
          field: "password",
        });
      }

      // Normalize email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();

      // Validate email format after normalization
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new BadRequestException({
          error: "Invalid email format",
          message:
            "Please provide a valid email address (e.g., user@example.com).",
          field: "email",
        });
      }

      // Find user by email
      let user: UserEntity | null;
      try {
        user = await this.userRepository.findOne({
          where: { email: normalizedEmail },
        });
      } catch (error) {
        throw new ServiceUnavailableException({
          error: "Database connection error",
          message: "Unable to verify credentials. Please try again later.",
          field: "general",
        });
      }

      if (!user) {
        throw new UnauthorizedException({
          error: "Invalid credentials",
          message:
            "The email address or password you entered is incorrect. Please check your credentials and try again.",
          field: "general",
        });
      }

      // Verify password
      let isPasswordValid: boolean;
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (error) {
        throw new InternalServerErrorException({
          error: "Password verification failed",
          message: "Unable to verify your password. Please try again.",
          field: "password",
        });
      }

      if (!isPasswordValid) {
        throw new UnauthorizedException({
          error: "Invalid credentials",
          message:
            "The email address or password you entered is incorrect. Please check your credentials and try again.",
          field: "general",
        });
      }

      // Return user without password for security
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException ||
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error during user login:", error);
      throw new InternalServerErrorException({
        error: "Login failed",
        message:
          "An unexpected error occurred during login. Please try again later.",
        field: "general",
      });
    }
  }
}
