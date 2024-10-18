import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'

export interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  description?: string
}

const ToastContext = createContext<{
  addToast: (toast: ToastProps) => void
  removeToast: (id: number) => void
} | null>(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return {
    ...context,
    toasts: [] 
  }
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([])

  const addToast = (toast: ToastProps) => {
    const id = Date.now()
    setToasts((currentToasts) => [...currentToasts, { ...toast, id }])
  }

  const removeToast = (id: number) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer: React.FC<{
  toasts: (ToastProps & { id: number })[]
  removeToast: (id: number) => void
}> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

export const Toast: React.FC<ToastProps & { onClose: () => void }> = ({
  message,
  type,
  duration = 3000,
  description,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'info':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div
      className={`${getBackgroundColor()} text-white p-4 rounded-md shadow-lg mb-2 max-w-md`}
      role="alert"
    >
      <div className="font-bold">{message}</div>
      {description && <div className="mt-1 text-sm">{description}</div>}
    </div>
  )
}