import { NextResponse } from "next/server";
import { verifyResponseChecksum } from "@/lib/zaakpay";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries());

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";
    const receivedChecksum = params.checksum;

    const isValid = verifyResponseChecksum(params, receivedChecksum);

    if (params.responseCode === "100" || params.responseCode === "402") {
      const query = new URLSearchParams({
        orderId: params.orderId || "",
        paymentId: params.pgTransId || "",
        gateway: "zaakpay",
        amount: params.amount ? (parseInt(params.amount) / 100).toString() : "",
        status: "success",
        method: (params.paymentMode || "").toLowerCase(),
        verified: isValid.toString(),
      });
      return NextResponse.redirect(`${appUrl}/order-confirmation?${query}`);
    }

    const query = new URLSearchParams({
      payment_failed: "true",
      gateway: "zaakpay",
      reason: params.responseDescription || "Payment failed",
    });
    return NextResponse.redirect(`${appUrl}/checkout?${query}`);
  } catch (error) {
    console.error("Zaakpay callback error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";
    return NextResponse.redirect(`${appUrl}/checkout?payment_failed=true`);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";

  const responseCode = searchParams.get("responseCode");
  if (responseCode === "100" || responseCode === "402") {
    const query = new URLSearchParams({
      orderId: searchParams.get("orderId") || "",
      paymentId: searchParams.get("pgTransId") || "",
      gateway: "zaakpay",
      amount: searchParams.get("amount") ? (parseInt(searchParams.get("amount")) / 100).toString() : "",
      status: "success",
      method: (searchParams.get("paymentMode") || "").toLowerCase(),
    });
    return NextResponse.redirect(`${appUrl}/order-confirmation?${query}`);
  }

  return NextResponse.redirect(`${appUrl}/checkout?payment_failed=true&gateway=zaakpay`);
}
