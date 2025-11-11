import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app/app.module";

describe("User Registration API (e2e)", () => {
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

  describe("POST /user/register", () => {
    it("should register user and return user data without password", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "e2e-user@example.com",
          password: "securepassword123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body).toHaveProperty("email", "e2e-user@example.com");
          expect(res.body).toHaveProperty("createdAt");
          expect(res.body).not.toHaveProperty("password");
          expect(typeof res.body.id).toBe("string");
          expect(typeof res.body.createdAt).toBe("string");
        });
    });

    it("should handle multiple registrations with different emails", async () => {
      // Register first user
      await request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "user1@example.com",
          password: "password123",
        })
        .expect(201);

      // Register second user
      return request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "user2@example.com",
          password: "password456",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe("user2@example.com");
        });
    });

    it("should return proper error for malformed JSON", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .set("Content-Type", "application/json")
        .send("invalid json")
        .expect(400);
    });

    it("should return proper error for wrong content type", () => {
      return request(app.getHttpServer())
        .post("/user/register")
        .set("Content-Type", "text/plain")
        .send("email=test@example.com&password=password123")
        .expect(400);
    });
  });

  describe("POST /auth/login", () => {
    it("should login successfully and return tokens", async () => {
      // First register a user
      await request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "login-test@example.com",
          password: "testpassword123",
        })
        .expect(201);

      // Then login
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "login-test@example.com",
          password: "testpassword123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("accessToken");
          expect(res.body).toHaveProperty("refreshToken");
          expect(typeof res.body.accessToken).toBe("string");
          expect(typeof res.body.refreshToken).toBe("string");
        });
    });

    it("should return 401 for invalid credentials", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 401);
          expect(res.body).toHaveProperty("error", "Invalid credentials");
        });
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh tokens successfully", async () => {
      // Register and login first
      await request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "refresh-test@example.com",
          password: "testpassword123",
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "refresh-test@example.com",
          password: "testpassword123",
        })
        .expect(201);

      const refreshToken = loginResponse.body.refreshToken;

      // Now refresh
      return request(app.getHttpServer())
        .post("/auth/refresh")
        .send({
          refreshToken,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("accessToken");
          expect(res.body).toHaveProperty("refreshToken");
        });
    });

    it("should return 400 for missing refresh token", () => {
      return request(app.getHttpServer())
        .post("/auth/refresh")
        .send({})
        .expect(400);
    });
  });

  describe("GET /user/profile", () => {
    it("should return user profile for authenticated user", async () => {
      // Register and login
      await request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "profile-test@example.com",
          password: "testpassword123",
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "profile-test@example.com",
          password: "testpassword123",
        })
        .expect(201);

      const accessToken = loginResponse.body.accessToken;

      // Get profile
      return request(app.getHttpServer())
        .get("/user/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body).toHaveProperty("email", "profile-test@example.com");
          expect(res.body).toHaveProperty("role", "user");
          expect(res.body).toHaveProperty("createdAt");
          expect(res.body).not.toHaveProperty("password");
        });
    });

    it("should return 401 for unauthenticated request", () => {
      return request(app.getHttpServer()).get("/user/profile").expect(401);
    });
  });

  describe("GET /user/admin", () => {
    it("should return 403 for regular user trying to access admin endpoint", async () => {
      // Register and login as regular user
      await request(app.getHttpServer())
        .post("/user/register")
        .send({
          email: "regular-user@example.com",
          password: "testpassword123",
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "regular-user@example.com",
          password: "testpassword123",
        })
        .expect(201);

      const accessToken = loginResponse.body.accessToken;

      // Try to access admin route as regular user
      return request(app.getHttpServer())
        .get("/user/admin")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(403);
    });

    it("should return 401 for unauthenticated request to admin endpoint", () => {
      return request(app.getHttpServer()).get("/user/admin").expect(401);
    });
  });

  describe("GET /health/db", () => {
    it("should return database health status", () => {
      return request(app.getHttpServer())
        .get("/health/db")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("status");
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("db");
          expect(res.body.db).toHaveProperty("status");
          expect(["connected", "disconnected"]).toContain(res.body.db.status);
        });
    });
  });
});
