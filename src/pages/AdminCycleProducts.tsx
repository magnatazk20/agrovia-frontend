import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

type CycleProduct = {
  id: number
  name: string
  description: string
  imageUrl: string
  price: number
  redeemRewardValue: number
  cycleDays: number
  planType: 'normal' | 'vip' | 'vip_day'
  requireCommissionLevel1Count: number
  requireCommissionLevel2Count: number
  requireCommissionLevel3Count: number
  stockQuantity: number
  maxPurchasesPerUser: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string | null
  minAmount: number
  maxAmount: number
  profitPercent: number
}

type CommissionLevel = {
  id: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
}

type FormState = {
  name: string
  description: string
  imageUrl: string
  price: string
  redeemRewardValue: string
  cycleDays: string
  planType: 'normal' | 'vip' | 'vip_day'
  requireCommissionLevel1Count: string
  requireCommissionLevel2Count: string
  requireCommissionLevel3Count: string
  stockQuantity: string
  maxPurchasesPerUser: string
  expiresAt: string
  isActive: boolean
  minAmount: string
  maxAmount: string
  profitPercent: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const emptyForm: FormState = {
  name: '',
  description: '',
  imageUrl: '',
  price: '',
  redeemRewardValue: '',
  cycleDays: '0',
  planType: 'normal',
  requireCommissionLevel1Count: '0',
  requireCommissionLevel2Count: '0',
  requireCommissionLevel3Count: '0',
  stockQuantity: '0',
  maxPurchasesPerUser: '0',
  expiresAt: '',
  isActive: true,
  minAmount: '0',
  maxAmount: '0',
  profitPercent: '0',
}

export default function AdminCycleProducts() {
  const [products, setProducts] = useState<CycleProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const loadCommissionLevels = async () => {
    try {
      const res = await fetch(`${API_URL}/api/referral/commission-levels`)
      const data = await res.json() as {
        ok?: boolean
        levels?: Array<{
          id?: number
          level?: number
          name?: string
          commissionPercent?: number
          isActive?: boolean
        }>
      }

      if (!res.ok || !data?.ok || !Array.isArray(data?.levels)) {
        setCommissionLevels([])
        return
      }

      const mappedLevels: CommissionLevel[] = data.levels.map((item) => ({
        id: Number(item.id ?? 0),
        level: Number(item.level ?? 0),
        name: String(item.name ?? ''),
        commissionPercent: Number(item.commissionPercent ?? 0),
        isActive: Boolean(item.isActive),
      }))

      setCommissionLevels(mappedLevels)
    } catch {
      setCommissionLevels([])
    }
  }

  const loadProducts = async () => {
    if (!token) {
      setFeedback({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    setLoading(true)
    setFeedback(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/cycle-products`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json() as {
        ok?: boolean
        error?: string
        products?: Array<{
          id?: number
          name?: string
          description?: string
          imageUrl?: string
          price?: number
          redeemRewardValue?: number
          cycleDays?: number
          planType?: string
          requireCommissionLevel1Count?: number
          requireCommissionLevel2Count?: number
          requireCommissionLevel3Count?: number
          stockQuantity?: number
          maxPurchasesPerUser?: number
          expiresAt?: string | null
          isActive?: boolean
          createdAt?: string | null
        }>
      }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Erro ao carregar produtos.' })
        setProducts([])
        return
      }

      const normalizePlanType = (value: string): 'normal' | 'vip' | 'vip_day' =>
        value === 'vip' || value === 'vip_day' ? value : 'normal'

      const mapped: CycleProduct[] = Array.isArray(data.products)
        ? data.products.map((item) => ({
            id: Number(item.id ?? 0),
            name: String(item.name ?? ''),
            description: String(item.description ?? ''),
            imageUrl: String(item.imageUrl ?? ''),
            price: Number(item.price ?? 0),
            redeemRewardValue: Number(item.redeemRewardValue ?? 0),
            cycleDays: Number(item.cycleDays ?? 0),
            planType: normalizePlanType(String(item.planType ?? 'normal')),
            requireCommissionLevel1Count: Number(item.requireCommissionLevel1Count ?? 0),
            requireCommissionLevel2Count: Number(item.requireCommissionLevel2Count ?? 0),
            requireCommissionLevel3Count: Number(item.requireCommissionLevel3Count ?? 0),
            stockQuantity: Number(item.stockQuantity ?? 0),
            maxPurchasesPerUser: Number(item.maxPurchasesPerUser ?? 0),
            expiresAt: item.expiresAt ?? null,
            isActive: Boolean(item.isActive),
            createdAt: item.createdAt ?? null,
            minAmount: Number((item as any).minAmount ?? 0),
            maxAmount: Number((item as any).maxAmount ?? 0),
            profitPercent: Number((item as any).profitPercent ?? 0),
          }))
        : []

      setProducts(mapped)
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão ao carregar produtos.' })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    loadCommissionLevels()
  }, [])

  const fillEditForm = (product: CycleProduct) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: String(product.price),
      redeemRewardValue: String(product.redeemRewardValue),
      cycleDays: String(product.cycleDays ?? 0),
      planType: product.planType ?? 'normal',
      requireCommissionLevel1Count: String(product.requireCommissionLevel1Count ?? 0),
      requireCommissionLevel2Count: String(product.requireCommissionLevel2Count ?? 0),
      requireCommissionLevel3Count: String(product.requireCommissionLevel3Count ?? 0),
      stockQuantity: String(product.stockQuantity ?? 0),
      maxPurchasesPerUser: String(product.maxPurchasesPerUser ?? 0),
      expiresAt: product.expiresAt ? String(product.expiresAt).slice(0, 16) : '',
      isActive: product.isActive,
      minAmount: String(product.minAmount ?? 0),
      maxAmount: String(product.maxAmount ?? 0),
      profitPercent: String(product.profitPercent ?? 0),
    })
    setFeedback(null)
  }

  const handleSave = async () => {
    const normalizedName = form.name.trim()
    const normalizedDescription = form.description.trim()
    const normalizedImageUrl = form.imageUrl.trim()
    const numericPrice = Number(form.price.replace(',', '.'))
    const numericReward = Number(form.redeemRewardValue.replace(',', '.'))
    const numericCycleDays = Number(form.cycleDays.replace(',', '.'))
    const numericRequireLevel1 = Number(form.requireCommissionLevel1Count.replace(',', '.'))
    const numericRequireLevel2 = Number(form.requireCommissionLevel2Count.replace(',', '.'))
    const numericRequireLevel3 = Number(form.requireCommissionLevel3Count.replace(',', '.'))
    const numericStockQuantity = Number(form.stockQuantity.replace(',', '.'))
    const numericMaxPurchasesPerUser = Number(form.maxPurchasesPerUser.replace(',', '.'))
    const numericMinAmount = Number(form.minAmount.replace(',', '.'))
    const numericMaxAmount = Number(form.maxAmount.replace(',', '.'))
    const numericProfitPercent = Number(form.profitPercent.replace(',', '.'))

    if (!token) {
      setFeedback({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    if (!normalizedName) {
      setFeedback({ type: 'error', text: 'Informe o nome do produto.' })
      return
    }

    if (!normalizedDescription) {
      setFeedback({ type: 'error', text: 'Informe a descrição do produto.' })
      return
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFeedback({ type: 'error', text: 'Informe um preço válido.' })
      return
    }

    if (!Number.isFinite(numericReward) || numericReward < 0) {
      setFeedback({ type: 'error', text: 'Informe um valor de resgate válido.' })
      return
    }

    if (!Number.isInteger(numericCycleDays) || numericCycleDays < 0) {
      setFeedback({ type: 'error', text: 'Informe os dias do ciclo (inteiro maior ou igual a 0).' })
      return
    }

    if (!Number.isInteger(numericRequireLevel1) || numericRequireLevel1 < 0) {
      setFeedback({ type: 'error', text: 'Informe uma quantidade válida para exigência do nível 1.' })
      return
    }

    if (!Number.isInteger(numericRequireLevel2) || numericRequireLevel2 < 0) {
      setFeedback({ type: 'error', text: 'Informe uma quantidade válida para exigência do nível 2.' })
      return
    }

    if (!Number.isInteger(numericRequireLevel3) || numericRequireLevel3 < 0) {
      setFeedback({ type: 'error', text: 'Informe uma quantidade válida para exigência do nível 3.' })
      return
    }

    if (!Number.isInteger(numericStockQuantity) || numericStockQuantity < 0) {
      setFeedback({ type: 'error', text: 'Informe uma quantidade de estoque válida (inteiro maior ou igual a 0).' })
      return
    }

    if (!Number.isInteger(numericMaxPurchasesPerUser) || numericMaxPurchasesPerUser < 0) {
      setFeedback({ type: 'error', text: 'Limite de compras por usuário deve ser 0 (sem limite) ou um número inteiro positivo.' })
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      const isEditing = editingId != null
      const endpoint = isEditing
        ? `${API_URL}/api/admin/cycle-products/${editingId}`
        : `${API_URL}/api/admin/cycle-products`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: normalizedName,
          description: normalizedDescription,
          imageUrl: normalizedImageUrl,
          price: Number(numericPrice.toFixed(2)),
          redeemRewardValue: Number(numericReward.toFixed(2)),
          cycleDays: numericCycleDays,
          planType: form.planType,
          requireCommissionLevel1Count: numericRequireLevel1,
          requireCommissionLevel2Count: numericRequireLevel2,
          requireCommissionLevel3Count: numericRequireLevel3,
          stockQuantity: numericStockQuantity,
          maxPurchasesPerUser: numericMaxPurchasesPerUser,
          expiresAt: form.planType === 'vip_day' ? (form.expiresAt || null) : null,
          isActive: form.isActive,
          minAmount: Number.isFinite(numericMinAmount) ? numericMinAmount : 0,
          maxAmount: Number.isFinite(numericMaxAmount) ? numericMaxAmount : 0,
          profitPercent: Number.isFinite(numericProfitPercent) ? numericProfitPercent : 0,
        }),
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Erro ao salvar produto.' })
        return
      }

      setFeedback({ type: 'success', text: data?.message || (isEditing ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.') })
      resetForm()
      await loadProducts()
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão ao salvar produto.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product: CycleProduct) => {
    if (!token) {
      setFeedback({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    const confirmed = window.confirm(`Deseja realmente apagar o produto "${product.name}"?`)
    if (!confirmed) return

    setDeletingId(product.id)
    setFeedback(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/cycle-products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Erro ao apagar produto.' })
        return
      }

      setFeedback({ type: 'success', text: data?.message || 'Produto apagado com sucesso.' })
      if (editingId === product.id) resetForm()
      await loadProducts()
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão ao apagar produto.' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-users-header">
          <div>
            <h1>Produtos (cycle_products)</h1>
            <p className="admin-subtitle">Crie, edite e apague os produtos exibidos na loja.</p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total: {products.length}</span>
          </div>
        </header>

        <section className="admin-panel admin-cycle-form-panel">
          <h3 className="admin-cycle-form-title">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
          <div className="admin-cycle-form-grid">
            <div className="admin-cycle-field">
              <label>Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Preço (R$)</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Ex.: 29.90"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Investimento Mínimo (R$)</label>
              <input
                type="text"
                value={form.minAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, minAmount: e.target.value }))}
                placeholder="Ex.: 10"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Lucro diário (%)</label>
              <input
                type="text"
                value={form.profitPercent}
                onChange={(e) => setForm((prev) => ({ ...prev, profitPercent: e.target.value }))}
                placeholder="Ex.: 3"
              />
              {Number(form.profitPercent) > 0 && (
                <small style={{ color: '#4caf50', fontWeight: 600 }}>
                  Renda diária: {formatBRL(Number(form.price || 0) * (Number(form.profitPercent.replace(',', '.')) / 100))}
                  {Number(form.cycleDays) > 0 && (
                    <span> • Lucro total: {formatBRL(Number(form.price || 0) * (Number(form.profitPercent.replace(',', '.')) / 100) * Number(form.cycleDays))}</span>
                  )}
                </small>
              )}
            </div>

            <div className="admin-cycle-field">
              <label>Investimento Máximo (R$)</label>
              <input
                type="text"
                value={form.maxAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, maxAmount: e.target.value }))}
                placeholder="Ex.: 1000"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Dias do ciclo</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.cycleDays}
                onChange={(e) => setForm((prev) => ({ ...prev, cycleDays: e.target.value }))}
                placeholder="Ex.: 30"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Tipo do plano</label>
              <select
                value={form.planType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    planType: e.target.value as 'normal' | 'vip' | 'vip_day',
                    expiresAt: e.target.value === 'vip_day' ? prev.expiresAt : '',
                  }))
                }
              >
                <option value="normal">Plano normal</option>
                <option value="vip">Plano VIP</option>
                <option value="vip_day">VIP do dia</option>
              </select>
            </div>

            {form.planType === 'vip_day' ? (
              <div className="admin-cycle-field">
                <label>Expira em (opcional)</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            ) : null}

            <div className="admin-cycle-field">
              <label>Exigência Convite Nível 1 ({commissionLevels.find((lvl) => lvl.level === 1)?.name || 'Nível 1'})</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.requireCommissionLevel1Count}
                onChange={(e) => setForm((prev) => ({ ...prev, requireCommissionLevel1Count: e.target.value }))}
                placeholder="Ex.: 3"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Exigência Convite Nível 2 ({commissionLevels.find((lvl) => lvl.level === 2)?.name || 'Nível 2'})</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.requireCommissionLevel2Count}
                onChange={(e) => setForm((prev) => ({ ...prev, requireCommissionLevel2Count: e.target.value }))}
                placeholder="Ex.: 5"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Exigência Convite Nível 3 ({commissionLevels.find((lvl) => lvl.level === 3)?.name || 'Nível 3'})</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.requireCommissionLevel3Count}
                onChange={(e) => setForm((prev) => ({ ...prev, requireCommissionLevel3Count: e.target.value }))}
                placeholder="Ex.: 7"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Estoque</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.stockQuantity}
                onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                placeholder="Ex.: 100"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Limite de compras por usuário <small style={{ color: '#94a3b8', fontWeight: 400 }}>(0 = sem limite)</small></label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.maxPurchasesPerUser}
                onChange={(e) => setForm((prev) => ({ ...prev, maxPurchasesPerUser: e.target.value }))}
                placeholder="0 = ilimitado"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Imagem (URL)</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="admin-cycle-field full">
              <label>Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Descrição do produto"
              />
            </div>

            <div className="admin-cycle-field full">
              <label className="admin-cycle-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Produto ativo
              </label>
            </div>
          </div>

          <div className="admin-cycle-actions">
            <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar produto'}
            </button>
            {editingId ? (
              <button type="button" className="btn ghost" onClick={resetForm} disabled={saving}>
                Cancelar edição
              </button>
            ) : null}
          </div>
        </section>

        {feedback ? (
          <div className={`gift-toast ${feedback.type === 'success' ? 'success' : 'error'}`} role="status" aria-live="polite">
            {feedback.text}
          </div>
        ) : null}

        {loading ? (
          <div className="vip-inline-message">Carregando produtos...</div>
        ) : !products.length ? (
          <div className="vip-inline-message">Nenhum produto encontrado.</div>
        ) : (
          <section className="admin-panel admin-cycle-list-panel">
            <div className="admin-cycle-list">
              {products.map((product) => (
                <article key={product.id} className="admin-cycle-item">
                  <div className="admin-cycle-item-head">
                    <div>
                      <strong className="admin-cycle-item-title">{product.name}</strong>
                      <p className="admin-cycle-item-description">{product.description}</p>
                      <p className="admin-cycle-item-meta">
                        Preço: {formatBRL(product.price)} • Resgate: {formatBRL(product.redeemRewardValue)} • Ciclo: {product.cycleDays} dias
                      </p>
                      <p className="admin-cycle-item-meta secondary">
                        Tipo: {product.planType === 'vip' ? 'Plano VIP' : product.planType === 'vip_day' ? 'VIP do dia' : 'Plano normal'} • Status: {product.isActive ? 'Ativo' : 'Inativo'} • Criado em: {product.createdAt ? new Date(product.createdAt).toLocaleString('pt-BR') : '-'}
                      </p>
                      {product.planType === 'vip_day' ? (
                        <p className="admin-cycle-item-meta secondary">
                          Expiração: {product.expiresAt ? new Date(product.expiresAt).toLocaleString('pt-BR') : 'Sem expiração'}
                        </p>
                      ) : null}
                      <p className="admin-cycle-item-meta secondary">
                        Exigência de convite • Nível 1: {product.requireCommissionLevel1Count} • Nível 2: {product.requireCommissionLevel2Count} • Nível 3: {product.requireCommissionLevel3Count}
                      </p>
                      <p className="admin-cycle-item-meta secondary">
                        Estoque: {product.stockQuantity} • Limite por usuário: {product.maxPurchasesPerUser === 0 ? 'Ilimitado' : `${product.maxPurchasesPerUser}x`}
                      </p>
                      {(product.minAmount > 0 && product.maxAmount > 0 && product.profitPercent > 0) ? (
                        <p className="admin-cycle-item-meta secondary" style={{ color: '#60a5fa' }}>
                          Investimento flexível: {formatBRL(product.minAmount)} ~ {formatBRL(product.maxAmount)} • Lucro: {product.profitPercent}%
                        </p>
                      ) : null}
                    </div>
                    <div className="admin-cycle-item-actions">
                      <button type="button" className="btn ghost" onClick={() => fillEditForm(product)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn admin-cycle-delete-btn"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? 'Apagando...' : 'Apagar'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
