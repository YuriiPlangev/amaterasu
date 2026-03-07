# Налаштування Social Auth (Google & Telegram)

## ⚠️ Важливо перед початком

**Telegram Login Widget НЕ працює на localhost!**
- Якщо тестуєте на `localhost:3000` - отримаєте помилку **"Bot domain invalid"**
- Для локальної розробки використовуйте:
  - **ngrok** (`ngrok http 3000`) - створює тимчасовий публічний URL
  - **Cloudflare Tunnel** - безкоштовний туннель
  - Або тестуйте тільки на production сервері

**Google OAuth працює на localhost** - можна тестувати локально.

---

## Нові змінні середовища

### 1. GOOGLE_CLIENT_ID
**Призначення:** Ідентифікатор додатку Google OAuth для входу через Google.

**Де взяти:**
1. Перейдіть на [Google Cloud Console](https://console.cloud.google.com/)
2. Створіть новий проєкт або оберіть існуючий
3. У меню ліворуч виберіть **APIs & Services** → **Credentials**
4. Натисніть **Create Credentials** → **OAuth 2.0 Client ID**
5. Тип додатку: **Web application**
6. У полі **Authorized redirect URIs** додайте:
   ```
   https://ваш-домен.com/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback (для локальної розробки)
   ```
7. Скопіюйте **Client ID** із створеного OAuth клієнта

**Приклад:**
```env
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

---

### 2. GOOGLE_CLIENT_SECRET
**Призначення:** Секретний ключ додатку Google OAuth (для обміну коду авторизації на токен доступу).

**Де взяти:**
1. У тому ж розділі **Credentials** у Google Cloud Console
2. Натисніть на створений OAuth 2.0 Client ID
3. Скопіюйте **Client secret**

**Приклад:**
```env
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

⚠️ **ВАЖЛИВО:** Не публікуйте цей ключ у публічних репозиторіях!

---

### 3. NEXT_PUBLIC_SITE_URL
**Призначення:** Базова URL-адреса вашого сайту (потрібна для формування redirect URI в OAuth і callback URL).

**Де взяти:**
- Для production: домен вашого сайту (наприклад, `https://amaterasu.shop`)
- Для локальної розробки: `http://localhost:3000`

**Приклад:**
```env
# Production
NEXT_PUBLIC_SITE_URL=https://amaterasu.shop

# Development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

⚠️ **ВАЖЛИВО:** 
- Без `/` в кінці
- Повинна точно збігатися з доменом, на якому працює ваш сайт
- Ця змінна також використовується в Google OAuth Redirect URI і LiqPay callback

---

### 4. TELEGRAM_BOT_TOKEN
**Призначення:** Токен бота Telegram для перевірки підпису даних авторизації від Telegram Login Widget.

**Де взяти:**
1. Відкрийте Telegram і знайдіть бота [@BotFather](https://t.me/BotFather)
2. Надішліть команду `/newbot`
3. Дайте ім'я вашому боту (наприклад, `Amaterasu Auth`)
4. Дайте username боту (наприклад, `amaterasu_auth_bot`)
5. BotFather надішле вам **токен** у форматі `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
6. Скопіюйте цей токен

**Приклад:**
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-1234567
```

⚠️ **ВАЖЛИВО:** Не публікуйте цей токен у публічних репозиторіях!

**Налаштування домену бота (ОБОВ'ЯЗКОВО!):**

⚠️ **Без цього кроку Telegram Login Widget НЕ ПРАЦЮВАТИМЕ** (помилка "Bot domain invalid")

1. Після створення бота надішліть BotFather команду: `/setdomain`
2. Виберіть свого бота зі списку
3. Вкажіть **ТОЧНИЙ** домен вашого сайту

**Правильні приклади:**
- `amaterasu.shop` ✅
- `www.amaterasu.shop` ✅ (якщо сайт на www)
- `subdomain.amaterasu.shop` ✅ (для субдоменів)

**НЕПРАВИЛЬНІ приклади (будуть помилки):**
- `https://amaterasu.shop` ❌ (НЕ додавати https://)
- `http://amaterasu.shop` ❌ (НЕ додавати http://)
- `amaterasu.shop/` ❌ (НЕ додавати слеш в кінці)
- `localhost` ❌ (Telegram не підтримує localhost)
- `127.0.0.1` ❌ (IP адреси не підтримуються)

**Для локальної розробки:**
- Telegram Login Widget НЕ працює на `localhost:3000`
- Використовуйте **ngrok** або **Cloudflare Tunnel** для тестування
- Або тестуйте тільки Google OAuth локально, а Telegram на production

---

### 5. NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
**Призначення:** Username вашого Telegram бота (для відображення Telegram Login Widget на сторінці).

**Де взяти:**
- Це username, який ви вказали при створенні бота (без `@`)
- Наприклад, якщо ваш бот `@amaterasu_auth_bot`, то значення: `amaterasu_auth_bot`

**Приклад:**
```env
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=amaterasu_auth_bot
```

⚠️ **ВАЖЛИВО:** Без символу `@` на початку!

---

## Вже існуючі змінні (використовуються в social auth)

### WP_URL
**Призначення:** URL вашого WordPress сайту (для надсилання запитів до WP REST API).

**Приклад:**
```env
WP_URL=https://admin.amaterasu.shop
```

### JWT_SECRET
**Призначення:** Секретний ключ для підпису JWT токенів авторизації.

**Приклад:**
```env
JWT_SECRET=ваш_дуже_секретний_ключ_random_64_symbols_minimum
```

---

## Повний приклад .env файлу

```env
# WordPress
WP_URL=https://admin.amaterasu.shop
WC_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WC_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT
JWT_SECRET=super_secret_key_min_32_chars_for_production_use_random_generator

# Site URL
NEXT_PUBLIC_SITE_URL=https://amaterasu.shop

# Google OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz

# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-1234567
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=amaterasu_auth_bot

# LiqPay (якщо використовується)
LIQPAY_PUBLIC_KEY=sandbox_...
LIQPAY_PRIVATE_KEY=sandbox_...
```

---

## Швидкий чеклист налаштування

### Google OAuth
- [ ] Створити проєкт у Google Cloud Console
- [ ] Створити OAuth 2.0 Client ID
- [ ] Додати redirect URI: `{NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`
- [ ] Скопіювати Client ID і Client Secret у .env
- [ ] Увімкнути Google+ API (якщо потрібно)

### Telegram Bot
- [ ] Створити бота через @BotFather
- [ ] Скопіювати Bot Token у .env
- [ ] Налаштувати domain бота через `/setdomain`
- [ ] Скопіювати username бота (без @) у .env як NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

### WordPress
- [ ] Завантажити оновлений файл `amaterasu-checkout/amaterasu-checkout.php` на сервер
- [ ] Перевірити, що плагін активний у WordPress Admin → Plugins

---

## Перевірка роботи

### Google Auth
1. Відкрийте `/uk/auth/register` або `/uk/auth/login`
2. Натисніть "Продовжити з Google"
3. Виберіть Google акаунт
4. Перевірте, що ви увійшли і перенаправлені на `/uk/account`

### Telegram Auth
1. Відкрийте `/uk/auth/register` або `/uk/auth/login`
2. Натисніть на кнопку Telegram Login Widget
3. Підтвердіть вхід у Telegram
4. Перевірте, що ви увійшли і перенаправлені на `/uk/account`

---

## Troubleshooting

### Google OAuth помилки
- **redirect_uri_mismatch**: перевірте, що в Google Console додано точний URI `{NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`
- **invalid_client**: перевірте GOOGLE_CLIENT_ID і GOOGLE_CLIENT_SECRET
- **access_denied**: користувач відмовився від авторизації (нормальна поведінка)

### Telegram помилки

**"Bot domain invalid" (найчастіша помилка):**

Ця помилка означає, що домен НЕ налаштований або налаштований неправильно.

**Кроки виправлення:**
1. Відкрийте Telegram → знайдіть [@BotFather](https://t.me/BotFather)
2. Надішліть команду: `/setdomain`
3. Виберіть ваш бот зі списку
4. Надішліть ТОЧНИЙ домен без `https://`, `http://`, `www` (якщо сайт без www), без `/`

**Приклади:**
- ✅ Правильно: `amaterasu.shop`
- ❌ Неправильно: `https://amaterasu.shop`
- ❌ Неправильно: `www.amaterasu.shop` (якщо сайт працює БЕЗ www)
- ❌ Неправильно: `localhost:3000` (localhost не підтримується)

**Як перевірити поточний домен:**
1. Надішліть `/mybots` у BotFather
2. Виберіть бота → **Bot Settings** → **Domain**
3. Якщо показує "not set" або неправильний - виправте через `/setdomain`

**Якщо ви на localhost:**
- Telegram Login Widget НЕ працює на localhost
- Використайте **ngrok**: `ngrok http 3000` → скопіюйте URL → встановіть в `/setdomain`
- Або тестуйте на реальному домені

**Інші помилки:**
- **Invalid signature**: неправильний TELEGRAM_BOT_TOKEN у .env
- **Widget не відображається**: перевірте NEXT_PUBLIC_TELEGRAM_BOT_USERNAME (без @)
- **Auth_date expired**: годинник сервера відстає більше ніж на 24 години

### WordPress помилки
- **social_auth_failed**: перевірте, що плагін `amaterasu-checkout.php` активний і файл оновлений
- **500 Internal Server Error**: перевірте логи WordPress (wp-content/debug.log)
