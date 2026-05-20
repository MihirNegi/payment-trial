"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.scss";

const GATEWAY_LABELS = {
  zaakpay: "Zaakpay (MobiKwik)",
  razorpay: "Razorpay",
};

const METHOD_LABELS = {
  upi: "UPI",
  card: "Credit / Debit Card",
  netbanking: "Net Banking",
  wallet: "Digital Wallet",
  emi: "EMI",
};

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <OrderConfirmationContent />
    </Suspense>
  );
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const orderId = searchParams.get("orderId") || `ORD-${Date.now().toString(36).toUpperCase()}`;
  const paymentId = searchParams.get("paymentId");
  const gateway = searchParams.get("gateway");
  const amount = searchParams.get("amount");
  const status = searchParams.get("status");
  const method = searchParams.get("method");

  const isRealPayment = status === "success" && gateway;

  useEffect(() => {
    if (isRealPayment) {
      clearCart();
    }
  }, [isRealPayment, clearCart]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.checkmark}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className={styles.title}>Order Placed Successfully!</h1>
        <p className={styles.subtitle}>
          {isRealPayment
            ? "Your payment has been processed and your order is confirmed."
            : "This is a simulated confirmation. No real payment was processed."}
        </p>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Order ID</span>
            <span className={styles.value}>{orderId}</span>
          </div>
          {paymentId && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Payment ID</span>
              <span className={styles.value}>{paymentId}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.label}>Status</span>
            <span className={isRealPayment ? styles.successBadge : styles.statusBadge}>
              {isRealPayment ? "Paid" : "Demo — Simulated"}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Gateway</span>
            <span className={styles.value}>
              {gateway ? GATEWAY_LABELS[gateway] || gateway : "Pending Integration"}
            </span>
          </div>
          {method && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Payment Method</span>
              <span className={styles.value}>{METHOD_LABELS[method] || method}</span>
            </div>
          )}
          {amount && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Amount Paid</span>
              <span className={styles.value}>
                &#8377;{parseFloat(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {!isRealPayment && (
          <div className={styles.infoBox}>
            <p>
              This demo uses <strong>Zaakpay (MobiKwik)</strong> for all payments — UPI, cards,
              net banking &amp; wallets. Add your API keys in the <code>.env</code> file to
              process real payments.
            </p>
          </div>
        )}

        {isRealPayment && (
          <div className={styles.infoBox}>
            <p>
              A confirmation email will be sent to your registered email address.
              You can track your order using the Order ID above.
            </p>
          </div>
        )}

        <Link href="/" className={styles.backBtn}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
