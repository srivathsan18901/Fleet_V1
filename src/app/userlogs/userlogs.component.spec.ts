import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Userlogscomponent } from './userlogs.component';

describe('UserlogsComponent', () => {
  let component: Userlogscomponent;
  let fixture: ComponentFixture<Userlogscomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Userlogscomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Userlogscomponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
