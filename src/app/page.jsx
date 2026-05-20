"use client";

import ProductCard from "@/components/ProductCard/ProductCard";
import { products } from "@/data/products";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Payment Gateway Sandbox</h1>
        <p className={styles.subtitle}>
          Pick some products, go through checkout, and test any payment integration.
          No real charges — ever.
        </p>
      </section>

      <section className={styles.products}>
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
