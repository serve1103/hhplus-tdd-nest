import { Injectable } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointBody } from './point.dto';
import { PointHistoryTable } from '../database/pointhistory.table';
import { PointHistory, TransactionType } from './point.model';

@Injectable()
export class PointService {
  constructor(
    private readonly userDb: UserPointTable,
    private readonly pointHistoryTable: PointHistoryTable,
  ) {}

  // 유저의 포인트를 조회한다.
  async getPoint(id: string) {
    const userId = Number.parseInt(id);
    // 파라미터 검증
    if (isNaN(userId)) throw new Error('유효하지 않은 id 입니다.');
    // 유저 point 검색
    const userPoint = await this.userDb.selectById(userId);

    // 유저 정보가 없으면 새로운 유저 생성
    if (userPoint.point === 0 && userPoint.updateMillis > Date.now() - 1000) {
      await this.userDb.insertOrUpdate(userId, userPoint.point);
    }

    return userPoint;
  }

  // 포인트 충전
  async chargePoint(id: string, pointDto: PointBody) {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;

    // 음수와 0원은 충전이 되지 않도록 에러반환
    if (amount < 0) throw new Error('포인트는 음수일 수 없습니다.');
    if (amount == 0) throw new Error('0 포인트는 충전할 수 없습니다.');

    // 정상적인 포인트만 충전
    const userPoint = await this.userDb.insertOrUpdate(userId, amount);

    // 로그 저장
    await this.pointHistoryTable.insert(
      userPoint.id,
      userPoint.point,
      TransactionType.CHARGE,
      Date.now(),
    );

    return userPoint;
  }

  // 포인트 사용
  async usePoint(id: string, pointDto: PointBody) {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;
    // 유저가 보요하고 있는 포인트 조회
    const userPoint = await this.userDb.selectById(userId);
    // 포인트 계산을 위한 변수
    let usedAmount = 0;
    // 사용하려는 포인트가 보유 포인트보다 작은 경우
    if (amount > userPoint.point) {
      // 보유 포인트 반환
      usedAmount = userPoint.point;
      throw new Error('보유 포인트가 적습니다.');
    } else {
      // 보유 포인트 차감
      usedAmount = userPoint.point - amount;
    }

    // 결과 저장
    const result = await this.userDb.insertOrUpdate(userId, usedAmount);
    // 로그 저장
    await this.pointHistoryTable.insert(
      result.id,
      result.point,
      TransactionType.USE,
      Date.now(),
    );
    return result;
  }

  // 로그 조회
  async getHistory(id: string): Promise<PointHistory[]> {
    const userId = Number.parseInt(id);
    if (isNaN(userId)) throw new Error('유효하지 않은 id 입니다.');
    const result = this.pointHistoryTable.selectAllByUserId(userId);
    return result;
  }
}
