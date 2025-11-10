/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

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
});
