package io.ionic.starter;

import android.app.WallpaperManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.util.Base64;
import android.util.Log;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import android.Manifest;

@CapacitorPlugin(
    name = "WallpaperPlugin",
    permissions = {
        @Permission(
            strings = { Manifest.permission.SET_WALLPAPER },
            alias = "wallpaper"
        ),
        @Permission(
            strings = { Manifest.permission.READ_MEDIA_IMAGES },
            alias = "media"
        )
    }
)
public class WallpaperPlugin extends Plugin {

    private static final String TAG = "WallpaperPlugin";



    @PluginMethod
    public void setWallpaperHomeScreen(PluginCall call) {
        Log.d(TAG, "setWallpaperHomeScreen called");
        
        // Log all received data
        Log.d(TAG, "Received call data: " + call.getData().toString());
        
        String imageUrl = call.getString("imageUrl");
        String base64Image = call.getString("base64Image");
        
        Log.d(TAG, "imageUrl: " + (imageUrl != null ? imageUrl : "null"));
        Log.d(TAG, "base64Image: " + (base64Image != null ? "provided" : "null"));

        if (imageUrl == null && base64Image == null) {
            Log.e(TAG, "No image data provided");
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Must provide either imageUrl or base64Image");
            call.resolve(result);
            return;
        }

        try {
            // Verificar permisos
            WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
            if (!wallpaperManager.isWallpaperSupported()) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("message", "Wallpaper not supported on this device");
                call.resolve(result);
                return;
            }

            Bitmap bitmap;
            if (base64Image != null && !base64Image.trim().isEmpty()) {
                bitmap = decodeBase64ToBitmap(base64Image);
                if (bitmap == null) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("message", "Failed to decode base64 image");
                    call.resolve(result);
                    return;
                }
            } else if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                bitmap = downloadImageFromUrl(imageUrl);
                if (bitmap == null) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("message", "Failed to download image from URL");
                    call.resolve(result);
                    return;
                }
            } else {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("message", "Invalid image data provided");
                call.resolve(result);
                return;
            }

            // Establecer wallpaper
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM);
            } else {
                wallpaperManager.setBitmap(bitmap);
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Home screen wallpaper set successfully");
            call.resolve(result);
            
        } catch (SecurityException e) {
            Log.e(TAG, "Security error setting home wallpaper", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Permission denied: " + e.getMessage());
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error setting home wallpaper", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Error setting wallpaper: " + e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void setWallpaperLockScreen(PluginCall call) {
        Log.d(TAG, "setWallpaperLockScreen called");
        
        // Log all received data
        Log.d(TAG, "Received call data: " + call.getData().toString());
        
        String imageUrl = call.getString("imageUrl");
        String base64Image = call.getString("base64Image");
        
        Log.d(TAG, "imageUrl: " + (imageUrl != null ? imageUrl : "null"));
        Log.d(TAG, "base64Image: " + (base64Image != null ? "provided" : "null"));

        if (imageUrl == null && base64Image == null) {
            Log.e(TAG, "No image data provided");
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Must provide either imageUrl or base64Image");
            call.resolve(result);
            return;
        }

        // Verificar versión de Android
        if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.N) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Lock screen wallpaper requires Android 7.0 (API 24) or higher");
            call.resolve(result);
            return;
        }

        try {
            // Verificar permisos
            WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
            if (!wallpaperManager.isWallpaperSupported()) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("message", "Wallpaper not supported on this device");
                call.resolve(result);
                return;
            }

            Bitmap bitmap;
            if (base64Image != null && !base64Image.trim().isEmpty()) {
                bitmap = decodeBase64ToBitmap(base64Image);
                if (bitmap == null) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("message", "Failed to decode base64 image");
                    call.resolve(result);
                    return;
                }
            } else if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                bitmap = downloadImageFromUrl(imageUrl);
                if (bitmap == null) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("message", "Failed to download image from URL");
                    call.resolve(result);
                    return;
                }
            } else {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("message", "Invalid image data provided");
                call.resolve(result);
                return;
            }

            // Establecer wallpaper de pantalla de bloqueo
            wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Lock screen wallpaper set successfully");
            call.resolve(result);
            
        } catch (SecurityException e) {
            Log.e(TAG, "Security error setting lock wallpaper", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Permission denied: " + e.getMessage());
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error setting lock wallpaper", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Error setting wallpaper: " + e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void setBothWallpapers(PluginCall call) {
        String imageUrl = call.getString("imageUrl");
        String base64Image = call.getString("base64Image");

        if (imageUrl == null && base64Image == null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Must provide either imageUrl or base64Image");
            call.resolve(result);
            return;
        }

        try {
            // Verificar permisos
            WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
            if (!wallpaperManager.isWallpaperSupported()) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("message", "Wallpaper not supported on this device");
                call.resolve(result);
                return;
            }

            Bitmap bitmap;
            if (base64Image != null && !base64Image.trim().isEmpty()) {
                bitmap = decodeBase64ToBitmap(base64Image);
                if (bitmap == null) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("message", "Failed to decode base64 image");
                    call.resolve(result);
                    return;
                }
            } else if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                bitmap = downloadImageFromUrl(imageUrl);
                if (bitmap == null) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("message", "Failed to download image from URL");
                    call.resolve(result);
                    return;
                }
            } else {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("message", "Invalid image data provided");
                call.resolve(result);
                return;
            }

            // Establecer wallpaper en ambas pantallas
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK);
            } else {
                // Para versiones anteriores, solo establecer en pantalla principal
                wallpaperManager.setBitmap(bitmap);
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                result.put("message", "Wallpaper set successfully for both home and lock screens");
            } else {
                result.put("message", "Wallpaper set successfully for home screen (lock screen not supported on this Android version)");
            }
            call.resolve(result);
            
        } catch (SecurityException e) {
            Log.e(TAG, "Security error setting both wallpapers", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Permission denied: " + e.getMessage());
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error setting both wallpapers", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Error setting wallpaper: " + e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        try {
            Log.d(TAG, "Checking wallpaper permissions");
            
            WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
            boolean isWallpaperSupported = wallpaperManager.isWallpaperSupported();
            
            Log.d(TAG, "Wallpaper supported: " + isWallpaperSupported);
            
            // Check if we have SET_WALLPAPER permission
            boolean hasSetWallpaperPermission = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.SET_WALLPAPER) 
                == PackageManager.PERMISSION_GRANTED;
            
            Log.d(TAG, "SET_WALLPAPER permission: " + hasSetWallpaperPermission);
            
            // Check for READ_MEDIA_IMAGES permission on Android 13+
            boolean hasMediaPermission = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                hasMediaPermission = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_IMAGES) 
                    == PackageManager.PERMISSION_GRANTED;
                Log.d(TAG, "READ_MEDIA_IMAGES permission (Android 13+): " + hasMediaPermission);
            }
            
            boolean hasAllPermissions = isWallpaperSupported && hasSetWallpaperPermission && hasMediaPermission;
            
            JSObject result = new JSObject();
            result.put("hasPermission", hasAllPermissions);
            result.put("isWallpaperSupported", isWallpaperSupported);
            result.put("hasSetWallpaperPermission", hasSetWallpaperPermission);
            result.put("hasMediaPermission", hasMediaPermission);
            result.put("androidVersion", Build.VERSION.SDK_INT);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error checking permissions", e);
            call.reject("Error checking permissions: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        try {
            Log.d(TAG, "Requesting wallpaper permissions");
            
            // Verificar qué permisos necesitamos solicitar
            String[] permissionsToRequest;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Android 13+ necesita READ_MEDIA_IMAGES
                permissionsToRequest = new String[]{
                    Manifest.permission.SET_WALLPAPER,
                    Manifest.permission.READ_MEDIA_IMAGES
                };
            } else {
                // Versiones anteriores solo necesitan SET_WALLPAPER
                permissionsToRequest = new String[]{
                    Manifest.permission.SET_WALLPAPER
                };
            }
            
            // Usar el sistema de permisos de Capacitor
            requestPermissionForAliases(permissionsToRequest, call, "permissionCallback");
            
        } catch (Exception e) {
            Log.e(TAG, "Error requesting permissions", e);
            call.reject("Error requesting permissions: " + e.getMessage());
        }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        try {
            Log.d(TAG, "Permission callback received");
            
            // Verificar el estado de los permisos después de la solicitud
            boolean hasSetWallpaperPermission = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.SET_WALLPAPER) 
                == PackageManager.PERMISSION_GRANTED;
            
            boolean hasMediaPermission = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                hasMediaPermission = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_IMAGES) 
                    == PackageManager.PERMISSION_GRANTED;
            }
            
            boolean hasAllPermissions = hasSetWallpaperPermission && hasMediaPermission;
            
            JSObject result = new JSObject();
            result.put("granted", hasAllPermissions);
            result.put("hasSetWallpaperPermission", hasSetWallpaperPermission);
            result.put("hasMediaPermission", hasMediaPermission);
            
            Log.d(TAG, "Permissions granted: " + hasAllPermissions);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error in permission callback", e);
            call.reject("Error in permission callback: " + e.getMessage());
        }
    }

    /**
     * Alias method for setWallpaperHomeScreen - for compatibility
     */
    @PluginMethod
    public void setHomeWallpaper(PluginCall call) {
        Log.d(TAG, "setHomeWallpaper called (alias for setWallpaperHomeScreen)");
        setWallpaperHomeScreen(call);
    }

    /**
     * Alias method for setWallpaperLockScreen - for compatibility
     */
    @PluginMethod
    public void setLockWallpaper(PluginCall call) {
        Log.d(TAG, "setLockWallpaper called (alias for setWallpaperLockScreen)");
        setWallpaperLockScreen(call);
    }

    private Bitmap decodeBase64ToBitmap(String base64String) {
        try {
            Log.d(TAG, "Decoding base64 image, length: " + base64String.length());
            
            // Remove data URL prefix if present
            if (base64String.startsWith("data:image")) {
                Log.d(TAG, "Removing data URL prefix");
                base64String = base64String.substring(base64String.indexOf(",") + 1);
            }
            
            // Validate base64 string
            if (base64String.trim().isEmpty()) {
                Log.e(TAG, "Base64 string is empty after processing");
                return null;
            }
            
            Log.d(TAG, "Decoding base64 string, final length: " + base64String.length());
            byte[] decodedBytes = Base64.decode(base64String, Base64.DEFAULT);
            
            if (decodedBytes == null || decodedBytes.length == 0) {
                Log.e(TAG, "Failed to decode base64 - no bytes produced");
                return null;
            }
            
            Log.d(TAG, "Decoded bytes length: " + decodedBytes.length);
            Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
            
            if (bitmap == null) {
                Log.e(TAG, "Failed to create bitmap from decoded bytes");
                return null;
            }
            
            Log.d(TAG, "Successfully created bitmap: " + bitmap.getWidth() + "x" + bitmap.getHeight());
            
            // Verificar que el bitmap no sea demasiado grande
            int maxSize = 4096; // 4K max
            if (bitmap.getWidth() > maxSize || bitmap.getHeight() > maxSize) {
                Log.d(TAG, "Resizing large bitmap from " + bitmap.getWidth() + "x" + bitmap.getHeight());
                float scale = Math.min((float) maxSize / bitmap.getWidth(), (float) maxSize / bitmap.getHeight());
                int newWidth = Math.round(bitmap.getWidth() * scale);
                int newHeight = Math.round(bitmap.getHeight() * scale);
                bitmap = Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true);
                Log.d(TAG, "Resized bitmap to " + bitmap.getWidth() + "x" + bitmap.getHeight());
            }
            
            return bitmap;
        } catch (IllegalArgumentException e) {
            Log.e(TAG, "Invalid base64 string", e);
            return null;
        } catch (OutOfMemoryError e) {
            Log.e(TAG, "Out of memory while decoding base64 image", e);
            return null;
        } catch (Exception e) {
            Log.e(TAG, "Error decoding base64 image", e);
            return null;
        }
    }

    private Bitmap downloadImageFromUrl(String imageUrl) {
        try {
            // Validar URL
            if (imageUrl == null || imageUrl.trim().isEmpty()) {
                Log.e(TAG, "URL is null or empty");
                return null;
            }

            URL url = new URL(imageUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            // Configurar timeouts
            connection.setConnectTimeout(10000); // 10 segundos
            connection.setReadTimeout(15000);    // 15 segundos
            connection.setDoInput(true);
            
            // Configurar headers para mejor compatibilidad
            connection.setRequestProperty("User-Agent", "WallpaperApp/1.0");
            connection.setRequestProperty("Accept", "image/*");
            
            // Conectar y verificar respuesta
            connection.connect();
            int responseCode = connection.getResponseCode();
            
            if (responseCode != HttpURLConnection.HTTP_OK) {
                Log.e(TAG, "HTTP error code: " + responseCode);
                return null;
            }
            
            InputStream input = connection.getInputStream();
            Bitmap bitmap = BitmapFactory.decodeStream(input);
            
            if (bitmap == null) {
                Log.e(TAG, "Failed to decode bitmap from stream");
                return null;
            }
            
            // Verificar que el bitmap no sea demasiado grande
            int maxSize = 4096; // 4K max
            if (bitmap.getWidth() > maxSize || bitmap.getHeight() > maxSize) {
                // Redimensionar si es necesario
                float scale = Math.min((float) maxSize / bitmap.getWidth(), (float) maxSize / bitmap.getHeight());
                int newWidth = Math.round(bitmap.getWidth() * scale);
                int newHeight = Math.round(bitmap.getHeight() * scale);
                bitmap = Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true);
            }
            
            input.close();
            connection.disconnect();
            
            return bitmap;
        } catch (Exception e) {
            Log.e(TAG, "Error downloading image from URL: " + imageUrl, e);
            return null;
        }
    }
}