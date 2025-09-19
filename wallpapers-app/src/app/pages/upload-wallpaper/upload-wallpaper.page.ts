import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CreateWallpaperData, UploadWallpaperResponse } from '../../core/interfaces/wallpaper.interface';
import { WallpaperService } from '../../core/services/wallpaper.service';
import { Auth } from '../../core/services/auth';
import { TranslationService } from '../../core/services/translation.service';
import { FilePickerService } from '../../core/services/file-picker.service';

@Component({
  selector: 'app-upload-wallpaper',
  templateUrl: './upload-wallpaper.page.html',
  styleUrls: ['./upload-wallpaper.page.scss'],
  standalone: false
})
export class UploadWallpaperPage implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;
  currentUser: any = null;

  // Predefined categories
  categories = [
    'nature',
    'abstract',
    'minimal',
    'landscape',
    'city',
    'space',
    'animals',
    'art',
    'technology',
    'other'
  ];

  constructor(
    private router: Router,
    private location: Location,
    private formBuilder: FormBuilder,
    private wallpaperService: WallpaperService,
    private auth: Auth,
    private filePickerService: FilePickerService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    public translationService: TranslationService
  ) {
    this.uploadForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['', Validators.required],
      tags: [''],
      isPublic: [false]
    });
  }

  async ngOnInit() {
    await this.loadCurrentUser();
  }

  private async loadCurrentUser() {
    try {
      this.currentUser = await this.auth.getCurrentUser();
    } catch (error) {
      console.error('Error loading current user:', error);
      this.router.navigate(['/login']);
    }
  }

  async selectImage() {
    try {
      const file = await this.filePickerService.pickImage();
      if (file) {
        this.selectedFile = file;
        this.createImagePreview(file);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      await this.showToast('upload.selectImageError', 'danger');
    }
  }

  private createImagePreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  async uploadWallpaper() {
    if (!this.uploadForm.valid || !this.selectedFile) {
      await this.showToast('upload.formInvalid', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.translationService.translate('upload.uploading')
    });
    await loading.present();

    this.isUploading = true;

    try {
      const formValue = this.uploadForm.value;
      
      // Process tags
      const tags = formValue.tags 
        ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
        : [];

      const wallpaperData: CreateWallpaperData = {
        title: formValue.title,
        description: formValue.description || undefined,
        category: formValue.category,
        tags: tags.length > 0 ? tags : undefined,
        isPublic: formValue.isPublic,
        imageFile: this.selectedFile
      };

      this.wallpaperService.createWallpaper(wallpaperData).subscribe({
          next: async (wallpaperId) => {
            await this.showToast('upload.uploadSuccess', 'success');
            this.isUploading = false;
            await loading.dismiss();
            this.router.navigate(['/my-gallery']);
          },
          error: async (error) => {
            console.error('Error uploading wallpaper:', error);
            await this.showToast('upload.uploadError', 'danger');
            this.isUploading = false;
            await loading.dismiss();
          }
        });
    } catch (error) {
      console.error('Error uploading wallpaper:', error);
      await this.showToast('upload.uploadError', 'danger');
      this.isUploading = false;
      await loading.dismiss();
    }
  }

  async showDiscardAlert() {
    if (this.selectedFile || this.uploadForm.dirty) {
      const alert = await this.alertController.create({
        header: this.translationService.translate('upload.discardChanges'),
        message: this.translationService.translate('upload.discardChangesMessage'),
        buttons: [
          {
            text: this.translationService.translate('common.cancel'),
            role: 'cancel'
          },
          {
            text: this.translationService.translate('common.accept'),
            handler: () => {
              this.goBack();
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.goBack();
    }
  }

  goBack() {
    this.location.back();
  }

  private async showToast(messageKey: string, color: string) {
    const toast = await this.toastController.create({
      message: this.translationService.translate(messageKey),
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Getters for form validation
  get title() { return this.uploadForm.get('title'); }
  get category() { return this.uploadForm.get('category'); }
}
