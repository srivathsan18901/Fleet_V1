import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IPScannerComponent } from './ipscanner.component';

describe('IPScannerComponent', () => {
  let component: IPScannerComponent;
  let fixture: ComponentFixture<IPScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IPScannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IPScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
