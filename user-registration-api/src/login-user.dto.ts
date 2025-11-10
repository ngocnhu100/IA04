import { IsEmail, IsString, IsNotEmpty } from "class-validator";

export class LoginUserDto {
  @IsNotEmpty({ message: "Email address is required to sign in" })
  @IsEmail(
    {},
    {
      message:
        "Please enter a valid email address (for example: yourname@example.com)",
    }
  )
  email!: string;

  @IsNotEmpty({ message: "Password is required to sign in" })
  @IsString({ message: "Password must be text" })
  password!: string;
}
