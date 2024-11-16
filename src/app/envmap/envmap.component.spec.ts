import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvmapComponent } from './envmap.component';

describe('EnvmapComponent', () => {
  let component: EnvmapComponent;
  let fixture: ComponentFixture<EnvmapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnvmapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnvmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
