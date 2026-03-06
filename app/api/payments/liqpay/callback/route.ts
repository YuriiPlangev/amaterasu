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
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
    const wpOrderId = parseWpOrderId(payload);

    if (!wpOrderId) {
      return NextResponse.json({ ok: false, error: "Cannot resolve order id" }, { status: 400 });
    }

    const liqpayStatus = String(payload?.status || "").toLowerCase();
    const transactionId = String(payload?.transaction_id || payload?.liqpay_order_id || "");

    let nextStatus: "processing" | "failed" | null = null;
    let setPaid = false;

    if (["success", "sandbox", "wait_accept"].includes(liqpayStatus)) {
      nextStatus = "processing";
      setPaid = true;
    } else if (["failure", "error", "reversed", "unsubscribed"].includes(liqpayStatus)) {
      nextStatus = "failed";
    }

    if (nextStatus) {
      await woo.put(`orders/${wpOrderId}`, {
        status: nextStatus,
        set_paid: setPaid,
        transaction_id: transactionId || undefined,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("LiqPay callback error:", error?.response?.data || error?.message || error);
    return NextResponse.json({ ok: false, error: "Callback processing failed" }, { status: 500 });
  }
}
