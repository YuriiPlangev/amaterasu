import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { originalImage, mockupImage, categoryName, userName, userFirstName } = await request.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing Telegram config:', { botToken: !!botToken, chatId: !!chatId });
      return NextResponse.json(
        { error: 'Telegram configuration missing' },
        { status: 500 }
      );
    }

    // Convert base64 images to buffers
    const originalBuffer = Buffer.from(originalImage.split(',')[1], 'base64');
    const mockupBuffer = Buffer.from(mockupImage.split(',')[1], 'base64');

    // Prepare caption
    const caption = `🎨 Нове замовлення на CustomDesign!\n\n📦 Категорія: ${categoryName}\n👤 Контакт користувача: ${userName || 'Не вказано'}`;

    // Send original image
    const formData1 = new FormData();
    formData1.append('chat_id', chatId);
    
    const blob1 = new Blob([originalBuffer], { type: 'image/jpeg' });
    const file1 = new File([blob1], 'original.jpg', { type: 'image/jpeg' });
    formData1.append('photo', file1);
    formData1.append('caption', `${caption}\n\n📸 Оригінал користувача`);

    const response1 = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
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

    // Send mockup image
    const formData2 = new FormData();
    formData2.append('chat_id', chatId);
    
    const blob2 = new Blob([mockupBuffer], { type: 'image/jpeg' });
    const file2 = new File([blob2], 'mockup.jpg', { type: 'image/jpeg' });
    formData2.append('photo', file2);
    formData2.append('caption', '✨ Результат на чашці');

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
