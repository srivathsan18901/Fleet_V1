import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotPopupComponent } from './robot-popup.component';

describe('RobotPopupComponent', () => {
  let component: RobotPopupComponent;
  let fixture: ComponentFixture<RobotPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RobotPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RobotPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
