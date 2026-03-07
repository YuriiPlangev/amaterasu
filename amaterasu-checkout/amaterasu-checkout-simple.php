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
    // Login endpoint
    register_rest_route('custom/v1', '/login', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_handle_login_v2',
        'permission_callback' => '__return_true',
    ));
    
    // Register endpoint
    register_rest_route('custom/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_handle_register_v2',
        'permission_callback' => '__return_true',
    ));

    // Social auth endpoint
    register_rest_route('custom/v1', '/social-auth', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_handle_social_auth_v2',
        'permission_callback' => '__return_true',
    ));
});

/**
 * Обработка логина
 */
function amaterasu_handle_login_v2($request) {
    $data = $request->get_json_params();
    
    if (empty($data['username']) || empty($data['password'])) {
        return new WP_Error('missing_fields', 'Username и password обязательны', array('status' => 400));
    }
    
    $user = wp_authenticate(sanitize_user($data['username']), $data['password']);
    
    if (is_wp_error($user)) {
        return new WP_Error('invalid_credentials', 'Неверный логин или пароль', array('status' => 401));
    }
    
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

/**
 * Обработка регистрации
 */
function amaterasu_handle_register_v2($request) {
    $data = $request->get_json_params();
    
    if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
        return new WP_Error('missing_fields', 'Username, email и password обязательны', array('status' => 400));
    }
    
    $username = sanitize_user($data['username']);
    $email = sanitize_email($data['email']);
    $password = $data['password'];
    
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

/**
 * Обработка социальной аутентификации (Google / Telegram)
 */
function amaterasu_handle_social_auth_v2($request) {
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
    if (!empty($email) && is_email($email) && $user->user_email !== $email && !email_exists($email)) {
        wp_update_user(array(
            'ID' => $user->ID,
            'user_email' => $email,
        ));
        $user = get_user_by('id', $user->ID);
    }

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
