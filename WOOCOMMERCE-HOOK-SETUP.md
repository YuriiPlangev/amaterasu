# Настройка хука woocommerce_checkout_order_processed

Для использования хука `woocommerce_checkout_order_processed` при оформлении заказов через API, нужно добавить кастомный WordPress endpoint.

## Установка

### Вариант 1: Добавить в functions.php темы

1. Откройте файл `functions.php` вашей активной темы WordPress
2. Скопируйте содержимое файла `wordpress-custom-endpoint.php` в конец `functions.php`
3. Сохраните файл

### Вариант 2: Создать отдельный плагин (рекомендуется)

1. Создайте папку `amaterasu-checkout` в `/wp-content/plugins/`
2. Создайте файл `amaterasu-checkout.php` со следующим содержимым:

```php
<?php
/**
 * Plugin Name: Amaterasu Checkout Endpoint
 * Description: Кастомный endpoint для оформления заказов через WooCommerce с поддержкой хуков
 * Version: 1.0.0
 */

// Код из wordpress-custom-endpoint.php здесь
```

3. Активируйте плагин в админ-панели WordPress

## Как это работает

1. Next.js отправляет запрос на `/api/orders`
2. API route перенаправляет запрос на кастомный WordPress endpoint `/wp-json/amaterasu/v1/checkout`
3. WordPress endpoint использует стандартные функции WooCommerce (`wc_create_order()`, `$order->add_product()`, `$order->save()`)
4. При сохранении заказа автоматически вызываются все хуки WooCommerce, включая:
   - `woocommerce_checkout_order_processed`
   - `woocommerce_new_order`
   - `woocommerce_thankyou`
   - И другие стандартные хуки WooCommerce

## Использование хука

Теперь вы можете использовать хук `woocommerce_checkout_order_processed` в своем WordPress коде:

```php
add_action('woocommerce_checkout_order_processed', 'my_custom_order_handler', 10, 3);

function my_custom_order_handler($order_id, $posted_data, $order) {
    // Ваш код обработки заказа
    // Например, отправка email, обновление базы данных и т.д.
    error_log("Order processed: " . $order_id);
}
```

## Безопасность

По умолчанию endpoint доступен без авторизации. Для продакшена рекомендуется добавить проверку:

1. В файле `wordpress-custom-endpoint.php` измените:
```php
'permission_callback' => '__return_true',
```
на:
```php
'permission_callback' => 'amaterasu_check_permission',
```

2. Добавьте функцию проверки:
```php
function amaterasu_check_permission($request) {
    // Проверка API ключа или другой метод авторизации
    $api_key = $request->get_header('X-API-Key');
    return $api_key === 'your-secret-key';
}
```

3. В `app/api/orders/route.ts` добавьте заголовок:
```typescript
headers: {
  "Content-Type": "application/json",
  "X-API-Key": process.env.API_SECRET_KEY || "",
},
```

## Тестирование

После установки endpoint будет доступен по адресу:
```
POST {WP_URL}/wp-json/amaterasu/v1/checkout
```

Можно протестировать через Postman или curl:
```bash
curl -X POST https://your-site.com/wp-json/amaterasu/v1/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id": 1, "qty": 2, "name": "Test Product"}],
    "billing": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phone": "123456789",
      "address": "Test Address",
      "city": "Test City",
      "postcode": "12345",
      "country": "UA"
    },
    "paymentMethod": "cash_on_delivery"
  }'
```

