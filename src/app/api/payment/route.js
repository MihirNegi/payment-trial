import { NextResponse } from "next/server";

/**
 * Payment gateway configuration endpoint.
 * Returns which gateways are enabled based on env keys.
 */
export async function GET() {
  return NextResponse.json({
    gateways: {
      zaakpay: {
        enabled: !!process.env.ZAAKPAY_MERCHANT_ID,
        methods: ["upi", "card", "netbanking", "wallet"],
      },
      razorpay: {
        enabled: !!process.env.RAZORPAY_KEY_ID,
        methods: ["card", "netbanking", "wallet", "emi"],
      },
    },
  });
}
