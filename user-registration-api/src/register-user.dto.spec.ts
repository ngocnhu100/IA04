import { validate } from "class-validator";
import { RegisterUserDto } from "./register-user.dto";

describe("RegisterUserDto", () => {
  it("should pass validation with valid data", async () => {
    const dto = new RegisterUserDto();
    dto.email = "test@example.com";
    dto.password = "validpassword123";

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should fail validation with empty email", async () => {
    const dto = new RegisterUserDto();
    dto.email = "";
    dto.password = "validpassword123";

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const emailErrors = errors.filter((error) => error.property === "email");
    expect(emailErrors.length).toBeGreaterThan(0);
  });

  it("should fail validation with invalid email format", async () => {
    const dto = new RegisterUserDto();
    dto.email = "invalid-email";
    dto.password = "validpassword123";

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const emailErrors = errors.filter((error) => error.property === "email");
    expect(emailErrors.length).toBeGreaterThan(0);
    expect(emailErrors[0].constraints).toHaveProperty("isEmail");
  });

  it("should fail validation with password too short", async () => {
    const dto = new RegisterUserDto();
    dto.email = "test@example.com";
    dto.password = "short";

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const passwordErrors = errors.filter(
      (error) => error.property === "password"
    );
    expect(passwordErrors.length).toBeGreaterThan(0);
    expect(passwordErrors[0].constraints).toHaveProperty("minLength");
  });

  it("should fail validation with password too long", async () => {
    const dto = new RegisterUserDto();
    dto.email = "test@example.com";
    dto.password = "a".repeat(129); // 129 characters

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const passwordErrors = errors.filter(
      (error) => error.property === "password"
    );
    expect(passwordErrors.length).toBeGreaterThan(0);
    expect(passwordErrors[0].constraints).toHaveProperty("maxLength");
  });

  it("should fail validation with empty password", async () => {
    const dto = new RegisterUserDto();
    dto.email = "test@example.com";
    dto.password = "";

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const passwordErrors = errors.filter(
      (error) => error.property === "password"
    );
    expect(passwordErrors.length).toBeGreaterThan(0);
  });

  it("should fail validation with all fields missing", async () => {
    const dto = new RegisterUserDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const emailErrors = errors.filter((error) => error.property === "email");
    const passwordErrors = errors.filter(
      (error) => error.property === "password"
    );

    expect(emailErrors.length).toBeGreaterThan(0);
    expect(passwordErrors.length).toBeGreaterThan(0);
  });

  it("should pass validation with minimum valid password length", async () => {
    const dto = new RegisterUserDto();
    dto.email = "test@example.com";
    dto.password = "12345678"; // exactly 8 characters

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should pass validation with maximum valid password length", async () => {
    const dto = new RegisterUserDto();
    dto.email = "test@example.com";
    dto.password = "a".repeat(128); // exactly 128 characters

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
