import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const fixedDate = new Date(2022, 5, 1).getTime();

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate); // 고정된 날짜 설정

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/point/:id (GET)', () => {
    return request(app.getHttpServer()).get('/point/1').expect(200).expect({
      id: 1,
      point: 0,
      updateMillis: fixedDate, // 고정된 날짜와 일치
    });
  });

  afterAll(async () => {
    jest.useRealTimers(); // 모킹 해제
    await app.close();
  });
});
