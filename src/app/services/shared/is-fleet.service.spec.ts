import { TestBed } from '@angular/core/testing';

import { IsFleetService } from './is-fleet.service';

describe('IsFleetService', () => {
  let service: IsFleetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IsFleetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
