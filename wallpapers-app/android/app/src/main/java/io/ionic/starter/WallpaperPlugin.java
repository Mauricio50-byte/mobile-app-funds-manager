package io.ionic.starter;

import android.app.WallpaperManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "WallpaperPlugin")
public class WallpaperPlugin extends Plugin {

    private static final String TAG = "WallpaperPlugin";

    @PluginMethod
    public void setWallpaperHomeScreen(PluginCall call) {
        String imageUrl = call.getString("imageUrl");
        String base64Image = call.getString("base64Image");

        if (imageUrl == null && base64Image == null) {
            call.reject("Must provide either imageUrl or base64Image");
            return;
        }

        try {
            Bitmap bitmap;
            if (base64Image != null) {
                bitmap = decodeBase64ToBitmap(base64Image);
            } else {
                bitmap = downloadImageFromUrl(imageUrl);
            }

            if (bitmap != null) {
                WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM);
                } else {
                    wallpaperManager.setBitmap(bitmap);
                }
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } else {
                call.reject("Failed to load image");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting home wallpaper", e);
            call.reject("Error setting wallpaper: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setWallpaperLockScreen(PluginCall call) {
        String imageUrl = call.getString("imageUrl");
        String base64Image = call.getString("base64Image");

        if (imageUrl == null && base64Image == null) {
            call.reject("Must provide either imageUrl or base64Image");
            return;
        }

        try {
            Bitmap bitmap;
            if (base64Image != null) {
                bitmap = decodeBase64ToBitmap(base64Image);
            } else {
                bitmap = downloadImageFromUrl(imageUrl);
            }

            if (bitmap != null) {
                WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK);
                } else {
                    wallpaperManager.setBitmap(bitmap);
                }
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } else {
                call.reject("Failed to load image");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting lock wallpaper", e);
            call.reject("Error setting wallpaper: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setBothWallpapers(PluginCall call) {
        String imageUrl = call.getString("imageUrl");
        String base64Image = call.getString("base64Image");

        if (imageUrl == null && base64Image == null) {
            call.reject("Must provide either imageUrl or base64Image");
            return;
        }

        try {
            Bitmap bitmap;
            if (base64Image != null) {
                bitmap = decodeBase64ToBitmap(base64Image);
            } else {
                bitmap = downloadImageFromUrl(imageUrl);
            }

            if (bitmap != null) {
                WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK);
                } else {
                    wallpaperManager.setBitmap(bitmap);
                }
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } else {
                call.reject("Failed to load image");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting both wallpapers", e);
            call.reject("Error setting wallpaper: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        try {
            WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
            boolean hasPermission = wallpaperManager.isWallpaperSupported();
            
            JSObject result = new JSObject();
            result.put("hasPermissions", hasPermission);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error checking permissions", e);
            call.reject("Error checking permissions: " + e.getMessage());
        }
    }

    private Bitmap decodeBase64ToBitmap(String base64String) {
        try {
            // Remove data URL prefix if present
            if (base64String.startsWith("data:image")) {
                base64String = base64String.substring(base64String.indexOf(",") + 1);
            }
            
            byte[] decodedBytes = Base64.decode(base64String, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
        } catch (Exception e) {
            Log.e(TAG, "Error decoding base64 image", e);
            return null;
        }
    }

    private Bitmap downloadImageFromUrl(String imageUrl) {
        try {
            URL url = new URL(imageUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.connect();
            InputStream input = connection.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (IOException e) {
            Log.e(TAG, "Error downloading image from URL", e);
            return null;
        }
    }
}