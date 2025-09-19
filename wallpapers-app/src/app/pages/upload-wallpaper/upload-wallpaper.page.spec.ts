import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadWallpaperPage } from './upload-wallpaper.page';

describe('UploadWallpaperPage', () => {
  let component: UploadWallpaperPage;
  let fixture: ComponentFixture<UploadWallpaperPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadWallpaperPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
