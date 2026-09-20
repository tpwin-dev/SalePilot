# POS Application Feature Roadmap

Implement each step completely and verify its acceptance criteria before starting the next step.

## 1. Project foundation

- [x] Repository and workspace structure
- [x] Strict TypeScript, formatting, linting, tests, and CI
- [x] Database migrations and module-boundary enforcement
- [x] Secret scanning
- [x] English and Myanmar localization foundation

**Acceptance criteria**

- All packages build and every quality check passes.
- Secrets are not committed.
- Database and cloud providers remain replaceable.

## 2. Business setup and staff access

- [ ] Business, branch, register, and device setup
- [ ] Owner and staff accounts
- [ ] Staff PIN authentication
- [ ] Roles, permissions, session timeout, and manager approval

**Acceptance criteria**

- A new shop can complete setup and authorized staff can sign in offline.
- Unauthorized actions are rejected and audited.
- PINs are never stored as plaintext.

## 3. Product catalogue

- [ ] Categories, units, products, and variants
- [ ] SKU and multiple barcodes
- [ ] Selling prices and decimal quantities
- [ ] Product search and archiving
- [ ] CSV import with validation preview

**Acceptance criteria**

- Products can be created, found, updated, and archived.
- Archived products remain visible in historical transactions.
- Duplicate identifiers and invalid quantity precision are rejected.

## 4. Suppliers and stock receiving

- [ ] Supplier profiles and stock receipts
- [ ] Purchase quantities and costs
- [ ] Immutable inventory movements
- [ ] Weighted-average costing and stock-on-hand calculation
- [ ] Purchase history and correction workflow

**Acceptance criteria**

- Receiving inventory increases stock correctly.
- Weighted-average cost remains exact.
- Corrections use reversing or adjustment records instead of rewriting history.

## 5. Basic checkout

- [ ] Product and barcode search
- [ ] Cart, quantity changes, and decimal quantities
- [ ] Cash payment and change calculation
- [ ] Completed sale, receipt number, and receipt preview
- [ ] Hold and resume cart
- [ ] Command idempotency

**Acceptance criteria**

- A cashier can complete a sale without internet.
- Sale totals equal their lines and stock decreases exactly once.
- Retrying a command cannot duplicate a sale or payment.

## 6. Cashier shifts

- [ ] Open shift and opening float
- [ ] Cash-in and cash-out movements
- [ ] Expected and counted cash
- [ ] Shift close, variance, and shift report

**Acceptance criteria**

- Expected cash is calculated from immutable movements.
- A cashier can reconcile and close the shift.
- Variances remain in the audit trail.

## 7. Local reports

- [ ] Daily sales and payment totals
- [ ] Sales by product and cashier
- [ ] Inventory quantity and valuation
- [ ] Gross profit and shift reconciliation
- [ ] CSV and Excel exports

**Acceptance criteria**

- Reports reconcile with sales, payments, and inventory ledgers.
- Exports match on-screen totals and remain available offline.

## 8. Offline persistence

- [ ] IndexedDB for the PWA and SQLite for desktop
- [ ] Atomic local transactions and restart recovery
- [ ] Persistent carts and database upgrades
- [ ] Storage-failure handling and offline status

**Acceptance criteria**

- Receiving, selling, restarting, and shift reconciliation work without data loss or internet.
- Database upgrades preserve existing records.

## 9. Backup and recovery

- [ ] Encrypted backups and integrity validation
- [ ] Scheduled retention
- [ ] Clean-device restore and pre-restore safety backup
- [ ] Wrong-password and corruption handling
- [ ] Recovery documentation

**Acceptance criteria**

- A clean installation can restore a verified backup.
- Invalid backups cannot modify current data.
- Passwords and recovery keys are never stored as plaintext.

## 10. Historical archives

- [ ] Encrypted archives and closed-period eligibility
- [ ] Read-only viewer and search
- [ ] Archive catalogue, record counts, and control totals
- [ ] Independent-copy confirmations

**Acceptance criteria**

- Archive totals match source records and corrupted files are rejected.
- Archived records remain searchable and read-only.

## 11. Returns and refunds

- [ ] Full and partial returns
- [ ] Refunds and exchanges
- [ ] Reasons and manager approval
- [ ] Inventory reversal and refund receipt

**Acceptance criteria**

- Returns cannot exceed the original eligible quantity or amount.
- Original sales remain unchanged; refunds and reversals are append-only.

## 12. Customer credit and debt

- [ ] Customer profiles, credit limits, and credit sales
- [ ] Customer ledger and partial repayments
- [ ] Statements, due dates, and balance reports

**Acceptance criteria**

- Customer balances equal their ledger-entry sums.
- Payments cannot be applied twice and credit limits are enforced.

## 13. Purchasing and supplier accounts

- [ ] Purchase orders and partial receiving
- [ ] Supplier invoices, ledger, payments, and returns
- [ ] Accounts payable, cost history, and reorder suggestions

**Acceptance criteria**

- Orders reconcile with received quantities.
- Supplier balances equal their ledger entries.

## 14. Expenses and cash management

- [ ] Expense categories and expense recording
- [ ] Petty cash, deposits, and withdrawals
- [ ] Supporting documents and approval rules
- [ ] Expense reports and cash-flow summary

**Acceptance criteria**

- Every cash movement records its source, actor, timestamp, and reason.
- Posted expenses cannot be silently changed.

## 15. Stock operations

- [ ] Stock counts and reconciliation
- [ ] Adjustments with mandatory reasons
- [ ] Branch transfers
- [ ] Damaged, lost, and expired stock
- [ ] Reorder levels and low-stock warnings
- [ ] Batch and expiry tracking

**Acceptance criteria**

- Stock projection equals the movement-ledger sum.
- Transfers cannot create or destroy stock.

## 16. Cloud API and synchronization

- [ ] Versioned HTTP API and canonical OpenAPI specification
- [ ] Device activation
- [ ] Local outbox, inbox, idempotency, and opaque cursors
- [ ] Bounded batches, retries, and checksums
- [ ] Conflict records and manager diagnostics
- [ ] No-sync and PostgreSQL providers

**Acceptance criteria**

- Two offline devices reconnect and converge.
- Duplicate events cannot duplicate financial or stock effects.
- Clients never connect directly to PostgreSQL.

## 17. Multi-branch management

- [ ] Multiple branches and branch-specific access
- [ ] Branch pricing and inventory
- [ ] Transfers and consolidated reports
- [ ] Device management and remote revocation

**Acceptance criteria**

- Tenant and branch data remain isolated.
- Branch totals reconcile with consolidated reports.

## 18. Hardware integration

- [ ] Barcode scanners and receipt printers
- [ ] Cash drawers and customer displays
- [ ] Weighing scales and label printers
- [ ] Card terminals
- [ ] Simulators and diagnostics

**Acceptance criteria**

- Checkout continues when optional hardware is unavailable.
- Integrations pass simulator and physical-device tests.

## 19. Advanced pricing and loyalty

- [ ] Discounts, promotions, and scheduled prices
- [ ] Customer-group and wholesale pricing
- [ ] Bundles and modifiers
- [ ] Loyalty points, rewards, and gift cards

**Acceptance criteria**

- Pricing is deterministic and explainable.
- Applied rules are recorded and cannot be applied twice.

## 20. Production readiness

- [ ] Accessibility and localization review
- [ ] Performance and low-spec-device testing
- [ ] Security, dependency, and recovery audits
- [ ] Desktop installers and mobile packaging
- [ ] Monitoring, legal documents, and support procedures

**Acceptance criteria**

- All automated gates and recovery drills pass.
- Supported platforms and limitations are documented.
- Production readiness is claimed only after operational and physical-device verification.
