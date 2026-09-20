import { useState, type FormEvent } from 'react'
import {
  calculateBaseQuantity,
  createStockReceipt,
} from '../../core/inventory/stock'
import { categoryRepository } from '../../core/inventory/categoryRepository'
import { resolveSku } from '../../core/inventory/sku'
import { buildVariantCombinations } from '../../core/inventory/variants'
import { stockMovementRepository } from '../../core/inventory/stockRepository'
import type {
  InventoryProduct,
  StockMovement,
} from '../../core/inventory/types'
import { getUnitSymbol, units } from '../../core/inventory/units'
import { normalizeDecimal } from '../../core/inventory/decimal'
import type { MessageKey } from '../../shared/i18n/messages'
import { usePreferences } from '../../shared/preferences/preferencesContext'
import './AddStock.css'

const unitKey = (id: string) => `unit.${id}` as MessageKey
const NEW_CATEGORY = '__new__'
type EditDraft = {
  name: string
  sku: string
  categoryId: string
  quantity: string
  unitCost: string
  sellingPrice: string
}

export default function AddStock() {
  const { t } = usePreferences()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(
    null,
  )
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
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
  const [baseUnitId, setBaseUnitId] = useState('piece')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [note, setNote] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categories, setCategories] = useState(() => [
    ...categoryRepository.list(),
  ])
  const [message, setMessage] = useState('')
  const [movements, setMovements] = useState<StockMovement[]>(() => [
    ...stockMovementRepository.list(),
  ])
  const combinations = buildVariantCombinations(
    optionGroups.map((group) => ({
      ...group,
      values: group.values,
    })),
  )

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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      if (!hasVariants) {
        calculateBaseQuantity(unitCost, '1')
        calculateBaseQuantity(sellingPrice, '1')
      }
      const selectedCategory =
        categoryId === NEW_CATEGORY && newCategoryName.trim()
          ? categoryRepository.create(newCategoryName)
          : categories.find((category) => category.id === categoryId)
      if (
        selectedCategory &&
        !categories.some(({ id }) => id === selectedCategory.id)
      )
        setCategories((current) => [...current, selectedCategory])
      const entries = hasVariants
        ? combinations.map((combination) => ({
            combination,
            ...variantEntries[combination.key],
          }))
        : [{ combination: undefined, sku, quantity, unitCost, sellingPrice }]
      if (!entries.length) throw new Error('QUANTITY_REQUIRED')
      const usedSkus = movements.flatMap(({ productSku }) =>
        productSku ? [productSku] : [],
      )
      const created = entries.map((entry) => {
        const entryUnitCost = entry.unitCost ?? ''
        const entrySellingPrice = entry.sellingPrice ?? ''
        calculateBaseQuantity(entryUnitCost, '1')
        calculateBaseQuantity(entrySellingPrice, '1')
        const productId = crypto.randomUUID()
        const resolvedSku = resolveSku(entry.sku ?? '', usedSkus)
        usedSkus.push(resolvedSku)
        const product: InventoryProduct = {
          id: productId,
          name: name.trim(),
          sku: resolvedSku,
          sellingPrice: normalizeDecimal(entrySellingPrice),
          baseUnitId,
          ...(entry.combination
            ? {
                variantName: entry.combination.label,
                variantOptions: entry.combination.options,
              }
            : {}),
          ...(selectedCategory
            ? {
                categoryId: selectedCategory.id,
                categoryName: selectedCategory.name,
              }
            : {}),
          quantityPrecision: 6,
          productUnits: [
            {
              id: `${productId}-stock`,
              productId,
              unitId: baseUnitId,
              baseQuantity: '1',
              canPurchase: true,
              canSell: true,
            },
          ],
        }
        return createStockReceipt({
          product,
          productUnitId: `${productId}-stock`,
          enteredQuantity: entry.quantity ?? '',
          occurredAt: new Date().toISOString(),
          unitCost: entryUnitCost,
          ...(note ? { note } : {}),
        })
      })
      created.forEach((movement) => stockMovementRepository.add(movement))
      setMovements((current) => [...created, ...current])
      setMessage(
        hasVariants
          ? t('stock.variantsSaved', { count: created.length.toString() })
          : t('stock.saved', {
              quantity: created[0]?.baseQuantity ?? '0',
              unit: getUnitSymbol(baseUnitId),
            }),
      )
      setName('')
      setSku('')
      setQuantity('')
      setVariantEntries({})
      setUnitCost('')
      setSellingPrice('')
      setNote('')
      setNewCategoryName('')
      setIsDialogOpen(false)
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === 'SKU_TAKEN'
          ? t('stock.skuTaken')
          : t('stock.invalid'),
      )
    }
  }

  function startEdit(movement: StockMovement) {
    setMessage('')
    setEditingMovement(movement)
    setEditDraft({
      name: movement.productName,
      sku: movement.productSku,
      categoryId: movement.categoryId ?? '',
      quantity: movement.enteredQuantity,
      unitCost: movement.unitCost ?? '',
      sellingPrice: movement.sellingPrice ?? '',
    })
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingMovement || !editDraft) return
    try {
      const baseQuantity = calculateBaseQuantity(
        editDraft.quantity,
        editingMovement.conversionToBase,
      )
      calculateBaseQuantity(editDraft.unitCost, '1')
      calculateBaseQuantity(editDraft.sellingPrice, '1')
      const usedSkus = movements
        .filter(({ id }) => id !== editingMovement.id)
        .map(({ productSku }) => productSku)
      const productSku = resolveSku(editDraft.sku, usedSkus)
      const category = categories.find(({ id }) => id === editDraft.categoryId)
      const updated: StockMovement = {
        ...editingMovement,
        productName: editDraft.name.trim(),
        productSku,
        baseQuantity,
        enteredQuantity: normalizeDecimal(editDraft.quantity),
        unitCost: normalizeDecimal(editDraft.unitCost),
        sellingPrice: normalizeDecimal(editDraft.sellingPrice),
        ...(category
          ? { categoryId: category.id, categoryName: category.name }
          : {}),
      }
      if (!category) {
        delete updated.categoryId
        delete updated.categoryName
      }
      stockMovementRepository.update(updated)
      setMovements((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setEditingMovement(null)
      setEditDraft(null)
      setMessage(t('inventory.updated'))
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === 'SKU_TAKEN'
          ? t('stock.skuTaken')
          : t('stock.invalid'),
      )
    }
  }

  return (
    <section className="stock-page">
      <div className="stock-title">
        <h1>{t('inventory.title')}</h1>
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
      </div>
      {message && (
        <div className="form-message inventory-message" role="status">
          {message}
        </div>
      )}
      {movements.length === 0 ? (
        <div className="panel inventory-empty">{t('inventory.empty')}</div>
      ) : (
        <section className="panel product-list">
          <div className="product-list__head">
            <span>{t('stock.product')}</span>
            <span>{t('stock.sku')}</span>
            <span>{t('category.label')}</span>
            <span>{t('stock.quantity')}</span>
            <span>{t('stock.cost')}</span>
            <span>{t('stock.sellingPrice')}</span>
            <span>{t('inventory.actions')}</span>
          </div>
          {movements.map((movement) => (
            <div className="product-list__row" key={movement.id}>
              <strong>
                {movement.productName}
                {movement.variantName ? ` · ${movement.variantName}` : ''}
              </strong>
              <span>{movement.productSku}</span>
              <select
                className="receipt-category"
                value={movement.categoryId ?? ''}
                onChange={(event) => {
                  const nextId = event.target.value
                  const category = categories.find(({ id }) => id === nextId)
                  stockMovementRepository.assignCategory(
                    movement.id,
                    category?.id,
                    category?.name,
                  )
                  setMovements((current) =>
                    current.map((item) => {
                      if (item.id !== movement.id) return item
                      if (category)
                        return {
                          ...item,
                          categoryId: category.id,
                          categoryName: category.name,
                        }
                      const updated = { ...item }
                      delete updated.categoryId
                      delete updated.categoryName
                      return updated
                    }),
                  )
                }}
                aria-label={t('category.label')}
              >
                <option value="">{t('category.none')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <span>
                {movement.baseQuantity} {getUnitSymbol(movement.baseUnitId)}
              </span>
              <span>{movement.unitCost ?? '—'}</span>
              <span>{movement.sellingPrice ?? '—'}</span>
              <div className="product-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => startEdit(movement)}
                >
                  {t('inventory.edit')}
                </button>
                <button
                  type="button"
                  className="text-button delete-button"
                  onClick={() => {
                    if (
                      !window.confirm(
                        t('inventory.deleteConfirm', {
                          product: movement.variantName
                            ? `${movement.productName} · ${movement.variantName}`
                            : movement.productName,
                        }),
                      )
                    )
                      return
                    stockMovementRepository.remove(movement.id)
                    setMovements((current) =>
                      current.filter(({ id }) => id !== movement.id),
                    )
                    setMessage(t('inventory.deleted'))
                  }}
                >
                  {t('inventory.delete')}
                </button>
              </div>
            </div>
          ))}
        </section>
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
            <div className="stock-layout">
              <form className="stock-form" onSubmit={submit}>
                <div className="field-row">
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
                </div>
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
                                current.filter((item) => item.id !== group.id),
                              )
                            }
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {optionGroups.length < 3 && (
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
                    )}
                  </div>
                )}
                <div className="field-row">
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
                </div>
                <div className="field-row">
                  <label className="field">
                    <span>{t('stock.unit')}</span>
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
                </div>
                {!hasVariants && (
                  <>
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
                    </div>
                  </>
                )}
                {hasVariants && combinations.length > 0 && (
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
                    {combinations.map((combination) => (
                      <div className="variant-table__row" key={combination.key}>
                        <strong>{combination.label}</strong>
                        <input
                          value={variantEntries[combination.key]?.sku ?? ''}
                          onChange={(event) =>
                            setVariantEntries((current) => ({
                              ...current,
                              [combination.key]: {
                                ...current[combination.key],
                                sku: event.target.value,
                                quantity:
                                  current[combination.key]?.quantity ?? '',
                                unitCost:
                                  current[combination.key]?.unitCost ?? '',
                                sellingPrice:
                                  current[combination.key]?.sellingPrice ?? '',
                              },
                            }))
                          }
                        />
                        <input
                          required
                          inputMode="decimal"
                          value={
                            variantEntries[combination.key]?.quantity ?? ''
                          }
                          onChange={(event) =>
                            setVariantEntries((current) => ({
                              ...current,
                              [combination.key]: {
                                ...current[combination.key],
                                sku: current[combination.key]?.sku ?? '',
                                quantity: event.target.value,
                                unitCost:
                                  current[combination.key]?.unitCost ?? '',
                                sellingPrice:
                                  current[combination.key]?.sellingPrice ?? '',
                              },
                            }))
                          }
                        />
                        <input
                          required
                          inputMode="decimal"
                          value={
                            variantEntries[combination.key]?.unitCost ?? ''
                          }
                          onChange={(event) =>
                            setVariantEntries((current) => ({
                              ...current,
                              [combination.key]: {
                                ...current[combination.key],
                                sku: current[combination.key]?.sku ?? '',
                                quantity:
                                  current[combination.key]?.quantity ?? '',
                                unitCost: event.target.value,
                                sellingPrice:
                                  current[combination.key]?.sellingPrice ?? '',
                              },
                            }))
                          }
                        />
                        <input
                          required
                          inputMode="decimal"
                          value={
                            variantEntries[combination.key]?.sellingPrice ?? ''
                          }
                          onChange={(event) =>
                            setVariantEntries((current) => ({
                              ...current,
                              [combination.key]: {
                                ...current[combination.key],
                                sku: current[combination.key]?.sku ?? '',
                                quantity:
                                  current[combination.key]?.quantity ?? '',
                                unitCost:
                                  current[combination.key]?.unitCost ?? '',
                                sellingPrice: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
                {!hasVariants && (
                  <div className="field-row">
                    <label className="field">
                      <span>
                        {t('stock.costPerUnit', {
                          unit: t(unitKey(baseUnitId)).toLocaleLowerCase(),
                        })}
                      </span>
                      <input
                        required
                        inputMode="decimal"
                        value={unitCost}
                        onChange={(event) => setUnitCost(event.target.value)}
                      />
                    </label>
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
                {message && (
                  <div className="form-message" role="status">
                    {message}
                  </div>
                )}
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
            </div>
          </section>
        </div>
      )}
      {editingMovement && editDraft && (
        <div
          className="stock-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditingMovement(null)
              setEditDraft(null)
            }
          }}
        >
          <section
            className="stock-dialog stock-dialog--edit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
          >
            <div className="stock-dialog__header">
              <h2 id="edit-product-title">{t('inventory.editTitle')}</h2>
              <button
                type="button"
                className="dialog-close"
                aria-label={t('stock.close')}
                onClick={() => {
                  setEditingMovement(null)
                  setEditDraft(null)
                }}
              >
                ×
              </button>
            </div>
            <form className="stock-form" onSubmit={submitEdit}>
              <label className="field">
                <span>{t('stock.productName')}</span>
                <input
                  required
                  value={editDraft.name}
                  onChange={(event) =>
                    setEditDraft({ ...editDraft, name: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>
                  {t('stock.sku')} <i>{t('stock.optional')}</i>
                </span>
                <input
                  value={editDraft.sku}
                  onChange={(event) =>
                    setEditDraft({ ...editDraft, sku: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>{t('category.label')}</span>
                <select
                  value={editDraft.categoryId}
                  onChange={(event) =>
                    setEditDraft({
                      ...editDraft,
                      categoryId: event.target.value,
                    })
                  }
                >
                  <option value="">{t('category.none')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t('stock.quantity')}</span>
                <input
                  required
                  inputMode="decimal"
                  value={editDraft.quantity}
                  onChange={(event) =>
                    setEditDraft({ ...editDraft, quantity: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>{t('stock.cost')}</span>
                <input
                  required
                  inputMode="decimal"
                  value={editDraft.unitCost}
                  onChange={(event) =>
                    setEditDraft({ ...editDraft, unitCost: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>{t('stock.sellingPrice')}</span>
                <input
                  required
                  inputMode="decimal"
                  value={editDraft.sellingPrice}
                  onChange={(event) =>
                    setEditDraft({
                      ...editDraft,
                      sellingPrice: event.target.value,
                    })
                  }
                />
              </label>
              {message && (
                <div className="form-message" role="status">
                  {message}
                </div>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingMovement(null)
                    setEditDraft(null)
                  }}
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
    </section>
  )
}
