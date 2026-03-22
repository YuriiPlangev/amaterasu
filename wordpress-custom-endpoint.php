<?php
/**
 * Custom WordPress REST API Endpoint for WooCommerce Orders
 * 
 * Этот код нужно добавить в functions.php вашей темы WordPress
 * или создать как отдельный плагин.
 * 
 * Этот endpoint использует стандартные функции WooCommerce для создания заказа,
 * что автоматически вызывает все хуки, включая woocommerce_checkout_order_processed
 */

// Регистрируем кастомный REST API endpoint
add_action('rest_api_init', function () {
    register_rest_route('amaterasu/v1', '/checkout', array(
        'methods' => 'POST',
        'callback' => 'amaterasu_process_checkout',
        'permission_callback' => '__return_true', // Можно добавить проверку авторизации
    ));
});

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
    $customer_id = isset($data['customerId']) ? intval($data['customerId']) : 0;
    
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

        // Привязываем заказ к авторизованному пользователю, если передан customerId
        if ($customer_id > 0) {
            $order->set_customer_id($customer_id);

            // Если email не передали в checkout, подставим email пользователя WP
            $customer_user = get_userdata($customer_id);
            if ($customer_user && empty($data['billing']['email'])) {
                $data['billing']['email'] = $customer_user->user_email;
            }
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
            $payment_method === 'liqpay'
                ? 'LiqPay'
                : ($payment_method === 'card' ? 'Оплата картою' : 'Накладений платіж')
        );

        // Устанавливаем примечания
        if (!empty($billing['notes'])) {
            $order->set_customer_note($billing['notes']);
        }

        // Устанавливаем валюту
        $order->set_currency('UAH');

        // Пересчитываем итог заказа перед сохранением (важно для корректной суммы оплаты)
        $order->calculate_totals();
        
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

// ========================
// ПОЛЯ ПОЛЬЗОВАТЕЛЯ: АВАТАР (для отображения всем)
// ========================
// Регистрируем current_avatar и availableAvatars в REST API пользователей.
// Аватар сохраняется в user meta — его видят все (профиль, комментарии).

add_action('rest_api_init', function () {
    register_rest_field('user', 'current_avatar', array(
        'get_callback' => function ($user) {
            return get_user_meta($user['id'], 'current_avatar', true) ?: '';
        },
        'update_callback' => function ($value, $user) {
            update_user_meta($user->ID, 'current_avatar', sanitize_text_field($value));
        },
        'schema' => array('type' => 'string', 'description' => 'ID выбранного аватара'),
    ));

    register_rest_field('user', 'available_avatars', array(
        'get_callback' => function ($user) {
            $val = get_user_meta($user['id'], 'available_avatars', true);
            return is_array($val) ? $val : array();
        },
        'update_callback' => function ($value, $user) {
            $arr = is_array($value) ? array_map('sanitize_text_field', $value) : array();
            update_user_meta($user->ID, 'available_avatars', $arr);
        },
        'schema' => array('type' => 'array', 'description' => 'Доступные аватары (SKU купленных)'),
    ));

    register_rest_field('user', 'phone', array(
        'get_callback' => function ($user) {
            $phone = get_user_meta($user['id'], 'billing_phone', true);
            if (empty($phone)) $phone = get_user_meta($user['id'], 'phone', true);
            return $phone ?: '';
        },
        'update_callback' => function ($value, $user) {
            $v = sanitize_text_field($value);
            update_user_meta($user->ID, 'phone', $v);
            update_user_meta($user->ID, 'billing_phone', $v);
        },
        'schema' => array('type' => 'string', 'description' => 'Номер телефона'),
    ));
});

// Запрет слова Admin в display_name при обновлении через REST API
add_filter('rest_pre_dispatch', function ($result, $server, $request) {
    if ($request->get_method() === 'PATCH' && preg_match('#/wp/v2/users/(\d+)$#', $request->get_route(), $m)) {
        $params = $request->get_json_params();
        if (!empty($params['name']) && is_string($params['name']) && stripos($params['name'], 'admin') !== false) {
            return new WP_Error('invalid_display_name', 'Відображуване ім\'я не може містити слово "Admin"', array('status' => 400));
        }
    }
    return $result;
}, 10, 3);

// Для совместимости с /api/auth/user (ожидает availableAvatars, phone)
add_filter('rest_prepare_user', function ($response, $user, $request) {
    $meta = get_user_meta($user->ID, 'available_avatars', true);
    if (!is_array($meta)) {
        $meta = array('default');
    }
    $response->data['availableAvatars'] = $meta;
    $phone = get_user_meta($user->ID, 'billing_phone', true) ?: get_user_meta($user->ID, 'phone', true);
    $response->data['phone'] = $phone ?: '';
    return $response;
}, 10, 3);

// ========================
// ENDPOINTS ДЛЯ КОММЕНТАРИЕВ
// ========================

add_action('rest_api_init', function () {
    // Массовое получение current_avatar по user_id (для обогащения комментариев)
    register_rest_route('custom/v1', '/users/avatars', array(
        'methods' => 'GET',
        'callback' => 'custom_get_users_avatars',
        'permission_callback' => '__return_true',
        'args' => array(
            'ids' => array(
                'required' => true,
                'type' => 'string',
                'description' => 'Comma-separated user IDs',
            ),
        ),
    ));

    // Получение комментариев к посту
    register_rest_route('custom/v1', '/posts/(?P<id>\d+)/comments', array(
        'methods' => 'GET',
        'callback' => 'custom_get_post_comments',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array(
                'required' => true,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
    
    // Создание комментария
    register_rest_route('custom/v1', '/comments', array(
        'methods' => 'POST',
        'callback' => 'custom_create_comment',
        'permission_callback' => '__return_true',
        'args' => array(
            'post_id' => array('required' => true),
            'user_id' => array('required' => true),
            'content' => array('required' => true),
            'avatar_id' => array('required' => false),
        ),
    ));

    // Редактирование комментария (PATCH)
    register_rest_route('custom/v1', '/comments/(?P<id>\d+)', array(
        'methods' => 'PATCH',
        'callback' => 'custom_update_comment',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array('required' => true, 'validate_callback' => function($p) { return is_numeric($p); }),
        ),
    ));

    // Удаление комментария (DELETE)
    register_rest_route('custom/v1', '/comments/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'custom_delete_comment',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array('required' => true, 'validate_callback' => function($p) { return is_numeric($p); }),
        ),
    ));
});

/**
 * Массовое получение current_avatar по user ID
 */
function custom_get_users_avatars($request) {
    $ids_param = $request->get_param('ids');
    if (empty($ids_param)) {
        return rest_ensure_response(array());
    }
    $ids = array_filter(array_map('intval', explode(',', $ids_param)));
    $result = array();
    foreach ($ids as $uid) {
        if ($uid <= 0) continue;
        $av = get_user_meta($uid, 'current_avatar', true);
        if (!empty($av) && trim($av) !== 'default') {
            $result[(string)$uid] = trim($av);
        }
    }
    return rest_ensure_response($result);
}

/**
 * Получить комментарии к посту
 */
function custom_get_post_comments($request) {
    $post_id = intval($request['id']);
    
    $comments = get_comments(array(
        'post_id' => $post_id,
        'status' => 'approve',
        'orderby' => 'comment_date',
        'order' => 'DESC',
    ));
    
    $result = array();
    foreach ($comments as $comment) {
        $avatar_id = get_comment_meta($comment->comment_ID, 'avatar_id', true);
        if (empty($avatar_id) || $avatar_id === 'default') {
            $avatar_id = 'default';
            if (!empty($comment->user_id)) {
                $current_avatar = get_user_meta($comment->user_id, 'current_avatar', true);
                if (!empty($current_avatar)) {
                    $avatar_id = $current_avatar;
                }
            }
        }
        $display_name = '';
        if (!empty($comment->user_id)) {
            $u = get_userdata($comment->user_id);
            if ($u && !empty($u->display_name)) {
                $display_name = $u->display_name;
            }
        }
        if (empty($display_name)) {
            $display_name = $comment->comment_author ?: __('Anonymous', 'amaterasu');
        }
        $is_admin = false;
        if (!empty($comment->user_id)) {
            $user_obj = get_userdata($comment->user_id);
            $is_admin = $user_obj && in_array('administrator', (array) $user_obj->roles, true);
        }
        $result[] = array(
            'id' => $comment->comment_ID,
            'author' => $comment->comment_author,
            'displayName' => $display_name,
            'content' => $comment->comment_content,
            'date' => $comment->comment_date,
            'userId' => $comment->user_id,
            'avatarId' => $avatar_id,
            'isAdmin' => $is_admin,
        );
    }
    
    return rest_ensure_response($result);
}

/**
 * Создать комментарий
 */
function custom_create_comment($request) {
    $data = $request->get_json_params();
    
    // Валидация
    if (empty($data['post_id']) || empty($data['user_id']) || empty($data['content'])) {
        return new WP_Error('missing_data', 'Отсутствуют обязательные поля', array('status' => 400));
    }
    
    $post_id = intval($data['post_id']);
    $user_id = intval($data['user_id']);
    $content = sanitize_textarea_field($data['content']);
    
    // Проверяем, существует ли пост
    if (!get_post($post_id)) {
        return new WP_Error('invalid_post', 'Пост не найден', array('status' => 404));
    }
    
    // Проверяем, существует ли пользователь
    $user = get_userdata($user_id);
    if (!$user) {
        return new WP_Error('invalid_user', 'Пользователь не найден', array('status' => 404));
    }
    
    // Создаем комментарий
    $comment_data = array(
        'comment_post_ID' => $post_id,
        'comment_author' => $user->user_login,
        'comment_author_email' => $user->user_email,
        'comment_content' => $content,
        'user_id' => $user_id,
        'comment_approved' => 1, // Автоматически одобряем
    );
    
    $comment_id = wp_insert_comment($comment_data);
    
    if (!$comment_id) {
        return new WP_Error('comment_creation_failed', 'Не удалось создать комментарий', array('status' => 500));
    }
    
    $comment = get_comment($comment_id);
    $avatar_id = isset($data['avatar_id']) && !empty(trim($data['avatar_id'])) && trim($data['avatar_id']) !== 'default'
        ? sanitize_text_field(trim($data['avatar_id']))
        : 'default';
    if ($avatar_id === 'default' && !empty($user_id)) {
        $current_avatar = get_user_meta($user_id, 'current_avatar', true);
        if (!empty($current_avatar)) {
            $avatar_id = $current_avatar;
        }
    }
    add_comment_meta($comment_id, 'avatar_id', $avatar_id, true);

    $user = get_userdata($comment->user_id);
    $display_name = ($user && !empty($user->display_name)) ? $user->display_name : $comment->comment_author;
    return rest_ensure_response(array(
        'id' => $comment->comment_ID,
        'author' => $comment->comment_author,
        'displayName' => $display_name,
        'content' => $comment->comment_content,
        'date' => $comment->comment_date,
        'userId' => $comment->user_id,
        'avatarId' => $avatar_id,
    ));
}

/**
 * Редактирование комментария (только владелец)
 */
function custom_update_comment($request) {
    $comment_id = intval($request['id']);
    $body = $request->get_json_params();
    $user_id = isset($body['user_id']) ? intval($body['user_id']) : 0;
    $content = isset($body['content']) ? sanitize_textarea_field(trim($body['content'])) : '';

    if (empty($content) || $user_id <= 0) {
        return new WP_Error('invalid_data', 'Invalid data', array('status' => 400));
    }
    $comment = get_comment($comment_id);
    if (!$comment || $comment->user_id != $user_id) {
        return new WP_Error('forbidden', 'Comment not found or access denied', array('status' => 403));
    }
    wp_update_comment(array('comment_ID' => $comment_id, 'comment_content' => $content));
    $updated = get_comment($comment_id);
    $user = get_userdata($updated->user_id);
    $display_name = ($user && !empty($user->display_name)) ? $user->display_name : $updated->comment_author;
    return rest_ensure_response(array(
        'id' => $updated->comment_ID,
        'author' => $updated->comment_author,
        'displayName' => $display_name,
        'content' => $updated->comment_content,
        'date' => $updated->comment_date,
        'userId' => $updated->user_id,
    ));
}

/**
 * Удаление комментария (только владелец)
 */
function custom_delete_comment($request) {
    $comment_id = intval($request['id']);
    $body = $request->get_json_params();
    $user_id = isset($body['user_id']) ? intval($body['user_id']) : 0;

    if ($user_id <= 0) {
        return new WP_Error('invalid_data', 'Invalid data', array('status' => 400));
    }
    $comment = get_comment($comment_id);
    if (!$comment || $comment->user_id != $user_id) {
        return new WP_Error('forbidden', 'Comment not found or access denied', array('status' => 403));
    }
    wp_delete_comment($comment_id, true);
    return rest_ensure_response(array('success' => true));
}

