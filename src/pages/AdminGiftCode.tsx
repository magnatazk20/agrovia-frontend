import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './AdminRouletteCode.css'

type GiftCodeItem = {
  id: number
  code: string
  rewardValue: number
  maxUses: number
  notes: string
  createdAt: string | null
  usedCount: number
  isActive: boolean
  isListedForSale: boolean
  salePrice: number | null
  discountPercent: number | null
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminGiftCode() {
  const [code, setCode] = useState('')
  const [rewardValue, setRewardValue] = useState('')
  const [maxUses, setMaxUses] = useState('1')
  const [notes, setNotes] = useState('')
  const [isListedForSale, setIsListedForSale] = useState(false)
  const [salePrice, setSalePrice] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [createdCodes, setCreatedCodes] = useState<GiftCodeItem[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const totalCodes = useMemo(() => createdCodes.length, [createdCodes])

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const loadCodes = async () => {
    if (!token) {
      const msg = 'Token não encontrado. Faça login novamente.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    setLoadingList(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/gift-codes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json() as {
        ok?: boolean
        error?: string
        giftCodes?: Array<{
          id?: number
          code?: string
          rewardValue?: number
          maxTotalUses?: number
          notes?: string
          createdAt?: string | null
          usedCount?: number
          isActive?: boolean
          isListedForSale?: boolean
          salePrice?: number | null
          discountPercent?: number | null
        }>
      }

      if (!res.ok || !data?.ok) {
        const msg = data?.error || 'Falha ao carregar códigos.'
        setMessage({ type: 'error', text: msg })
        window.alert(msg)
        return
      }

      const mapped = Array.isArray(data.giftCodes)
        ? data.giftCodes.map((item) => ({
            id: Number(item.id ?? 0),
            code: String(item.code ?? ''),
            rewardValue: Number(item.rewardValue ?? 0),
            maxUses: Number(item.maxTotalUses ?? 0),
            notes: String(item.notes ?? ''),
            createdAt: item.createdAt ?? null,
            usedCount: Number(item.usedCount ?? 0),
            isActive: Boolean(item.isActive),
            isListedForSale: Boolean(item.isListedForSale),
            salePrice: item.salePrice == null ? null : Number(item.salePrice),
            discountPercent: item.discountPercent == null ? null : Number(item.discountPercent),
          }))
        : []

      setCreatedCodes(mapped)
    } catch {
      const msg = 'Erro de conexão ao carregar códigos.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadCodes()
    const intervalId = window.setInterval(() => {
      loadCodes()
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const handleDelete = async (giftCodeId: number, giftCodeLabel: string) => {
    if (!token) {
      const msg = 'Token não encontrado. Faça login novamente.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    const confirmed = window.confirm(`Deseja realmente apagar o código ${giftCodeLabel}?`)
    if (!confirmed) return

    setDeletingId(giftCodeId)
    setMessage(null)

    try {
      const res = await fetch(`${API_URL}/api/admin/gift-codes/${giftCodeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        const msg = data?.error || 'Erro ao apagar código.'
        setMessage({ type: 'error', text: msg })
        window.alert(msg)
        return
      }

      const msg = data.message || `Código ${giftCodeLabel} apagado com sucesso.`
      setMessage({ type: 'success', text: msg })
      window.alert(msg)
      await loadCodes()
    } catch {
      const msg = 'Erro de conexão ao apagar código.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreate = async () => {
    const normalizedCode = code.trim().toUpperCase()
    const numericReward = Number(rewardValue.replace(',', '.'))
    const numericMaxUses = Number(maxUses)
    const numericSalePrice = Number(salePrice.replace(',', '.'))
    const numericDiscountPercent = discountPercent.trim() ? Number(discountPercent.replace(',', '.')) : null

    if (!normalizedCode) {
      const msg = 'Informe um código.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    if (!Number.isFinite(numericReward) || numericReward <= 0) {
      const msg = 'Informe um valor de recompensa válido.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    if (!Number.isInteger(numericMaxUses) || numericMaxUses <= 0) {
      const msg = 'Informe um limite de resgates válido.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    if (isListedForSale && !productName.trim()) {
      const msg = 'Informe o nome do produto para venda.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    if (isListedForSale && !productDescription.trim()) {
      const msg = 'Informe a descrição do produto para venda.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    if (isListedForSale && (!Number.isFinite(numericSalePrice) || numericSalePrice <= 0)) {
      const msg = 'Informe um valor de vale presente válido para venda.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    if (
      isListedForSale &&
      numericDiscountPercent != null &&
      (!Number.isFinite(numericDiscountPercent) || numericDiscountPercent < 0 || numericDiscountPercent > 100)
    ) {
      const msg = 'Cupom em % deve estar entre 0 e 100.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    if (!token) {
      const msg = 'Token não encontrado. Faça login novamente.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const res = await fetch(`${API_URL}/api/admin/gift-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: normalizedCode,
          rewardType: 'balance_credit',
          rewardValue: Number(numericReward.toFixed(2)),
          maxTotalUses: numericMaxUses,
          notes: notes.trim(),
          productName: isListedForSale ? productName.trim() : '',
          description: isListedForSale ? productDescription.trim() : '',
          imageUrl: isListedForSale ? imageUrl.trim() : '',
          isListedForSale,
          salePrice: isListedForSale ? Number(numericSalePrice.toFixed(2)) : null,
          discountPercent: isListedForSale && numericDiscountPercent != null
            ? Number(numericDiscountPercent.toFixed(2))
            : null,
        }),
      })

      const data = await res.json() as {
        ok?: boolean
        error?: string
        giftCode?: {
          id?: number
          code?: string
          rewardValue?: number
          maxTotalUses?: number
          notes?: string
        }
      }

      if (!res.ok || !data?.ok) {
        const msg = data?.error || 'Erro ao criar código.'
        setMessage({ type: 'error', text: msg })
        window.alert(msg)
        return
      }

      setCode('')
      setRewardValue('')
      setMaxUses('1')
      setNotes('')
      setIsListedForSale(false)
      setSalePrice('')
      setDiscountPercent('')
      setProductName('')
      setProductDescription('')
      setImageUrl('')
      const msg = `Código ${normalizedCode} criado com sucesso.`
      setMessage({ type: 'success', text: msg })
      window.alert(msg)

      await loadCodes()
    } catch {
      const msg = 'Erro de conexão ao criar código.'
      setMessage({ type: 'error', text: msg })
      window.alert(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="roulette-code-page">
      <AdminSidebar />
      <section className="roulette-code-content">
        <header className="roulette-code-header">
          <div>
            <h1 className="roulette-code-title">Gerenciar Códigos de Presente</h1>
            <p className="roulette-code-subtitle">
              Crie códigos para serem resgatados pelos usuários na página de perfil.
            </p>
          </div>
        </header>

        <section className="roulette-code-card">
          <div className="roulette-code-card-head">
            <h2>Novo Código de Presente</h2>
            <p>Total cadastrado no banco: {totalCodes}</p>
          </div>

          <div className="roulette-code-grid">
            <div className="roulette-code-field">
              <label htmlFor="gift-code-input">Código</label>
              <input
                id="gift-code-input"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Ex.: PRESENTE50"
                maxLength={20}
              />
            </div>

            <div className="roulette-code-field">
              <label htmlFor="gift-reward-input">Recompensa (R$)</label>
              <input
                id="gift-reward-input"
                type="text"
                value={rewardValue}
                onChange={(event) => setRewardValue(event.target.value)}
                placeholder="Ex.: 50"
              />
            </div>

            <div className="roulette-code-field">
              <label htmlFor="gift-max-uses-input">Limite de Resgates</label>
              <input
                id="gift-max-uses-input"
                type="number"
                min={1}
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
              />
            </div>

            <div className="roulette-code-field full">
              <label htmlFor="gift-notes-input">Observações (opcional)</label>
              <textarea
                id="gift-notes-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Ex.: campanha do fim de semana"
              />
            </div>

            <div className="roulette-code-field full">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isListedForSale}
                  onChange={(event) => setIsListedForSale(event.target.checked)}
                />
                Vender na loja
              </label>
            </div>

            <div className="roulette-code-field full">
              <label htmlFor="gift-image-url-input">Link da Foto (opcional)</label>
              <input
                id="gift-image-url-input"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            {isListedForSale ? (
              <>
                <div className="roulette-code-field">
                  <label htmlFor="gift-product-name-input">Nome do Produto</label>
                  <input
                    id="gift-product-name-input"
                    type="text"
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    placeholder="Ex.: Vale Presente Premium"
                    maxLength={120}
                  />
                </div>

                <div className="roulette-code-field full">
                  <label htmlFor="gift-product-description-input">Descrição do Produto</label>
                  <textarea
                    id="gift-product-description-input"
                    value={productDescription}
                    onChange={(event) => setProductDescription(event.target.value)}
                    rows={3}
                    placeholder="Descreva o produto que será exibido na loja"
                  />
                </div>

                <div className="roulette-code-field">
                  <label htmlFor="gift-sale-price-input">Valor do Vale Presente (R$)</label>
                  <input
                    id="gift-sale-price-input"
                    type="text"
                    value={salePrice}
                    onChange={(event) => setSalePrice(event.target.value)}
                    placeholder="Ex.: 30"
                  />
                </div>

                <div className="roulette-code-field">
                  <label htmlFor="gift-discount-percent-input">Cupom de desconto em % (opcional)</label>
                  <input
                    id="gift-discount-percent-input"
                    type="text"
                    value={discountPercent}
                    onChange={(event) => setDiscountPercent(event.target.value)}
                    placeholder="Ex.: 10"
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="roulette-code-actions">
            <button type="button" className="roulette-code-btn" onClick={handleCreate} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Código'}
            </button>
          </div>

          {message ? (
            <p
              className="roulette-code-feedback"
              style={{
                color: message.type === 'error' ? '#fecaca' : '#bbf7d0',
                background: message.type === 'error' ? 'rgba(127, 29, 29, 0.45)' : 'rgba(20, 83, 45, 0.45)',
                border: `1px solid ${message.type === 'error' ? 'rgba(248, 113, 113, 0.55)' : 'rgba(74, 222, 128, 0.45)'}`,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              {message.text}
            </p>
          ) : null}

          {loadingList ? <p className="roulette-code-hint" style={{ color: '#cbd5e1' }}>Carregando códigos...</p> : null}

          {createdCodes.length ? (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ marginBottom: 10, color: '#f8fafc' }}>Códigos no Banco</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {createdCodes.map((item) => {
                  const isLimitReached = item.maxUses > 0 && item.usedCount >= item.maxUses

                  return (
                  <div
                    key={item.id}
                    style={{
                      border: isLimitReached ? '1px solid rgba(248,113,113,0.65)' : '1px solid rgba(148,163,184,0.3)',
                      borderRadius: 12,
                      padding: 12,
                      background: isLimitReached ? 'rgba(127,29,29,0.25)' : 'rgba(15,23,42,0.6)',
                    }}
                  >
                    <strong style={{ color: '#f8fafc' }}>{item.code}</strong>
                    <p style={{ margin: '6px 0 0', color: '#cbd5e1' }}>
                      Recompensa: {formatBRL(item.rewardValue)} • Limite: {item.maxUses} • Usos: {item.usedCount}
                    </p>
                    <p style={{ margin: '6px 0 0', color: isLimitReached ? '#fca5a5' : '#93c5fd', fontWeight: 600 }}>
                      Pessoas que já resgataram (tempo real): {item.usedCount}
                    </p>
                    {isLimitReached ? (
                      <p
                        style={{
                          margin: '6px 0 0',
                          color: '#fecaca',
                          background: 'rgba(127, 29, 29, 0.45)',
                          border: '1px solid rgba(248, 113, 113, 0.55)',
                          borderRadius: 8,
                          padding: '6px 8px',
                          display: 'inline-block',
                          fontWeight: 700,
                        }}
                      >
                        Limite atingido
                      </p>
                    ) : null}
                    <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
                      Status: {item.isActive ? 'Ativo' : 'Inativo'} • Criado em: {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
                      Loja: {item.isListedForSale ? 'Sim' : 'Não'}
                      {item.isListedForSale ? ` • Valor: ${formatBRL(Number(item.salePrice ?? 0))}` : ''}
                      {item.isListedForSale && item.discountPercent != null ? ` • Cupom: ${item.discountPercent}%` : ''}
                    </p>
                    {item.notes ? (
                      <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>Obs: {item.notes}</p>
                    ) : null}

                    <div style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.code)}
                        disabled={deletingId === item.id}
                        style={{
                          background: deletingId === item.id ? '#3f3f46' : '#991b1b',
                          color: '#ffffff',
                          border: deletingId === item.id ? '1px solid #71717a' : '1px solid #f87171',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontWeight: 600,
                          cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {deletingId === item.id ? 'Apagando...' : 'Apagar'}
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
