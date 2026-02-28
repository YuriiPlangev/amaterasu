'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToastStore } from '../store/toastStore';
import Image from 'next/image';

interface CustomDesignPreviewProps {
  categoryName: string;
}

export default function CustomDesignPreview({ categoryName }: CustomDesignPreviewProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(100);
  const [offsetX, setOffsetX] = useState(50);
  const [offsetY, setOffsetY] = useState(50);
  const [isSending, setIsSending] = useState(false);
  const [userContact, setUserContact] = useState('');
  const [originalImageData, setOriginalImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('customOrder');
  const { addToast } = useToastStore();

  // Load user contact from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customOrderUserContact');
    if (saved) {
      setUserContact(saved);
    }
  }, []);

  // Save user contact to localStorage
  const handleContactChange = (value: string) => {
    setUserContact(value);
    if (value.trim()) {
      localStorage.setItem('customOrderUserContact', value);
    } else {
      localStorage.removeItem('customOrderUserContact');
    }
  };

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
      setOriginalImageData(result); // Save original
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
    setOriginalImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateMockupImage = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Canvas not supported');
        return;
      }

      // Set canvas size to match cup image aspect ratio (16:9)
      canvas.width = 1600;
      canvas.height = 900;

      const cupImage = new window.Image();
      cupImage.crossOrigin = 'anonymous';
      cupImage.src = '/images/cup.png';

      cupImage.onload = () => {
        // Draw cup background
        ctx.drawImage(cupImage, 0, 0, canvas.width, canvas.height);

        if (uploadedImage) {
          // Calculate design rectangle position (matching the preview exactly)
          const rectLeft = canvas.width * 0.27;
          const rectTop = canvas.height * 0.24;
          const rectWidth = canvas.width * 0.68;
          const rectHeight = canvas.height * 0.57;

          // Save context state
          ctx.save();

          // Create clipping region for the design rectangle
          ctx.beginPath();
          ctx.rect(rectLeft, rectTop, rectWidth, rectHeight);
          ctx.clip();

          const userImage = new window.Image();
          userImage.crossOrigin = 'anonymous';
          userImage.src = uploadedImage;

          userImage.onload = () => {
            // Apply rotation first (at center of rectangle)
            const centerX = rectLeft + rectWidth / 2;
            const centerY = rectTop + rectHeight / 2;

            ctx.translate(centerX, centerY);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);

            // Calculate size based on CSS backgroundSize logic
            // backgroundSize: ${scale}% means scale% of container size
            const scaleMultiplier = scale / 100;
            const scaledWidth = rectWidth * scaleMultiplier;
            const scaledHeight = rectHeight * scaleMultiplier;

            // Fit image to scaled dimensions while maintaining aspect ratio
            const imgAspect = userImage.width / userImage.height;
            const rectAspect = rectWidth / rectHeight;

            let drawWidth: number;
            let drawHeight: number;

            if (imgAspect > rectAspect) {
              drawWidth = scaledWidth;
              drawHeight = scaledWidth / imgAspect;
            } else {
              drawHeight = scaledHeight;
              drawWidth = drawHeight * imgAspect;
            }

            // Calculate position based on CSS backgroundPosition logic
            // backgroundPosition: ${offsetX}% ${offsetY}%
            // This means: move the image so that its offsetX% point is at offsetX% of container
            const offsetXPercent = (offsetX - 50) / 100; // Convert to -0.5 to 0.5 range
            const offsetYPercent = (offsetY - 50) / 100;

            const posX = rectLeft + (rectWidth - drawWidth) * (0.5 + offsetXPercent);
            const posY = rectTop + (rectHeight - drawHeight) * (0.5 + offsetYPercent);

            ctx.drawImage(userImage, posX, posY, drawWidth, drawHeight);

            ctx.restore();

            // Convert canvas to base64
            resolve(canvas.toDataURL('image/jpeg', 0.95));
          };

          userImage.onerror = () => reject('Failed to load user image');
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        }
      };

      cupImage.onerror = () => reject('Failed to load cup image');
    });
  };

  const handleSendToTelegram = async () => {
    if (!uploadedImage || !originalImageData) {
      addToast('Будь ласка, завантажте зображення', 'error');
      return;
    }

    if (!userContact.trim()) {
      addToast('Будь ласка, введіть свій нікнейм або номер телефону', 'error');
      return;
    }

    setIsSending(true);

    try {
      const mockupImage = await generateMockupImage();

      const response = await fetch('/api/send-to-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImage: originalImageData,
          mockupImage,
          categoryName,
          userName: userContact.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send');
      }

      addToast('Фотографії успішно відправлені боту! ✅', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Помилка відправки';
      addToast(`Помилка: ${errorMessage}`, 'error');
    } finally {
      setIsSending(false);
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
            backgroundImage: 'url(/images/cup.png)',
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
              left: '27%',
              top: '24%',
              width: '68%',
              height: '57%',
            }}
          >
            {uploadedImage ? (
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${uploadedImage})`,
                  backgroundSize: `${scale}%`,
                  backgroundPosition: `${offsetX}% ${offsetY}%`,
                  backgroundRepeat: 'no-repeat',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out',
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF] text-xs text-center p-2">
                {t('previewPlaceholder')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Controls */}
      {uploadedImage && (
        <div className="mb-6 rounded-xl bg-white border border-[#E5E7EB] p-4 md:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#1C1C1C] mb-3">Налаштування зображення</h3>
          
          {/* Rotation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#6B7280]">Поворот</label>
              <span className="text-sm font-semibold text-[#9C0000]">{rotation}°</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRotation(r => r - 15)}
                className="px-3 py-1.5 rounded bg-[#F3F4F6] hover:bg-[#E5E7EB] text-sm font-medium"
              >
                ↺ -15°
              </button>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#9C0000]"
              />
              <button
                onClick={() => setRotation(r => r + 15)}
                className="px-3 py-1.5 rounded bg-[#F3F4F6] hover:bg-[#E5E7EB] text-sm font-medium"
              >
                ↻ +15°
              </button>
            </div>
          </div>

          {/* Scale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#6B7280]">Масштаб</label>
              <span className="text-sm font-semibold text-[#9C0000]">{scale}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#9C0000]"
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-[#6B7280]">Позиція X</label>
                <span className="text-sm font-semibold text-[#9C0000]">{offsetX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#9C0000]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-[#6B7280]">Позиція Y</label>
                <span className="text-sm font-semibold text-[#9C0000]">{offsetY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#9C0000]"
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setRotation(0);
              setScale(100);
              setOffsetX(50);
              setOffsetY(50);
            }}
            className="w-full px-4 py-2 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-sm font-medium text-[#1C1C1C] transition-colors"
          >
            🔄 Скинути налаштування
          </button>

          {/* Contact Input */}
          {uploadedImage && (
            <>
              {/* User Contact Input */}
              <div className="rounded-lg bg-white border border-[#E5E7EB] p-4">
                <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
                  Ваш нікнейм або телефон
                </label>
                <input
                  type="text"
                  value={userContact}
                  onChange={(e) => handleContactChange(e.target.value)}
                  placeholder="Наприклад: @username або +380..."
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#9C0000]"
                />
                <p className="text-xs text-[#6B7280] mt-2">
                  Буде автоматично збережено для наступних замовлень
                </p>
              </div>
            </>
          )}

          {/* Save Contact Button */}
          <button
            onClick={handleSendToTelegram}
            disabled={isSending || !uploadedImage || !userContact.trim()}
            className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all ${
              isSending || !uploadedImage || !userContact.trim()
                ? 'bg-[#9C0000]/50 cursor-not-allowed'
                : 'bg-[#9C0000] hover:bg-[#8B0000] shadow-lg hover:shadow-xl'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {isSending ? 'Відправка...' : '📤 Відправити в Telegram бот'}
            </span>
          </button>
        </div>
      )}

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
