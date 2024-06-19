import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from '../point.controller';

describe('PointController', () => {
  let service: PointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointController],
    }).compile();

    service = module.get<PointController>(PointController);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
