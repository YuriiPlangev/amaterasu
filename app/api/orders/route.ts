import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
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

  const customerId = String(payload.sub ?? "");

  try {
    const res = await woo.get("orders", {
      params: { customer: customerId, per_page: 50, orderby: "date", order: "desc" },
    });
    const orders = Array.isArray(res.data) ? res.data : [];
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
    const body = await req.json();
    const { items, billing, shipping, paymentMethod } = body;

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

    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
    if (!wpUrl) {
      throw new Error("WP_URL не настроен в переменных окружения");
    }

    const response = await axios.post(
      `${wpUrl}/wp-json/amaterasu/v1/checkout`,
      orderData,
      { headers: { "Content-Type": "application/json" } }
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
