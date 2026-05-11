import { useEffect, useMemo, useRef, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'
import './AdminShopProducts.css'

type Product = {
  id: number
  name: string
  platform: string
  description: string
  price: number
  imageUrl: string
  category: string
  isActive: boolean
  sortOrder: number
}

type FormState = {
  name: string
  platform: string
  description: string
  price: string
  imageUrl: string
  category: string
  isActive: boolean
  sortOrder: string
}

type ProductCode = {
  id: number
  code: string
  status: 'available' | 'used'
  usedBy: number | null
  usedAt: string | null
  createdAt: string
}

type StockInfo = {
  codes: ProductCode[]
  available: number
  used: number
  total: number
}

const CATEGORIES = ['games', 'streaming', 'musica', 'compras', 'social', 'outros']

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const defaultForm: FormState = {
  name: '',
  platform: '',
  description: '',
  price: '0',
  imageUrl: '',
  category: 'outros',
  isActive: true,
  sortOrder: '0',
}

const formatBRL = (v: number) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (raw: string | null) => {
  if (!raw) return '—'
  return new Date(raw).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminShopProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Estoque de códigos ─────────────────────────────────────
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null)
  const [stockLoading, setStockLoading] = useState(false)
  const [newCodes, setNewCodes] = useState('')
  const [addingCodes, setAddingCodes] = useState(false)

  const token = useMemo(() => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '', [])

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  )

  // ── Upload de imagem ───────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setForm((p) => ({ ...p, imageUrl: previewUrl }))

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(`${API_URL}/api/admin/shop/products/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const url = data?.url ?? data?.imageUrl ?? data?.path ?? ''
        if (url) {
          URL.revokeObjectURL(previewUrl)
          setForm((p) => ({ ...p, imageUrl: url }))
          setToast({ type: 'success', message: 'Imagem enviada com sucesso!' })
        } else {
          setToast({ type: 'error', message: 'Upload OK, mas URL não retornada. Cole a URL manualmente.' })
        }
      } else if (res.status === 404) {
        setToast({ type: 'error', message: 'Endpoint de upload não configurado. Cole a URL manualmente.' })
        setForm((p) => ({ ...p, imageUrl: '' }))
        URL.revokeObjectURL(previewUrl)
      } else {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? `Erro ${res.status} ao enviar imagem.`)
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao enviar imagem.' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Produtos ───────────────────────────────────────────────
  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/shop/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false || !Array.isArray(data?.products)) {
        throw new Error(data?.error ?? 'Falha ao carregar produtos.')
      }
      const normalized: Product[] = data.products.map((p: any) => ({
        id:          Number(p?.id ?? 0),
        name:        String(p?.name ?? ''),
        platform:    String(p?.platform ?? ''),
        description: String(p?.description ?? ''),
        price:       Number(p?.price ?? 0),
        imageUrl:    String(p?.imageUrl ?? ''),
        category:    String(p?.category ?? 'outros'),
        isActive:    Boolean(p?.isActive ?? p?.is_active),
        sortOrder:   Number(p?.sortOrder ?? p?.sort_order ?? 0),
      }))
      setProducts(normalized)
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao carregar produtos.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId(null)
  }

  const startEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({
      name:        p.name,
      platform:    p.platform,
      description: p.description,
      price:       String(p.price),
      imageUrl:    p.imageUrl,
      category:    p.category,
      isActive:    p.isActive,
      sortOrder:   String(p.sortOrder),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name:        form.name.trim(),
        platform:    form.platform.trim(),
        description: form.description.trim(),
        price:       Number(String(form.price).replace(',', '.')),
        imageUrl:    form.imageUrl.trim(),
        category:    form.category,
        isActive:    form.isActive,
        sortOrder:   Number(form.sortOrder),
      }

      const isEditing = editingId != null
      const url    = isEditing ? `${API_URL}/api/admin/shop/products/${editingId}` : `${API_URL}/api/admin/shop/products`
      const method = isEditing ? 'PUT' : 'POST'

      const res  = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error ?? 'Falha ao salvar produto.')

      setToast({ type: 'success', message: isEditing ? 'Produto atualizado.' : 'Produto criado.' })
      resetForm()
      await loadProducts()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao salvar produto.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remover este produto?')) return
    try {
      const res  = await fetch(`${API_URL}/api/admin/shop/products/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error ?? 'Falha ao remover produto.')
      setToast({ type: 'success', message: 'Produto removido.' })
      if (editingId === id) resetForm()
      if (stockProduct?.id === id) setStockProduct(null)
      await loadProducts()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao remover produto.' })
    }
  }

  const handleToggle = async (p: Product) => {
    try {
      const payload = { ...p, isActive: !p.isActive }
      const res  = await fetch(`${API_URL}/api/admin/shop/products/${p.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error ?? 'Falha.')
      await loadProducts()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao atualizar status.' })
    }
  }

  // ── Estoque de códigos ─────────────────────────────────────
  const openStock = async (p: Product) => {
    setStockProduct(p)
    setNewCodes('')
    setStockInfo(null)
    setStockLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/shop/products/${p.id}/codes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error ?? 'Falha ao carregar estoque.')
      setStockInfo({
        codes:     data.codes ?? [],
        available: Number(data.available ?? 0),
        used:      Number(data.used ?? 0),
        total:     Number(data.total ?? 0),
      })
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao carregar estoque.' })
    } finally {
      setStockLoading(false)
    }
  }

  const handleAddCodes = async () => {
    if (!stockProduct || !newCodes.trim()) return
    setAddingCodes(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/shop/products/${stockProduct.id}/codes`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ codes: newCodes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error ?? 'Falha ao adicionar códigos.')
      setToast({ type: 'success', message: `${data.added} código(s) adicionado(s) ao estoque.` })
      setNewCodes('')
      await openStock(stockProduct)
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao adicionar códigos.' })
    } finally {
      setAddingCodes(false)
    }
  }

  const handleDeleteCode = async (codeId: number) => {
    if (!stockProduct) return
    if (!window.confirm('Remover este código do estoque?')) return
    try {
      const res = await fetch(`${API_URL}/api/admin/shop/products/codes/${codeId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error ?? 'Falha ao remover código.')
      setToast({ type: 'success', message: 'Código removido.' })
      await openStock(stockProduct)
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao remover código.' })
    }
  }

  const filtered = products.filter((p) => {
    const matchCat = filterCat === 'all' || p.category === filterCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.platform.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <main className="admin-page admin-shop-products-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-users-header">
          <div>
            <h1>Produtos da Loja Agrovia</h1>
            <p>Gerencie o catálogo de produtos e os códigos de gift card do estoque.</p>
          </div>
        </header>

        <div className="asp-wrap">

          {/* ── Formulário ─────────────────────────── */}
          <article className="asp-card">
            <h2 className="asp-card-title">
              {editingId ? `Editando produto #${editingId}` : 'Novo produto'}
            </h2>

            <form className="asp-form" onSubmit={handleSubmit}>
              <div className="asp-row">
                <div className="asp-field asp-field-lg">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Steam Gift Card"
                    required
                  />
                </div>
                <div className="asp-field">
                  <label>Plataforma</label>
                  <input
                    type="text"
                    value={form.platform}
                    onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))}
                    placeholder="Ex: Steam"
                  />
                </div>
              </div>

              <div className="asp-row">
                <div className="asp-field">
                  <label>Preço (R$) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="asp-field">
                  <label>Categoria</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="asp-field">
                  <label>Ordem</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                  />
                </div>
              </div>

              <div className="asp-field">
                <label>Descrição</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Descrição breve do produto"
                />
              </div>

              {/* ── Imagem do produto ─────────────────── */}
              <div className="asp-field">
                <label>Imagem do produto</label>
                <div className="asp-image-wrap">
                  <div className="asp-image-preview">
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt="preview"
                        className="asp-image-preview-img"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <span className="asp-image-preview-placeholder">
                        {uploading ? '⏳' : '🖼️'}
                      </span>
                    )}
                  </div>

                  <div className="asp-image-controls">
                    <input
                      type="text"
                      value={form.imageUrl}
                      onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                      placeholder="Cole a URL da imagem (https://...)"
                      className="asp-image-url-input"
                    />
                    <button
                      type="button"
                      className="btn ghost asp-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Fazer upload de imagem do computador"
                    >
                      {uploading ? 'Enviando…' : '📁 Enviar arquivo'}
                    </button>
                    {form.imageUrl && (
                      <button
                        type="button"
                        className="btn danger asp-clear-img-btn"
                        onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                        title="Remover imagem"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <label className="asp-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                <span>Produto ativo (visível na loja)</span>
              </label>

              <div className="asp-form-actions">
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar produto'}
                </button>
                {editingId ? (
                  <button className="btn ghost" type="button" onClick={resetForm}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          </article>

          {/* ── Lista ──────────────────────────────── */}
          <article className="asp-card">
            <div className="asp-list-header">
              <h2 className="asp-card-title">Produtos cadastrados ({products.length})</h2>
              <div className="asp-filters">
                <input
                  type="search"
                  className="asp-search"
                  placeholder="Buscar produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="asp-select"
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value)}
                >
                  <option value="all">Todas categorias</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <p className="asp-loading">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="asp-empty">Nenhum produto encontrado.</p>
            ) : (
              <div className="asp-table-wrap">
                <table className="asp-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Plataforma</th>
                      <th>Preço</th>
                      <th>Categoria</th>
                      <th>Ordem</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className={!p.isActive ? 'asp-row-inactive' : ''}>
                        <td className="asp-td-id">{p.id}</td>
                        <td>
                          <div className="asp-product-name">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="asp-product-img" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                              <span className="asp-product-icon">{p.name.charAt(0).toUpperCase()}</span>
                            )}
                            <span>{p.name}</span>
                          </div>
                        </td>
                        <td>{p.platform || '—'}</td>
                        <td className="asp-td-price">{formatBRL(p.price)}</td>
                        <td>
                          <span className={`asp-cat asp-cat-${p.category}`}>
                            {p.category}
                          </span>
                        </td>
                        <td>{p.sortOrder}</td>
                        <td>
                          <button
                            type="button"
                            className={`asp-toggle ${p.isActive ? 'asp-toggle-on' : 'asp-toggle-off'}`}
                            onClick={() => handleToggle(p)}
                            title={p.isActive ? 'Clique para desativar' : 'Clique para ativar'}
                          >
                            {p.isActive ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td>
                          <div className="asp-row-actions">
                            <button className="btn ghost" type="button" onClick={() => startEdit(p)}>
                              Editar
                            </button>
                            <button
                              className="btn accent"
                              type="button"
                              onClick={() => openStock(p)}
                              title="Gerenciar estoque de códigos"
                            >
                              📦 Estoque
                            </button>
                            <button className="btn danger" type="button" onClick={() => handleDelete(p.id)}>
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          {/* ── Painel de Estoque de Códigos ─────── */}
          {stockProduct && (
            <article className="asp-card asp-stock-card">
              <div className="asp-stock-header">
                <div>
                  <h2 className="asp-card-title">
                    📦 Estoque — {stockProduct.name}
                  </h2>
                  <p className="asp-stock-sub">
                    Cada código será entregue automaticamente ao usuário quando ele comprar o produto.
                  </p>
                </div>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setStockProduct(null)}
                >
                  Fechar
                </button>
              </div>

              {/* Resumo */}
              {stockInfo && (
                <div className="asp-stock-summary">
                  <div className="asp-stock-stat asp-stock-available">
                    <strong>{stockInfo.available}</strong>
                    <span>Disponíveis</span>
                  </div>
                  <div className="asp-stock-stat asp-stock-used">
                    <strong>{stockInfo.used}</strong>
                    <span>Usados</span>
                  </div>
                  <div className="asp-stock-stat">
                    <strong>{stockInfo.total}</strong>
                    <span>Total</span>
                  </div>
                </div>
              )}

              {/* Adicionar novos códigos */}
              <div className="asp-stock-add">
                <label className="asp-stock-add-label">
                  Adicionar códigos ao estoque
                  <span className="asp-stock-hint">Separados por vírgula ou um por linha</span>
                </label>
                <textarea
                  className="asp-stock-textarea"
                  rows={5}
                  value={newCodes}
                  onChange={(e) => setNewCodes(e.target.value)}
                  placeholder={'XXXX-XXXX-XXXX,YYYY-YYYY-YYYY,ZZZZ-ZZZZ-ZZZZ\n\nou um por linha:\nXXXX-XXXX-XXXX\nYYYY-YYYY-YYYY'}
                />
                <button
                  className="btn primary"
                  type="button"
                  onClick={handleAddCodes}
                  disabled={addingCodes || !newCodes.trim()}
                >
                  {addingCodes ? 'Adicionando...' : '+ Adicionar ao estoque'}
                </button>
              </div>

              {/* Lista de códigos */}
              {stockLoading ? (
                <p className="asp-loading">Carregando estoque...</p>
              ) : stockInfo && stockInfo.codes.length === 0 ? (
                <p className="asp-empty">Nenhum código cadastrado. Adicione códigos acima.</p>
              ) : stockInfo ? (
                <div className="asp-table-wrap" style={{ marginTop: 20 }}>
                  <table className="asp-table asp-codes-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Código</th>
                        <th>Status</th>
                        <th>Usado por</th>
                        <th>Data</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockInfo.codes.map((c) => (
                        <tr key={c.id} className={c.status === 'used' ? 'asp-row-inactive' : ''}>
                          <td className="asp-td-id">{c.id}</td>
                          <td>
                            <code className="asp-code-cell">{c.code}</code>
                          </td>
                          <td>
                            <span className={`asp-toggle ${c.status === 'available' ? 'asp-toggle-on' : 'asp-toggle-off'}`}>
                              {c.status === 'available' ? 'Disponível' : 'Usado'}
                            </span>
                          </td>
                          <td className="asp-td-id">{c.usedBy ?? '—'}</td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text3)' }}>
                            {c.status === 'used' ? fmtDate(c.usedAt) : fmtDate(c.createdAt)}
                          </td>
                          <td>
                            {c.status === 'available' && (
                              <button
                                className="btn danger"
                                type="button"
                                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                onClick={() => handleDeleteCode(c.id)}
                              >
                                Remover
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </article>
          )}

        </div>
      </section>

      {toast ? (
        <FloatingToast
          open={Boolean(toast)}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </main>
  )
}
