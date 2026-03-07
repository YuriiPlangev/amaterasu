<?php
/**
 * Plugin Name: Amaterasu Checkout Endpoint
 * Plugin URI: https://amaterasu.com
 * Description: Кастомный endpoint для оформления заказов через WooCommerce с поддержкой хуков woocommerce_checkout_order_processed
 * Version: 1.0.0
 * Author: Amaterasu
 * Author URI: https://amaterasu.com
 * Text Domain: amaterasu-checkout
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 8.0
 */

// Выход, если файл вызывается напрямую
if (!defined('ABSPATH')) {
    exit;
}

// Проверяем, что WooCommerce активен
add_action('plugins_loaded', 'amaterasu_checkout_check_woocommerce');

function amaterasu_checkout_check_woocommerce() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', 'amaterasu_checkout_woocommerce_missing_notice');
        return;
    }
    
    // Инициализируем плагин
    amaterasu_checkout_init();
}

function amaterasu_checkout_woocommerce_missing_notice() {
    ?>
    <div class="error">
        <p><?php _e('Amaterasu Checkout Endpoint требует активный WooCommerce плагин.', 'amaterasu-checkout'); ?></p>
    </div>
    <?php
}

function amaterasu_checkout_init() {
    // Регистрируем REST API endpoints
    add_action('rest_api_init', 'amaterasu_register_checkout_endpoint');
    add_action('rest_api_init', 'amaterasu_register_auth_endpoints');
    
    // Добавляем обработчик хука woocommerce_checkout_order_processed
    add_action('woocommerce_checkout_order_processed', 'amaterasu_handle_order_processed', 10, 3);
    
    // Можно добавить другие хуки WooCommerce
    add_action('woocommerce_new_order', 'amaterasu_handle_new_order', 10, 1);
    add_action('woocommerce_order_status_changed', 'amaterasu_handle_order_status_changed', 10, 4);
}

/**
 * Регистрация кастомного REST API endpoint
 */
function amaterasu_register_checkout_endpoint() {
    register_rest_route('amaterasu/v1', '/checkout', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_process_checkout',
        'permission_callback' => 'amaterasu_check_permission',
    ));
}

/**
 * Регистрация эндпоинтов для авторизации (login и register)
 */
function amaterasu_register_auth_endpoints() {
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

    // Social auth endpoint (Google / Telegram)
    register_rest_route('custom/v1', '/social-auth', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_handle_social_auth',
        'permission_callback' => '__return_true',
    ));
}

/**
 * Проверка прав доступа к endpoint
 * Можно настроить под ваши нужды (API ключ, токен и т.д.)
 */
function amaterasu_check_permission($request) {
    // Вариант 1: Разрешить всем (для разработки)
    // return true;
    
    // Вариант 2: Проверка через заголовок X-API-Key
    $api_key = $request->get_header('X-API-Key');
    $expected_key = get_option('amaterasu_api_key', '');
    
    if (empty($expected_key)) {
        // Если ключ не настроен, разрешаем доступ (для первого запуска)
        return true;
    }
    
    return $api_key === $expected_key;
    
    // Вариант 3: Проверка через WooCommerce Consumer Key
    // $consumer_key = $request->get_header('X-Consumer-Key');
    // $consumer_secret = $request->get_header('X-Consumer-Secret');
    // return !empty($consumer_key) && !empty($consumer_secret);
}

/**
 * Обработка оформления заказа через WooCommerce
 * Использует стандартные функции WooCommerce, что вызывает все хуки
 */
function amaterasu_process_checkout($request) {
    // Проверяем, что WooCommerce активен
    if (!class_exists('WooCommerce')) {
        return new WP_Error('woocommerce_not_active', 'WooCommerce не активен', array('status' => 500));
    }

    $data = $request->get_json_params();
    
    // Валидация данных
    if (empty($data['items']) || empty($data['billing'])) {
        return new WP_Error('invalid_data', 'Недостаточно данных для создания заказа', array('status' => 400));
    }

    try {
        // Создаем новый заказ через WooCommerce
        $order = wc_create_order();
        
        if (is_wp_error($order)) {
            return new WP_Error('order_creation_failed', $order->get_error_message(), array('status' => 500));
        }

        // Добавляем товары в заказ
        foreach ($data['items'] as $item) {
            $product_id = intval($item['id']);
            $quantity = intval($item['qty']);
            
            // Получаем продукт
            $product = wc_get_product($product_id);
            if (!$product) {
                continue; // Пропускаем несуществующие товары
            }
            
            // Добавляем товар в заказ
            $order->add_product($product, $quantity);
        }

        // Устанавливаем данные биллинга
        $billing = $data['billing'];
        $order->set_billing_first_name($billing['firstName'] ?? '');
        $order->set_billing_last_name($billing['lastName'] ?? '');
        $order->set_billing_email($billing['email'] ?? '');
        $order->set_billing_phone($billing['phone'] ?? '');
        $order->set_billing_address_1($billing['address'] ?? '');
        $order->set_billing_city($billing['city'] ?? '');
        $order->set_billing_postcode($billing['postcode'] ?? '');
        $order->set_billing_country($billing['country'] ?? 'UA');

        // Устанавливаем данные доставки
        $shipping = $data['shipping'] ?? $billing;
        $order->set_shipping_first_name($shipping['firstName'] ?? $billing['firstName'] ?? '');
        $order->set_shipping_last_name($shipping['lastName'] ?? $billing['lastName'] ?? '');
        $order->set_shipping_address_1($shipping['address'] ?? $billing['address'] ?? '');
        $order->set_shipping_city($shipping['city'] ?? $billing['city'] ?? '');
        $order->set_shipping_postcode($shipping['postcode'] ?? $billing['postcode'] ?? '');
        $order->set_shipping_country($shipping['country'] ?? $billing['country'] ?? 'UA');

        // Устанавливаем метод оплаты
        $payment_method = $data['paymentMethod'] ?? 'cash_on_delivery';
        $order->set_payment_method($payment_method);
        $order->set_payment_method_title(
            $payment_method === 'card' ? 'Оплата картою' : 'Накладений платіж'
        );

        // Устанавливаем примечания
        if (!empty($billing['notes'])) {
            $order->set_customer_note($billing['notes']);
        }

        // Устанавливаем валюту
        $order->set_currency('UAH');
        
        // Устанавливаем статус
        $order->set_status('pending', 'Заказ создан через API');

        // Сохраняем заказ
        // Это вызовет все хуки WooCommerce, включая woocommerce_checkout_order_processed
        $order_id = $order->save();

        if (!$order_id) {
            return new WP_Error('order_save_failed', 'Не удалось сохранить заказ', array('status' => 500));
        }

        // Получаем сохраненный заказ для возврата данных
        $saved_order = wc_get_order($order_id);

        // Возвращаем данные заказа
        return rest_ensure_response(array(
            'success' => true,
            'orderId' => $order_id,
            'orderNumber' => $saved_order->get_order_number(),
            'orderKey' => $saved_order->get_order_key(),
            'status' => $saved_order->get_status(),
            'total' => $saved_order->get_total(),
        ));

    } catch (Exception $e) {
        return new WP_Error('order_exception', $e->getMessage(), array('status' => 500));
    }
}

/**
 * Обработчик хука woocommerce_checkout_order_processed
 * Этот хук вызывается автоматически при сохранении заказа
 * 
 * @param int $order_id ID заказа
 * @param array $posted_data Данные, отправленные при оформлении
 * @param WC_Order $order Объект заказа
 */
function amaterasu_handle_order_processed($order_id, $posted_data, $order) {
    // Логируем информацию о заказе
    error_log("Amaterasu: Заказ обработан - ID: {$order_id}, Номер: {$order->get_order_number()}");
    
    // Пример: Отправка email уведомления
    // wp_mail(
    //     'admin@example.com',
    //     'Новый заказ #' . $order->get_order_number(),
    //     'Создан новый заказ на сумму ' . $order->get_total() . ' ' . $order->get_currency()
    // );
    
    // Пример: Обновление мета-данных заказа
    // $order->update_meta_data('_amaterasu_source', 'api');
    // $order->save();
    
    // Пример: Интеграция с внешними системами
    // amaterasu_send_to_crm($order);
    
    // Пример: Обновление кастомной таблицы
    // amaterasu_update_custom_table($order_id, $order);
}

/**
 * Обработчик хука woocommerce_new_order
 * Вызывается при создании нового заказа
 * 
 * @param int $order_id ID заказа
 */
function amaterasu_handle_new_order($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) {
        return;
    }
    
    error_log("Amaterasu: Создан новый заказ - ID: {$order_id}");
    
    // Ваш код обработки нового заказа
}

/**
 * Обработчик хука woocommerce_order_status_changed
 * Вызывается при изменении статуса заказа
 * 
 * @param int $order_id ID заказа
 * @param string $old_status Старый статус
 * @param string $new_status Новый статус
 * @param WC_Order $order Объект заказа
 */
function amaterasu_handle_order_status_changed($order_id, $old_status, $new_status, $order) {
    error_log("Amaterasu: Статус заказа изменен - ID: {$order_id}, {$old_status} -> {$new_status}");
    
    // Пример: Отправка уведомления при изменении статуса на "processing"
    if ($new_status === 'processing') {
        // wp_mail(
        //     $order->get_billing_email(),
        //     'Ваш заказ обрабатывается',
        //     'Заказ #' . $order->get_order_number() . ' начал обрабатываться'
        // );
    }
}

/**
 * Пример функции для отправки данных в CRM
 */
function amaterasu_send_to_crm($order) {
    // Ваш код интеграции с CRM
    // Например, отправка через API:
    // wp_remote_post('https://crm.example.com/api/orders', array(
    //     'body' => json_encode(array(
    //         'order_id' => $order->get_id(),
    //         'total' => $order->get_total(),
    //         'email' => $order->get_billing_email(),
    //     )),
    //     'headers' => array('Content-Type' => 'application/json'),
    // ));
}

/**
 * Пример функции для обновления кастомной таблицы
 */
function amaterasu_update_custom_table($order_id, $order) {
    global $wpdb;
    
    // Пример создания таблицы (выполнить один раз):
    // $wpdb->query("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}amaterasu_orders (
    //     id bigint(20) NOT NULL AUTO_INCREMENT,
    //     order_id bigint(20) NOT NULL,
    //     total decimal(10,2) NOT NULL,
    //     created_at datetime DEFAULT CURRENT_TIMESTAMP,
    //     PRIMARY KEY (id)
    // )");
    
    // Пример вставки данных:
    // $wpdb->insert(
    //     $wpdb->prefix . 'amaterasu_orders',
    //     array(
    //         'order_id' => $order_id,
    //         'total' => $order->get_total(),
    //     )
    // );
}

/**
 * Обработка логина пользователя
 */
function amaterasu_handle_login($request) {
    $data = $request->get_json_params();
    
    if (empty($data['username']) || empty($data['password'])) {
        return new WP_Error('missing_fields', 'Username и password обязательны', array('status' => 400));
    }
    
    $username = sanitize_text_field($data['username']);
    $password = $data['password'];
    
    // Пытаемся авторизовать пользователя
    $user = wp_authenticate($username, $password);
    
    if (is_wp_error($user)) {
        return new WP_Error('invalid_credentials', 'Неверный логин или пароль', array('status' => 401));
    }
    
    // Получаем роли пользователя
    $user_roles = $user->roles;
    
    // Возвращаем данные пользователя
    return rest_ensure_response(array(
        'user' => array(
            'ID' => $user->ID,
            'user_login' => $user->user_login,
            'user_email' => $user->user_email,
            'roles' => $user_roles,
        ),
    ));
}

/**
 * Обработка регистрации нового пользователя
 */
function amaterasu_handle_register($request) {
    $data = $request->get_json_params();
    
    // Валидация обязательных полей
    if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
        return new WP_Error('missing_fields', 'Username, email и password обязательны', array('status' => 400));
    }
    
    $username = sanitize_user($data['username']);
    $email = sanitize_email($data['email']);
    $password = $data['password'];
    
    // Проверка валидности email
    if (!is_email($email)) {
        return new WP_Error('invalid_email', 'Некорректный email адрес', array('status' => 400));
    }
    
    // Проверка, существует ли пользователь с таким username
    if (username_exists($username)) {
        return new WP_Error('username_exists', 'Пользователь с таким именем уже существует', array('status' => 409));
    }
    
    // Проверка, существует ли пользователь с таким email
    if (email_exists($email)) {
        return new WP_Error('email_exists', 'Пользователь с таким email уже существует', array('status' => 409));
    }
    
    // Создаем нового пользователя
    $user_id = wp_create_user($username, $password, $email);
    
    if (is_wp_error($user_id)) {
        return new WP_Error('registration_failed', $user_id->get_error_message(), array('status' => 500));
    }
    
    // Получаем созданного пользователя
    $user = get_user_by('id', $user_id);
    
    // Возвращаем данные пользователя
    return rest_ensure_response(array(
        'success' => true,
        'user' => array(
            'ID' => $user->ID,
            'user_login' => $user->user_login,
            'user_email' => $user->user_email,
            'roles' => $user->roles,
        ),
    ));
}

function amaterasu_normalize_social_provider($provider) {
    $provider = sanitize_text_field((string) $provider);
    if ($provider !== 'google' && $provider !== 'telegram') {
        return '';
    }
    return $provider;
}

function amaterasu_generate_unique_username($base) {
    $base = sanitize_user((string) $base, true);
    if (empty($base)) {
        $base = 'user_' . wp_generate_password(8, false, false);
    }

    $candidate = $base;
    $suffix = 1;
    while (username_exists($candidate)) {
        $candidate = $base . '_' . $suffix;
        $suffix++;
    }

    return $candidate;
}

function amaterasu_get_user_by_social_meta($provider, $provider_user_id) {
    $meta_key = 'amaterasu_social_' . $provider . '_id';
    $users = get_users(array(
        'meta_key' => $meta_key,
        'meta_value' => (string) $provider_user_id,
        'number' => 1,
        'count_total' => false,
        'fields' => array('ID'),
    ));

    if (empty($users)) {
        return null;
    }

    $user_id = intval($users[0]->ID);
    if ($user_id <= 0) {
        return null;
    }

    return get_user_by('id', $user_id);
}

function amaterasu_user_response($user) {
    return array(
        'success' => true,
        'user' => array(
            'ID' => $user->ID,
            'user_login' => $user->user_login,
            'user_email' => $user->user_email,
            'roles' => $user->roles,
        ),
    );
}

/**
 * Social auth (Google / Telegram): find or create user and return user payload.
 */
function amaterasu_handle_social_auth($request) {
    $data = $request->get_json_params();

    $provider = amaterasu_normalize_social_provider($data['provider'] ?? '');
    $provider_user_id = sanitize_text_field((string) ($data['provider_user_id'] ?? ''));

    if (empty($provider) || empty($provider_user_id)) {
        return new WP_Error('missing_fields', 'Provider и provider_user_id обязательны', array('status' => 400));
    }

    $email_raw = isset($data['email']) ? (string) $data['email'] : '';
    $email = sanitize_email($email_raw);
    if (!empty($email_raw) && !is_email($email)) {
        return new WP_Error('invalid_email', 'Некорректный email адрес', array('status' => 400));
    }

    $display_name = sanitize_text_field((string) ($data['display_name'] ?? ''));
    $username_seed = sanitize_user((string) ($data['username'] ?? ''), true);

    // 1) Existing by social meta.
    $user = amaterasu_get_user_by_social_meta($provider, $provider_user_id);

    // 2) Existing by email (if provided).
    if (!$user && !empty($email)) {
        $user = get_user_by('email', $email);
    }

    // 3) Create new user.
    if (!$user) {
        if (empty($username_seed) && !empty($email)) {
            $parts = explode('@', $email);
            $username_seed = sanitize_user($parts[0], true);
        }

        if (empty($username_seed)) {
            $username_seed = $provider . '_' . $provider_user_id;
        }

        $username = amaterasu_generate_unique_username($username_seed);
        $password = wp_generate_password(20, true, true);

        // Telegram може не мати email; создаем технический уникальный.
        $email_for_create = !empty($email)
            ? $email
            : ($provider . '_' . $provider_user_id . '@users.amaterasu.local');

        if (email_exists($email_for_create)) {
            $email_for_create = $provider . '_' . $provider_user_id . '_' . wp_generate_password(4, false, false) . '@users.amaterasu.local';
        }

        $user_id = wp_create_user($username, $password, $email_for_create);
        if (is_wp_error($user_id)) {
            return new WP_Error('social_registration_failed', $user_id->get_error_message(), array('status' => 500));
        }

        $user = get_user_by('id', $user_id);
        if (!$user) {
            return new WP_Error('social_registration_failed', 'Не удалось получить созданного пользователя', array('status' => 500));
        }
    }

    if (!empty($display_name)) {
        wp_update_user(array(
            'ID' => $user->ID,
            'display_name' => $display_name,
        ));
    }

    update_user_meta($user->ID, 'amaterasu_social_' . $provider . '_id', (string) $provider_user_id);

    // Если у пользователя был технический email и social-провайдер прислал реальный — обновим.
    if (!empty($email) && is_email($email) && $user->user_email !== $email && !email_exists($email)) {
        wp_update_user(array(
            'ID' => $user->ID,
            'user_email' => $email,
        ));
        $user = get_user_by('id', $user->ID);
    }

    return rest_ensure_response(amaterasu_user_response($user));
}

