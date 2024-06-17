import { Module } from '@nestjs/common';
import { PointController } from './point.controller';
import { DatabaseModule } from '../database/database.module';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';

@Module({
  imports: [DatabaseModule],
  controllers: [PointController],
  providers: [UserPointTable, PointHistoryTable],
})
export class PointModule {}
