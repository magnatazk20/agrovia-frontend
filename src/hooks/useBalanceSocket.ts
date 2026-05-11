import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export type BalanceData = {
  userId: number
  balance: number
  commissionBalance: number
  rechargeBalance: number
  totalDeposits: number
}

export function useBalanceSocket(
  userId: number | undefined | null,
  onUpdate: (data: BalanceData) => void
) {
  const socketRef = useRef<Socket | null>(null)
  const callbackRef = useRef(onUpdate)
  callbackRef.current = onUpdate

  useEffect(() => {
    if (!userId) return

    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('balance:subscribe', { userId })
    })

    socket.on('balance:update', (data: BalanceData) => {
      if (Number(data?.userId) === userId) {
        callbackRef.current(data)
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId])
}
