import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsetupComponent } from './projectsetup.component';

describe('ProjectsetupComponent', () => {
  let component: ProjectsetupComponent;
  let fixture: ComponentFixture<ProjectsetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectsetupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
