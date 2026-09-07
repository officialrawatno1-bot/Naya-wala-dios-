import React, { Component, ErrorInfo, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical Runtime Error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-rose-500/20 text-rose-400">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-white">App Runtime Error Detected</h2>
            <p className="text-xs text-slate-300">
              Browser cache ya purane data format ki wajah se crash hua hai:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl text-left border border-rose-900 overflow-x-auto text-xs font-mono text-rose-400">
              {this.state.error?.message || String(this.state.error)}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
            >
              🧹 Clear Cache &amp; Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
)
