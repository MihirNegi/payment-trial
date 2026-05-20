import { NextResponse } from "next/server";
import { getZaakpayBaseUrl, calculateChecksum } from "@/lib/zaakpay";

export async function POST(request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const merchantId = process.env.ZAAKPAY_MERCHANT_ID;
    const secretKey = process.env.ZAAKPAY_SECRET_KEY;

    const data = `merchantIdentifier=${merchantId}&orderId=${orderId}&mode=0&`;
    const checksum = calculateChecksum(data, secretKey);

    const baseUrl = getZaakpayBaseUrl();
    const response = await fetch(`${baseUrl}/checkTxn?v=5`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        merchantIdentifier: merchantId,
        orderId,
        mode: "0",
        checksum,
      }).toString(),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Zaakpay status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
