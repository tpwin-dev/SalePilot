import { useEffect, useRef, useState, type FormEvent } from 'react'
import { categoryRepository } from '../../core/inventory/categoryRepository'
import {
  addDecimals,
  compareDecimal,
  negateDecimal,
  normalizeDecimal,
} from '../../core/inventory/decimal'
import { productRepository } from '../../core/inventory/productRepository'
import {
  commitInventoryAdd,
  commitProductDelete,
  commitInventoryUpdate,
} from '../../core/inventory/inventoryStore'
import { resolveSku } from '../../core/inventory/sku'
import { buildVariantCombinations } from '../../core/inventory/variants'
import {
  calculateStockOnHand,
  calculateWeightedAverageCost,
  createStockReceipt,
} from '../../core/inventory/stock'
import { stockMovementRepository } from '../../core/inventory/stockRepository'
import type {
  InventoryProduct,
  ProductUnit,
  StockMovement,
} from '../../core/inventory/types'
import { getUnitSymbol, units } from '../../core/inventory/units'
import type { MessageKey } from '../../shared/i18n/messages'
import { usePreferences } from '../../shared/preferences/preferencesContext'
import ConfirmDialog from '../../shared/ui/ConfirmDialog'
import './AddStock.css'

const NEW_PRODUCT = '__new__'
const NEW_CATEGORY = '__new_category__'
const CUSTOM_UNIT = '__custom_unit__'
const unitKey = (id: string) => `unit.${id}` as MessageKey

function productFromMovement(movement: StockMovement): InventoryProduct {
  return {
    id: movement.productId,
    name: movement.productName,
    sku: movement.productSku,
    ...(movement.sellingPrice ? { sellingPrice: movement.sellingPrice } : {}),
    baseUnitId: movement.baseUnitId,
    ...(movement.categoryId ? { categoryId: movement.categoryId } : {}),
    ...(movement.categoryName ? { categoryName: movement.categoryName } : {}),
    ...(movement.variantName ? { variantName: movement.variantName } : {}),
    ...(movement.variantOptions
      ? { variantOptions: movement.variantOptions }
      : {}),
    quantityPrecision: 6,
    productUnits: [
      {
        id: `${movement.productId}-base`,
        productId: movement.productId,
        unitId: movement.baseUnitId,
        baseQuantity: '1',
        canPurchase: true,
        canSell: true,
      },
    ],
  }
}

function loadProducts(movements: readonly StockMovement[]) {
  const stored = [...productRepository.list()]
  const known = new Set(stored.map(({ id }) => id))
  const migrated = movements
    .filter(({ productId }) => !known.has(productId))
    .filter(
      (movement, index, all) =>
        all.findIndex(({ productId }) => productId === movement.productId) ===
        index,
    )
    .map(productFromMovement)
  if (migrated.length) productRepository.saveMany(migrated)
  return [...stored, ...migrated]
}

export default function AddStock() {
  const { t } = usePreferences()
  const [movements, setMovements] = useState<StockMovement[]>(() => [
    ...stockMovementRepository.list(),
  ])
  const [products, setProducts] = useState<InventoryProduct[]>(() =>
    loadProducts(stockMovementRepository.list()),
  )
  const [categories, setCategories] = useState(() => [
    ...categoryRepository.list(),
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(NEW_PRODUCT)
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [baseUnitId, setBaseUnitId] = useState('piece')
  const [purchaseUnitId, setPurchaseUnitId] = useState('piece')
  const [customUnitName, setCustomUnitName] = useState('')
  const [conversion, setConversion] = useState('1')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [note, setNote] = useState('')
  const [hasVariants, setHasVariants] = useState(false)
  const [optionGroups, setOptionGroups] = useState([
    {
      id: crypto.randomUUID(),
      name: '',
      values: [] as string[],
      nextValue: '',
    },
  ])
  const [variantEntries, setVariantEntries] = useState<
    Record<
      string,
      { sku: string; quantity: string; unitCost: string; sellingPrice: string }
    >
  >({})
  const [message, setMessage] = useState('')
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(
    null,
  )
  const [editQuantity, setEditQuantity] = useState('')
  const [editRemark, setEditRemark] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [pendingProductAction, setPendingProductAction] = useState<{
    product: InventoryProduct
    action: 'archive' | 'delete'
  } | null>(null)
  const firstInputRef = useRef<HTMLSelectElement>(null)

  const archivedCount = products.filter(({ archivedAt }) => archivedAt).length
  const visibleProducts = products.filter(({ archivedAt }) =>
    showArchived ? Boolean(archivedAt) : !archivedAt,
  )
  const productGroups = visibleProducts.reduce<InventoryProduct[][]>(
    (groups, product) => {
      const key =
        product.familyId ??
        `${product.name.toLocaleLowerCase()}::${product.categoryId ?? ''}`
      const group = groups.find((items) => {
        const first = items[0]
        return (
          first &&
          (first.familyId ??
            `${first.name.toLocaleLowerCase()}::${first.categoryId ?? ''}`) ===
            key
        )
      })
      if (group) group.push(product)
      else groups.push([product])
      return groups
    },
    [],
  )
  const selectedProduct = products.find(({ id }) => id === selectedProductId)
  const selectedUnit = selectedProduct?.productUnits.find(
    ({ id }) => id === selectedUnitId,
  )
  const combinations = buildVariantCombinations(optionGroups)

  useEffect(() => {
    if (!isDialogOpen) return
    firstInputRef.current?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDialogOpen(false)
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [isDialogOpen])

  function resetForm() {
    setSelectedProductId(NEW_PRODUCT)
    setSelectedUnitId('')
    setName('')
    setSku('')
    setCategoryId('')
    setNewCategoryName('')
    setBaseUnitId('piece')
    setPurchaseUnitId('piece')
    setCustomUnitName('')
    setConversion('1')
    setQuantity('')
    setUnitCost('')
    setSellingPrice('')
    setNote('')
    setHasVariants(false)
    setOptionGroups([
      { id: crypto.randomUUID(), name: '', values: [], nextValue: '' },
    ])
    setVariantEntries({})
  }

  function addChoice(groupId: string) {
    setOptionGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId || !group.nextValue.trim()) return group
        const value = group.nextValue.trim()
        return {
          ...group,
          values: group.values.includes(value)
            ? group.values
            : [...group.values, value],
          nextValue: '',
        }
      }),
    )
  }

  function updateVariantEntry(
    key: string,
    field: 'sku' | 'quantity' | 'unitCost' | 'sellingPrice',
    value: string,
  ) {
    setVariantEntries((current) => ({
      ...current,
      [key]: {
        sku: current[key]?.sku ?? '',
        quantity: current[key]?.quantity ?? '',
        unitCost: current[key]?.unitCost ?? '',
        sellingPrice: current[key]?.sellingPrice ?? '',
        [field]: value,
      },
    }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const occurredAt = new Date().toISOString()
      let createdProducts: InventoryProduct[] = []
      let receipts: StockMovement[] = []
      if (selectedProduct) {
        if (
          compareDecimal(quantity, '0') <= 0 ||
          compareDecimal(unitCost, '0') < 0
        )
          throw new Error('INVALID')
        const productUnit = selectedUnit ?? selectedProduct.productUnits[0]
        if (!productUnit) throw new Error('INVALID')
        receipts = [
          createStockReceipt({
            product: selectedProduct,
            productUnitId: productUnit.id,
            enteredQuantity: quantity,
            unitCost,
            note,
            occurredAt,
          }),
        ]
      } else {
        if (!name.trim() || compareDecimal(conversion, '0') <= 0)
          throw new Error('INVALID')
        if (purchaseUnitId === CUSTOM_UNIT && !customUnitName.trim())
          throw new Error('INVALID')
        if (categoryId === NEW_CATEGORY && !newCategoryName.trim())
          throw new Error('INVALID')
        if (
          hasVariants &&
          (!combinations.length ||
            optionGroups.some(
              (group) => !group.name.trim() || !group.values.length,
            ))
        )
          throw new Error('INVALID')
        const entries = hasVariants
          ? combinations.map((combination) => ({
              combination,
              ...variantEntries[combination.key],
            }))
          : [{ combination: undefined, sku, quantity, unitCost, sellingPrice }]
        for (const entry of entries) {
          if (
            compareDecimal(entry.quantity ?? '', '0') <= 0 ||
            compareDecimal(entry.unitCost ?? '', '0') < 0 ||
            compareDecimal(entry.sellingPrice ?? '', '0') < 0
          )
            throw new Error('INVALID')
        }
        const usedSkus = products.map(({ sku: productSku }) => productSku)
        const resolvedSkus = entries.map((entry) => {
          const resolved = resolveSku(entry.sku ?? '', usedSkus)
          usedSkus.push(resolved)
          return resolved
        })
        const selectedCategory =
          categoryId === NEW_CATEGORY
            ? undefined
            : categories.find(({ id }) => id === categoryId)
        const familyId = crypto.randomUUID()
        createdProducts = entries.map((entry, index) => {
          const id = crypto.randomUUID()
          const enteredUnitId =
            purchaseUnitId === CUSTOM_UNIT
              ? `custom:${customUnitName.trim().toLocaleLowerCase()}`
              : purchaseUnitId
          const productUnits: ProductUnit[] = [
            {
              id: `${id}-base`,
              productId: id,
              unitId: baseUnitId,
              baseQuantity: '1',
              canPurchase: true,
              canSell: true,
            },
          ]
          if (
            enteredUnitId !== baseUnitId ||
            normalizeDecimal(conversion) !== '1'
          )
            productUnits.push({
              id: `${id}-purchase`,
              productId: id,
              unitId: enteredUnitId,
              ...(purchaseUnitId === CUSTOM_UNIT
                ? { unitName: customUnitName.trim() }
                : {}),
              baseQuantity: normalizeDecimal(conversion),
              canPurchase: true,
              canSell: false,
            })
          return {
            id,
            familyId,
            name: name.trim(),
            sku: resolvedSkus[index] ?? '',
            sellingPrice: normalizeDecimal(entry.sellingPrice ?? ''),
            baseUnitId,
            ...(selectedCategory
              ? {
                  categoryId: selectedCategory.id,
                  categoryName: selectedCategory.name,
                }
              : {}),
            ...(entry.combination
              ? {
                  variantName: entry.combination.label,
                  variantOptions: entry.combination.options,
                }
              : {}),
            quantityPrecision: 6,
            productUnits,
          }
        })
        receipts = createdProducts.map((product, index) => {
          const purchaseUnit =
            product.productUnits.find(({ canSell }) => !canSell) ??
            product.productUnits[0]
          if (!purchaseUnit) throw new Error('INVALID')
          return createStockReceipt({
            product,
            productUnitId: purchaseUnit.id,
            enteredQuantity: entries[index]?.quantity ?? '',
            unitCost: entries[index]?.unitCost ?? '',
            note,
            occurredAt,
          })
        })
        if (categoryId === NEW_CATEGORY) {
          const category = categoryRepository.create(newCategoryName)
          createdProducts = createdProducts.map((product) => ({
            ...product,
            categoryId: category.id,
            categoryName: category.name,
          }))
          receipts = receipts.map((receipt) => ({
            ...receipt,
            categoryId: category.id,
            categoryName: category.name,
          }))
          if (!categories.some(({ id }) => id === category.id))
            setCategories((current) => [...current, category])
        }
      }
      if (createdProducts.length) commitInventoryAdd(createdProducts, receipts)
      else stockMovementRepository.addMany(receipts)
      if (createdProducts.length)
        setProducts((current) => [...current, ...createdProducts])
      setMovements((current) => [...receipts, ...current])
      setMessage(
        receipts.length > 1
          ? t('stock.variantsSaved', { count: receipts.length.toString() })
          : t('stock.saved', {
              quantity: receipts[0]?.baseQuantity ?? '0',
              unit: getUnitSymbol(receipts[0]?.baseUnitId ?? 'piece'),
            }),
      )
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === 'SKU_TAKEN'
          ? t('stock.skuTaken')
          : t('stock.invalid'),
      )
    }
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingProduct || !editingProduct.name.trim()) return
    try {
      if (
        compareDecimal(editQuantity, '0') < 0 ||
        compareDecimal(editingProduct.sellingPrice ?? '', '0') < 0
      )
        throw new Error('INVALID')
      const currentQuantity = calculateStockOnHand(editingProduct.id, movements)
      const quantityDifference = addDecimals(
        editQuantity,
        negateDecimal(currentQuantity),
      )
      const originalProduct = products.find(
        ({ id }) => id === editingProduct.id,
      )
      const priceChanged =
        normalizeDecimal(editingProduct.sellingPrice ?? '') !==
        normalizeDecimal(originalProduct?.sellingPrice ?? '0')
      if ((quantityDifference !== '0' || priceChanged) && !editRemark.trim())
        throw new Error('REMARK_REQUIRED')
      const updated = {
        ...editingProduct,
        name: editingProduct.name.trim(),
        sellingPrice: normalizeDecimal(editingProduct.sellingPrice ?? ''),
        ...(priceChanged
          ? {
              priceHistory: [
                ...(originalProduct?.priceHistory ?? []),
                {
                  previousPrice: originalProduct?.sellingPrice ?? '0',
                  nextPrice: normalizeDecimal(
                    editingProduct.sellingPrice ?? '',
                  ),
                  remark: editRemark.trim(),
                  occurredAt: new Date().toISOString(),
                },
              ],
            }
          : {}),
        sku: resolveSku(
          editingProduct.sku,
          products
            .filter(({ id }) => id !== editingProduct.id)
            .map(({ sku: value }) => value),
        ),
      }
      const adjustment: StockMovement | undefined =
        quantityDifference === '0'
          ? undefined
          : {
              id: crypto.randomUUID(),
              productId: updated.id,
              productName: updated.name,
              productSku: updated.sku,
              ...(updated.variantName
                ? { variantName: updated.variantName }
                : {}),
              ...(updated.variantOptions
                ? { variantOptions: updated.variantOptions }
                : {}),
              baseUnitId: updated.baseUnitId,
              ...(updated.categoryId ? { categoryId: updated.categoryId } : {}),
              ...(updated.categoryName
                ? { categoryName: updated.categoryName }
                : {}),
              type: 'adjustment',
              baseQuantity: quantityDifference,
              enteredQuantity: quantityDifference,
              enteredUnitId: updated.baseUnitId,
              conversionToBase: '1',
              occurredAt: new Date().toISOString(),
              correctionReason: editRemark.trim(),
              note: editRemark.trim(),
            }
      commitInventoryUpdate(updated, adjustment)
      setProducts((current) =>
        current.map((product) =>
          product.id === updated.id ? updated : product,
        ),
      )
      if (adjustment) setMovements((current) => [adjustment, ...current])
      setEditingProduct(null)
      setEditRemark('')
      setMessage(t('inventory.updated'))
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === 'REMARK_REQUIRED'
          ? t('stock.remarkRequired')
          : t('stock.invalid'),
      )
    }
  }

  function archiveProduct(product: InventoryProduct) {
    const updated = { ...product, archivedAt: new Date().toISOString() }
    commitInventoryUpdate(updated)
    setProducts((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    )
    setMessage(t('inventory.archived'))
  }

  function restoreProduct(product: InventoryProduct) {
    const updated = { ...product }
    delete updated.archivedAt
    commitInventoryUpdate(updated)
    setProducts((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    )
    setMessage(t('inventory.restored'))
  }

  function deleteProduct(product: InventoryProduct) {
    commitProductDelete(product.id)
    setProducts((current) => current.filter(({ id }) => id !== product.id))
    setMessage(t('inventory.deleted'))
  }

  return (
    <section className="stock-page">
      <div className="stock-title">
        <h1>{t('inventory.title')}</h1>
        <div className="stock-title__actions">
          {archivedCount > 0 && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowArchived((value) => !value)}
            >
              {showArchived
                ? t('inventory.showActive')
                : t('inventory.showArchived', {
                    count: archivedCount.toString(),
                  })}
            </button>
          )}
          {!showArchived && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setMessage('')
                setIsDialogOpen(true)
              }}
            >
              {t('stock.addAction')}
            </button>
          )}
        </div>
      </div>
      {message && (
        <div className="form-message inventory-message" role="status">
          {message}
        </div>
      )}
      {!productGroups.length ? (
        <div className="panel inventory-empty">{t('inventory.empty')}</div>
      ) : (
        <div className="panel inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>{t('variant.name')}</th>
                <th>{t('stock.sku')}</th>
                <th>{t('stock.onHand')}</th>
                <th>{t('stock.averageCost')}</th>
                <th>{t('stock.sellingPrice')}</th>
                <th>{t('inventory.actions')}</th>
              </tr>
            </thead>
            {productGroups.map((group) => {
              const first = group[0]
              if (!first) return null
              return (
                <tbody key={first.familyId ?? first.id}>
                  <tr className="product-table-group">
                    <th colSpan={6}>
                      <div className="product-table-group__content">
                        <div>
                          <strong>{first.name}</strong>
                          <span>
                            {first.categoryName ?? t('category.none')}
                          </span>
                        </div>
                        {group.length > 1 && (
                          <small>
                            {t('variant.count', {
                              count: group.length.toString(),
                            })}
                          </small>
                        )}
                      </div>
                    </th>
                  </tr>
                  {group.map((product) => {
                    const hasHistory = movements.some(
                      (movement) => movement.productId === product.id,
                    )
                    return (
                      <tr className="product-table-row" key={product.id}>
                        <td data-label={t('variant.name')}>
                          <strong>
                            {product.variantName ?? t('variant.standard')}
                          </strong>
                        </td>
                        <td data-label={t('stock.sku')}>{product.sku}</td>
                        <td data-label={t('stock.onHand')}>
                          {calculateStockOnHand(product.id, movements)}{' '}
                          {getUnitSymbol(product.baseUnitId)}
                        </td>
                        <td data-label={t('stock.averageCost')}>
                          {calculateWeightedAverageCost(
                            product.id,
                            movements,
                          ) ?? t('common.notAvailable')}
                        </td>
                        <td data-label={t('stock.sellingPrice')}>
                          {product.sellingPrice ?? t('common.notAvailable')}
                        </td>
                        <td>
                          <div className="product-actions">
                            <button
                              type="button"
                              className="product-action-button"
                              onClick={() => {
                                setEditingProduct(product)
                                setEditQuantity(
                                  calculateStockOnHand(product.id, movements),
                                )
                                setEditRemark('')
                              }}
                            >
                              {t('inventory.edit')}
                            </button>
                            {product.archivedAt ? (
                              <button
                                type="button"
                                className="product-action-button"
                                onClick={() => restoreProduct(product)}
                              >
                                {t('inventory.restore')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="product-action-button danger-text-button"
                                onClick={() =>
                                  setPendingProductAction({
                                    product,
                                    action: hasHistory ? 'archive' : 'delete',
                                  })
                                }
                              >
                                {hasHistory
                                  ? t('inventory.archive')
                                  : t('inventory.delete')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              )
            })}
          </table>
        </div>
      )}

      {isDialogOpen && (
        <div
          className="stock-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsDialogOpen(false)
          }}
        >
          <section
            className="stock-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-stock-title"
          >
            <div className="stock-dialog__header">
              <h2 id="add-stock-title">{t('stock.title')}</h2>
              <button
                type="button"
                className="dialog-close"
                aria-label={t('stock.close')}
                onClick={() => setIsDialogOpen(false)}
              >
                ×
              </button>
            </div>
            <form className="stock-form" onSubmit={submit}>
              <label className="field field--wide">
                <span>{t('stock.product')}</span>
                <select
                  ref={firstInputRef}
                  value={selectedProductId}
                  onChange={(event) => {
                    const productId = event.target.value
                    setSelectedProductId(productId)
                    setSelectedUnitId(
                      products.find(({ id }) => id === productId)
                        ?.productUnits[0]?.id ?? '',
                    )
                  }}
                >
                  <option value={NEW_PRODUCT}>{t('stock.newProduct')}</option>
                  {products
                    .filter(({ archivedAt }) => !archivedAt)
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.variantName ? ` · ${product.variantName}` : ''}
                      </option>
                    ))}
                </select>
              </label>
              {!selectedProduct && (
                <>
                  <label className="field">
                    <span>{t('stock.productName')}</span>
                    <input
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                  {!hasVariants && (
                    <label className="field">
                      <span>
                        {t('stock.sku')} <i>{t('stock.optional')}</i>
                      </span>
                      <input
                        value={sku}
                        onChange={(event) => setSku(event.target.value)}
                      />
                    </label>
                  )}
                  <label className="field">
                    <span>
                      {t('category.label')} <i>{t('stock.optional')}</i>
                    </span>
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                    >
                      <option value="">{t('category.none')}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                      <option value={NEW_CATEGORY}>
                        {t('category.create')}
                      </option>
                    </select>
                  </label>
                  {categoryId === NEW_CATEGORY && (
                    <label className="field">
                      <span>{t('category.name')}</span>
                      <input
                        required
                        value={newCategoryName}
                        onChange={(event) =>
                          setNewCategoryName(event.target.value)
                        }
                      />
                    </label>
                  )}
                  <label className="variant-toggle field--wide">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(event) => setHasVariants(event.target.checked)}
                    />
                    <span>{t('variant.hasVariants')}</span>
                    <small>{t('variant.example')}</small>
                  </label>
                  {hasVariants && (
                    <div className="variant-builder field--wide">
                      {optionGroups.map((group) => (
                        <div className="option-row" key={group.id}>
                          <label className="field">
                            <span>
                              {t('variant.option')}{' '}
                              <small>{t('variant.optionExample')}</small>
                            </span>
                            <input
                              value={group.name}
                              onChange={(event) =>
                                setOptionGroups((current) =>
                                  current.map((item) =>
                                    item.id === group.id
                                      ? { ...item, name: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>
                          <div className="choice-editor field">
                            <span>
                              {t('variant.choices')}{' '}
                              <small>{t('variant.choiceExample')}</small>
                            </span>
                            <div className="choice-list">
                              {group.values.map((value) => (
                                <span className="choice-chip" key={value}>
                                  {value}
                                  <button
                                    type="button"
                                    aria-label={t('variant.removeChoice')}
                                    onClick={() =>
                                      setOptionGroups((current) =>
                                        current.map((item) =>
                                          item.id === group.id
                                            ? {
                                                ...item,
                                                values: item.values.filter(
                                                  (choice) => choice !== value,
                                                ),
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="choice-input">
                              <input
                                value={group.nextValue}
                                onChange={(event) =>
                                  setOptionGroups((current) =>
                                    current.map((item) =>
                                      item.id === group.id
                                        ? {
                                            ...item,
                                            nextValue: event.target.value,
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault()
                                    addChoice(group.id)
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => addChoice(group.id)}
                              >
                                {t('variant.addChoice')}
                              </button>
                            </div>
                          </div>
                          {optionGroups.length > 1 && (
                            <button
                              type="button"
                              className="remove-option"
                              aria-label={t('variant.removeOption')}
                              onClick={() =>
                                setOptionGroups((current) =>
                                  current.filter(
                                    (item) => item.id !== group.id,
                                  ),
                                )
                              }
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="text-button add-option"
                        onClick={() =>
                          setOptionGroups((current) => [
                            ...current,
                            {
                              id: crypto.randomUUID(),
                              name: '',
                              values: [],
                              nextValue: '',
                            },
                          ])
                        }
                      >
                        {t('variant.addAnotherOption')}
                      </button>
                    </div>
                  )}
                  <label className="field">
                    <span>{t('stock.baseUnit')}</span>
                    <select
                      value={baseUnitId}
                      onChange={(event) => setBaseUnitId(event.target.value)}
                    >
                      {units
                        .filter(({ system }) => system !== 'CUSTOM')
                        .map((unit) => (
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
                      onChange={(event) =>
                        setPurchaseUnitId(event.target.value)
                      }
                    >
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {t(unitKey(unit.id))}
                        </option>
                      ))}
                      <option value={CUSTOM_UNIT}>{t('unit.custom')}</option>
                    </select>
                  </label>
                  {purchaseUnitId === CUSTOM_UNIT && (
                    <label className="field">
                      <span>{t('stock.customUnitName')}</span>
                      <input
                        required
                        value={customUnitName}
                        onChange={(event) =>
                          setCustomUnitName(event.target.value)
                        }
                      />
                    </label>
                  )}
                  <label className="field">
                    <span>{t('stock.conversionHelp')}</span>
                    <input
                      required
                      inputMode="decimal"
                      value={conversion}
                      onChange={(event) => setConversion(event.target.value)}
                    />
                  </label>
                  {!hasVariants && (
                    <label className="field">
                      <span>{t('stock.sellingPrice')}</span>
                      <input
                        required
                        inputMode="decimal"
                        value={sellingPrice}
                        onChange={(event) =>
                          setSellingPrice(event.target.value)
                        }
                      />
                    </label>
                  )}
                </>
              )}
              {selectedProduct && (
                <label className="field field--wide">
                  <span>{t('stock.purchaseUnit')}</span>
                  <select
                    value={
                      selectedUnitId || selectedProduct.productUnits[0]?.id
                    }
                    onChange={(event) => setSelectedUnitId(event.target.value)}
                  >
                    {selectedProduct.productUnits
                      .filter(({ canPurchase }) => canPurchase)
                      .map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.unitName ??
                            (unit.unitId.startsWith('custom:')
                              ? unit.unitId.slice(7)
                              : t(unitKey(unit.unitId)))}{' '}
                          ({unit.baseQuantity}{' '}
                          {t(unitKey(selectedProduct.baseUnitId))})
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {(selectedProduct || !hasVariants) && (
                <label className="field">
                  <span>{t('stock.quantity')}</span>
                  <input
                    required
                    inputMode="decimal"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </label>
              )}
              {(selectedProduct || !hasVariants) && (
                <label className="field">
                  <span>
                    {t('stock.costPerUnit', { unit: t('stock.purchaseUnit') })}
                  </span>
                  <input
                    required
                    inputMode="decimal"
                    value={unitCost}
                    onChange={(event) => setUnitCost(event.target.value)}
                  />
                </label>
              )}
              {!selectedProduct && hasVariants && combinations.length > 0 && (
                <div className="variant-table field--wide">
                  <div className="variant-table__head">
                    <span>{t('variant.name')}</span>
                    <span>
                      {t('stock.sku')} <small>{t('stock.optional')}</small>
                    </span>
                    <span>{t('variant.quantity')}</span>
                    <span>{t('stock.cost')}</span>
                    <span>{t('stock.sellingPrice')}</span>
                  </div>
                  {combinations.map((combination) => {
                    const entry = variantEntries[combination.key]
                    return (
                      <div className="variant-table__row" key={combination.key}>
                        <strong>{combination.label}</strong>
                        <input
                          aria-label={`${combination.label} ${t('stock.sku')}`}
                          value={entry?.sku ?? ''}
                          onChange={(event) =>
                            updateVariantEntry(
                              combination.key,
                              'sku',
                              event.target.value,
                            )
                          }
                        />
                        <input
                          required
                          aria-label={`${combination.label} ${t('stock.quantity')}`}
                          inputMode="decimal"
                          value={entry?.quantity ?? ''}
                          onChange={(event) =>
                            updateVariantEntry(
                              combination.key,
                              'quantity',
                              event.target.value,
                            )
                          }
                        />
                        <input
                          required
                          aria-label={`${combination.label} ${t('stock.cost')}`}
                          inputMode="decimal"
                          value={entry?.unitCost ?? ''}
                          onChange={(event) =>
                            updateVariantEntry(
                              combination.key,
                              'unitCost',
                              event.target.value,
                            )
                          }
                        />
                        <input
                          required
                          aria-label={`${combination.label} ${t('stock.sellingPrice')}`}
                          inputMode="decimal"
                          value={entry?.sellingPrice ?? ''}
                          onChange={(event) =>
                            updateVariantEntry(
                              combination.key,
                              'sellingPrice',
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              )}
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
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('stock.cancel')}
                </button>
                <button type="submit" className="primary-button">
                  {t('stock.submit')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editingProduct && (
        <div className="stock-dialog-backdrop">
          <section
            className="stock-dialog stock-dialog--edit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
          >
            <div className="stock-dialog__header">
              <h2 id="edit-product-title">{t('inventory.editTitle')}</h2>
            </div>
            <form className="stock-form" onSubmit={saveProduct}>
              <label className="field">
                <span>{t('stock.productName')}</span>
                <input
                  required
                  value={editingProduct.name}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: event.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>{t('stock.sku')}</span>
                <input
                  required
                  value={editingProduct.sku}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      sku: event.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>{t('stock.sellingPrice')}</span>
                <input
                  required
                  inputMode="decimal"
                  value={editingProduct.sellingPrice ?? ''}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      sellingPrice: event.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>{t('stock.targetQuantity')}</span>
                <input
                  required
                  inputMode="decimal"
                  value={editQuantity}
                  onChange={(event) => setEditQuantity(event.target.value)}
                />
              </label>
              <label className="field field--wide">
                <span>
                  {t('stock.remark')} <i>{t('stock.remarkHelp')}</i>
                </span>
                <textarea
                  value={editRemark}
                  onChange={(event) => setEditRemark(event.target.value)}
                  placeholder={t('stock.remarkPlaceholder')}
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingProduct(null)}
                >
                  {t('stock.cancel')}
                </button>
                <button type="submit" className="primary-button">
                  {t('inventory.save')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingProductAction)}
        title={
          pendingProductAction?.action === 'delete'
            ? t('inventory.deleteTitle')
            : t('inventory.archiveTitle')
        }
        message={
          pendingProductAction?.action === 'delete'
            ? t('inventory.deleteConfirm', {
                product: pendingProductAction?.product.name ?? '',
              })
            : t('inventory.archiveConfirm', {
                product: pendingProductAction?.product.name ?? '',
              })
        }
        confirmLabel={
          pendingProductAction?.action === 'delete'
            ? t('inventory.delete')
            : t('inventory.archive')
        }
        cancelLabel={t('stock.cancel')}
        destructive={pendingProductAction?.action === 'delete'}
        onCancel={() => setPendingProductAction(null)}
        onConfirm={() => {
          if (!pendingProductAction) return
          if (pendingProductAction.action === 'delete')
            deleteProduct(pendingProductAction.product)
          else archiveProduct(pendingProductAction.product)
          setPendingProductAction(null)
        }}
      />
    </section>
  )
}
