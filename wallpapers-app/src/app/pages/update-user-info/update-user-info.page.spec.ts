import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateUserInfoPage } from './update-user-info.page';

describe('UpdateUserInfoPage', () => {
  let component: UpdateUserInfoPage;
  let fixture: ComponentFixture<UpdateUserInfoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateUserInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
