import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotDetailPopupComponent } from './robot-detail-popup.component';

describe('RobotDetailPopupComponent', () => {
  let component: RobotDetailPopupComponent;
  let fixture: ComponentFixture<RobotDetailPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RobotDetailPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RobotDetailPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
