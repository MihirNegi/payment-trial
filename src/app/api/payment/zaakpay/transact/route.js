import { NextResponse } from "next/server";
import {
  getZaakpayBaseUrl,
  calculateChecksum,
  encryptWithPublicKey,
} from "@/lib/zaakpay";

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, orderId, email, phone, productDescription, paymentMode, bankid, card } = body;

    if (!amount || !orderId || !email || !paymentMode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const merchantId = process.env.ZAAKPAY_MERCHANT_ID;
    const secretKey = process.env.ZAAKPAY_SECRET_KEY;
    const encryptionKeyId = process.env.ZAAKPAY_ENCRYPTION_KEY_ID;
    const publicKey = process.env.ZAAKPAY_PUBLIC_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";

    if (!merchantId || !secretKey) {
      return NextResponse.json(
        { error: "Zaakpay credentials not configured. Set ZAAKPAY_MERCHANT_ID and ZAAKPAY_SECRET_KEY in .env" },
        { status: 500 }
      );
    }

    const amountInPaisa = Math.round(parseFloat(amount) * 100).toString();

    const data = {
      merchantIdentifier: merchantId,
      showMobile: "true",
      mode: "0",
      returnUrl: `${appUrl}/api/payment/zaakpay/callback`,
      orderDetail: {
        orderId,
        amount: amountInPaisa,
        currency: "INR",
        productDescription: productDescription || "Order payment",
        email,
        phone: phone || "",
      },
      paymentInstrument: {},
    };

    if (paymentMode === "UPI") {
      data.paymentInstrument = {
        paymentMode: "UPI",
        netbanking: { bankid: bankid || "" },
      };
      data.debitorcredit = "upi";
    } else if (paymentMode === "netbanking") {
      data.paymentInstrument = {
        paymentMode: "netbanking",
        netbanking: { bankid: bankid || "" },
      };
    } else if (paymentMode === "wallet") {
      data.paymentInstrument = {
        paymentMode: "wallet",
        netbanking: { bankid: "MW" },
      };
    } else if (paymentMode === "card" && card && publicKey) {
      data.encryptionKeyId = encryptionKeyId;
      data.paymentInstrument = {
        paymentMode: "card",
        card: {
          encrypted_pan: encryptWithPublicKey(card.number, publicKey),
          nameoncard: card.name,
          encryptedcvv: encryptWithPublicKey(card.cvv, publicKey),
          encrypted_expiry_month: encryptWithPublicKey(card.expiryMonth, publicKey),
          encrypted_expiry_year: encryptWithPublicKey(card.expiryYear, publicKey),
          saveCard: "false",
        },
      };
    } else if (paymentMode === "card") {
      return NextResponse.json(
        { error: "Card encryption keys not configured. Set ZAAKPAY_PUBLIC_KEY in .env" },
        { status: 500 }
      );
    }

    const dataString = JSON.stringify(data);
    const checksum = calculateChecksum(dataString, secretKey);

    const baseUrl = getZaakpayBaseUrl();
    const response = await fetch(`${baseUrl}/transactU?v=8`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: dataString, checksum }).toString(),
    });

    const result = await response.json();

    return NextResponse.json({
      ...result,
      orderId,
      gateway: "zaakpay",
    });
  } catch (error) {
    console.error("Zaakpay TransactU error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Zaakpay payment" },
      { status: 500 }
    );
  }
}
