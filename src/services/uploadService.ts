import * as tus from 'tus-js-client';
import {
  getSupabaseUrl,
  getSupabasePublishableKey,
  getActiveAccessToken,
  isValidJwt,
  getCurrentAuthUser,
  checkIsUserAdmin,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';
import type { UploadState } from '../types';

export const CHUNK_SIZE_6MB = 6 * 1024 * 1024; // 6 MiB required by Supabase Storage TUS
export const MAX_VIDEO_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB limit (Pro tier max)
export const FREE_TIER_LIMIT = 50 * 1024 * 1024; // 50 MB Free tier warning threshold

export interface TusUploadController {
  pause: () => void;
  resume: () => void;
  abort: () => void;
}

export interface UploadOptions {
  bucketName?: string;
  onStateChange: (state: UploadState) => void;
}

export const sanitizeFileName = (name: string): string => {
  const ext = name.split('.').pop() || '';
  const base = name.substring(0, name.lastIndexOf('.')) || name;
  const cleanBase = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
  return `${Date.now()}-${cleanBase}.${ext.toLowerCase()}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const uploadService = {
  /**
   * Resumable large video upload (up to 2 GB+) using TUS chunked transfer
   */
  async startTusVideoUpload(
    file: File,
    options: UploadOptions
  ): Promise<{ controller: TusUploadController }> {
    const bucketName = options.bucketName || 'portfolio-videos';
    const sanitizedName = sanitizeFileName(file.name);
    const storagePath = `${bucketName}/${sanitizedName}`;

    // Validate size limit
    if (file.size > MAX_VIDEO_FILE_SIZE) {
      options.onStateChange({
        status: 'error',
        progress: 0,
        bytesUploaded: 0,
        totalBytes: file.size,
        speed: '0 MB/s',
        estimatedTimeRemaining: '0s',
        errorMessage: `File size (${formatBytes(file.size)}) exceeds the maximum supported 5 GB limit.`,
      });
      return {
        controller: { pause: () => {}, resume: () => {}, abort: () => {} },
      };
    }

    const supabaseUrl = getSupabaseUrl();
    const publishableKey = getSupabasePublishableKey();

    let lastBytes = 0;
    let lastTime = Date.now();
    let isPaused = false;
    let isAborted = false;

    // Real Supabase TUS resumable transfer
    if (isSupabaseConfigured()) {
      // 1. Retrieve and validate active JWT token from Supabase Auth session
      const token = await getActiveAccessToken();
      if (!token || !isValidJwt(token)) {
        options.onStateChange({
          status: 'error',
          progress: 0,
          bytesUploaded: 0,
          totalBytes: file.size,
          speed: '0 MB/s',
          estimatedTimeRemaining: '0s',
          errorMessage:
            'Authentication Required: No active Supabase administrator session. Please sign in to Studio Admin with your account (kpctech1234@gmail.com) before uploading videos.',
        });
        return {
          controller: { pause: () => {}, resume: () => {}, abort: () => {} },
        };
      }

      // 2. Verify authenticated user has administrator permissions
      const authUser = await getCurrentAuthUser();
      if (!authUser) {
        options.onStateChange({
          status: 'error',
          progress: 0,
          bytesUploaded: 0,
          totalBytes: file.size,
          speed: '0 MB/s',
          estimatedTimeRemaining: '0s',
          errorMessage:
            'Authentication Required: Administrator session expired. Please sign in again.',
        });
        return {
          controller: { pause: () => {}, resume: () => {}, abort: () => {} },
        };
      }

      const isAdmin =
        (await checkIsUserAdmin(authUser.id)) ||
        authUser.email?.toLowerCase() === 'kpctech1234@gmail.com';

      if (!isAdmin) {
        options.onStateChange({
          status: 'error',
          progress: 0,
          bytesUploaded: 0,
          totalBytes: file.size,
          speed: '0 MB/s',
          estimatedTimeRemaining: '0s',
          errorMessage:
            `Access Denied: Account ${authUser.email} is authenticated, but has not been granted administrator permissions in public.admin_users.`,
        });
        return {
          controller: { pause: () => {}, resume: () => {}, abort: () => {} },
        };
      }

      const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

      const upload = new tus.Upload(file, {
        endpoint,
        retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
        chunkSize: CHUNK_SIZE_6MB,
        headers: {
          authorization: `Bearer ${token}`,
          apikey: publishableKey,
          'x-upsert': 'true',
        },
        onBeforeRequest: async (req) => {
          try {
            const freshToken = await getActiveAccessToken();
            if (freshToken && isValidJwt(freshToken)) {
              req.setHeader('authorization', `Bearer ${freshToken}`);
            } else {
              console.warn('Session token could not be refreshed during chunk upload');
            }
            req.setHeader('apikey', publishableKey);
          } catch (e) {
            console.warn('Failed to refresh token before TUS chunk request:', e);
          }
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName,
          objectName: sanitizedName,
          contentType: file.type || 'video/mp4',
        },
        onError: (error) => {
          console.error('TUS Upload failed:', error);
          const rawMsg = error.message || '';
          let userMsg = rawMsg || 'Video upload failed.';

          if (rawMsg.includes('Invalid Compact JWS') || rawMsg.includes('AccessDenied')) {
            userMsg =
              'Authentication Error (403): Invalid or expired administrator session token. Please sign in again with your administrator account (kpctech1234@gmail.com).';
          } else if (rawMsg.includes('413') || (file.size > FREE_TIER_LIMIT && rawMsg.includes('Payload Too Large'))) {
            userMsg =
              'Upload rejected (413 Payload Too Large): Supabase Free plan has a 50 MB limit. Upgrade to Pro tier or adjust bucket limit for 1–2 GB files.';
          } else if (rawMsg.includes('Bucket not found') || rawMsg.includes('portfolio-videos')) {
            userMsg =
              'Storage Error: Bucket "portfolio-videos" was not found in Supabase. Please execute the SQL migration in your Supabase SQL Editor.';
          } else if (rawMsg.toLowerCase().includes('violates row-level security policy') || rawMsg.toLowerCase().includes('rls')) {
            userMsg =
              'Storage Permission Error (RLS): Your user account is not permitted to upload to "portfolio-videos". Ensure your user ID is registered in public.admin_users.';
          }

          options.onStateChange({
            status: 'error',
            progress: 0,
            bytesUploaded: 0,
            totalBytes: file.size,
            speed: '0 MB/s',
            estimatedTimeRemaining: '0s',
            errorMessage: userMsg,
          });
        },
        onProgress: (bytesUploaded, totalBytes) => {
          const now = Date.now();
          const timeDelta = (now - lastTime) / 1000;
          let speedStr = 'Calculating...';
          let etaStr = '--';

          if (timeDelta >= 0.5) {
            const bytesDelta = bytesUploaded - lastBytes;
            const bytesPerSec = bytesDelta / timeDelta;
            speedStr = `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
            const remainingBytes = totalBytes - bytesUploaded;
            const secondsLeft = bytesPerSec > 0 ? remainingBytes / bytesPerSec : 0;
            etaStr = formatDuration(secondsLeft);

            lastBytes = bytesUploaded;
            lastTime = now;
          }

          const percent = Math.min(100, Math.round((bytesUploaded / totalBytes) * 100));

          options.onStateChange({
            status: isPaused ? 'paused' : 'uploading',
            progress: percent,
            bytesUploaded,
            totalBytes,
            speed: speedStr,
            estimatedTimeRemaining: etaStr,
            storagePath,
          });
        },
        onSuccess: () => {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${storagePath}`;
          options.onStateChange({
            status: 'completed',
            progress: 100,
            bytesUploaded: file.size,
            totalBytes: file.size,
            speed: '0 MB/s',
            estimatedTimeRemaining: '0s',
            storagePath,
            publicUrl,
          });
        },
      });

      upload.start();

      return {
        controller: {
          pause: () => {
            isPaused = true;
            upload.abort();
            options.onStateChange({
              status: 'paused',
              progress: Math.round((lastBytes / file.size) * 100),
              bytesUploaded: lastBytes,
              totalBytes: file.size,
              speed: 'Paused',
              estimatedTimeRemaining: 'Paused',
              storagePath,
            });
          },
          resume: () => {
            isPaused = false;
            upload.start();
          },
          abort: () => {
            isAborted = true;
            upload.abort();
            options.onStateChange({
              status: 'idle',
              progress: 0,
              bytesUploaded: 0,
              totalBytes: file.size,
              speed: '0 MB/s',
              estimatedTimeRemaining: '0s',
            });
          },
        },
      };
    }

    // Fallback Mock simulation mode if Supabase is disconnected
    let simulatedUploaded = 0;
    let timerId: any = null;

    const runSimulationStep = () => {
      if (isPaused || isAborted) return;

      const simulatedChunk = Math.min(CHUNK_SIZE_6MB, file.size - simulatedUploaded);
      simulatedUploaded += simulatedChunk;

      const percent = Math.min(100, Math.round((simulatedUploaded / file.size) * 100));
      const remainingBytes = file.size - simulatedUploaded;
      const speedMBps = 14.5;
      const etaSeconds = remainingBytes / (speedMBps * 1024 * 1024);

      if (simulatedUploaded >= file.size) {
        options.onStateChange({
          status: 'completed',
          progress: 100,
          bytesUploaded: file.size,
          totalBytes: file.size,
          speed: '0 MB/s',
          estimatedTimeRemaining: '0s',
          storagePath: `portfolio-videos/${sanitizedName}`,
          publicUrl: `/thumbnails/tokyo-noir.jpg`,
        });
      } else {
        options.onStateChange({
          status: 'uploading',
          progress: percent,
          bytesUploaded: simulatedUploaded,
          totalBytes: file.size,
          speed: `${speedMBps.toFixed(1)} MB/s`,
          estimatedTimeRemaining: formatDuration(etaSeconds),
          storagePath,
        });

        timerId = setTimeout(runSimulationStep, 350);
      }
    };

    timerId = setTimeout(runSimulationStep, 200);

    return {
      controller: {
        pause: () => {
          isPaused = true;
          if (timerId) clearTimeout(timerId);
          options.onStateChange({
            status: 'paused',
            progress: Math.round((simulatedUploaded / file.size) * 100),
            bytesUploaded: simulatedUploaded,
            totalBytes: file.size,
            speed: 'Paused',
            estimatedTimeRemaining: 'Paused',
            storagePath,
          });
        },
        resume: () => {
          isPaused = false;
          runSimulationStep();
        },
        abort: () => {
          isAborted = true;
          if (timerId) clearTimeout(timerId);
          options.onStateChange({
            status: 'idle',
            progress: 0,
            bytesUploaded: 0,
            totalBytes: file.size,
            speed: '0 MB/s',
            estimatedTimeRemaining: '0s',
          });
        },
      },
    };
  },

  /**
   * Upload thumbnail image to `portfolio-thumbnails` bucket
   */
  async uploadThumbnailImage(file: File): Promise<{ storagePath: string; publicUrl: string }> {
    const sanitizedName = sanitizeFileName(file.name);
    const bucket = 'portfolio-thumbnails';

    if (isSupabaseConfigured() && supabase) {
      const token = await getActiveAccessToken();
      if (!token || !isValidJwt(token)) {
        throw new Error('Authentication Required: Please sign in to Supabase as administrator before uploading thumbnail images.');
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(sanitizedName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase thumbnail upload error:', error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        storagePath: `${bucket}/${data.path}`,
        publicUrl: publicUrlData.publicUrl,
      };
    }

    // Local object URL fallback
    return {
      storagePath: `${bucket}/${sanitizedName}`,
      publicUrl: URL.createObjectURL(file),
    };
  },
};
