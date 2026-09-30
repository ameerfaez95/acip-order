/* ============================================
   ACIP ORDER — NAVBAR (Pelanggan)
   Header sticky dengan logo & ikon cart.
   ============================================ */

import { Link } from 'react-router-dom'
import { IconCart } from './icons'

type NavbarProps = {
  cartCount: number
  onCartClick?: () => void
}

export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo">A</span>
          <span className="navbar__name">
            Acip<span className="navbar__name-accent">Gunting</span>
          </span>
        </Link>

        <button
          className="navbar__cart"
          onClick={onCartClick}
          aria-label={`Cart, ${cartCount} item`}
        >
          <IconCart size={22} />
          {cartCount > 0 && (
            <span className="navbar__badge" key={cartCount}>
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
