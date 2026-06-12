"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Дашборд" },
    { href: "/admin/users", label: "Пользователи" },
    { href: "/admin/reports", label: "Жалобы" },
    { href: "/admin/taxonomy", label: "Жанры и теги" },
  ];

  return (
    <div className={styles.adminWrap}>
      <nav className={styles.sidebar}>
        <h2>Админка</h2>
        <p className={styles.sub}>Панель управления ЭЙРИ</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.active : ""}`}
          >
            {item.label}
          </Link>
        ))}
        <Link href="/home" className={styles.backLink}>
          ← На сайт
        </Link>
      </nav>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
