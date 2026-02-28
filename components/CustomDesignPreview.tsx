'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useToastStore } from '../store/toastStore';
import Image from 'next/image';

interface CustomDesignPreviewProps {
  categoryName: string;
}

export default function CustomDesignPreview({ categoryName }: CustomDesignPreviewProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('customOrder');
  const { addToast } = useToastStore();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      addToast(t('errorInvalidFormat'), 'error');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      addToast(t('errorFileSize'), 'error');
      return;
    }

    // Read and display the image
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      addToast(t('successUpload'), 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-8 rounded-xl bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] border border-[#E5E7EB] p-6 md:p-8">
      <h2 className="text-xl font-semibold text-[#1C1C1C] mb-6">{t('previewTitle')}</h2>
      
      {/* Mockup Preview - Full Width */}
      <div className="mb-6 rounded-xl overflow-hidden border-2 border-[#D1D5DB]">
        <div 
          className="relative w-full"
          style={{
            backgroundImage: 'url(/images/cup.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#F3F4F6',
            minHeight: '400px',
            aspectRatio: '16/9',
          }}
        >
          {/* Design Rectangle on Cup - Fixed position */}
          <div 
            className="absolute border-2 border-[#333] rounded overflow-hidden bg-white shadow-xl"
            style={{
              backgroundImage: uploadedImage ? `url(${uploadedImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              left: '27%',
              top: '24%',
              width: '68%',
              height: '57%',
            }}
          >
            {!uploadedImage && (
              <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF] text-xs text-center p-2">
                {t('previewPlaceholder')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all ${
              isDragging
                ? 'border-[#9C0000] bg-[#9C0000]/5'
                : 'border-[#D1D5DB] bg-white hover:border-[#9C0000]/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleInputChange}
              className="hidden"
            />
            
            <div className="text-center">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-[#1C1C1C] font-semibold mb-2">{t('uploadTitle')}</p>
              <p className="text-[#6B7280] text-sm mb-2">{t('uploadSubtitle')}</p>
              <p className="text-[#9CA3AF] text-xs">{t('uploadFormats')}</p>
            </div>
          </div>

          {uploadedImage && (
            <div className="flex items-center justify-between rounded-lg bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded overflow-hidden border border-[#E5E7EB]">
                  <Image 
                    src={uploadedImage} 
                    alt="Uploaded preview" 
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1C1C1C]">{t('imageUploaded')}</p>
                  <p className="text-xs text-[#6B7280]">{t('imageReady')}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="text-[#EF4444] hover:text-[#DC2626] text-sm font-medium"
              >
                {t('removeImage')}
              </button>
            </div>
          )}

          <div className="rounded-lg bg-[#FEF3C7] border border-[#FDE68A] p-4">
            <p className="text-[#92400E] text-xs leading-relaxed">
              💡 {t('uploadHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
