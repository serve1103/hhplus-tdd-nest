import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from '../point.controller';
import { PointService } from '../point.service';
import { UserPoint } from '../point.model';
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
    jest.clearAllMocks();
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
    it('1. 조회 성공', async () => {
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
});
