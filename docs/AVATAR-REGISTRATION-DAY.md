# Как добавить аватарку за регистрацию в определённый день

Пошаговая инструкция для выдачи уникальной аватарки пользователям, зарегистрировавшимся в указанную дату (например, день запуска).

---

## Шаг 1: Добавить изображение в проект Next.js

1. Подготовьте изображение аватарки (рекомендуется квадрат, например 200×200 px).
2. Сохраните файл в папку `public/avatars/`.
3. Имя файла должно быть `avatar_launch.jpg` (или другой ID, если настроите иначе).

```
public/avatars/avatar_launch.jpg
```

---

## Шаг 2: Зарегистрировать ID аватарки в Next.js

Откройте `lib/avatars.ts` и убедитесь, что ID есть в `LOCAL_AVATAR_IDS`:

```ts
export const LOCAL_AVATAR_IDS = ["avatar_launch"] as const;
```

Если используете другой ID (например, `avatar_promo_2026`), добавьте его:

```ts
export const LOCAL_AVATAR_IDS = ["avatar_launch", "avatar_promo_2026"] as const;
```

Файлы при этом должны быть: `avatar_launch.jpg`, `avatar_promo_2026.jpg`.

---

## Шаг 3: Добавить PHP-код в WordPress

Скопируйте содержимое файла `docs/wordpress-launch-day-avatars.php` и добавьте в `functions.php` вашей темы WordPress (или создайте отдельный плагин).

Основные настройки в начале файла:

```php
define('AMATERASU_LAUNCH_DATE', '2026-03-20');       // Дата в формате Y-m-d
define('AMATERASU_LAUNCH_AVATAR_SKU', 'avatar_launch'); // Должен совпадать с ID в lib/avatars.ts
```

- `AMATERASU_LAUNCH_DATE` — дата, в которую пользователи должны зарегистрироваться (например, день запуска).
- `AMATERASU_LAUNCH_AVATAR_SKU` — ID аватарки, совпадающий с записью в `LOCAL_AVATAR_IDS`.

---

## Шаг 4: Не создавать товар в WooCommerce

Аватарка за регистрацию — локальная, она **не продаётся**. Не создавайте для неё товар в WooCommerce. Выдача происходит автоматически через хук `user_register` в WordPress.

---

## Шаг 5: Проверка

1. Убедитесь, что в `wordpress-custom-endpoint.php` зарегистрированы поля `available_avatars` и `current_avatar` (обычно уже есть).
2. Зарегистрируйте тестового пользователя в указанную дату.
3. Проверьте, что в user meta появились `available_avatars` (массив с `avatar_launch`) и `current_avatar` (`avatar_launch`).
4. Войдите в аккаунт на сайте — аватарка должна быть доступна во вкладке «Унікальні» (Unique).

---

## Добавление аватарки за другой день (например, акция на новый год)

Чтобы выдать аватарку за регистрацию в другую дату:

1. Создайте новый файл, например `avatar_newyear.jpg`, в `public/avatars/`.
2. Добавьте ID в `lib/avatars.ts`: `["avatar_launch", "avatar_newyear"]`.
3. В WordPress добавьте ещё один хук или расширьте существующий:

```php
define('AMATERASU_NEWYEAR_DATE', '2026-01-01');
define('AMATERASU_NEWYEAR_AVATAR_SKU', 'avatar_newyear');

add_action('user_register', 'amaterasu_grant_newyear_avatar_on_register', 20, 1);

function amaterasu_grant_newyear_avatar_on_register($user_id) {
    $user = get_userdata($user_id);
    if (!$user) return;
    $reg_date = date('Y-m-d', strtotime($user->user_registered));
    if ($reg_date !== AMATERASU_NEWYEAR_DATE) return;

    $available = get_user_meta($user_id, 'available_avatars', true);
    $available = is_array($available) ? $available : array('default');
    if (in_array(AMATERASU_NEWYEAR_AVATAR_SKU, $available)) return;

    $available[] = AMATERASU_NEWYEAR_AVATAR_SKU;
    update_user_meta($user_id, 'available_avatars', array_values(array_unique($available)));
    update_user_meta($user_id, 'current_avatar', AMATERASU_NEWYEAR_AVATAR_SKU);
}
```

---

## Краткий чеклист

- [ ] Файл `public/avatars/avatar_launch.jpg` добавлен
- [ ] ID `avatar_launch` есть в `lib/avatars.ts` → `LOCAL_AVATAR_IDS`
- [ ] PHP-код добавлен в WordPress (functions.php или плагин)
- [ ] Дата `AMATERASU_LAUNCH_DATE` и SKU `AMATERASU_LAUNCH_AVATAR_SKU` настроены
- [ ] Товар в WooCommerce **не** создаётся
- [ ] Тестовая регистрация в нужную дату прошла успешно
