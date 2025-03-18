import { TestBed } from '@angular/core/testing';

import { IdleTrackerService } from './idle-tracker.service';

describe('IdleTrackerService', () => {
  let service: IdleTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdleTrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
