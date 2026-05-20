"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.scss";

// Zaakpay rate: 1.9% + 18% GST on that = ~2.24%. We round up to 2.25% to cover fully.
const CONVENIENCE_FEE_CONFIG = {
  upi: { rate: 0, label: "Free" },
  card: { rate: 0.0225, label: "2.25%" },
  netbanking: { rate: 0.0225, label: "2.25%" },
  wallet: { rate: 0.0225, label: "2.25%" },
};

function getConvenienceFee(method, orderTotal) {
  const config = CONVENIENCE_FEE_CONFIG[method];
  if (!config || config.rate === 0) return 0;
  return Math.ceil(orderTotal * config.rate);
}

const PAYMENT_METHODS = [
  {
    id: "upi",
    label: "UPI",
    description: "Google Pay, PhonePe, Paytm & more",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="18" rx="3" />
        <path d="M8 12l3 3 5-6" />
      </svg>
    ),
    badge: "No Extra Fee",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay, Amex",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: "netbanking",
    label: "Net Banking",
    description: "All major Indian banks",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
  },
  {
    id: "wallet",
    label: "MobiKwik Wallet",
    description: "Pay using MobiKwik wallet balance",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M16 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
      </svg>
    ),
  },
];

const POPULAR_BANKS = [
  { id: "SBI", name: "State Bank of India" },
  { id: "HDF", name: "HDFC Bank" },
  { id: "ICICI", name: "ICICI Bank" },
  { id: "AXIS", name: "Axis Bank" },
  { id: "162", name: "Kotak Mahindra Bank" },
  { id: "PNB", name: "Punjab National Bank" },
  { id: "BOI", name: "Bank of India" },
  { id: "YBK", name: "Yes Bank" },
  { id: "IDB", name: "IDBI Bank" },
  { id: "FBK", name: "Federal Bank" },
  { id: "IDS", name: "IndusInd Bank" },
  { id: "RBL", name: "RBL Bank" },
];

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, totalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [paymentError, setPaymentError] = useState("");
  const bankRedirectFormRef = useRef(null);

  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  const convenienceFee = getConvenienceFee(selectedMethod, totalPrice);
  const grandTotal = totalPrice + convenienceFee;

  useEffect(() => {
    if (searchParams.get("payment_failed") === "true") {
      const reason = searchParams.get("reason");
      const gw = searchParams.get("gateway");
      setPaymentError(
        reason || `Payment failed${gw ? ` via ${gw}` : ""}. Please try again.`
      );
    }
  }, [searchParams]);

  const selectedConfig = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

  async function handleZaakpayPayment(formData) {
    const orderId = `ZP_${Date.now()}`;
    const email = formData.get("email") || "customer@example.com";
    const phone = formData.get("phone") || "";

    const payload = {
      amount: grandTotal,
      orderId,
      email,
      phone,
      productDescription: `Order — ${items.length} item(s)`,
      paymentMode: "",
    };

    if (selectedMethod === "upi") {
      if (!upiId || !upiId.includes("@")) {
        setPaymentError("Please enter a valid UPI ID (e.g. name@upi)");
        setIsProcessing(false);
        return;
      }
      payload.paymentMode = "UPI";
      payload.bankid = upiId;
    } else if (selectedMethod === "card") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        setPaymentError("Please fill in all card details");
        setIsProcessing(false);
        return;
      }
      const [expMonth, expYear] = cardExpiry.split("/").map((s) => s.trim());
      payload.paymentMode = "card";
      payload.card = {
        number: cardNumber.replace(/\s/g, ""),
        name: cardName,
        cvv: cardCvv,
        expiryMonth: expMonth,
        expiryYear: expYear?.length === 2 ? `20${expYear}` : expYear,
      };
    } else if (selectedMethod === "netbanking") {
      if (!selectedBank) {
        setPaymentError("Please select a bank");
        setIsProcessing(false);
        return;
      }
      payload.paymentMode = "netbanking";
      payload.bankid = selectedBank;
    } else if (selectedMethod === "wallet") {
      payload.paymentMode = "wallet";
    }

    const res = await fetch("/api/payment/zaakpay/transact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || (data.responseCode && data.responseCode !== "100" && data.responseCode !== "208" && data.responseCode !== "402")) {
      setPaymentError(data.error || data.responseDescription || "Payment failed. Please try again.");
      setIsProcessing(false);
      return;
    }

    if (data.responseCode === "100" || data.responseCode === "402") {
      clearCart();
      const params = new URLSearchParams({
        orderId: data.orderId || orderId,
        paymentId: data.pgTransId || "",
        gateway: "zaakpay",
        amount: grandTotal.toString(),
        status: "success",
        method: selectedMethod,
      });
      router.push(`/order-confirmation?${params}`);
      return;
    }

    if (data.doRedirect === "true" && data.postUrl && data.bankPostData) {
      const form = bankRedirectFormRef.current;
      if (form) {
        form.action = data.postUrl;
        form.innerHTML = "";
        Object.entries(data.bankPostData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        form.submit();
        return;
      }
    }

    if (data.responseCode === "208") {
      pollPaymentStatus(orderId);
      return;
    }

    setPaymentError("Unexpected response from payment gateway. Please try again.");
    setIsProcessing(false);
  }

  async function pollPaymentStatus(orderId) {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch("/api/payment/zaakpay/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();

        if (data.responseCode === "100" || data.responseCode === "402") {
          clearCart();
          const params = new URLSearchParams({
            orderId,
            paymentId: data.pgTransId || "",
            gateway: "zaakpay",
            amount: grandTotal.toString(),
            status: "success",
            method: selectedMethod,
          });
          router.push(`/order-confirmation?${params}`);
          return;
        }

        if (data.responseCode && data.responseCode !== "208") {
          setPaymentError(data.responseDescription || "Payment failed.");
          setIsProcessing(false);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setPaymentError("Payment timed out. Please check your UPI app and try again.");
          setIsProcessing(false);
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setPaymentError("Could not verify payment. Please contact support.");
          setIsProcessing(false);
        }
      }
    };

    poll();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError("");

    const formData = new FormData(e.target);

    try {
      await handleZaakpayPayment(formData);
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentError("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h2>Nothing to checkout</h2>
          <p>Add some items to your cart first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Checkout</h1>

      {/* Hidden form for bank redirects (3DS, net banking) */}
      <form ref={bankRedirectFormRef} method="POST" style={{ display: "none" }} />

      <form className={styles.layout} onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <div className={styles.section}>
            <h2>Contact Information</h2>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="firstName">First Name</label>
                <input id="firstName" name="firstName" type="text" placeholder="John" />
              </div>
              <div className={styles.field}>
                <label htmlFor="lastName">Last Name</label>
                <input id="lastName" name="lastName" type="text" placeholder="Doe" />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="john@example.com" />
            </div>
            <div className={styles.field}>
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className={styles.section}>
            <h2>Shipping Address</h2>
            <div className={styles.field}>
              <label htmlFor="address">Address</label>
              <input id="address" name="address" type="text" placeholder="42, MG Road" />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="city">City</label>
                <input id="city" name="city" type="text" placeholder="Mumbai" />
              </div>
              <div className={styles.field}>
                <label htmlFor="state">State</label>
                <input id="state" name="state" type="text" placeholder="Maharashtra" />
              </div>
              <div className={styles.field}>
                <label htmlFor="zip">PIN Code</label>
                <input id="zip" name="zip" type="text" placeholder="400001" />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Payment Method</h2>

            {paymentError && (
              <div className={styles.errorBanner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{paymentError}</span>
              </div>
            )}

            <div className={styles.methodList}>
              {PAYMENT_METHODS.map((method) => {
                const fee = getConvenienceFee(method.id, totalPrice);
                return (
                  <label
                    key={method.id}
                    className={`${styles.methodOption} ${selectedMethod === method.id ? styles.methodSelected : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={() => { setSelectedMethod(method.id); setPaymentError(""); }}
                      className={styles.methodRadio}
                    />
                    <div className={styles.methodIcon}>{method.icon}</div>
                    <div className={styles.methodInfo}>
                      <span className={styles.methodLabel}>
                        {method.label}
                        {method.badge && (
                          <span className={styles.methodBadge}>{method.badge}</span>
                        )}
                      </span>
                      <span className={styles.methodDesc}>{method.description}</span>
                    </div>
                    <div className={styles.methodFee}>
                      {fee === 0 ? (
                        <span className={styles.feeFree}>FREE</span>
                      ) : (
                        <span className={styles.feeAmount}>+&#8377;{fee.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* UPI Input */}
            {selectedMethod === "upi" && (
              <div className={styles.paymentForm}>
                <div className={styles.field}>
                  <label htmlFor="upiId">UPI ID</label>
                  <input
                    id="upiId"
                    type="text"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Card Input */}
            {selectedMethod === "card" && (
              <div className={styles.paymentForm}>
                <div className={styles.field}>
                  <label htmlFor="cardNumber">Card Number</label>
                  <input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                      setCardNumber(v);
                    }}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="cardName">Name on Card</label>
                  <input
                    id="cardName"
                    type="text"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="cardExpiry">Expiry (MM/YY)</label>
                    <input
                      id="cardExpiry"
                      type="text"
                      placeholder="12/28"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                        setCardExpiry(v);
                      }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="cardCvv">CVV</label>
                    <input
                      id="cardCvv"
                      type="password"
                      placeholder="***"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Net Banking */}
            {selectedMethod === "netbanking" && (
              <div className={styles.paymentForm}>
                <div className={styles.field}>
                  <label>Select Bank</label>
                  <div className={styles.bankGrid}>
                    {POPULAR_BANKS.map((bank) => (
                      <label
                        key={bank.id}
                        className={`${styles.bankOption} ${selectedBank === bank.id ? styles.bankSelected : ""}`}
                      >
                        <input
                          type="radio"
                          name="bank"
                          value={bank.id}
                          checked={selectedBank === bank.id}
                          onChange={() => setSelectedBank(bank.id)}
                          style={{ display: "none" }}
                        />
                        <span>{bank.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Wallet — no extra input needed */}
            {selectedMethod === "wallet" && (
              <div className={styles.paymentForm}>
                <p className={styles.walletNote}>
                  You will be redirected to MobiKwik to complete payment using your wallet balance.
                </p>
              </div>
            )}

            <div className={styles.feeNote}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>No convenience fee on UPI payments as per RBI guidelines</span>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.orderReview}>
            <h2>Order Review</h2>
            <div className={styles.reviewItems}>
              {items.map((item) => (
                <div key={item.id} className={styles.reviewItem}>
                  <span className={styles.reviewName}>
                    {item.name} <span className={styles.reviewQty}>&times;{item.quantity}</span>
                  </span>
                  <span>&#8377;{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
            <div className={styles.reviewTotals}>
              <div className={styles.reviewRow}>
                <span>Subtotal (incl. GST)</span>
                <span>&#8377;{totalPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.reviewRow}>
                <span>Shipping</span>
                <span className={styles.free}>Free</span>
              </div>
              {convenienceFee > 0 ? (
                <div className={`${styles.reviewRow} ${styles.feeRow}`}>
                  <span>Convenience Fee</span>
                  <span>+&#8377;{convenienceFee.toLocaleString("en-IN")}</span>
                </div>
              ) : (
                <div className={`${styles.reviewRow} ${styles.feeRowFree}`}>
                  <span>Convenience Fee</span>
                  <span className={styles.free}>Free</span>
                </div>
              )}
              <div className={`${styles.reviewRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>&#8377;{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <button type="submit" className={styles.payBtn} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <span className={styles.spinner} />
                {selectedMethod === "upi" ? "Waiting for UPI approval..." : "Processing..."}
              </>
            ) : (
              `Pay ₹${grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })} — ${selectedConfig?.label}`
            )}
          </button>

          <div className={styles.secureNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secured by Zaakpay (MobiKwik)</span>
          </div>
        </div>
      </form>
    </div>
  );
}
