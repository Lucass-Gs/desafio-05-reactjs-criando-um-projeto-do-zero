import Link from 'next/link';
import styles from './header.module.scss';

export default function Header() {
  return (
    <Link href="/" className={styles.headerContent}>
      <img src="/images/logo.svg" alt="logo" />
      <h1>
        spacetraveling<strong>.</strong>
      </h1>
    </Link>
  );
}
