import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from "class-validator";

export class RegisterUserDto {
  @IsNotEmpty({ message: "Email address is required to create your account" })
  @IsEmail(
    {},
    {
      message:
        "Please enter a valid email address (for example: yourname@example.com)",
    }
  )
  email!: string;

  @IsNotEmpty({ message: "Password is required to secure your account" })
  @IsString({
    message: "Password must be text (no special characters allowed)",
  })
  @MinLength(8, {
    message:
      "Password must be at least 8 characters long for better security. Consider using a mix of letters, numbers, and symbols.",
  })
  @MaxLength(128, {
    message:
      "Password must not exceed 128 characters. Please choose a shorter password.",
  })
  password!: string;
}
