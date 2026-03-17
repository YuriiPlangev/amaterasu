import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      originalImage,
      originalImage2,
      mockupImage,
      categoryName,
      userName,
      userFirstName,
      productType,
      phone,
      telegram,
    } = await request.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing Telegram config:', { botToken: !!botToken, chatId: !!chatId });
      return NextResponse.json(
        { error: 'Telegram configuration missing' },
        { status: 500 }
      );
    }

    // Prepare caption
    const productTypeLabel =
      productType === 'badge'
        ? 'значок'
        : productType === 'magnet'
        ? 'магніт'
        : productType === 'keychain'
        ? 'брелок'
        : 'чашка';

    const captionLines = [
      '🎨 Нове замовлення на CustomDesign!',
      '',
      `📦 Категорія: ${categoryName}`,
      `🎯 Тип: ${productTypeLabel}`,
      `📞 Телефон: ${phone || userName || 'Не вказано'}`,
      `💬 Telegram: ${telegram || 'Не вказано'}`,
      '',
      '⚠️ Це попередній макет, результат не фінальний. Ми звʼяжемося з клієнтом для уточнення деталей перед друком.',
      '🧾 Товар буде доданий до кошика для оплати.',
    ];

    const caption = captionLines.join('\n');

    // Send original image 1 as document to preserve quality
    if (originalImage) {
      const originalBuffer = Buffer.from(originalImage.split(',')[1], 'base64');
      
      // Detect MIME type from base64 header
      const mimeMatch = originalImage.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      
      const formData1 = new FormData();
      formData1.append('chat_id', chatId);
      
      const blob1 = new Blob([originalBuffer], { type: mimeType });
      const file1 = new File([blob1], `original1.${extension}`, { type: mimeType });
      formData1.append('document', file1);
      formData1.append('caption', `${caption}\n\n📸 Оригінал користувача${productType === 'keychain' ? ' (Картинка 1 - ліва)' : ''}`);

      const response1 = await fetch(
        `https://api.telegram.org/bot${botToken}/sendDocument`,
        {
          method: 'POST',
          body: formData1,
        }
      );

      const result1 = await response1.json();
      
      if (!response1.ok) {
        console.error('Telegram API error (original):', result1);
        throw new Error(`Failed to send original image: ${JSON.stringify(result1)}`);
      }
    }

    // Send original image 2 as document to preserve quality (for keychain)
    if (originalImage2 && productType === 'keychain') {
      const originalBuffer2 = Buffer.from(originalImage2.split(',')[1], 'base64');
      
      // Detect MIME type from base64 header
      const mimeMatch2 = originalImage2.match(/^data:([^;]+);base64,/);
      const mimeType2 = mimeMatch2 ? mimeMatch2[1] : 'image/png';
      const extension2 = mimeType2.split('/')[1] || 'png';
      
      const formData1b = new FormData();
      formData1b.append('chat_id', chatId);
      
      const blob1b = new Blob([originalBuffer2], { type: mimeType2 });
      const file1b = new File([blob1b], `original2.${extension2}`, { type: mimeType2 });
      formData1b.append('document', file1b);
      formData1b.append('caption', '📸 Оригінал користувача (Картинка 2 - права)');

      const response1b = await fetch(
        `https://api.telegram.org/bot${botToken}/sendDocument`,
        {
          method: 'POST',
          body: formData1b,
        }
      );

      const result1b = await response1b.json();
      
      if (!response1b.ok) {
        console.error('Telegram API error (original 2):', result1b);
        throw new Error(`Failed to send original image 2: ${JSON.stringify(result1b)}`);
      }
    }

    // Send mockup image
    const mockupBuffer = Buffer.from(mockupImage.split(',')[1], 'base64');
    const formData2 = new FormData();
    formData2.append('chat_id', chatId);
    
    const blob2 = new Blob([mockupBuffer], { type: 'image/jpeg' });
    const file2 = new File([blob2], 'mockup.jpg', { type: 'image/jpeg' });
    formData2.append('photo', file2);
    formData2.append('caption', `✨ Результат на ${productTypeLabel === 'брелок' ? 'брелоку' : productTypeLabel === 'значок' ? 'значку' : 'чашці'}`);

    const response2 = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: 'POST',
        body: formData2,
      }
    );

    const result2 = await response2.json();
    
    if (!response2.ok) {
      console.error('Telegram API error (mockup):', result2);
      throw new Error(`Failed to send mockup image: ${JSON.stringify(result2)}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send to Telegram' },
      { status: 500 }
    );
  }
}
