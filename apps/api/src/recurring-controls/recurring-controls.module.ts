import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RecurringControlsController } from "./recurring-controls.controller";
import { RecurringControlsService } from "./recurring-controls.service";

@Module({
  imports: [AuthModule],
  controllers: [RecurringControlsController],
  providers: [RecurringControlsService],
  exports: [RecurringControlsService],
})
export class RecurringControlsModule {}
