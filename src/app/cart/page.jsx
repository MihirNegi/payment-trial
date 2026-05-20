"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.scss";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven&apos;t added any products yet.</p>
          <Link href="/" className={styles.shopBtn}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Shopping Cart</h1>

      <div className={styles.layout}>
        <div className={styles.itemsList}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemImage}>
                <Image src={item.image} alt={item.name} width={100} height={100} />
              </div>
              <div className={styles.itemInfo}>
                <h3>{item.name}</h3>
                <p className={styles.itemCategory}>{item.category}</p>
                <p className={styles.itemPrice}>&#8377;{item.price.toLocaleString("en-IN")}</p>
              </div>
              <div className={styles.itemActions}>
                <div className={styles.quantity}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <p className={styles.itemTotal}>&#8377;{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <h2>Order Summary</h2>
          <div className={styles.summaryRow}>
            <span>Subtotal (incl. GST)</span>
            <span>&#8377;{totalPrice.toLocaleString("en-IN")}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span className={styles.free}>Free</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total</span>
            <span>&#8377;{totalPrice.toLocaleString("en-IN")}</span>
          </div>
          <Link href="/checkout" className={styles.checkoutBtn}>
            Proceed to Checkout
          </Link>
          <p className={styles.note}>Convenience fee may apply based on payment method.</p>
        </div>
      </div>
    </div>
  );
}
