import { useState, type FormEvent } from 'react'
import { createStockReceipt } from '../../core/inventory/stock'
import { stockMovementRepository } from '../../core/inventory/stockRepository'
import type {
  InventoryProduct,
  StockMovement,
} from '../../core/inventory/types'
import { getUnitSymbol, units } from '../../core/inventory/units'
import type { MessageKey } from '../../shared/i18n/messages'
import { usePreferences } from '../../shared/preferences/preferencesContext'
import './AddStock.css'

const locations = [
  { id: 'main-store', nameKey: 'stock.mainStore' as MessageKey },
  { id: 'warehouse-1', nameKey: 'stock.warehouse1' as MessageKey },
]
const unitKey = (id: string) => `unit.${id}` as MessageKey

export default function AddStock() {
  const { t } = usePreferences()
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [baseUnitId, setBaseUnitId] = useState('piece')
  const [purchaseUnitId, setPurchaseUnitId] = useState('piece')
  const [conversion, setConversion] = useState('1')
  const [quantity, setQuantity] = useState('')
  const [locationId, setLocationId] = useState('main-store')
  const [unitCost, setUnitCost] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [movements, setMovements] = useState<StockMovement[]>(() => [
    ...stockMovementRepository.list(),
  ])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const productId = crypto.randomUUID()
      const product: InventoryProduct = {
        id: productId,
        name: name.trim(),
        sku: sku.trim(),
        baseUnitId,
        quantityPrecision: 6,
        productUnits: [
          {
            id: `${productId}-purchase`,
            productId,
            unitId: purchaseUnitId,
            baseQuantity: conversion,
            canPurchase: true,
            canSell: true,
          },
        ],
      }
      const movement = createStockReceipt({
        product,
        productUnitId: `${productId}-purchase`,
        enteredQuantity: quantity,
        locationId,
        occurredAt: new Date().toISOString(),
        ...(unitCost ? { unitCost } : {}),
        ...(reference ? { reference } : {}),
        ...(note ? { note } : {}),
      })
      stockMovementRepository.add(movement)
      setMovements((current) => [movement, ...current])
      setMessage(
        t('stock.saved', {
          quantity: movement.baseQuantity,
          unit: getUnitSymbol(baseUnitId),
        }),
      )
      setName('')
      setSku('')
      setQuantity('')
      setUnitCost('')
      setReference('')
      setNote('')
    } catch {
      setMessage(t('stock.invalid'))
    }
  }

  return (
    <section className="stock-page">
      <div className="stock-title">
        <h1>{t('stock.title')}</h1>
      </div>
      <div className="stock-layout">
        <form className="stock-form panel" onSubmit={submit}>
          <div className="field-row">
            <label className="field">
              <span>{t('stock.productName')}</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="field">
              <span>{t('stock.sku')}</span>
              <input
                required
                value={sku}
                onChange={(event) => setSku(event.target.value)}
              />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>{t('stock.baseUnit')}</span>
              <select
                value={baseUnitId}
                onChange={(event) => setBaseUnitId(event.target.value)}
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {t(unitKey(unit.id))}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t('stock.purchaseUnit')}</span>
              <select
                value={purchaseUnitId}
                onChange={(event) => setPurchaseUnitId(event.target.value)}
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {t(unitKey(unit.id))}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>{t('stock.quantity')}</span>
              <input
                required
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>
            <label className="field">
              <span>{t('stock.conversionHelp')}</span>
              <input
                required
                inputMode="decimal"
                value={conversion}
                onChange={(event) => setConversion(event.target.value)}
              />
            </label>
          </div>
          <div className="conversion-preview">
            <span>{t('stock.storedAs')}</span>
            <strong>
              {quantity || '0'} × {conversion} {getUnitSymbol(baseUnitId)}
            </strong>
          </div>
          <div className="field-row">
            <label className="field">
              <span>{t('stock.location')}</span>
              <select
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {t(location.nameKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>
                {t('stock.unitCost')} <i>{t('stock.optional')}</i>
              </span>
              <input
                inputMode="decimal"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
              />
            </label>
          </div>
          <label className="field field--wide">
            <span>
              {t('stock.reference')} <i>{t('stock.optional')}</i>
            </span>
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder={t('stock.referencePlaceholder')}
            />
          </label>
          <label className="field field--wide">
            <span>
              {t('stock.note')} <i>{t('stock.optional')}</i>
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t('stock.notePlaceholder')}
            />
          </label>
          {message && (
            <div className="form-message" role="status">
              {message}
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="secondary-button">
              {t('stock.cancel')}
            </button>
            <button type="submit" className="primary-button">
              {t('stock.submit')}
            </button>
          </div>
        </form>
        <aside className="stock-summary panel">
          <h2>{t('stock.summary')}</h2>
          <dl>
            <div>
              <dt>{t('stock.baseUnit')}</dt>
              <dd>{t(unitKey(baseUnitId))}</dd>
            </div>
            <div>
              <dt>{t('stock.purchaseUnit')}</dt>
              <dd>{t(unitKey(purchaseUnitId))}</dd>
            </div>
            <div>
              <dt>{t('stock.conversion')}</dt>
              <dd>
                1 {getUnitSymbol(purchaseUnitId)} = {conversion}{' '}
                {getUnitSymbol(baseUnitId)}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
      {movements.length > 0 && (
        <section className="panel receipt-list">
          <div className="panel-heading">
            <h2>{t('stock.recent')}</h2>
          </div>
          {movements.map((movement) => (
            <div className="receipt" key={movement.id}>
              <span>
                <strong>{movement.productName}</strong>
                <small>
                  {movement.enteredQuantity}{' '}
                  {getUnitSymbol(movement.enteredUnitId)}
                </small>
              </span>
              <b>
                +{movement.baseQuantity} {getUnitSymbol(movement.baseUnitId)}
              </b>
            </div>
          ))}
        </section>
      )}
    </section>
  )
}
