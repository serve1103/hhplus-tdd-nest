import { Injectable, NotFoundException } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointBody } from './point.dto';

@Injectable()
export class PointService {
  constructor(private readonly userDb: UserPointTable) {}

  async getPoint(id: string) {
    const userId = Number.parseInt(id);
    if (isNaN(userId)) throw new Error('유효하지 않은 id 입니다.');

    const userPoint = await this.userDb.selectById(userId);

    // 기본 값 여부를 판단하는 로직
    if (userPoint.point === 0 && userPoint.updateMillis > Date.now() - 1000) {
      await this.userDb.insertOrUpdate(userId, userPoint.point);
    }

    return userPoint;
  }

  async chargePoint(id: string, pointDto: PointBody) {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;

    if (amount < 0) throw new Error('포인트는 음수일 수 없습니다.');
    if (amount == 0) throw new Error('0 포인트는 충전할 수 없습니다.');

    const userPoint = await this.userDb.insertOrUpdate(userId, amount);

    return userPoint;
  }

  async usePoint(id: string, pointDto: PointBody) {
    const userId = Number.parseInt(id);
    return { id: userId, point: 0, updateMillis: Date.now() };
  }
}
