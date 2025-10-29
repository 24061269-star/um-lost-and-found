'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type UploadDropzoneProps = {
  onUploaded: (urls: string[]) => void;
  maxFiles?: number;
  bucket?: string;
};

export function UploadDropzone({ onUploaded, maxFiles = 5, bucket = 'item-images' }: UploadDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  const onDrop = useCallback(
    (dropped: FileList | null) => {
      if (!dropped) return;
      const arr = Array.from(dropped)
        .filter((f) => f.type.startsWith('image/'))
        .slice(0, maxFiles);
      setFiles(arr);
      setError(null);
    },
    [maxFiles]
  );

  const openFilePicker = () => inputRef.current?.click();

  async function uploadAll() {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr || new Error('Not signed in');
      const userId = userData.user.id;
      const bucketName = bucket;
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(bucketName).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      onUploaded(uploadedUrls);
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-umblue"
        onClick={openFilePicker}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onDrop(e.target.files)}
        />
        <div className="text-gray-700">
          <div className="font-medium">Drag & drop images here</div>
          <div className="text-sm text-gray-500">or click to browse (max {maxFiles})</div>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map(({ url, file }) => (
            <div key={url} className="overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={file.name} className="h-32 w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <button
          type="button"
          disabled={uploading || files.length === 0}
          onClick={uploadAll}
          className="rounded-xl bg-umblue px-4 py-2 text-white disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Upload images'}
        </button>
      </div>
    </div>
  );
}

