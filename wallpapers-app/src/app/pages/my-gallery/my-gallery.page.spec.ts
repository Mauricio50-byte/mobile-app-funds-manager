import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyGalleryPage } from './my-gallery.page';

describe('MyGalleryPage', () => {
  let component: MyGalleryPage;
  let fixture: ComponentFixture<MyGalleryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyGalleryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
