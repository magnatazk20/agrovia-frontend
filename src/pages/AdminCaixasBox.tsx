import { useEffect, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './AdminCaixasBox.css'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3333'

type Prize = {
  id: number
  prizeKey: string
  label: string
  type: 'cash' | 'physical'
  value: number
  probability: number
  sortOrder: number
  isActive: boolean
  imageUrl?: string
  createdAt?: string
}

type Stats = {
  totalOpened: number
  totalPending: number
  byPrize: Array<{ prizeLabel: string; count: number }>
}

const EMPTY_FORM = {
  prizeKey: '',
  label: '',
  type: 'cash' as 'cash' | 'physical',
  value: '',
  probability: '',
  sortOrder: '',
  isActive: true,
  imageUrl: '',
}

const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token') || ''

const formatBRL = (v: number) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminCaixasBox() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Modal de criar/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const token = getToken()
    try {
      const [prizesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/caixas-box/prizes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/caixas-box/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const prizesData = await prizesRes.json() as { ok?: boolean; prizes?: Prize[] }
      const statsData = await statsRes.json() as { ok?: boolean; stats?: Stats }

      if (prizesData.ok) setPrizes(Array.isArray(prizesData.prizes) ? prizesData.prizes : [])
      if (statsData.ok && statsData.stats) setStats(statsData.stats)
    } catch {
      setFeedback({ type: 'error', msg: 'Erro ao carregar dados.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setModalOpen(true)
  }

  const openEdit = (prize: Prize) => {
    setEditingId(prize.id)
    setForm({
      prizeKey: prize.prizeKey,
      label: prize.label,
      type: prize.type,
      value: String(prize.value),
      probability: String(prize.probability),
      sortOrder: String(prize.sortOrder),
      isActive: prize.isActive,
      imageUrl: prize.imageUrl ?? '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  const handleSave = async () => {
    if (!form.label.trim() || (!editingId && !form.prizeKey.trim())) {
      showFeedback('error', 'Preencha todos os campos obrigatórios.')
      return
    }
    const token = getToken()
    setSaving(true)
    try {
      const body = {
        prizeKey: form.prizeKey.trim(),
        label: form.label.trim(),
        type: form.type,
        value: Number(String(form.value).replace(',', '.')) || 0,
        probability: Number(String(form.probability).replace(',', '.')) || 0,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        imageUrl: form.imageUrl.trim(),
      }

      const isEdit = editingId !== null
      const res = await fetch(
        isEdit
          ? `${API_URL}/api/admin/caixas-box/prizes/${editingId}`
          : `${API_URL}/api/admin/caixas-box/prizes`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }
      )
      const data = await res.json() as { ok?: boolean; message?: string; error?: string }
      if (!res.ok || !data.ok) {
        showFeedback('error', data.error ?? 'Erro ao salvar prêmio.')
        return
      }
      showFeedback('success', data.message ?? 'Prêmio salvo com sucesso.')
      closeModal()
      loadData()
    } catch {
      showFeedback('error', 'Erro de conexão ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    const token = getToken()
    setDeleting(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/caixas-box/prizes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json() as { ok?: boolean; message?: string; error?: string }
      if (!res.ok || !data.ok) {
        showFeedback('error', data.error ?? 'Erro ao remover prêmio.')
        return
      }
      showFeedback('success', data.message ?? 'Prêmio removido.')
      setConfirmDeleteId(null)
      loadData()
    } catch {
      showFeedback('error', 'Erro de conexão ao remover.')
    } finally {
      setDeleting(false)
    }
  }

  const totalProb = prizes.filter((p) => p.isActive).reduce((acc, p) => acc + p.probability, 0)

  return (
    <main className="acb-page">
      <AdminSidebar />

      <section className="acb-content">
        {/* Feedback */}
        {feedback && (
          <div className={`acb-feedback acb-feedback--${feedback.type}`} role="alert">
            {feedback.msg}
          </div>
        )}

        {/* Header */}
        <header className="acb-header">
          <div>
            <h1 className="acb-title">Caixas Box</h1>
            <p className="acb-subtitle">Configure os prêmios, probabilidades e gerencie as aberturas.</p>
          </div>
          <button type="button" className="acb-btn acb-btn--primary" onClick={openCreate}>
            + Novo Prêmio
          </button>
        </header>

        {/* Stats */}
        {stats && (
          <div className="acb-stats-row">
            <div className="acb-stat-card">
              <span className="acb-stat-label">Total Abertas</span>
              <strong className="acb-stat-value">{stats.totalOpened.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="acb-stat-card">
              <span className="acb-stat-label">Giros Pendentes</span>
              <strong className="acb-stat-value">{stats.totalPending.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="acb-stat-card">
              <span className="acb-stat-label">Prêmios Configurados</span>
              <strong className="acb-stat-value">{prizes.length}</strong>
            </div>
            <div className={`acb-stat-card ${Math.abs(totalProb - 100) < 0.1 ? 'acb-stat-card--ok' : 'acb-stat-card--warn'}`}>
              <span className="acb-stat-label">Soma das Probabilidades</span>
              <strong className="acb-stat-value">{totalProb.toFixed(2)}%</strong>
            </div>
          </div>
        )}

        {/* Top prêmios sorteados */}
        {stats && stats.byPrize.length > 0 && (
          <div className="acb-card acb-card--compact">
            <h2 className="acb-card-title">Prêmios Mais Sorteados</h2>
            <div className="acb-by-prize-list">
              {stats.byPrize.map((item) => (
                <div key={item.prizeLabel} className="acb-by-prize-row">
                  <span className="acb-by-prize-label">{item.prizeLabel}</span>
                  <span className="acb-by-prize-count">{item.count.toLocaleString('pt-BR')}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabela de prêmios */}
        <div className="acb-card">
          <h2 className="acb-card-title">Prêmios Configurados</h2>
          {loading ? (
            <p className="acb-loading">Carregando...</p>
          ) : prizes.length === 0 ? (
            <p className="acb-loading">Nenhum prêmio cadastrado.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="acb-table-wrap">
                <table className="acb-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Foto</th>
                      <th>Prize Key</th>
                      <th>Label</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Prob. (%)</th>
                      <th>Ordem</th>
                      <th>Ativo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizes.map((prize) => (
                      <tr key={prize.id} className={!prize.isActive ? 'acb-row--inactive' : ''}>
                        <td className="acb-td--muted">#{prize.id}</td>
                        <td>
                          {prize.imageUrl ? (
                            <img
                              src={prize.imageUrl}
                              alt={prize.label}
                              className="acb-thumb"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : (
                            <span className="acb-thumb-empty">—</span>
                          )}
                        </td>
                        <td><code className="acb-code">{prize.prizeKey}</code></td>
                        <td><strong>{prize.label}</strong></td>
                        <td>
                          <span className={`acb-badge acb-badge--${prize.type}`}>
                            {prize.type === 'cash' ? 'Dinheiro' : 'Físico'}
                          </span>
                        </td>
                        <td>{prize.type === 'cash' ? formatBRL(prize.value) : '—'}</td>
                        <td>
                          <span className={`acb-prob ${prize.probability === 0 ? 'acb-prob--zero' : ''}`}>
                            {Number(prize.probability).toFixed(2)}%
                          </span>
                        </td>
                        <td className="acb-td--muted">{prize.sortOrder}</td>
                        <td>
                          <span className={`acb-active-badge ${prize.isActive ? 'acb-active-badge--on' : 'acb-active-badge--off'}`}>
                            {prize.isActive ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td>
                          <div className="acb-actions">
                            <button type="button" className="acb-btn acb-btn--edit" onClick={() => openEdit(prize)}>
                              Editar
                            </button>
                            <button type="button" className="acb-btn acb-btn--danger" onClick={() => setConfirmDeleteId(prize.id)}>
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="acb-mobile-cards">
                {prizes.map((prize) => (
                  <div key={`m-${prize.id}`} className={`acb-mobile-card ${!prize.isActive ? 'acb-mobile-card--inactive' : ''}`}>
                    {prize.imageUrl && (
                      <div className="acb-mobile-thumb-wrap">
                        <img
                          src={prize.imageUrl}
                          alt={prize.label}
                          className="acb-mobile-thumb"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    )}
                    <div className="acb-mobile-row">
                      <span>Label</span>
                      <strong>{prize.label}</strong>
                    </div>
                    <div className="acb-mobile-row">
                      <span>Prize Key</span>
                      <code className="acb-code">{prize.prizeKey}</code>
                    </div>
                    <div className="acb-mobile-row">
                      <span>Tipo</span>
                      <span className={`acb-badge acb-badge--${prize.type}`}>{prize.type === 'cash' ? 'Dinheiro' : 'Físico'}</span>
                    </div>
                    <div className="acb-mobile-row">
                      <span>Valor</span>
                      <span>{prize.type === 'cash' ? formatBRL(prize.value) : '—'}</span>
                    </div>
                    <div className="acb-mobile-row">
                      <span>Probabilidade</span>
                      <span className={`acb-prob ${prize.probability === 0 ? 'acb-prob--zero' : ''}`}>{Number(prize.probability).toFixed(2)}%</span>
                    </div>
                    <div className="acb-mobile-row">
                      <span>Ativo</span>
                      <span className={`acb-active-badge ${prize.isActive ? 'acb-active-badge--on' : 'acb-active-badge--off'}`}>
                        {prize.isActive ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div className="acb-actions acb-actions--mobile">
                      <button type="button" className="acb-btn acb-btn--edit" onClick={() => openEdit(prize)}>Editar</button>
                      <button type="button" className="acb-btn acb-btn--danger" onClick={() => setConfirmDeleteId(prize.id)}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Aviso probabilidades */}
        {prizes.length > 0 && Math.abs(totalProb - 100) >= 0.1 && (
          <p className="acb-prob-warn">
            ⚠️ A soma das probabilidades ativas é <strong>{totalProb.toFixed(2)}%</strong>. O ideal é que some <strong>100%</strong>.
          </p>
        )}
      </section>

      {/* Modal criar/editar */}
      {modalOpen && (
        <div className="acb-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="acb-modal-title">
          <div className="acb-modal">
            <div className="acb-modal-header">
              <h2 id="acb-modal-title">{editingId !== null ? 'Editar Prêmio' : 'Novo Prêmio'}</h2>
              <button type="button" className="acb-modal-close" onClick={closeModal} aria-label="Fechar">×</button>
            </div>

            <div className="acb-modal-body">
              {editingId === null && (
                <div className="acb-field">
                  <label className="acb-label">Prize Key <span className="acb-required">*</span></label>
                  <input
                    className="acb-input"
                    type="text"
                    placeholder="ex: iphone, r50, caixa_som"
                    value={form.prizeKey}
                    onChange={(e) => setForm((f) => ({ ...f, prizeKey: e.target.value }))}
                  />
                  <small className="acb-hint">Identificador único (sem espaços). Usado para o ícone no frontend.</small>
                </div>
              )}

              <div className="acb-field">
                <label className="acb-label">Label (nome exibido) <span className="acb-required">*</span></label>
                <input
                  className="acb-input"
                  type="text"
                  placeholder="ex: iPhone 16, R$ 50,00"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                />
              </div>

              <div className="acb-field-row">
                <div className="acb-field">
                  <label className="acb-label">Tipo</label>
                  <select
                    className="acb-input"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'cash' | 'physical' }))}
                  >
                    <option value="cash">Dinheiro (cash)</option>
                    <option value="physical">Físico (physical)</option>
                  </select>
                </div>

                <div className="acb-field">
                  <label className="acb-label">Valor (R$)</label>
                  <input
                    className="acb-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    disabled={form.type === 'physical'}
                  />
                  {form.type === 'physical' && <small className="acb-hint">Prêmio físico não tem valor em dinheiro.</small>}
                </div>
              </div>

              <div className="acb-field-row">
                <div className="acb-field">
                  <label className="acb-label">Probabilidade (%)</label>
                  <input
                    className="acb-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    value={form.probability}
                    onChange={(e) => setForm((f) => ({ ...f, probability: e.target.value }))}
                  />
                </div>

                <div className="acb-field">
                  <label className="acb-label">Ordem (sort)</label>
                  <input
                    className="acb-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  />
                </div>
              </div>

              <div className="acb-field acb-field--check">
                <label className="acb-check-label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <span>Prêmio ativo (aparece no sorteio)</span>
                </label>
              </div>

              <div className="acb-field">
                <label className="acb-label">URL da Foto (opcional)</label>
                <input
                  className="acb-input"
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                />
                <small className="acb-hint">Link direto para a imagem do prêmio. Deixe em branco para usar o ícone padrão.</small>
                {form.imageUrl.trim() && (
                  <div className="acb-img-preview-wrap">
                    <img
                      src={form.imageUrl.trim()}
                      alt="Preview"
                      className="acb-img-preview"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = ''
                        ;(e.currentTarget as HTMLImageElement).alt = 'URL inválida ou imagem inacessível'
                      }}
                    />
                    <small className="acb-hint">Preview da imagem</small>
                  </div>
                )}
              </div>
            </div>

            <div className="acb-modal-footer">
              <button type="button" className="acb-btn acb-btn--ghost" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="acb-btn acb-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : editingId !== null ? 'Salvar Alterações' : 'Criar Prêmio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDeleteId !== null && (
        <div className="acb-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="acb-del-title">
          <div className="acb-modal acb-modal--sm">
            <div className="acb-modal-header">
              <h2 id="acb-del-title">Confirmar Exclusão</h2>
              <button type="button" className="acb-modal-close" onClick={() => setConfirmDeleteId(null)} aria-label="Fechar">×</button>
            </div>
            <div className="acb-modal-body">
              <p>
                Tem certeza que deseja remover o prêmio <strong>#{confirmDeleteId}</strong>?
                <br />
                <small className="acb-hint">Esta ação não pode ser desfeita.</small>
              </p>
            </div>
            <div className="acb-modal-footer">
              <button
                type="button"
                className="acb-btn acb-btn--ghost"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="acb-btn acb-btn--danger"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
              >
                {deleting ? 'Removendo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
