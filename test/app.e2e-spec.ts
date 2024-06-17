/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserPointTable } from './../src/database/userpoint.table';
// import { PointHistoryTable } from './../src/database/pointhistory.table';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const fixedDate = new Date(2022, 5, 1).getTime();
  let userDb: UserPointTable;
  // let historyDb: PointHistoryTable;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate); // 고정된 날짜 설정
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(UserPointTable) // UserPointTable 제공자 오버라이드
    .useValue({
      selectById: jest.fn().mockResolvedValue({ id: 1, point: 0, updateMillis: fixedDate }),
      insertOrUpdate: jest.fn().mockImplementation((id: number, amount: number) => {
        return Promise.resolve({ id, point: amount, updateMillis: fixedDate });
      }),
    })
    .compile();
    
    app = moduleFixture.createNestApplication();
    userDb = moduleFixture.get<UserPointTable>(UserPointTable); // Mock된 인스턴스 얻기
    await app.init();
  });
  
  afterAll(async () => {
    jest.useRealTimers(); // 모킹 해제
    await app.close();
  });

  // 유저의 포인트를 조회한다.
  it('/point/:id (GET)', async () => {
    await userDb.insertOrUpdate( 1, 100 );
    return request(app.getHttpServer()).get('/point/1').expect(200).expect({
      id: 1,
      point: 100,
      updateMillis: fixedDate, // 고정된 날짜와 일치
    });
  });
  
  // 유저의 포인트를 충전한다.
  it('/point/:id/charge (PATCH)', async () => {
    await userDb.insertOrUpdate(1,100)
    return request(app.getHttpServer())
      .patch('/point/1/charge')
      .send({ amount: 100 })
      .expect(200)
      .expect({
        id: 1,
        point: 100,
        updateMillis: fixedDate,
      });
  });
});
