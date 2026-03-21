# SEO: налаштування та рекомендації

## Звіт про SEO-оптимізацію (16.03.2025)

### Впроваджені зміни

#### 1. Динамічні метадані (Metadata API) — товар
- **title**: `{Product Name} | Купити аніме мерч в Amaterasu`
- **description**: з `short_description` (очищено від HTML через `cleanDescription`)
- **alternates.canonical**: посилання на поточний товар
- **openGraph**: title, description, url, images (динамічна OG-картка)
- **twitter**: summary_large_image

#### 2. JSON-LD (Rich Snippets)
- **Product**: name, description, sku, image, offers (price, priceCurrency: UAH, availability)
- **BreadcrumbList**: Головна → Каталог → Категорія → Тайтл/Персонаж → Товар

#### 3. OpenGraph Image Generation (ImageResponse)
- **`app/api/og/route.tsx`**: динамічна генерація OG-зображень через `@vercel/og`
- Параметри: `name`, `price`, `image`
- Картка: логотип Amaterasu, фото товару, назва, ціна (1200×630 px)

#### 4. Sitemap & Robots
- **sitemap.ts**: товари з WooCommerce + категорії + пости з WordPress
- **robots.ts**: disallow `/cart`, `/checkout`, `/my-account`, `/api/`, `/auth/`, `/account`

#### 5. Image SEO
- Головне фото товару: `priority` для LCP
- `alt` на основі `product.name` у ProductGallery та ProductCard

#### 6. SEO для фільтрів каталогу
- Динамічний `document.title` при виборі фільтра:  
  `Мерч по темі {Character/Title/Game/Category} | Amaterasu`

---

## Що вже зроблено на сайті

### 1. Метадані (Metadata)
- **Кореневий layout** (`app/layout.tsx`): `metadataBase`, шаблон `title` (`%s | Amaterasu`), опис, ключові слова, Open Graph, Twitter Card, іконки, robots.
- **Локалізований layout** (`app/[locale]/layout.tsx`): окремі title/description для uk та en, `alternates.canonical` і `alternates.languages` (hreflang), Open Graph з locale.
- **Сторінки каталогу, доставки, контактів, новин**: окремі layout з `generateMetadata` для кожної локалі.
- **Товар** (`app/[locale]/product/[slug]/page.tsx`): `generateMetadata` — динамічні title, description, openGraph з зображенням, canonical.
- **Новина** (`app/[locale]/news/[slug]/layout.tsx`): `generateMetadata` — title, description, openGraph, canonical з даних WP.

### 2. Sitemap та robots
- **`app/sitemap.ts`**: динамічна sitemap — головна, каталог, доставка, контакти, новини, кошик, обране, акаунт, авторизація (uk/en); усі товари з WooCommerce; усі пости з WordPress. `lastModified`, `changeFrequency`, `priority`.
- **`app/robots.ts`**: дозволено індексувати все, крім `/api/`, `/auth/`, `/account/`; посилання на `sitemap.xml`.

### 3. JSON-LD (структуровані дані)
- **Organization**: на всіх сторінках через `[locale]` layout — назва, url, опис, посилання на Telegram та Instagram.
- **Product**: на сторінці товару — назва, опис, зображення, ціна (UAH), наявність.
- **BreadcrumbList**: на сторінці товару — Головна → Каталог/тег → Назва товару.

### 4. Допоміжні речі
- **`lib/seo.ts`**: `getBaseUrl()`, `absoluteUrl()`, константи описів. Для продакшену в `.env` задати `NEXT_PUBLIC_SITE_URL=https://ваш-домен.com`.

---

## Рекомендації по покращенню SEO

### Обов’язково
1. **Задати домен у production**  
   У `.env.production`:  
   `NEXT_PUBLIC_SITE_URL=https://amaterasu-shop.com` (або ваш реальний домен). Інакше canonical, sitemap і Open Graph будуть з невірним URL.

2. **Перевірити індексованість**  
   - В Google Search Console додати сайт і надіслати sitemap: `https://ваш-домен.com/sitemap.xml`.  
   - Переконатися, що головна, каталог і кілька товарів без помилок індексуються.

3. **Якість контенту на сторінках**  
   - Унікальні H1 на кожній сторінці (вже є).  
   - Короткі унікальні описи товарів у WooCommerce (до 150–160 символів для meta description).  
   - Для новин у WP заповнювати excerpt або short description — це йде в meta description.

### Бажано
4. **Зображення**  
   - У товарах у WooCommerce заповнювати Alt Text для головного зображення (на сайті вже використовується `product.name` для карток).  
   - Для соцмереж можна додати окремі Open Graph зображення (наприклад, логотип) у root `metadata.openGraph.images`.

5. **Швидкість**  
   - Залишити підключення `next/image` для товарних зображень.  
   - При великому каталозі розглянути пагінацію або lazy load для сітки товарів, щоб не перевантажувати перший екран.

6. **Мобільна версія**  
   - Перевірити у Google Mobile-Friendly Test.  
   - Viewport і базові мета-теги за замовчуванням дає Next.js.

7. **Локалізація**  
   - `alternates.languages` (uk/en) уже задані в metadata — це коректний hreflang.  
   - Якщо з’являться інші мови, додати їх у `locales` та в metadata.

### Додатково
8. **Блог/новини**  
   - Регулярні оновлення допомагають. Продовжуйте додавати новини в WP із змістовними заголовками та excerpt.

9. **Аналітика та моніторинг**  
   - Підключити Google Analytics 4 (або інший аналітик) і переглядати поведінку та конверсії.  
   - У Search Console слідкувати за помилками індексації та Core Web Vitals.

10. **Зовнішні посилання та соцмережі**  
    - Посилання з соцмереж (Telegram, Instagram) і з партнерських сайтів покращують видимість. У JSON-LD Organization ці посилання вже вказані.

---

## Файли, пов’язані з SEO

| Файл | Призначення |
|------|-------------|
| `app/layout.tsx` | Базові metadata, openGraph, keywords |
| `app/[locale]/layout.tsx` | Локальні title/description, hreflang, JsonLd Organization |
| `app/[locale]/*/layout.tsx` | Метадані для catalog, delivery, contacts, news |
| `app/[locale]/product/[slug]/page.tsx` | generateMetadata, JsonLd Product, Breadcrumb |
| `app/[locale]/news/[slug]/layout.tsx` | generateMetadata для статті |
| `app/sitemap.ts` | Динамічна sitemap |
| `app/robots.ts` | robots.txt |
| `lib/seo.ts` | getBaseUrl, absoluteUrl, константи |
| `components/seo/JsonLd*.tsx` | Організація, товар, хлібні крихти |

Якщо потрібно змінити тексти (наприклад, default description) — це в `lib/seo.ts` та у відповідних layout/page.
