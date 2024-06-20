import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from '../point.controller';
import { PointService } from '../point.service';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';

describe('PointController', () => {
  let pointController: PointController;
  let pointService: PointService;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointController,
        PointService,
        UserPointTable,
        PointHistoryTable,
      ],
    }).compile();

    pointController = module.get<PointController>(PointController);
    pointService = module.get<PointService>(PointService);
    userPointTable = module.get<UserPointTable>(UserPointTable);
    pointHistoryTable = module.get<PointHistoryTable>(PointHistoryTable);
  });

  it('should be defined', () => {
    expect(pointController).toBeDefined();
  });
});
