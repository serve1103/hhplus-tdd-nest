import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '../point.service';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';

describe('PointService', () => {
  let pointService: PointService;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointService, UserPointTable, PointHistoryTable],
    }).compile();

    pointService = module.get<PointService>(PointService);
    userPointTable = module.get<UserPointTable>(UserPointTable);
    pointHistoryTable = module.get<PointHistoryTable>(PointHistoryTable);
  });

  beforeAll(async () => {
    // jest.setSystemTime();
    jest.useFakeTimers();
  });

  it('PointService 정상 ', () => {
    expect(pointService).toBeDefined();
  });

  /**
   * getPoint TC
   * 1. 성공
   * 2. 실패 - id가 입력되지 않았을 때
   * 3. 실패 - 올바르지 않은 ID가 입력 되었을 때
   */
  describe('유저 포인트 조회', () => {
    // 1. 성공
    it('정상 조회', () => {
      const userId = '1';
      const getUserPoint = pointService.getPoint(userId);

      expect(getUserPoint).resolves.toBe({
        id: 1,
        point: 0,
        updateMillis: Date.now(),
      });
    });

    // 2. 실패 - id가 입력되지 않았을 때
    it('조회 실패 : ID를 입력하지 않음', () => {
      const userId = '';
      const getUserPoint = pointService.getPoint(userId);

      expect(getUserPoint).rejects.toBeInstanceOf(Error);
    });

    // 3. 실패 - 올바르지 않은 ID가 입력 되었을 때
    it('조회 실패 : 올바르지 않은 ID가 입력 되었을 때', () => {
      const userId = '0';
      const getUserPoint = pointService.getPoint(userId);

      expect(getUserPoint).rejects.toBeInstanceOf(Error);
    });
  });
});
