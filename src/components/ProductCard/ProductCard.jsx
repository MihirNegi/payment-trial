"use client";

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import styles from "./ProductCard.module.scss";

export default function ProductCard({ product }) {
  const { addToCart, items } = useCart();
  const inCart = items.find((item) => item.id === product.id);

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={product.image}
          alt={product.name}
          width={400}
          height={400}
          className={styles.image}
        />
        {product.badge && <span className={styles.badge}>{product.badge}</span>}
      </div>
      <div className={styles.body}>
        <span className={styles.category}>{product.category}</span>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.footer}>
          <span className={styles.price}>&#8377;{product.price.toLocaleString("en-IN")}</span>
          <button className={styles.addBtn} onClick={() => addToCart(product)}>
            {inCart ? `In Cart (${inCart.quantity})` : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
