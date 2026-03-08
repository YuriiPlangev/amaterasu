'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToastStore } from '../store/toastStore';
import Image from 'next/image';
import html2canvas from 'html2canvas';

interface CustomDesignPreviewProps {
  categoryName: string;
  productType?: 'cup' | 'badge' | 'keychain' | 'magnet';
}

export default function CustomDesignPreview({ categoryName, productType = 'cup' }: CustomDesignPreviewProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImage2, setUploadedImage2] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(100);
  const [offsetX, setOffsetX] = useState(50);
  const [offsetY, setOffsetY] = useState(50);
  const [rotation2, setRotation2] = useState(0);
  const [scale2, setScale2] = useState(100);
  const [offsetX2, setOffsetX2] = useState(50);
  const [offsetY2, setOffsetY2] = useState(50);
  const [isSending, setIsSending] = useState(false);
  const [userContact, setUserContact] = useState('');
  const [originalImageData, setOriginalImageData] = useState<string | null>(null);
  const [originalImageData2, setOriginalImageData2] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
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
      if (productType === 'keychain' && activeTab === 2) {
        setUploadedImage2(result);
        setOriginalImageData2(result);
      } else {
        setUploadedImage(result);
        setOriginalImageData(result);
      }
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
    if (productType === 'keychain' && activeTab === 2) {
      setUploadedImage2(null);
      setOriginalImageData2(null);
    } else {
      setUploadedImage(null);
      setOriginalImageData(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateMockupImage = async (): Promise<string> => {
    if (!uploadedImage && !uploadedImage2) {
      throw new Error('No image uploaded');
    }

    if (!previewRef.current) {
      throw new Error('Preview element not found');
    }

    try {
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 3, // Делаем картинку четкой (в 2 раза больше экранного размера)
        backgroundColor: "#ffffff", // Белый фон вместо прозрачного
      });
      
      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error('html2canvas error:', error);
      throw new Error('Failed to generate mockup');
    }
  };

  const handleSendToTelegram = async () => {
    if (productType === 'keychain') {
      if (!uploadedImage && !uploadedImage2) {
        addToast('Будь ласка, завантажте хоча б одне зображення', 'error');
        return;
      }
    } else {
      if (!uploadedImage || !originalImageData) {
        addToast('Будь ласка, завантажте зображення', 'error');
        return;
      }
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
          originalImage2: productType === 'keychain' ? originalImageData2 : undefined,
          mockupImage,
          categoryName,
          userName: userContact.trim(),
          productType,
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

  const productBgImage = productType === 'badge' ? '/images/badge.jpg' 
    : productType === 'magnet' ? '/images/magnet.png'
    : productType === 'keychain' ? '/images/keychain.png' 
    : '/images/cup.jpg';
  const productAspectRatio = (productType === 'badge' || productType === 'magnet' || productType === 'keychain') ? '2/1' : '16/9';
  const previewMinHeightClass = (productType === 'badge' || productType === 'magnet' || productType === 'keychain')
    ? 'min-h-[170px] sm:min-h-[260px] md:min-h-[400px]'
    : 'min-h-[210px] sm:min-h-[300px] md:min-h-[400px]';
  
  const designAreaStyle = productType === 'badge'
    ? {
        left: '19%',
        top: '18%',
        width: '43.6%',
        height: '61%',
        borderRadius: '50%',
      }
    : productType === 'magnet'
    ? {
        left: '16.3%',
        top: '22%',
        width: '40%',
        height: '39.1%',
        borderRadius: '0%',
      }
    : {
        left: '27%',
        top: '25%',
        width: '68%',
        height: '55%',
      };

  // Keychain areas (left and right) - adjust these based on your actual keychain image
  const keychainLeftArea = {
    left: '19.6%',
    top: '39.5%',
    width: '25.1%',
    height: '39%',
  };

  const keychainRightArea = {
    left: '54.1%',
    top: '39.4%',
    width: '25%',
    height: '39.2%',
  };
  
  // Current image and settings based on active tab
  const currentImage = productType === 'keychain' && activeTab === 2 ? uploadedImage2 : uploadedImage;
  const currentRotation = productType === 'keychain' && activeTab === 2 ? rotation2 : rotation;
  const currentScale = productType === 'keychain' && activeTab === 2 ? scale2 : scale;
  const currentOffsetX = productType === 'keychain' && activeTab === 2 ? offsetX2 : offsetX;
  const currentOffsetY = productType === 'keychain' && activeTab === 2 ? offsetY2 : offsetY;

  const setCurrentRotation = (value: number) => {
    if (productType === 'keychain' && activeTab === 2) {
      setRotation2(value);
    } else {
      setRotation(value);
    }
  };

  const setCurrentScale = (value: number) => {
    if (productType === 'keychain' && activeTab === 2) {
      setScale2(value);
    } else {
      setScale(value);
    }
  };

  const setCurrentOffsetX = (value: number) => {
    if (productType === 'keychain' && activeTab === 2) {
      setOffsetX2(value);
    } else {
      setOffsetX(value);
    }
  };

  const setCurrentOffsetY = (value: number) => {
    if (productType === 'keychain' && activeTab === 2) {
      setOffsetY2(value);
    } else {
      setOffsetY(value);
    }
  };

  return (
    <div className="mb-8 rounded-xl bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] border border-[#E5E7EB] p-4 sm:p-5 md:p-8">
      <h2 className="text-xl font-semibold text-[#1C1C1C] mb-6">{t('previewTitle')}</h2>
      
      {/* Mockup Preview - Full Width */}
      <div className="mb-6 rounded-xl overflow-hidden border-2 border-[#D1D5DB] max-w-[450px] mx-auto w-full]">
        <div 
            ref={previewRef}
            className="relative w-full bg-[#F3F4F6]"
            style={{
              // 120% дает идеальную пропорцию для брелков и значков (не растягивается)
              // 70% дает пропорцию для значков и магнитов
              // 56.25% дает пропорцию 16:9 (чашки)
              paddingBottom: productType === 'keychain' ? '90%' : productType === 'badge' || productType === 'magnet' ? '100%' : '56.25%',
            }}
        >
          <div className="absolute inset-0 w-full h-full">
    
    {/* Product background image */}
    <img
      src={productBgImage}
      alt="Product"
      className={`absolute inset-0 w-full h-full ${productType === 'keychain' ? 'object-cover' : 'object-cover'}`}
      crossOrigin="anonymous"
    />

          {/* Design Areas */}
          {productType === 'keychain' ? (
            <>
              {/* Left Keychain */}
              <div 
                className="absolute overflow-hidden bg-white/90"
                style={keychainLeftArea}
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
                      transformOrigin: 'center',
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF] text-xs text-center p-2">
                    Картинка 1
                  </div>
                )}
              </div>

              {/* Right Keychain */}
              <div 
                className="absolute overflow-hidden bg-white/90 "
                style={keychainRightArea}
              >
                {uploadedImage2 ? (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${uploadedImage2})`,
                      backgroundSize: `${scale2}%`,
                      backgroundPosition: `${offsetX2}% ${offsetY2}%`,
                      backgroundRepeat: 'no-repeat',
                      transform: `rotate(${rotation2}deg)`,
                      transformOrigin: 'center',
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF] text-xs text-center p-2">
                    Картинка 2
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Single Design Area for cup, badge and magnet */
            <div 
              className="absolute overflow-hidden bg-white"
              style={designAreaStyle}
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
                    transformOrigin: 'center',
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF] text-xs text-center p-2">
                  {t('previewPlaceholder')}
                </div>
              )}
            </div>
          )}
        
              </div>
        </div>
      </div>

      {/* Tabs for Keychain */}
      {productType === 'keychain' && (
        <div className="mb-6 flex gap-2 border-b border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 1
                ? 'border-b-2 border-[#9C0000] text-[#9C0000]'
                : 'text-[#6B7280] hover:text-[#1C1C1C]'
            }`}
          >
            Картинка 1 (ліва)
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 2
                ? 'border-b-2 border-[#9C0000] text-[#9C0000]'
                : 'text-[#6B7280] hover:text-[#1C1C1C]'
            }`}
          >
            Картинка 2 (права)
          </button>
        </div>
      )}

      {/* Image Controls */}
      {currentImage && (
        <div className="mb-6 rounded-xl bg-white border border-[#E5E7EB] p-4 md:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#1C1C1C] mb-3">Налаштування зображення</h3>
          
          {/* Rotation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#6B7280]">Поворот</label>
              <span className="text-sm font-semibold text-[#9C0000]">{currentRotation}°</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <button
                onClick={() => setCurrentRotation(currentRotation - 15)}
                className="px-3 py-1.5 rounded bg-[#F3F4F6] hover:bg-[#E5E7EB] text-sm font-medium w-full sm:w-auto"
              >
                ↺ -15°
              </button>
              <input
                type="range"
                min="0"
                max="360"
                value={currentRotation}
                onChange={(e) => setCurrentRotation(Number(e.target.value))}
                className="flex-1 h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#9C0000]"
              />
              <button
                onClick={() => setCurrentRotation(currentRotation + 15)}
                className="px-3 py-1.5 rounded bg-[#F3F4F6] hover:bg-[#E5E7EB] text-sm font-medium w-full sm:w-auto"
              >
                ↻ +15°
              </button>
            </div>
          </div>

          {/* Scale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#6B7280]">Масштаб</label>
              <span className="text-sm font-semibold text-[#9C0000]">{currentScale}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={currentScale}
              onChange={(e) => setCurrentScale(Number(e.target.value))}
              className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#9C0000]"
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-[#6B7280]">Позиція X</label>
                <span className="text-sm font-semibold text-[#9C0000]">{currentOffsetX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentOffsetX}
                onChange={(e) => setCurrentOffsetX(Number(e.target.value))}
                className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#9C0000]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-[#6B7280]">Позиція Y</label>
                <span className="text-sm font-semibold text-[#9C0000]">{currentOffsetY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentOffsetY}
                onChange={(e) => setCurrentOffsetY(Number(e.target.value))}
                className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#9C0000]"
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setCurrentRotation(0);
              setCurrentScale(100);
              setCurrentOffsetX(50);
              setCurrentOffsetY(50);
            }}
            className="w-full px-4 py-2 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-sm font-medium text-[#1C1C1C] transition-colors"
          >
            🔄 Скинути налаштування
          </button>

          {/* Contact Input */}
          {currentImage && (
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
            disabled={
              isSending || 
              (productType === 'keychain' ? (!uploadedImage && !uploadedImage2) : !uploadedImage) ||
              !userContact.trim()
            }
            className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all ${
              isSending || 
              (productType === 'keychain' ? (!uploadedImage && !uploadedImage2) : !uploadedImage) ||
              !userContact.trim()
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
            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-5 sm:p-6 md:p-8 transition-all ${
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
              <p className="text-[#1C1C1C] font-semibold mb-2">
                {productType === 'keychain' 
                  ? `${t('uploadTitle')} (${activeTab === 1 ? 'Картинка 1' : 'Картинка 2'})`
                  : t('uploadTitle')
                }
              </p>
              <p className="text-[#6B7280] text-sm mb-2">{t('uploadSubtitle')}</p>
              <p className="text-[#9CA3AF] text-xs">{t('uploadFormats')}</p>
            </div>
          </div>

          {currentImage && (
            <div className="flex items-center justify-between rounded-lg bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded overflow-hidden border border-[#E5E7EB]">
                  <Image 
                    src={currentImage} 
                    alt="Uploaded preview" 
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1C1C1C]">
                    {t('imageUploaded')} {productType === 'keychain' && `(${activeTab === 1 ? 'Картинка 1' : 'Картинка 2'})`}
                  </p>
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
