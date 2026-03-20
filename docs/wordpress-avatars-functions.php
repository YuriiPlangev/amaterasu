<?php
/**
 * АВАТАРКИ — код для functions.php темы WordPress
 * 
 * 1. Выдача доступа к аватарке после оплаты (по SKU)
 * 2. REST API: current_avatar (с update для PATCH), availableAvatars
 * 3. Next.js ожидает currentAvatar и availableAvatars в camelCase
 */

/* 1. Выдача доступа после оплаты */
add_action('woocommerce_order_status_completed', 'grant_avatar_access_after_purchase', 20, 1);
add_action('woocommerce_order_status_processing_to_completed', 'grant_avatar_access_after_purchase', 20, 1);

function grant_avatar_access_after_purchase($order_id) {
    if (!$order_id) return;

    $order = wc_get_order($order_id);
    if (!$order) return;

    $user_id = $order->get_user_id();
    if (!$user_id) return;

    $available = get_user_meta($user_id, 'available_avatars', true);
    $available = is_array($available) ? $available : array('default');

    $added_new = false;
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        if (!$product) continue;

        $sku = trim($product->get_sku());
        if ($sku && !in_array($sku, $available)) {
            $available[] = $sku;
            $added_new = true;
        }
    }

    if ($added_new) {
        $available = array_values(array_unique(array_filter($available)));
        update_user_meta($user_id, 'available_avatars', $available);
        clean_user_cache($user_id);
    }
}

/* 2. REST API — одна регистрация, без дублирования */
add_action('rest_api_init', function () {
    // current_avatar — для PATCH (Next.js отправляет current_avatar)
    register_rest_field('user', 'current_avatar', array(
        'get_callback' => function ($user) {
            return get_user_meta($user['id'], 'current_avatar', true) ?: '';
        },
        'update_callback' => function ($value, $user) {
            update_user_meta($user->ID, 'current_avatar', sanitize_text_field($value));
        },
        'schema' => array('type' => 'string'),
    ));

    // available_avatars — только чтение (обновляется хуком оплаты)
    register_rest_field('user', 'available_avatars', array(
        'get_callback' => function ($user) {
            $val = get_user_meta($user['id'], 'available_avatars', true);
            return is_array($val) ? array_values(array_unique(array_filter($val))) : array();
        },
        'schema' => array('type' => 'array'),
    ));
});

/* 3. CamelCase для Next.js (ожидает currentAvatar, availableAvatars) */
add_filter('rest_prepare_user', function ($response, $user, $request) {
    $response->data['currentAvatar'] = get_user_meta($user->ID, 'current_avatar', true) ?: 'photo_1';
    $meta = get_user_meta($user->ID, 'available_avatars', true);
    $response->data['availableAvatars'] = is_array($meta) ? array_values(array_unique(array_filter($meta))) : array('default');
    if (!in_array('default', $response->data['availableAvatars'])) {
        array_unshift($response->data['availableAvatars'], 'default');
    }
    return $response;
}, 10, 3);
