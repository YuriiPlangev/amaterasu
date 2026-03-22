<?php
/**
 * Plugin Name: Amaterasu Checkout Endpoint
 * Plugin URI: https://amaterasu.com
 * Description: REST API endpoints для логина, регистрации и социальной аутентификации
 * Version: 2.0.0
 * Author: Amaterasu
 * Author URI: https://amaterasu.com
 * Text Domain: amaterasu-checkout
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

// Инициализация при загрузке плагинов
add_action('rest_api_init', function() {
    // Checkout endpoint
    register_rest_route('amaterasu/v1', '/checkout', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_process_checkout',
        'permission_callback' => '__return_true',
    ));

    // Login endpoint
    register_rest_route('custom/v1', '/login', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_handle_login',
        'permission_callback' => '__return_true',
    ));
    
    // Register endpoint
    register_rest_route('custom/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_handle_register',
        'permission_callback' => '__return_true',
    ));

    // Social auth endpoint
    register_rest_route('custom/v1', '/social-auth', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_handle_social_auth',
        'permission_callback' => '__return_true',
    ));
});

/**
 * Checkout handler for WooCommerce orders.
 */
function amaterasu_process_checkout($request) {
    if (!class_exists('WooCommerce')) {
        return new WP_Error('woocommerce_not_active', 'WooCommerce не активен', array('status' => 500));
    }

    $data = $request->get_json_params();
    if (empty($data['items']) || empty($data['billing'])) {
        return new WP_Error('invalid_data', 'Недостаточно данных для создания заказа', array('status' => 400));
    }

    try {
        $order = wc_create_order();
        if (is_wp_error($order)) {
            return new WP_Error('order_creation_failed', $order->get_error_message(), array('status' => 500));
        }

        if (!empty($data['customerId'])) {
            $customer_id = intval($data['customerId']);
            if ($customer_id > 0) {
                $order->set_customer_id($customer_id);
            }
        }

        foreach ($data['items'] as $item) {
            $product_id = intval($item['id'] ?? 0);
            $quantity = intval($item['qty'] ?? 0);
            if ($product_id <= 0 || $quantity <= 0) {
                continue;
            }

            $product = wc_get_product($product_id);
            if ($product) {
                $order->add_product($product, $quantity);
            }
        }

        $billing = is_array($data['billing']) ? $data['billing'] : array();
        $order->set_billing_first_name($billing['firstName'] ?? '');
        $order->set_billing_last_name($billing['lastName'] ?? '');
        $order->set_billing_email($billing['email'] ?? '');
        $order->set_billing_phone($billing['phone'] ?? '');
        $order->set_billing_address_1($billing['address'] ?? '');
        $order->set_billing_city($billing['city'] ?? '');
        $order->set_billing_postcode($billing['postcode'] ?? '');
        $order->set_billing_country($billing['country'] ?? 'UA');

        $shipping = isset($data['shipping']) && is_array($data['shipping']) ? $data['shipping'] : $billing;
        $order->set_shipping_first_name($shipping['firstName'] ?? ($billing['firstName'] ?? ''));
        $order->set_shipping_last_name($shipping['lastName'] ?? ($billing['lastName'] ?? ''));
        $order->set_shipping_address_1($shipping['address'] ?? ($billing['address'] ?? ''));
        $order->set_shipping_city($shipping['city'] ?? ($billing['city'] ?? ''));
        $order->set_shipping_postcode($shipping['postcode'] ?? ($billing['postcode'] ?? ''));
        $order->set_shipping_country($shipping['country'] ?? ($billing['country'] ?? 'UA'));

        $payment_method = sanitize_text_field($data['paymentMethod'] ?? 'cash_on_delivery');
        $order->set_payment_method($payment_method);
        $order->set_payment_method_title($payment_method === 'liqpay' ? 'Оплата LiqPay' : 'Накладений платіж');

        if (!empty($billing['notes'])) {
            $order->set_customer_note(sanitize_text_field($billing['notes']));
        }

        $order->set_currency('UAH');

        // Пересчитываем итог перед сохранением (обов'язково для LiqPay та коректної суми)
        $order->calculate_totals();

        $order->set_status('pending', 'Заказ создан через API');

        $order_id = $order->save();
        if (!$order_id) {
            return new WP_Error('order_save_failed', 'Не удалось сохранить заказ', array('status' => 500));
        }

        $saved_order = wc_get_order($order_id);
        return rest_ensure_response(array(
            'success' => true,
            'orderId' => $order_id,
            'orderNumber' => $saved_order ? $saved_order->get_order_number() : $order_id,
            'orderKey' => $saved_order ? $saved_order->get_order_key() : '',
            'status' => $saved_order ? $saved_order->get_status() : 'pending',
            'total' => $saved_order ? $saved_order->get_total() : 0,
        ));
    } catch (Exception $e) {
        return new WP_Error('order_exception', $e->getMessage(), array('status' => 500));
    }
}

/**
 * Обработка логина
 */
function amaterasu_handle_login($request) {
    $data = $request->get_json_params();
    
    if (empty($data['username']) || empty($data['password'])) {
        return new WP_Error('missing_fields', 'Username и password обязательны', array('status' => 400));
    }
    
    $user = wp_authenticate(sanitize_user($data['username']), $data['password']);
    
    if (is_wp_error($user)) {
        return new WP_Error('invalid_credentials', 'Неверный логин или пароль', array('status' => 401));
    }
    
    $phone = get_user_meta($user->ID, 'billing_phone', true);
    if (empty($phone)) {
        $phone = get_user_meta($user->ID, 'phone', true);
    }

    return rest_ensure_response(array(
        'success' => true,
        'user' => array(
            'ID' => $user->ID,
            'user_login' => $user->user_login,
            'user_email' => $user->user_email,
            'display_name' => $user->display_name,
            'phone' => $phone,
            'roles' => $user->roles,
        ),
    ));
}

/**
 * Обработка регистрации
 */
function amaterasu_handle_register($request) {
    $data = $request->get_json_params();
    
    if (empty($data['username']) || empty($data['email']) || empty($data['phone']) || empty($data['password'])) {
        return new WP_Error('missing_fields', 'Username, email, phone и password обязательны', array('status' => 400));
    }
    
    $username = sanitize_user($data['username']);
    $email = sanitize_email($data['email']);
    $phone = sanitize_text_field($data['phone']);
    $password = $data['password'];
    
    if (stripos($username, 'admin') !== false) {
        return new WP_Error('invalid_username', 'Ім\'я користувача не може містити слово "Admin"', array('status' => 400));
    }
    
    if (!is_email($email)) {
        return new WP_Error('invalid_email', 'Некорректный email адрес', array('status' => 400));
    }
    
    if (username_exists($username)) {
        return new WP_Error('username_exists', 'Пользователь с таким именем уже существует', array('status' => 409));
    }
    
    if (email_exists($email)) {
        return new WP_Error('email_exists', 'Пользователь с таким email уже существует', array('status' => 409));
    }
    
    $user_id = wp_create_user($username, $password, $email);
    
    if (is_wp_error($user_id)) {
        return new WP_Error('registration_failed', $user_id->get_error_message(), array('status' => 500));
    }
    
    $user = get_user_by('id', $user_id);

    if (!empty($phone)) {
        update_user_meta($user_id, 'billing_phone', $phone);
        update_user_meta($user_id, 'phone', $phone);
    }
    
    return rest_ensure_response(array(
        'success' => true,
        'user' => array(
            'ID' => $user->ID,
            'user_login' => $user->user_login,
            'user_email' => $user->user_email,
            'display_name' => $user->display_name,
            'phone' => $phone,
            'roles' => $user->roles,
        ),
    ));
}

/**
 * Обработка социальной аутентификации (Google / Telegram)
 */
function amaterasu_handle_social_auth($request) {
    $data = $request->get_json_params();

    $provider = sanitize_text_field($data['provider'] ?? '');
    $provider_user_id = sanitize_text_field($data['provider_user_id'] ?? '');

    if (empty($provider) || empty($provider_user_id)) {
        return new WP_Error('missing_fields', 'Provider и provider_user_id обязательны', array('status' => 400));
    }

    $email_raw = isset($data['email']) ? (string)$data['email'] : '';
    $email = sanitize_email($email_raw);
    if (!empty($email_raw) && !is_email($email)) {
        return new WP_Error('invalid_email', 'Некорректный email адрес', array('status' => 400));
    }

    $display_name = sanitize_text_field($data['display_name'] ?? '');
    $username_seed = sanitize_user($data['username'] ?? '', true);

    // 1) Поиск по социальным мета-данным
    $meta_key = 'amaterasu_social_' . $provider . '_id';
    $users = get_users(array(
        'meta_key' => $meta_key,
        'meta_value' => $provider_user_id,
        'number' => 1,
    ));
    $user = !empty($users) ? $users[0] : null;

    // 2) Поиск по email
    if (!$user && !empty($email)) {
        $user = get_user_by('email', $email);
    }

    // 3) Создание нового пользователя
    if (!$user) {
        if (empty($username_seed) && !empty($email)) {
            $parts = explode('@', $email);
            $username_seed = sanitize_user($parts[0], true);
        }

        if (empty($username_seed)) {
            $username_seed = $provider . '_' . substr($provider_user_id, 0, 8);
        }

        // Генерируем уникальный username
        $candidate = $username_seed;
        $suffix = 1;
        while (username_exists($candidate)) {
            $candidate = $username_seed . '_' . $suffix;
            $suffix++;
        }

        $password = wp_generate_password(20, true, true);
        $email_for_create = !empty($email) 
            ? $email 
            : ($provider . '_' . $provider_user_id . '@users.amaterasu.local');

        if (email_exists($email_for_create)) {
            $email_for_create = $provider . '_' . $provider_user_id . '_' . wp_generate_password(4, false) . '@users.amaterasu.local';
        }

        $user_id = wp_create_user($candidate, $password, $email_for_create);
        if (is_wp_error($user_id)) {
            return new WP_Error('user_creation_failed', $user_id->get_error_message(), array('status' => 500));
        }

        $user = get_user_by('id', $user_id);
        if (!$user) {
            return new WP_Error('user_creation_failed', 'Не удалось получить созданного пользователя', array('status' => 500));
        }
    }

    // Обновляем display_name если предоставлен
    if (!empty($display_name)) {
        wp_update_user(array(
            'ID' => $user->ID,
            'display_name' => $display_name,
        ));
    }

    // Сохраняем ID социального провайдера
    update_user_meta($user->ID, $meta_key, $provider_user_id);

    // Обновляем email если был технический и провайдер прислал реальный
    if (!empty($email) && is_email($email)) {
        $needs_update = ($user->user_email !== $email) && !email_exists($email);
        if ($needs_update) {
            wp_update_user(array(
                'ID' => $user->ID,
                'user_email' => $email,
            ));
            $user = get_user_by('id', $user->ID);
        }
        // billing_email для WooCommerce/чекаута
        update_user_meta($user->ID, 'billing_email', $email);
    }

    return rest_ensure_response(array(
        'success' => true,
        'user' => array(
            'ID' => $user->ID,
            'user_login' => $user->user_login,
            'user_email' => $user->user_email,
            'display_name' => $user->display_name,
            'roles' => $user->roles,
        ),
    ));
}

