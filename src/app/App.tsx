import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { sampleProducts } from '../features/checkout/data/sampleProducts'
import {
  addProduct,
  calculateCartTotal,
  calculateItemCount,
  calculateLineTotal,
  changeQuantity,
  formatMoney,
  type CartLine,
} from '../features/checkout/domain/cart'
import './App.css'

const categories = ['All', 'Drinks', 'Meals', 'Snacks'] as const

function App() {
  const [cartLines, setCartLines] = useState<CartLine[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key === 'F2') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase()

    return sampleProducts.filter((product) => {
      const isInCategory =
        selectedCategory === 'All' || product.category === selectedCategory
      const matchesSearch = product.name
        .toLocaleLowerCase()
        .includes(normalizedSearch)

      return isInCategory && matchesSearch
    })
  }, [searchTerm, selectedCategory])

  const itemCount = calculateItemCount(cartLines)
  const total = calculateCartTotal(cartLines)

  return (
    <div className="pos-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="SalePilot checkout">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span>SalePilot</span>
        </a>

        <div className="store-status">
          <span className="status-dot" aria-hidden="true" />
          <span>Yangon Main Store</span>
          <span className="divider" aria-hidden="true" />
          <span>Register 01</span>
        </div>

        <button className="cashier-button" type="button">
          <span className="cashier-avatar" aria-hidden="true">
            AM
          </span>
          <span>
            <small>Cashier</small>
            Aung Min
          </span>
        </button>
      </header>

      <main className="workspace" id="main">
        <section className="catalogue" aria-labelledby="catalogue-title">
          <div className="catalogue-heading">
            <div>
              <p className="eyebrow">New sale</p>
              <h1 id="catalogue-title">Choose products</h1>
            </div>
            <label className="search-box">
              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>
              <span className="sr-only">Search products</span>
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search product or barcode"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <kbd>F2</kbd>
            </label>
          </div>

          <nav className="category-tabs" aria-label="Product categories">
            {categories.map((category) => (
              <button
                className={category === selectedCategory ? 'active' : ''}
                type="button"
                key={category}
                onClick={() => setSelectedCategory(category)}
                aria-pressed={category === selectedCategory}
              >
                {category}
              </button>
            ))}
          </nav>

          {visibleProducts.length > 0 ? (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <button
                  className="product-card"
                  type="button"
                  key={product.id}
                  onClick={() =>
                    setCartLines((lines) => addProduct(lines, product))
                  }
                  aria-label={`Add ${product.name}, ${formatMoney(product.priceMinor)}`}
                >
                  <span
                    className="product-visual"
                    style={
                      { '--product-color': product.color } as CSSProperties
                    }
                    aria-hidden="true"
                  >
                    {product.shortCode}
                  </span>
                  <span className="product-info">
                    <span className="product-category">{product.category}</span>
                    <strong>{product.name}</strong>
                    <span className="product-price">
                      {formatMoney(product.priceMinor)}
                    </span>
                  </span>
                  <span className="add-button" aria-hidden="true">
                    +
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <strong>No products found</strong>
              <span>Try another name or category.</span>
            </div>
          )}
        </section>

        <aside className="cart" aria-labelledby="cart-title">
          <div className="cart-heading">
            <div>
              <p className="eyebrow">Current order</p>
              <h2 id="cart-title">Cart</h2>
            </div>
            <span className="item-count">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="cart-lines" aria-live="polite">
            {cartLines.length === 0 ? (
              <div className="empty-cart">
                <span className="empty-cart-icon" aria-hidden="true">
                  +
                </span>
                <strong>Your cart is empty</strong>
                <p>Select a product to start this sale.</p>
              </div>
            ) : (
              cartLines.map((line) => (
                <article className="cart-line" key={line.product.id}>
                  <div className="line-heading">
                    <div>
                      <strong>{line.product.name}</strong>
                      <span>{formatMoney(line.product.priceMinor)} each</span>
                    </div>
                    <strong>{formatMoney(calculateLineTotal(line))}</strong>
                  </div>
                  <div
                    className="quantity-control"
                    aria-label={`${line.product.name} quantity`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setCartLines((lines) =>
                          changeQuantity(lines, line.product.id, -1),
                        )
                      }
                      aria-label={`Decrease ${line.product.name} quantity`}
                    >
                      −
                    </button>
                    <output aria-label="Quantity">{line.quantity}</output>
                    <button
                      type="button"
                      onClick={() =>
                        setCartLines((lines) =>
                          changeQuantity(lines, line.product.id, 1),
                        )
                      }
                      aria-label={`Increase ${line.product.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatMoney(total)}</strong>
            </div>
            <div className="summary-row muted">
              <span>Tax</span>
              <span>Included</span>
            </div>
            <div className="total-row">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>
            <button
              className="charge-button"
              type="button"
              disabled={total === 0}
            >
              <span>Charge</span>
              <strong>{formatMoney(total)}</strong>
            </button>
            <button
              className="clear-button"
              type="button"
              disabled={cartLines.length === 0}
              onClick={() => setCartLines([])}
            >
              Clear cart
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
