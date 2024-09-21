import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartTimelineComponent } from './chart-timeline.component';

describe('ChartTimelineComponent', () => {
  let component: ChartTimelineComponent;
  let fixture: ComponentFixture<ChartTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChartTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
