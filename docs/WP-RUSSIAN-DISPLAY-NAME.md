# Кириллица (русский) в отображаемом имени (display_name)

Если при сохранении имени на русском возникает ошибка «WP Error», возможные причины и решения:

## 1. Кодировка базы данных WordPress

Убедитесь, что база данных использует utf8mb4:

```sql
-- Проверить кодировку таблицы users
SHOW CREATE TABLE wp_users;
```

Колонка `display_name` должна быть в `utf8mb4_unicode_ci` или `utf8mb4_unicode_520_ci`.

Если используется `latin1` или `utf8`, конвертируйте:

```sql
ALTER TABLE wp_users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. wp-config.php

Добавьте или проверьте:

```php
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', 'utf8mb4_unicode_ci');
```

## 3. PHP‑фильтр (если проблема сохраняется)

Добавьте в `functions.php` или в `wordpress-custom-endpoint.php`:

```php
// Явно разрешить Unicode в display_name при обновлении через REST API
add_filter('rest_pre_update_user', function ($user_data, $request) {
    if (!empty($request['name']) && is_string($request['name'])) {
        $user_data['display_name'] = $request['name'];
    }
    return $user_data;
}, 10, 2);
```

## 4. Сообщения об ошибках

Сайт теперь возвращает понятные сообщения вместо «WP Error»:
- Ошибки от WordPress передаются пользователю
- Если сработал общий fallback — показывается: «Не вдалося зберегти дані в профілі. Спробуйте інше імʼя або зверніться до підтримки.»

## 5. Права пользователя (Application Password)

Для обновления `display_name` через REST API Application Password должен иметь права `edit_users` (редактирование пользователей). Убедитесь, что у пользователя WordPress, чей Application Password используется в Next.js, есть эта возможность.
