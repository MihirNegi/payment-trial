"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const { totalItems } = useCart();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>&#9670;</span>
          PayDemo
        </Link>

        <div className={styles.links}>
          <Link href="/" className={styles.link}>
            Products
          </Link>
          <Link href="/cart" className={styles.cartLink}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
}
