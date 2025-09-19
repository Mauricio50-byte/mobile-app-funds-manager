import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
    })
    export class FilePickerService {

    constructor() { }

    // Aquí implementé el método para seleccionar imágenes desde el dispositivo con validaciones
    async pickImage(): Promise<File | null> {
        return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (event: any) => {
            const file = event.target.files[0];
            if (file) {
            // Validar que sea una imagen
            if (!file.type.startsWith('image/')) {
                reject(new Error('El archivo seleccionado no es una imagen válida'));
                return;
            }
            
            // Validar tamaño (máximo 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                reject(new Error('La imagen es demasiado grande. Máximo 10MB'));
                return;
            }
            
            resolve(file);
            } else {
            resolve(null);
            }
        };
        
        input.oncancel = () => {
            resolve(null);
        };
        
        input.onerror = () => {
            reject(new Error('Error al seleccionar el archivo'));
        };
        
        input.click();
        });
    }

    // Aquí creé el método para generar vista previa de imágenes seleccionadas
    createImagePreview(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            if (e.target?.result) {
            resolve(e.target.result as string);
            } else {
            reject(new Error('Error al crear la vista previa'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsDataURL(file);
        });
    }

    // Aquí desarrollé la validación de tipos de archivo de imagen permitidos
    isValidImage(file: File): boolean {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }

    // Aquí implementé el método para obtener información detallada del archivo
    getFileInfo(file: File) {
        return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        sizeFormatted: this.formatFileSize(file.size)
        };
    }

    // Aquí creé el método para formatear el tamaño del archivo en formato legible
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}