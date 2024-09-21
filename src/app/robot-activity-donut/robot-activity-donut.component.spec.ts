import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotActivityDonutComponent } from './robot-activity-donut.component';

describe('RobotActivityDonutComponent', () => {
  let component: RobotActivityDonutComponent;
  let fixture: ComponentFixture<RobotActivityDonutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RobotActivityDonutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RobotActivityDonutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
