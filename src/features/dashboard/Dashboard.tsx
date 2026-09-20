import { useState, type ReactNode } from 'react'
import type { MessageKey } from '../../shared/i18n/messages'
import { usePreferences } from '../../shared/preferences/preferencesContext'
import AddStock from '../inventory/AddStock'
import './Dashboard.css'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      {children}
    </svg>
  )
}

const navItems = [
  {
    labelKey: 'nav.overview' as MessageKey,
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
  },
  {
    labelKey: 'nav.pos' as MessageKey,
    icon: (
      <>
        <path d="M4 5h16v12H4z" />
        <path d="M8 21h8M12 17v4M8 9h8" />
      </>
    ),
  },
  {
    labelKey: 'nav.orders' as MessageKey,
    badge: '12',
    icon: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
        <path d="M9 7h6M9 11h6M9 15h3" />
      </>
    ),
  },
  {
    labelKey: 'nav.products' as MessageKey,
    icon: (
      <>
        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
      </>
    ),
  },
  {
    labelKey: 'nav.customers' as MessageKey,
    icon: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21c0-4 3-7 7-7s7 3 7 7M17 5a4 4 0 0 1 0 7M18 14c2.4.7 4 3 4 6" />
      </>
    ),
  },
  {
    labelKey: 'nav.inventory' as MessageKey,
    icon: (
      <>
        <path d="M3 7 12 2l9 5-9 5-9-5Z" />
        <path d="M3 7v10l9 5 9-5V7M12 12v10" />
      </>
    ),
  },
  {
    labelKey: 'nav.analytics' as MessageKey,
    icon: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
  },
  {
    labelKey: 'nav.reports' as MessageKey,
    icon: (
      <>
        <path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h3" />
      </>
    ),
  },
]

interface DashboardOrder {
  id: string
  customer: string
  time: string
  total: string
  status: 'Paid' | 'Pending'
}
const orders: readonly DashboardOrder[] = []

export default function Dashboard() {
  const { locale, setLocale, theme, toggleTheme, t } = usePreferences()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<MessageKey>('nav.overview')

  return (
    <div className="dashboard">
      <aside className={`drawer ${drawerOpen ? 'drawer--open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>{t('app.name')}</span>
        </div>
        <div className="drawer-scroll">
          <p className="drawer-label">{t('nav.workspace')}</p>
          <nav className="drawer-nav" aria-label={t('nav.mainLabel')}>
            {navItems.slice(0, 6).map((item) => (
              <NavItem
                key={item.labelKey}
                item={item}
                active={activeItem === item.labelKey}
                onClick={() => {
                  setActiveItem(item.labelKey)
                  setDrawerOpen(false)
                }}
              />
            ))}
          </nav>
          <p className="drawer-label drawer-label--spaced">
            {t('nav.insights')}
          </p>
          <nav className="drawer-nav" aria-label={t('nav.reportsLabel')}>
            {navItems.slice(6).map((item) => (
              <NavItem
                key={item.labelKey}
                item={item}
                active={activeItem === item.labelKey}
                onClick={() => {
                  setActiveItem(item.labelKey)
                  setDrawerOpen(false)
                }}
              />
            ))}
          </nav>
        </div>
        <div className="drawer-footer">
          <button className="drawer-link">
            <span className="drawer-link__icon">
              <Icon>
                <circle cx="12" cy="12" r="3" />
                <path d="M19 12a7 7 0 0 1-.1 1l2 1.6-2 3.4-2.5-1A8 8 0 0 1 14 18.4L13.6 21h-4L9 18.4A8 8 0 0 1 6.6 17l-2.5 1-2-3.4 2-1.6a7 7 0 0 1 0-2L2 9.4 4 6l2.5 1A8 8 0 0 1 9 5.6L9.5 3h4l.5 2.6A8 8 0 0 1 16.4 7l2.5-1 2 3.4-2 1.6a7 7 0 0 1 .1 1Z" />
              </Icon>
            </span>
            <span>{t('nav.settings')}</span>
          </button>
          <div className="profile">
            <span className="profile-avatar">AM</span>
            <span>
              <strong>Aung Myo</strong>
              <small>{t('user.role')}</small>
            </span>
            <span className="profile-more">•••</span>
          </div>
        </div>
      </aside>
      {drawerOpen && (
        <button
          className="backdrop"
          aria-label={t('nav.close')}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <main className="content">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            aria-label={t('nav.open')}
            onClick={() => setDrawerOpen(true)}
          >
            ☰
          </button>
          <div className="page-title">
            <p>
              {new Intl.DateTimeFormat(locale === 'my' ? 'my-MM' : 'en', {
                dateStyle: 'full',
              }).format(new Date())}
            </p>
            <h1>{t('header.greeting')}</h1>
          </div>
          <div className="topbar-actions">
            <button
              className="preference-button"
              aria-label={t('preference.language')}
              title={t('preference.language')}
              onClick={() => setLocale(locale === 'en' ? 'my' : 'en')}
            >
              {locale === 'en'
                ? t('preference.myanmar')
                : t('preference.english')}
            </button>
            <button
              className="icon-button"
              aria-label={t('preference.theme')}
              title={
                theme === 'light' ? t('preference.dark') : t('preference.light')
              }
              onClick={toggleTheme}
            >
              {theme === 'light' ? '☾' : '☀'}
            </button>
            <button
              className="icon-button notification"
              aria-label={t('header.notifications')}
            >
              <Icon>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </Icon>
              <span />
            </button>
            <button className="primary-button">
              <b>＋</b> {t('header.newSale')}
            </button>
          </div>
        </header>

        {activeItem === 'nav.inventory' ? (
          <AddStock />
        ) : (
          <>
            <section className="metrics" aria-label={t('dashboard.today')}>
              <Metric
                title={t('dashboard.grossSales')}
                value="$0.00"
                change="0%"
                symbol="↗"
              />
              <Metric
                title={t('dashboard.orders')}
                value="0"
                change="0%"
                symbol="▤"
              />
              <Metric
                title={t('dashboard.customers')}
                value="0"
                change="0%"
                symbol="♙"
              />
              <Metric
                title={t('dashboard.averageOrder')}
                value="$0.00"
                change="0%"
                symbol="◎"
                negative
              />
            </section>

            <section className="dashboard-grid">
              <article className="panel sales-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('dashboard.salesOverview')}</h2>
                    <p>{t('dashboard.weekRevenue')}</p>
                  </div>
                  <select
                    aria-label={t('dashboard.salesRange')}
                    defaultValue="7"
                  >
                    <option value="7">{t('dashboard.last7Days')}</option>
                    <option value="30">{t('dashboard.last30Days')}</option>
                  </select>
                </div>
                <div className="chart-wrap">
                  <div className="chart-y">
                    <span>$15k</span>
                    <span>$10k</span>
                    <span>$5k</span>
                    <span>$0</span>
                  </div>
                  <div className="chart">
                    <svg
                      viewBox="0 0 700 220"
                      preserveAspectRatio="none"
                      aria-label={t('dashboard.salesChart')}
                    >
                      <defs>
                        <linearGradient
                          id="chartFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#4f46e5"
                            stopOpacity=".2"
                          />
                          <stop
                            offset="100%"
                            stopColor="#4f46e5"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        className="chart-area"
                        d="M0 210 L700 210 L700 220 L0 220Z"
                      />
                      <path className="chart-line" d="M0 210 L700 210" />
                    </svg>
                    <div className="chart-days">
                      <span>{t('day.mon')}</span>
                      <span>{t('day.tue')}</span>
                      <span>{t('day.wed')}</span>
                      <span>{t('day.thu')}</span>
                      <span>{t('day.fri')}</span>
                      <span>{t('day.sat')}</span>
                      <span>{t('day.sun')}</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="panel category-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('dashboard.topCategories')}</h2>
                    <p>{t('dashboard.salesDistribution')}</p>
                  </div>
                  <button className="text-button">
                    {t('dashboard.viewReport')}
                  </button>
                </div>
                <div className="donut-row">
                  <div className="donut">
                    <div>
                      <strong>$0</strong>
                      <span>{t('dashboard.total')}</span>
                    </div>
                  </div>
                </div>
                <div className="legend">
                  <Legend
                    color="one"
                    label={t('category.electronics')}
                    value="0%"
                  />
                  <Legend
                    color="two"
                    label={t('category.apparel')}
                    value="0%"
                  />
                  <Legend color="three" label={t('category.home')} value="0%" />
                  <Legend color="four" label={t('category.other')} value="0%" />
                </div>
              </article>
            </section>

            <section className="panel orders-panel">
              <div className="panel-heading">
                <div>
                  <h2>{t('dashboard.recentOrders')}</h2>
                  <p>{t('dashboard.latestSales')}</p>
                </div>
                <button className="secondary-button">
                  {t('dashboard.viewAllOrders')}
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t('table.order')}</th>
                      <th>{t('table.customer')}</th>
                      <th>{t('table.time')}</th>
                      <th>{t('table.status')}</th>
                      <th>{t('table.total')}</th>
                      <th aria-label={t('table.actions')} />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.id}</strong>
                        </td>
                        <td>
                          <span className="customer-avatar">
                            {order.customer
                              .split(' ')
                              .map((name) => name[0])
                              .join('')}
                          </span>
                          {order.customer}
                        </td>
                        <td>{order.time}</td>
                        <td>
                          <span
                            className={`status status--${order.status.toLowerCase()}`}
                          >
                            {t(
                              order.status === 'Paid'
                                ? 'status.paid'
                                : 'status.pending',
                            )}
                          </span>
                        </td>
                        <td>
                          <strong>{order.total}</strong>
                        </td>
                        <td>
                          <button
                            className="more-button"
                            aria-label={`${t('table.actions')}: ${order.id}`}
                          >
                            •••
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function NavItem({
  item,
  active,
  onClick,
}: {
  item: (typeof navItems)[number]
  active: boolean
  onClick: () => void
}) {
  const { t } = usePreferences()
  return (
    <button
      className={`drawer-link ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <span className="drawer-link__icon">
        <Icon>{item.icon}</Icon>
      </span>
      <span>{t(item.labelKey)}</span>
      {item.badge && <span className="drawer-link__badge">{item.badge}</span>}
    </button>
  )
}

function Metric({
  title,
  value,
  change,
  symbol,
  negative = false,
}: {
  title: string
  value: string
  change: string
  symbol: string
  negative?: boolean
}) {
  const { t } = usePreferences()
  return (
    <article className="metric-card">
      <div className="metric-heading">
        <span>{title}</span>
        <span className="metric-icon">{symbol}</span>
      </div>
      <strong>{value}</strong>
      <p>
        <span className={negative ? 'negative' : 'positive'}>{change}</span>{' '}
        {t('dashboard.fromYesterday')}
      </p>
    </article>
  )
}

function Legend({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: string
}) {
  return (
    <div>
      <span>
        <i className={`dot dot--${color}`} />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  )
}
