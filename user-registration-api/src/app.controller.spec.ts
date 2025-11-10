import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("/ (GET)", () => {
    it("should return hello message", () => {
      return request(app.getHttpServer())
        .get("/")
        .expect(200)
        .expect("Hello from NestJS user-registration-api");
    });
  });

  describe("/user/register (POST)", () => {
    it("should register a new user successfully", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "e2e-test@example.com",
          password: "testpassword123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.email).toBe("e2e-test@example.com");
          expect(res.body).toHaveProperty("createdAt");
          expect(res.body).not.toHaveProperty("password");
        });
    });

    it("should return 400 for invalid email", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "invalid-email",
          password: "validpassword123",
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(res.body).toHaveProperty("error", "Bad Request");
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it("should return 400 for password too short", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "test@example.com",
          password: "short",
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(res.body).toHaveProperty("error", "Bad Request");
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it("should return 400 for missing email", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          password: "validpassword123",
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(res.body).toHaveProperty("error", "Bad Request");
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it("should return 400 for missing password", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "test@example.com",
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(res.body).toHaveProperty("error", "Bad Request");
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it("should return 400 for empty request body", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(res.body).toHaveProperty("error", "Bad Request");
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it("should return 409 for duplicate email", async () => {
      // First registration
      await request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "duplicate@example.com",
          password: "password123",
        })
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "duplicate@example.com",
          password: "differentpassword123",
        })
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 409);
          expect(res.body).toHaveProperty("error", "Email already registered");
          expect(res.body).toHaveProperty("message");
          expect(res.body.message).toContain("already exists");
        });
    });

    it("should handle case-insensitive duplicate email check", async () => {
      // Register with lowercase
      await request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "case-test@example.com",
          password: "password123",
        })
        .expect(201);

      // Try to register with uppercase - should fail
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "CASE-TEST@EXAMPLE.COM",
          password: "password456",
        })
        .expect(409);
    });

    it("should normalize email to lowercase", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "UPPERCASE@EXAMPLE.COM",
          password: "password123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe("uppercase@example.com");
        });
    });
  });
});
