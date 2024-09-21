import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradientDonutComponent } from './gradient-donut.component';

describe('GradientDonutComponent', () => {
  let component: GradientDonutComponent;
  let fixture: ComponentFixture<GradientDonutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GradientDonutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradientDonutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
