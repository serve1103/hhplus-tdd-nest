import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '../point.service';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';
import { UserPoint } from '../point.model';

describe('PointService', () => {
  let pointService: PointService;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: UserPointTable,
          useValue: {
            selectById: jest.fn(),
            insertOrUpdate: jest.fn(),
          },
        },
        {
          provide: PointHistoryTable,
          useValue: {
            insert: jest.fn(),
            selectAllByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    pointService = module.get<PointService>(PointService);
    userPointTable = module.get<UserPointTable>(UserPointTable);
    pointHistoryTable = module.get<PointHistoryTable>(PointHistoryTable);
  });

  beforeAll(async () => {
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
    it('정상 조회', async () => {
      const userId = '1';

      const initUser: UserPoint = {
        id: 1,
        point: 0,
        updateMillis: Date.now(),
      };

      jest.spyOn(userPointTable, 'selectById').mockResolvedValue(initUser);

      const getUserPoint = await pointService.getPoint(userId);

      expect(getUserPoint).toEqual(initUser);
    });

    // 2. 실패 - id가 입력되지 않았을 때
    it('조회 실패 : ID를 입력하지 않음', async () => {
      const userId = '';
      const getUserPoint = pointService.getPoint(userId);

      await expect(getUserPoint).rejects.toBeInstanceOf(Error);
    });

    // 3. 실패 - 올바르지 않은 ID가 입력 되었을 때
    it('조회 실패 : 올바르지 않은 ID가 입력 되었을 때', async () => {
      const userId = '0';
      const getUserPoint = pointService.getPoint(userId);

      await expect(getUserPoint).rejects.toBeInstanceOf(Error);
    });
  });

  /**
   * chargePoint TC
   * 1. 성공 - 충전 및 로그 생성 검증
   * 2. 실패 - 충전 금액이 마이너스일 때
   * 3. 실패 - 충전 금액이 0원일 때
   */
  describe('포인트 충전', () => {
    // 1. 성공 - 충전 및 로그 생성 검증
    it('충전 성공', async () => {
      const userId = '1';
      const point = { amount: 1000 };

      // 포인트 충전 전 사용자 데이터
      const initUserPoint: UserPoint = {
        id: 1,
        point: 1000,
        updateMillis: Date.now(),
      };

      const updateUserPoint: UserPoint = {
        id: 1,
        point: 2000,
        updateMillis: Date.now(),
      };

      jest.spyOn(userPointTable, 'selectById').mockResolvedValue(initUserPoint);
      jest
        .spyOn(userPointTable, 'insertOrUpdate')
        .mockResolvedValue(updateUserPoint);

      jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({} as any);

      const chargeUserPoint = await pointService.chargePoint(userId, point);

      expect(chargeUserPoint).toEqual(updateUserPoint);
    });

    // 2. 실패 - 충전 금액이 마이너스일 때
    it('실패 - 충전 금액이 마이너스일 때', async () => {
      const userId = '1';
      const point = { amount: -1000 };
      const chargeUserPoint = pointService.chargePoint(userId, point);

      await expect(chargeUserPoint).rejects.toBeInstanceOf(Error);
    });

    // 3. 실패 - 충전 금액이 0원일 때
    it('실패 - 충전 금액이 0원일 때', async () => {
      const userId = '1';
      const point = { amount: 0 };
      const chargeUserPoint = pointService.chargePoint(userId, point);

      await expect(chargeUserPoint).rejects.toBeInstanceOf(Error);
    });
  });

  /**
   * usePoint TC
   * 1. 성공 - 사용 및 로그 기록
   * 2. 실패 - 보유 포인트 보다 적은 경우
   * 3. 실패 - 0 포인트를 사용하는 경우
   * 4. 실패 - 마이너스 포인트를 사용하는 경우
   */
  describe('포인트 사용', () => {
    // 1. 성공 - 사용 및 로그 기록
    it('사용 성공', async () => {
      const userId = '1';
      const point = { amount: 1000 };

      // 사용 전 포인트 충전을 위한 객체
      const chargeUserPoint: UserPoint = {
        id: 1,
        point: 10000,
        updateMillis: Date.now(),
      };

      // 포인트 사용을 위한 객체
      const usingUserPoint: UserPoint = {
        id: 1,
        point: chargeUserPoint.point - point.amount,
        updateMillis: Date.now(),
      };

      // 유저 포인트 조회 Mock 설정
      jest
        .spyOn(userPointTable, 'selectById')
        .mockResolvedValue(chargeUserPoint);
      // 유저 포인트 충전 Mock 설정
      jest
        .spyOn(userPointTable, 'insertOrUpdate')
        .mockResolvedValue(chargeUserPoint);
      // 유저 포인트 충전 로그 Mock 설정
      jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({} as any);

      // 포인트 충전 동작
      await pointService.chargePoint(userId, point);

      // 유저 포인트 사용 Mock 설정
      jest
        .spyOn(userPointTable, 'insertOrUpdate')
        .mockResolvedValue(usingUserPoint);
      // 유저 포인트 사용 로그 Mock 설정
      jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({} as any);

      // 포인트 사용
      const useUserPoint = await pointService.usePoint(userId, point);

      // 결과 비교
      expect(useUserPoint).toEqual(usingUserPoint);
    });

    // 2. 실패 - 보유 포인트 보다 적은 경우
    it('실패 - 보유 포인트 보다 적은 경우', async () => {
      const userId = '1';
      const point = { amount: 1500 };

      // 포인트 충전을 위한 객체
      const chargeUserPoint: UserPoint = {
        id: 1,
        point: 1000,
        updateMillis: Date.now(),
      };

      // 유저 포인트 충전 Mock 설정
      jest
        .spyOn(userPointTable, 'insertOrUpdate')
        .mockResolvedValue(chargeUserPoint);
      // 유저 포인트 충전 로그 Mock 설정
      jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({} as any);

      // 포인트 사용
      const useUserPoint = pointService.usePoint(userId, point);

      // 오류가 발생할 것을 예상하여 reject를 테스트
      await expect(useUserPoint).rejects.toBeInstanceOf(Error);
    });

    // 3. 실패 - 0 포인트를 사용하는 경우
    it('실패 - 0 포인트를 사용하는 경우', async () => {
      const userId = '1';
      const point = { amount: 0 };

      // 포인트 충전을 위한 객체
      const chargeUserPoint: UserPoint = {
        id: 1,
        point: 1000,
        updateMillis: Date.now(),
      };

      // 유저 포인트 충전 Mock 설정
      jest
        .spyOn(userPointTable, 'insertOrUpdate')
        .mockResolvedValue(chargeUserPoint);
      // 유저 포인트 충전 로그 Mock 설정
      jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({} as any);

      // 포인트 사용
      const useUserPoint = pointService.usePoint(userId, point);

      // 오류가 발생할 것을 예상하여 reject를 테스트
      await expect(useUserPoint).rejects.toBeInstanceOf(Error);
    });

    // 4. 실패 - 마이너스 포인트를 사용하는 경우
    it('실패 - 마이너스 포인트를 사용하는 경우', async () => {
      const userId = '1';
      const point = { amount: -10000 };

      // 포인트 충전을 위한 객체
      const chargeUserPoint: UserPoint = {
        id: 1,
        point: 1000,
        updateMillis: Date.now(),
      };

      // 유저 포인트 충전 Mock 설정
      jest
        .spyOn(userPointTable, 'insertOrUpdate')
        .mockResolvedValue(chargeUserPoint);
      // 유저 포인트 충전 로그 Mock 설정
      jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({} as any);

      // 포인트 사용
      const useUserPoint = pointService.usePoint(userId, point);

      // 오류가 발생할 것을 예상하여 reject를 테스트
      await expect(useUserPoint).rejects.toBeInstanceOf(Error);
    });
  });
});
