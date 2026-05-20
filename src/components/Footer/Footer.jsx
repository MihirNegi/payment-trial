import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <span className={styles.logo}>&#9670; PayDemo</span>
          <p className={styles.tagline}>
            A demo storefront for testing payment gateway integrations.
          </p>
        </div>
        <div className={styles.info}>
          <p>No real transactions are processed.</p>
          <p>&copy; {new Date().getFullYear()} PayDemo &mdash; Test Environment</p>
        </div>
      </div>
    </footer>
  );
}
