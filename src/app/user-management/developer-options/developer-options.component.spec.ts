import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeveloperOptionsComponent } from './developer-options.component';

describe('DeveloperOptionsComponent', () => {
  let component: DeveloperOptionsComponent;
  let fixture: ComponentFixture<DeveloperOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeveloperOptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeveloperOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
