import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { UserEntity } from "../user/user.entity";

@Injectable()
export class DbSeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>
  ) {}

  async onApplicationBootstrap() {
    const isProd = process.env.NODE_ENV === "production";
    if (!isProd) return;

    const adminEmail = process.env.ADMIN_EMAIL || "alice@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Password123!";
    // If an admin already exists, do nothing
    const existing = await this.users.findOne({ where: { email: adminEmail } });
    if (existing) return;

    const hashed = await bcrypt.hash(adminPassword, 10);
    const admin = this.users.create({
      email: adminEmail,
      password: hashed,
      role: "admin",
    });
    await this.users.save(admin);
    // Optionally log something (avoid printing passwords)
    // console.log("Seeded admin user:", adminEmail);
  }
}
