/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserPointTable } from './../src/database/userpoint.table';
// import { PointHistoryTable } from './../src/database/pointhistory.table';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let userDb: UserPointTable;
  // let historyDb: PointHistoryTable;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userDb = moduleFixture.get<UserPointTable>(UserPointTable); // Mock된 인스턴스 얻기
  });

  it('/point/:id (GET)', async () => {
    // API 호출
    const res = await request(app.getHttpServer()).get('/point/1').expect(200);

    // 응답 및 검증
    expect(res.body).toEqual({
      id: 1,
      point: 0,
      updateMillis: expect.any(Number),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // 유저의 포인트를 충전한다.
  it('/point/:id/charge (PATCH)', async () => {
    // API 호출
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
    // API 호출
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
    // API 호출
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

  //유저의 포인트를 사용한다.
  it('/point/:id/use (PATCH)', async () => {});
});
