import { useState } from 'react'
import styles from '../../App.module.css'

export type NavItem = {
  label: string
  href?: string
  onClick?: () => void
}

type GlobalHeaderProps = {
  ready: boolean
  authenticated: boolean
  address?: string
  onLogin: () => void
  onLogout: () => void
  navItems: NavItem[]
}

export function GlobalHeader({
  ready,
  authenticated,
  address,
  onLogin,
  onLogout,
  navItems,
}: GlobalHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleNavClick = (item: NavItem) => {
    item.onClick?.()
    setMenuOpen(false)
  }

  const renderNav = (className: string) => (
    <nav className={className} aria-label="Primary navigation">
      <ul className={styles.headerNavList}>
        {navItems.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <a href={item.href} onClick={() => handleNavClick(item)}>
                {item.label}
              </a>
            ) : (
              <button type="button" onClick={() => handleNavClick(item)}>
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )

  const actionLabel = authenticated ? 'Disconnect' : ready ? 'Connect Wallet' : 'Initializing…'
  const actionHandler = authenticated ? onLogout : onLogin
  const actionDisabled = !ready && !authenticated

  return (
    <header className={styles.globalHeader}>
      <div className={styles.headerContent}>
        <div className={styles.headerBrand}>
          <span className={styles.brandMark} aria-hidden="true" />
          <div>
            <p className={styles.brandLabel}>Prize Control</p>
            <span className={styles.brandSubtext}>Live draws</span>
          </div>
        </div>

        {renderNav(styles.headerNav)}

        <div className={styles.headerActions}>
          {authenticated && address ? (
            <span className={styles.headerAddress}>
              {address.slice(0, 4)}…{address.slice(-4)}
            </span>
          ) : null}
          <button
            className={styles.headerButton}
            onClick={actionHandler}
            disabled={actionDisabled}
            type="button"
          >
            {actionLabel}
          </button>
          <button
            type="button"
            className={styles.headerToggle}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ''}`}>
        {renderNav(styles.mobileNavInner)}
      </div>
    </header>
  )
}
