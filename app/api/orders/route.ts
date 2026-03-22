import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import crypto from "crypto";
import { verifyToken } from "../../../lib/auth";
import { woo } from "../../../lib/woo";

export const dynamic = "force-dynamic";

/** GET /api/orders — список замовлень поточного користувача */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const customerId = String(payload.sub ?? "").trim();
  const customerIdNum = Number.parseInt(customerId, 10);

  if (!customerId || Number.isNaN(customerIdNum) || customerIdNum <= 0) {
    return NextResponse.json({ error: "Invalid user id in token", orders: [] }, { status: 401 });
  }

  try {
    const res = await woo.get("orders", {
      params: { customer: customerIdNum, per_page: 50, orderby: "date", order: "desc" },
    });
    const rawOrders = Array.isArray(res.data) ? res.data : [];
    const orders = rawOrders.filter((order: any) => Number(order?.customer_id) === customerIdNum);
    return NextResponse.json({ orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    console.error("Orders fetch error:", err);
    return NextResponse.json(
      { error: message, orders: [] },
      { status: 500 }
    );
  }
}

/** POST /api/orders — створення замовлення (checkout) */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    let customerId: number | null = null;
    if (token) {
      const payload = verifyToken(token);
      const parsedId = Number.parseInt(String((payload as any)?.sub ?? ""), 10);
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        customerId = parsedId;
      }
    }

    const body = await req.json();
    const { items, billing, shipping, paymentMethod, locale } = body;

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
      customerId,
    };

    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
    if (!wpUrl) {
      throw new Error("WP_URL не настроен в переменных окружения");
    }

    const response = await axios.post(
      `${wpUrl}/wp-json/amaterasu/v1/checkout`,
      orderData,
      { headers: { "Content-Type": "application/json" } }
    );

    const orderId = response.data.orderId;
    const orderNumber = response.data.orderNumber;
    const orderKey = response.data.orderKey;
    const status = response.data.status;
    const total = response.data.total;

    if (paymentMethod === "liqpay") {
      const publicKey = process.env.LIQPAY_PUBLIC_KEY;
      const privateKey = process.env.LIQPAY_PRIVATE_KEY;

      if (!publicKey || !privateKey) {
        return NextResponse.json(
          {
            success: false,
            error: "LiqPay keys are not configured",
          },
          { status: 500 }
        );
      }

      const forwardedProto = req.headers.get("x-forwarded-proto");
      const host = req.headers.get("host");
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${forwardedProto || "https"}://${host}` : "");

      if (!baseUrl) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot determine site URL for LiqPay callbacks",
          },
          { status: 500 }
        );
      }

      const totalStr = String(total ?? "").trim().replace(",", ".");
      const amount = Number.parseFloat(totalStr);
      if (!Number.isFinite(amount) || amount <= 0) {
        console.error("[Orders] LiqPay: invalid total — raw:", total, "parsed:", amount, "response:", response.data);
        return NextResponse.json(
          {
            success: false,
            error: "Invalid order total for LiqPay payment",
          },
          { status: 500 }
        );
      }

      const paymentOrderId = `amaterasu_${orderId}_${Date.now()}`;
      const normalizedLocale = locale === "en" ? "en" : "uk";

      const liqpayPayload = {
        public_key: publicKey,
        version: "3",
        action: "pay",
        amount: amount.toFixed(2),
        currency: "UAH",
        description: `Order #${orderNumber || orderId} at Amaterasu`,
        order_id: paymentOrderId,
        result_url: `${baseUrl}/${normalizedLocale}/cart?liqpay=success&order=${orderId}`,
        server_url: `${baseUrl}/api/payments/liqpay/callback`,
        language: normalizedLocale,
        info: JSON.stringify({ wp_order_id: orderId }),
      };

      const data = Buffer.from(JSON.stringify(liqpayPayload)).toString("base64");
      const signature = crypto
        .createHash("sha1")
        .update(privateKey + data + privateKey)
        .digest("base64");

      return NextResponse.json(
        {
          success: true,
          orderId,
          orderNumber,
          orderKey,
          status,
          total,
          paymentProvider: "liqpay",
          liqpay: {
            data,
            signature,
            checkoutUrl: "https://www.liqpay.ua/api/3/checkout",
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        orderNumber,
        orderKey,
        status,
        total,
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
