import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, billing, shipping, paymentMethod } = body;

    // Формируем данные для кастомного WordPress endpoint
    // который использует стандартные функции WooCommerce и вызывает хуки
    const orderData = {
      items: items.map((item: any) => ({
        id: item.id,
        qty: item.qty,
        name: item.name,
      })),
      billing: {
        firstName: billing.firstName || "",
        lastName: billing.lastName || "",
        email: billing.email || "",
        phone: billing.phone || "",
        address: billing.address || "",
        city: billing.city || "",
        postcode: billing.postcode || "",
        country: billing.country || "UA",
        notes: billing.notes || "",
      },
      shipping: shipping ? {
        firstName: shipping.firstName || "",
        lastName: shipping.lastName || "",
        address: shipping.address || "",
        city: shipping.city || "",
        postcode: shipping.postcode || "",
        country: shipping.country || "UA",
      } : undefined,
      paymentMethod: paymentMethod || "cash_on_delivery",
    };



    // Используем кастомный WordPress endpoint, который вызывает woocommerce_checkout_order_processed
    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
    if (!wpUrl) {
      throw new Error("WP_URL не настроен в переменных окружения");
    }

    const response = await axios.post(
      `${wpUrl}/wp-json/amaterasu/v1/checkout`,
      orderData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        // Если нужна авторизация, можно добавить:
        // auth: {
        //   username: process.env.WC_KEY!,
        //   password: process.env.WC_SECRET!,
        // },
      }
    );

    return NextResponse.json(
      {
        success: true,
        orderId: response.data.orderId,
        orderNumber: response.data.orderNumber,
        orderKey: response.data.orderKey,
        status: response.data.status,
        total: response.data.total,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Order creation error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to create order",
        details: error.response?.data,
      },
      { status: error.response?.status || 500 }
    );
  }
}

