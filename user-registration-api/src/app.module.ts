import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_FILTER } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserService } from "./user.service";
import { GlobalExceptionFilter } from "./global-exception.filter";
import { UserEntity } from "./user.entity";
import { databaseConfig, testDatabaseConfig } from "./database.config";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth.module";
import { UserController } from "./user.controller";
import { DbSeederService } from "./db-seeder.service";

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
