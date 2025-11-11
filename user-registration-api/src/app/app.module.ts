import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_FILTER } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserService } from "../user/user.service";
import { GlobalExceptionFilter } from "../shared/global-exception.filter";
import { UserEntity } from "../user/user.entity";
import { databaseConfig, testDatabaseConfig } from "../shared/database.config";
import { HealthController } from "../health/health.controller";
import { AuthModule } from "../auth/auth.module";
import { UserController } from "../user/user.controller";
import { DbSeederService } from "../shared/db-seeder.service";

const isTest = process.env.NODE_ENV === "test";

@Module({
  imports: [
    TypeOrmModule.forRoot(isTest ? testDatabaseConfig : databaseConfig),
    TypeOrmModule.forFeature([UserEntity]),
    AuthModule,
  ],
  controllers: [AppController, HealthController, UserController],
  providers: [
    AppService,
    UserService,
    DbSeederService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
