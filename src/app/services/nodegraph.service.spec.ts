import { TestBed } from '@angular/core/testing';

import { NodeGraphService } from './nodegraph.service';

describe('NodegraphService', () => {
  let service: NodeGraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NodeGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
