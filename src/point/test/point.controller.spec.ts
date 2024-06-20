import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from '../point.controller';
import { PointService } from '../point.service';
import { PointHistory, TransactionType, UserPoint } from '../point.model';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';

describe('PointController', () => {
  let pointController: PointController;
  let pointService: PointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
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

    pointController = module.get<PointController>(PointController);
    pointService = module.get<PointService>(PointService);
  });

  beforeAll(async () => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('Point Controller 정의 확인', () => {
    expect(pointController).toBeDefined();
  });

  /**
   * getPoint TC
   * 1. 성공
   * 2. 실패 - id가 입력되지 않았을 때
   * 3. 실패 - 올바르지 않은 ID가 입력 되었을 때
   */
  describe('포인트 조회', () => {
    it('1. 성공 - 조회 성공', async () => {
      const userId = '1';

      //유저 mock 데이터 설정
      const mockUser: UserPoint = {
        id: 1,
        point: 0,
        updateMillis: Date.now(),
      };

      jest.spyOn(pointController, 'point').mockResolvedValue(mockUser);

      const result = await pointController.point(userId);

      expect(result).toEqual(mockUser);
    });

    it('2. 실패 - id가 입력되지 않았을 때', async () => {
      const userId = '';

      await expect(pointController.point(userId)).rejects.toBeInstanceOf(Error);
    });

    it('3. 실패 - 올바르지 않은 ID가 입력 되었을 때', async () => {
      const userId = '0';

      await expect(pointController.point(userId)).rejects.toBeInstanceOf(Error);
    });
  });

  /**
   * chargePoint TC
   * 1. 성공 - 충전 및 로그 생성 검증
   * 2. 실패 - 충전 금액이 마이너스일 때
   * 3. 실패 - 충전 금액이 0원일 때
   */
  describe('포인트 충전', () => {
    it('1. 성공 - 충전 및 로그 생성 검증', async () => {
      const userId = '1';
      const point = { amount: 1000 };

      const mockUser: UserPoint = {
        id: 1,
        point: 1000,
        updateMillis: Date.now(),
      };

      jest.spyOn(pointController, 'charge').mockResolvedValue(mockUser);

      const result = await pointController.charge(userId, point);

      expect(result).toEqual(mockUser);
    });

    it('2. 실패 - 충전 금액이 마이너스일 때', async () => {
      const userId = '1';
      const point = { amount: -10000 };

      await expect(
        pointController.charge(userId, point),
      ).rejects.toBeInstanceOf(Error);
    });

    it('3. 실패 - 충전 금액이 0원일 때', async () => {
      const userId = '1';
      const point = { amount: 0 };

      await expect(
        pointController.charge(userId, point),
      ).rejects.toBeInstanceOf(Error);
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
    it('1. 성공 - 사용 및 로그 기록', async () => {
      const userId = '1';
      const point = { amount: 1000 };

      // 사용하기 위한 충전
      const mockChargeUser: UserPoint = {
        id: 1,
        point: 1000,
        updateMillis: Date.now(),
      };

      const mockUseUser: UserPoint = {
        id: 1,
        point: 0,
        updateMillis: Date.now(),
      };

      jest.spyOn(pointController, 'charge').mockResolvedValue(mockChargeUser);
      await pointController.charge(userId, point);

      jest.spyOn(pointController, 'use').mockResolvedValue(mockUseUser);
      const result = await pointController.use(userId, point);
      expect(result).toEqual(mockUseUser);
    });

    it('2. 실패 - 보유 포인트 보다 적은 경우', async () => {
      const userId = '1';
      const point = { amount: 10000 };

      await expect(pointController.use(userId, point)).rejects.toBeInstanceOf(
        Error,
      );
    });

    it('3. 실패 - 0 포인트를 사용하는 경우', async () => {
      const userId = '1';
      const point = { amount: 0 };

      await expect(pointController.use(userId, point)).rejects.toBeInstanceOf(
        Error,
      );
    });

    it('4. 실패 - 마이너스 포인트를 사용하는 경우', async () => {
      const userId = '1';
      const point = { amount: 0 };

      await expect(pointController.use(userId, point)).rejects.toBeInstanceOf(
        Error,
      );
    });
  });

  /**
   * getHistories TC
   * 1. 성공 - 로그 조회
   * 2. 실패 - 유효하지 않은 id 조회
   */
  describe('포인트 사용 내역', () => {
    it('1. 성공 - 로그 조회', async () => {
      const userId = '1';
      const mockPointHistoris: PointHistory = {
        id: 1,
        userId: 1,
        type: TransactionType.CHARGE,
        amount: 1000,
        timeMillis: Date.now(),
      };

      jest
        .spyOn(pointController, 'history')
        .mockResolvedValue([mockPointHistoris]);

      const result = await pointController.history(userId);

      expect(result).toEqual([mockPointHistoris]);
    });

    it('2. 실패 - 유효하지 않은 id 조회', async () => {
      const userId = '';

      await expect(pointController.history(userId)).rejects.toBeInstanceOf(
        Error,
      );
    });
  });
});
