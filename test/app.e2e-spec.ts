/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ASYNC_METHOD_SUFFIX } from '@nestjs/common/module-utils/constants';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  /**
     * e2e get TC
     * 1. 성공
     * 2. 실패 - id가 입력되지 않았을 때
     * 3. 실패 - 올바르지 않은 ID가 입력 되었을 때
     */
  describe('포인트 조회 TC', () => {
    let userId = '';
    // 유저 정보 확인하는 test
    it('1. 성공 - 조회 성공', async () => {
      userId = '1';

      // user 호출
      const res = await request(app.getHttpServer()).get(`/point/${userId}`).expect(200);

      // 응답 및 검증
      expect(res.body).toEqual({
        id: 1,
        point: 0,
        updateMillis: expect.any(Number), // 시간 타입 검증
      });
    });

    // 유저 정보를 확인 실패 하는 test
    it('2. 실패 - 유효하지 않은 id', async () => {
      userId = '';

      // user 호출
      const res = await request(app.getHttpServer()).get(`/point/${userId}`).expect(404);

      // 응답 및 검증
      expect(res.body).toEqual({
        error: 'Not Found',
        message: 'Cannot GET /point/',
        statusCode: 404
      });
    });

    // 유저 정보를 확인 실패 하는 test
    it('3. 실패 - 올바르지 않은 ID가 입력 되었을 때', async () => {
      userId = '0';

      // user 호출
      const res = await request(app.getHttpServer()).get(`/point/${userId}`).expect(500);

      // 응답 및 검증
      expect(res.body).toEqual({
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });

  /**
     * e2e charge TC
     * 1. 성공 - 충전 및 로그 생성 검증
     * 2. 실패 - 충전 금액이 마이너스일 때
     * 3. 실패 - 충전 금액이 0원일 때
     */
  describe('포인트 충전 TC', () => {
    // 유저의 포인트를 충전한다.
    it('1. 성공 - 충전 및 로그 생성 검증', async () => {
      // 100포인트 충전
      const res = await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 100 })
        .expect(200);

      // 응답 및 검증
      expect(res.body).toEqual({
        id: 1,
        point: 100,
        updateMillis: expect.any(Number),
      });
    });

    // 유저의 포인트를 충전한다.(실패)
    it('2. 실패 - 충전 금액이 마이너스일 때', async () => {
      // 음수 충전
      const res = await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: -100 })
        .expect(500);

      // 응답 및 검증
      expect(res.body).toEqual({
        message: 'Internal server error',
        statusCode: 500,
      });
    });

    // 유저의 포인트를 충전한다.(실패2)
    it('3. 실패 - 충전 금액이 0원일 때', async () => {
      // 0원 충전
      const res = await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 0 })
        .expect(500);

      // 응답 및 검증
      expect(res.body).toEqual({
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });

  /**
   * e2e use TC
   * 1. 성공 - 사용 및 로그 기록
   * 2. 실패 - 사용에 실패한다.
   */
  describe('포인트 사용', () => {
    //유저의 포인트를 사용한다.(성공)
    it('1. 성공 - 사용 및 로그 기록', async () => {
      // test를 위한 충전
      await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 100 })
        .expect(200);

      // point 사용
      const res = await request(app.getHttpServer())
        .patch('/point/1/use')
        .send({ amount: 100 })
        .expect(200);

      // 전부 소진
      expect(res.body).toEqual({
        id: 1,
        point: 0,
        updateMillis: expect.any(Number),
      });
    });

    //유저의 포인트를 사용한다.(실패1)
    it('2. 실패 - 사용에 실패한다.', async () => {
      const res = await request(app.getHttpServer())
        .patch('/point/1/use')
        .send({ amount: 100 })
        .expect(500);

      expect(res.body).toEqual({
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });

  /**
     * e2e Histories TC
     * 1. 성공 - 로그 조회
     * 2. 실패 - 유효하지 않은 id 조회
     */
  describe('포인트 사용 내역', () => {
    // 유저 포인트 거래내역 확인
    it('1. 성공 - 로그 조회', async () => {
      // test를 위한 충전
      await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 100 })
        .expect(200);
      // test를 위한 사용
      await request(app.getHttpServer())
        .patch('/point/1/use')
        .send({ amount: 100 })
        .expect(200);

      // 로그 조회
      const res = await request(app.getHttpServer())
        .get('/point/1/histories')
        .expect(200);

      // test 응답값
      expect(res.body).toEqual([
        {
          amount: 100,
          id: 1,
          timeMillis: expect.any(Number),
          type: 0,
          userId: 1,
        },
        {
          amount: 100,
          id: 2,
          timeMillis: expect.any(Number),
          type: 1,
          userId: 1,
        },
      ]);
    });
  });

  /**
   * 동시성 e2e
   * 
   * 100000포인트 충전 이후
   * 1. 1000충전
   * 2. 150 충전
   * 3. 10000 충전
   * 4. 5000 사용
   * 5. 20000 사용 
   */
  describe('동시성 테스트', () => {
    it('동시에 5번의 동작', async () => {
      await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 100000 })
        .expect(200);

      await Promise.all([
        request(app.getHttpServer())
          .patch('/point/1/charge')
          .send({ amount: 1000 })
          .expect(200),
        request(app.getHttpServer())
          .patch('/point/1/charge')
          .send({ amount: 150 })
          .expect(200),
        request(app.getHttpServer())
          .patch('/point/1/use')
          .send({ amount: 10000 })
          .expect(200),
        request(app.getHttpServer())
          .patch('/point/1/charge')
          .send({ amount: 5000 })
          .expect(200),
        request(app.getHttpServer())
          .patch('/point/1/use')
          .send({ amount: 20000 })
          .expect(200),
      ]);

      const res = await request(app.getHttpServer())
        .get('/point/1')
        .expect(200);

      expect(res.body.point).toEqual(
        100000 + 1000 + 150 + 5000 - 10000 - 20000,
      );
    });
  });

  // 끝점
  afterAll(async () => {
    await app.close();
  });
});
