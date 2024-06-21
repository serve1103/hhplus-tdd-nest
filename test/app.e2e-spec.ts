/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // 유저 정보 확인하는 test
  it('/point/:id (GET)', async () => {
    // user 호출
    const res = await request(app.getHttpServer()).get('/point/1').expect(200);

    // 응답 및 검증
    expect(res.body).toEqual({
      id: 1,
      point: 0,
      updateMillis: expect.any(Number), // 시간 타입 검증
    });
  });

  // 유저의 포인트를 충전한다.
  it('/point/:id/charge (PATCH)', async () => {
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
  it('/point/:id/charge (PATCH)', async () => {
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
  it('/point/:id/charge (PATCH)', async () => {
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

  //유저의 포인트를 사용한다.(성공)
  it('/point/:id/use (PATCH)', async () => {
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
  it('/point/:id/use (PATCH)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/point/1/use')
      .send({ amount: 100 })
      .expect(500);

    expect(res.body).toEqual({
      message: 'Internal server error',
      statusCode: 500,
    });
  });

  // 유저 포인트 거래내역 확인
  it('/point/:id/histories (GET)', async () => {
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
