<?php
/**
 * Автоматична видача спеціальної аватарки при реєстрації (день запуску)
 *
 * Додай цей код у functions.php теми WordPress.
 *
 * 1. Поклади зображення в public/avatars/avatar_launch.jpg (Next.js проект)
 * 2. Вкажи LAUNCH_DATE та LAUNCH_AVATAR_SKU нижче
 * 3. Користувачі, що зареєструвались у цю дату, автоматично отримають аватарку
 * 4. НЕ створюй товар у WooCommerce — аватарка локальна, не продається
 */

// ============ НАЛАШТУВАННЯ ============
define('AMATERASU_LAUNCH_DATE', '2026-03-20');       // Дата запуску (Y-m-d)
define('AMATERASU_LAUNCH_AVATAR_SKU', 'avatar_launch'); // ID аватарки (файл: public/avatars/avatar_launch.jpg)
// ======================================

add_action('user_register', 'amaterasu_grant_launch_avatar_on_register', 20, 1);

function amaterasu_grant_launch_avatar_on_register($user_id) {
    $avatar_sku = AMATERASU_LAUNCH_AVATAR_SKU;
    $launch_date = AMATERASU_LAUNCH_DATE;

    $user = get_userdata($user_id);
    if (!$user) return;

    $registered = $user->user_registered;
    $reg_date = date('Y-m-d', strtotime($registered));
    if ($reg_date !== $launch_date) return;

    $available = get_user_meta($user_id, 'available_avatars', true);
    $available = is_array($available) ? $available : array('default');
    if (in_array($avatar_sku, $available)) return;

    $available[] = $avatar_sku;
    $available = array_values(array_unique(array_filter($available)));
    update_user_meta($user_id, 'available_avatars', $available);
    update_user_meta($user_id, 'current_avatar', $avatar_sku);
}
