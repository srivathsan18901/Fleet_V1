import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { ProjectGuard } from './project.guard';

describe('projectGuard', () => {
  let guard: ProjectGuard;
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => {
      guard = TestBed.inject(ProjectGuard);
      return guard.canActivate();
    });

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
