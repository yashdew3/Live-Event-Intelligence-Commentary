import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '../store/authStore'

interface WSMessage {
  type: string
  [key: string]: unknown
}

export const useWebSocket = (eventId: string | null) => {
  const { token } = useAuthStore()
  const ws = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<WSMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!eventId || !token) return
    if (ws.current?.readyState === WebSocket.OPEN) return

    const url = `ws://localhost:8000/ws/events/${eventId}?token=${token}`
    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      setIsConnected(true)
      console.log(`[WS] Connected to event ${eventId}`)
    }

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WSMessage
        setMessages((prev) => [data, ...prev].slice(0, 100))
      } catch {}
    }

    ws.current.onclose = () => {
      setIsConnected(false)
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.current.onerror = () => {
      ws.current?.close()
    }
  }, [eventId, token])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  const sendPing = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'ping' }))
    }
  }, [])

  return { messages, isConnected, sendPing }
}