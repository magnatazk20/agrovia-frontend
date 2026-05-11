import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'
import './AdminMiniTasks.css'

type VipLevelItem = {
  id: number
  name: string
  price: number
  dailyTaskLimit: number
  taskRewardAmount: number
  durationDays: number
  benefits: string
  imageUrl: string
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  requireCommissionLevel1Count: number
  requireCommissionLevel2Count: number
  requireCommissionLevel3Count: number
}

type FormState = {
  name: string
  price: string
  dailyTaskLimit: string
  taskRewardAmount: string
  durationDays: string
  benefits: string
  imageUrl: string
  isActive: boolean
  isDefault: boolean
  sortOrder: string
  requireCommissionLevel1Count: string
  requireCommissionLevel2Count: string
  requireCommissionLevel3Count: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const defaultForm: FormState = {
  name: '',
  price: '0',
  dailyTaskLimit: '0',
  taskRewardAmount: '0.00',
  durationDays: '365',
  benefits: '',
  imageUrl: '',
  isActive: true,
  isDefault: false,
  sortOrder: '0',
  requireCommissionLevel1Count: '0',
  requireCommissionLevel2Count: '0',
  requireCommissionLevel3Count: '0',
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminVipLevels() {
  const [levels, setLevels] = useState<VipLevelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  )

  const loadLevels = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/vip/levels`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false || !Array.isArray(data?.levels)) {
        throw new Error(data?.error ?? 'Falha ao carregar VIPs.')
      }

      const normalized: VipLevelItem[] = data.levels.map((item: any) => ({
        id: Number(item?.id ?? 0),
        name: String(item?.name ?? ''),
        price: Number(item?.price ?? 0),
        dailyTaskLimit: Number(item?.dailyTaskLimit ?? 0),
        taskRewardAmount: Number(item?.taskRewardAmount ?? 0),
        durationDays: Number(item?.durationDays ?? 365),
        benefits: String(item?.benefits ?? ''),
        imageUrl: String(item?.imageUrl ?? ''),
        isActive: Boolean(item?.isActive),
        isDefault: Boolean(item?.isDefault),
        sortOrder: Number(item?.sortOrder ?? 0),
        requireCommissionLevel1Count: Number(item?.requireCommissionLevel1Count ?? 0),
        requireCommissionLevel2Count: Number(item?.requireCommissionLevel2Count ?? 0),
        requireCommissionLevel3Count: Number(item?.requireCommissionLevel3Count ?? 0),
      }))

      setLevels(normalized)
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao carregar VIPs.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLevels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId(null)
  }

  const startEdit = (level: VipLevelItem) => {
    setEditingId(level.id)
    setForm({
      name: level.name,
      price: String(level.price),
      dailyTaskLimit: String(level.dailyTaskLimit),
      taskRewardAmount: String(level.taskRewardAmount),
      durationDays: String(level.durationDays),
      benefits: level.benefits,
      imageUrl: level.imageUrl,
      isActive: level.isActive,
      isDefault: level.isDefault,
      sortOrder: String(level.sortOrder),
      requireCommissionLevel1Count: String(level.requireCommissionLevel1Count),
      requireCommissionLevel2Count: String(level.requireCommissionLevel2Count),
      requireCommissionLevel3Count: String(level.requireCommissionLevel3Count),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        name: form.name.trim(),
        price: Number(String(form.price).replace(',', '.')),
        dailyTaskLimit: Number(form.dailyTaskLimit),
        taskRewardAmount: Number(String(form.taskRewardAmount).replace(',', '.')),
        durationDays: Number(form.durationDays),
        benefits: form.benefits.trim(),
        imageUrl: form.imageUrl.trim(),
        isActive: form.isActive,
        isDefault: form.isDefault,
        sortOrder: Number(form.sortOrder),
        requireCommissionLevel1Count: Number(form.requireCommissionLevel1Count),
        requireCommissionLevel2Count: Number(form.requireCommissionLevel2Count),
        requireCommissionLevel3Count: Number(form.requireCommissionLevel3Count),
      }

      const isEditing = editingId != null
      const endpoint = isEditing
        ? `${API_URL}/api/admin/vip/levels/${editingId}`
        : `${API_URL}/api/admin/vip/levels`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error ?? 'Falha ao salvar VIP.')
      }

      setToast({
        type: 'success',
        message: isEditing ? 'VIP atualizado com sucesso.' : 'VIP criado com sucesso.',
      })
      resetForm()
      await loadLevels()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao salvar VIP.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Deseja realmente remover este VIP?')
    if (!confirmed) return

    try {
      const res = await fetch(`${API_URL}/api/admin/vip/levels/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error ?? 'Falha ao remover VIP.')
      }

      setToast({ type: 'success', message: 'VIP removido com sucesso.' })
      if (editingId === id) resetForm()
      await loadLevels()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao remover VIP.' })
    }
  }

  return (
    <main className="admin-page admin-mini-tasks-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-users-header">
          <div>
            <h1>VIPs</h1>
            <p>Crie, edite e remova os níveis VIP oferecidos aos usuários.</p>
          </div>
        </header>

        <div className="admin-mini-wrap">
          <article className="admin-mini-card">
            <h2 className="admin-mini-card-title">
              {editingId ? `Editar VIP #${editingId}` : 'Novo VIP'}
            </h2>
            <form className="admin-mini-form-grid" onSubmit={handleSubmit}>
              <div className="admin-mini-field">
                <label htmlFor="vip-name">Nome</label>
                <input
                  id="vip-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: VIP 1"
                  required
                />
              </div>

              <div className="admin-mini-field">
                <label htmlFor="vip-price">Preço (R$)</label>
                <input
                  id="vip-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              <div className="admin-mini-field">
                <label htmlFor="vip-limit">Tarefas diárias</label>
                <input
                  id="vip-limit"
                  type="number"
                  min={0}
                  value={form.dailyTaskLimit}
                  onChange={(e) => setForm((prev) => ({ ...prev, dailyTaskLimit: e.target.value }))}
                  required
                />
              </div>

              <div className="admin-mini-field">
                <label htmlFor="vip-reward">Recompensa por tarefa (R$)</label>
                <input
                  id="vip-reward"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.taskRewardAmount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, taskRewardAmount: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="admin-mini-field">
                <label htmlFor="vip-duration">Duração (dias)</label>
                <input
                  id="vip-duration"
                  type="number"
                  min={1}
                  value={form.durationDays}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationDays: e.target.value }))}
                  placeholder="365"
                  required
                />
              </div>

              <div className="admin-mini-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="vip-benefits">Benefícios</label>
                <input
                  id="vip-benefits"
                  type="text"
                  value={form.benefits}
                  onChange={(e) => setForm((prev) => ({ ...prev, benefits: e.target.value }))}
                  placeholder="Descrição dos benefícios do plano"
                />
              </div>

              <div className="admin-mini-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="vip-image-url">Link da foto do produto</label>
                <input
                  id="vip-image-url"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://exemplo.com/imagem.png"
                />
                {form.imageUrl.trim() && (
                  <div className="admin-mini-image-preview">
                    <img
                      src={form.imageUrl.trim()}
                      alt="Preview"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        img.style.display = 'none'
                        const errSpan = img.nextElementSibling as HTMLElement | null
                        if (errSpan) errSpan.style.display = 'inline'
                      }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement
                        img.style.display = 'block'
                        const errSpan = img.nextElementSibling as HTMLElement | null
                        if (errSpan) errSpan.style.display = 'none'
                      }}
                    />
                    <span className="admin-mini-image-error" style={{ display: 'none' }}>
                      Imagem não carregou
                    </span>
                  </div>
                )}
              </div>

              <div className="admin-mini-field" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 4, display: 'block' }}>
                  Requisitos de convite (indicados com depósito)
                </label>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>
                  Deixe 0 para não exigir convites. O usuário só poderá comprar o VIP se tiver o número mínimo de indicados com depósito aprovado em cada nível.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div className="admin-mini-field">
                    <label htmlFor="vip-req-level1">Nível 1</label>
                    <input
                      id="vip-req-level1"
                      type="number"
                      min={0}
                      value={form.requireCommissionLevel1Count}
                      onChange={(e) => setForm((prev) => ({ ...prev, requireCommissionLevel1Count: e.target.value }))}
                    />
                  </div>
                  <div className="admin-mini-field">
                    <label htmlFor="vip-req-level2">Nível 2</label>
                    <input
                      id="vip-req-level2"
                      type="number"
                      min={0}
                      value={form.requireCommissionLevel2Count}
                      onChange={(e) => setForm((prev) => ({ ...prev, requireCommissionLevel2Count: e.target.value }))}
                    />
                  </div>
                  <div className="admin-mini-field">
                    <label htmlFor="vip-req-level3">Nível 3</label>
                    <input
                      id="vip-req-level3"
                      type="number"
                      min={0}
                      value={form.requireCommissionLevel3Count}
                      onChange={(e) => setForm((prev) => ({ ...prev, requireCommissionLevel3Count: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-mini-field">
                <label htmlFor="vip-order">Ordem</label>
                <input
                  id="vip-order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                  required
                />
              </div>

              <label className="admin-mini-field-checkbox" htmlFor="vip-active">
                <input
                  id="vip-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                <span>Ativo</span>
              </label>

              <label className="admin-mini-field-checkbox" htmlFor="vip-default">
                <input
                  id="vip-default"
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                />
                <span>VIP padrão (atribuído automaticamente no cadastro)</span>
              </label>

              <div className="admin-mini-actions">
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar VIP'}
                </button>
                {editingId ? (
                  <button className="btn ghost" type="button" onClick={resetForm}>
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </form>
          </article>

          <article className="admin-mini-card">
            <h2 className="admin-mini-card-title">Lista de VIPs</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : levels.length === 0 ? (
              <p>Nenhum VIP cadastrado.</p>
            ) : (
              <div className="admin-mini-table-wrap">
                <table className="admin-mini-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Foto</th>
                      <th>Nome</th>
                      <th>Preço</th>
                      <th>Tarefas</th>
                      <th>Recompensa/tarefa</th>
                      <th>Duração</th>
                      <th>Benefícios</th>
                      <th>Requisitos convite</th>
                      <th>Ordem</th>
                      <th>Status</th>
                      <th>Padrão</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level) => (
                      <tr key={level.id}>
                        <td>{level.id}</td>
                        <td>
                          {level.imageUrl ? (
                            <img
                              className="admin-mini-table-img"
                              src={level.imageUrl}
                              alt={level.name}
                              onError={(e) => {
                                const img = e.target as HTMLImageElement
                                const placeholder = document.createElement('span')
                                placeholder.className = 'admin-mini-no-img'
                                placeholder.textContent = '—'
                                img.replaceWith(placeholder)
                              }}
                            />
                          ) : (
                            <span className="admin-mini-no-img">—</span>
                          )}
                        </td>
                        <td>
                          <span className="admin-mini-badge">{level.name}</span>
                        </td>
                        <td>{formatBRL(level.price)}</td>
                        <td>{level.dailyTaskLimit}</td>
                        <td>{formatBRL(Number(level.taskRewardAmount))}</td>
                        <td>{level.durationDays} dias</td>
                        <td
                          style={{
                            maxWidth: 260,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={level.benefits}
                        >
                          {level.benefits || '-'}
                        </td>
                        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                          {level.requireCommissionLevel1Count > 0 || level.requireCommissionLevel2Count > 0 || level.requireCommissionLevel3Count > 0 ? (
                            <>
                              {level.requireCommissionLevel1Count > 0 && <div>N1: {level.requireCommissionLevel1Count}</div>}
                              {level.requireCommissionLevel2Count > 0 && <div>N2: {level.requireCommissionLevel2Count}</div>}
                              {level.requireCommissionLevel3Count > 0 && <div>N3: {level.requireCommissionLevel3Count}</div>}
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td>{level.sortOrder}</td>
                        <td>
                          <span
                            className={`admin-mini-status ${level.isActive ? 'active' : 'inactive'}`}
                          >
                            {level.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          {level.isDefault ? (
                            <span className="admin-mini-status active">Padrão</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div className="admin-mini-row-actions">
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={() => startEdit(level)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn danger"
                              type="button"
                              onClick={() => handleDelete(level.id)}
                            >
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
