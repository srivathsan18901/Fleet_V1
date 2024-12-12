import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotParametersPopupComponent } from './robot-parameters-popup.component';

describe('RobotParametersPopupComponent', () => {
  let component: RobotParametersPopupComponent;
  let fixture: ComponentFixture<RobotParametersPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RobotParametersPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RobotParametersPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
