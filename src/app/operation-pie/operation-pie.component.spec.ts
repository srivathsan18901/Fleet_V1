import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationPieComponent } from './operation-pie.component';

describe('OperationPieComponent', () => {
  let component: OperationPieComponent;
  let fixture: ComponentFixture<OperationPieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OperationPieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperationPieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
