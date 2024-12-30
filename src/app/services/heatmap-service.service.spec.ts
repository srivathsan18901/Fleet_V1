import { TestBed } from '@angular/core/testing';

import { HeatmapService } from './heatmap-service.service';

describe('HeatmapServiceService', () => {
  let service: HeatmapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HeatmapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
