'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-red-500/10 border-2 border-red-500 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-4">🚨 Error Detected</h1>
            <div className="bg-slate-800 rounded p-4 mb-4">
              <p className="text-white font-mono text-sm break-all">
                <strong>Error:</strong> {this.state.error?.toString()}
              </p>
            </div>
            <div className="bg-slate-800 rounded p-4 mb-4 max-h-60 overflow-auto">
              <p className="text-slate-300 font-mono text-xs whitespace-pre-wrap break-all">
                {this.state.errorInfo?.componentStack}
              </p>
            </div>
            <div className="bg-slate-800 rounded p-4 mb-4 max-h-40 overflow-auto">
              <p className="text-slate-400 font-mono text-xs break-all">
                <strong>Stack:</strong> {this.state.error?.stack}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold w-full"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
