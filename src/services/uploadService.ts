import * as tus from 'tus-js-client';
import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from '../lib/supabase';
import type { UploadState } from '../types';

export const CHUNK_SIZE_6MB = 6 * 1024 * 1024; // 6 MiB as specified by Supabase Storage
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
  startTusVideoUpload(
    file: File,
    options: UploadOptions
  ): { controller: TusUploadController } {
    const bucketName = options.bucketName || 'portfolio-videos';
    const sanitizedName = sanitizeFileName(file.name);
    const storagePath = `${bucketName}/${sanitizedName}`;

    // Validate size
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

    // Supabase endpoint & headers
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    let lastBytes = 0;
    let lastTime = Date.now();
    let isPaused = false;
    let isAborted = false;

    // IF Supabase is configured, use real tus-js-client against Supabase Storage
    if (isSupabaseConfigured()) {
      const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

      const upload = new tus.Upload(file, {
        endpoint,
        retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
        chunkSize: CHUNK_SIZE_6MB,
        headers: {
          authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
          'x-upsert': 'true',
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
          let userMsg = error.message || 'Video upload failed.';
          if (file.size > FREE_TIER_LIMIT && userMsg.includes('413')) {
            userMsg = `Upload rejected (413 Payload Too Large). Supabase Free plan has a 50 MB limit. Please upgrade to Pro or adjust bucket limit for 1–2 GB files.`;
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

      // Start upload
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

    // MOCK SIMULATION MODE (When Supabase is not yet configured during development)
    // Simulates genuine chunked 6 MiB uploads, speed calculation, pause, resume, and completion
    let simulatedUploaded = 0;
    let timerId: any = null;

    const runSimulationStep = () => {
      if (isPaused || isAborted) return;

      // Simulate a 6 MiB chunk transfer every 400ms (~15 MB/s simulation)
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
          publicUrl: `/thumbnails/tokyo-noir.jpg`, // Preview fallback
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
};
