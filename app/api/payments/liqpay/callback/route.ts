import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { woo } from "../../../../../lib/woo";

function calcSignature(privateKey: string, data: string): string {
  return crypto.createHash("sha1").update(privateKey + data + privateKey).digest("base64");
}

function parseWpOrderId(payload: any): number | null {
  try {
    if (payload?.info) {
      const info = JSON.parse(payload.info);
      const infoOrderId = Number.parseInt(String(info?.wp_order_id ?? ""), 10);
      if (!Number.isNaN(infoOrderId) && infoOrderId > 0) {
        return infoOrderId;
      }
    }
  } catch {
    // Ignore info parse errors and fallback to order_id parsing.
  }

  const orderIdRaw = String(payload?.order_id ?? "");
  const match = orderIdRaw.match(/^amaterasu_(\d+)_/);
  if (!match) return null;

  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

export async function POST(req: NextRequest) {
  try {
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ ok: false, error: "LiqPay private key is missing" }, { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "";
    let data = "";
    let signature = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      data = String(body?.data || "");
      signature = String(body?.signature || "");
    } else {
      const formData = await req.formData();
      data = String(formData.get("data") || "");
      signature = String(formData.get("signature") || "");
    }

    if (!data || !signature) {
      return NextResponse.json({ ok: false, error: "Invalid callback payload" }, { status: 400 });
    }

    const expected = calcSignature(privateKey, data);
    if (expected !== signature) {
      console.warn("[LiqPay callback] Invalid signature — expected hash mismatch");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
    const wpOrderId = parseWpOrderId(payload);

    if (!wpOrderId) {
      console.warn("[LiqPay callback] Cannot resolve order id — payload.info:", payload?.info, "payload.order_id:", payload?.order_id);
      return NextResponse.json({ ok: false, error: "Cannot resolve order id" }, { status: 400 });
    }

    const liqpayStatus = String(payload?.status || "").toLowerCase();
    const transactionId = String(payload?.transaction_id || payload?.liqpay_order_id || "");

    let nextStatus: "completed" | "failed" | null = null;
    let setPaid = false;

    if (["success", "sandbox", "wait_accept"].includes(liqpayStatus)) {
      // Важно: аватары выдаём на статусе completed (woocommerce_order_status_completed).
      nextStatus = "completed";
      setPaid = true;
    } else if (["failure", "error", "reversed", "unsubscribed"].includes(liqpayStatus)) {
      nextStatus = "failed";
    }

    console.log("[LiqPay callback] wpOrderId:", wpOrderId, "liqpayStatus:", liqpayStatus, "nextStatus:", nextStatus, "transactionId:", transactionId || "(none)");

    if (nextStatus) {
      const wooPayload = { status: nextStatus, set_paid: setPaid };
      console.log("[LiqPay callback] WooCommerce PUT payload:", wooPayload, "transactionId:", transactionId || "(none)");
      const wooRes = await woo.put(`orders/${wpOrderId}`, wooPayload);
      console.log("[LiqPay callback] WooCommerce response status:", wooRes?.status, "orderStatus:", wooRes?.data?.status, "datePaid:", wooRes?.data?.date_paid);

      if (nextStatus === "completed" && setPaid) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (botToken && chatId) {
          const orderNumber = wooRes?.data?.number ?? wpOrderId;
          const text = `✅ Замовлення #${orderNumber} оплачено через LiqPay`;
          fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
          }).catch((err) => console.error("[LiqPay callback] Telegram paid notify error:", err));
        }
      }
    } else {
      console.log("[LiqPay callback] Skipping WooCommerce update — unknown liqpayStatus:", liqpayStatus);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const errData = error?.response?.data;
    const errStatus = error?.response?.status;
    console.error("[LiqPay callback] Error:", {
      message: error?.message,
      status: errStatus,
      data: errData,
      full: error?.response?.data || error?.message || error,
    });
    return NextResponse.json({ ok: false, error: "Callback processing failed" }, { status: 500 });
  }
}
