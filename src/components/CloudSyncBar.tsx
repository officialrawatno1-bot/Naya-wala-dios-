import React, { useState, useEffect } from 'react';
import { 
  Cloud, CloudUpload, CloudDownload, Save, Check, 
  Loader2, History, RotateCcw, X 
} from 'lucide-react';

interface CloudSyncBarProps {
  storageKey: string;
  sheetTitle: string;
  getData: () => any;
  onLoadData: (cloudData: any) => void;
  onSaveLocal?: () => void;
}

export const CloudSyncBar: React.FC<CloudSyncBarProps> = ({
  storageKey,
  sheetTitle,
  getData,
  onLoadData,
  onSaveLocal
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`dios_sync_ts_${storageKey}`) || null;
    } catch (e) {
      return null;
    }
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<Array<{ snapshotKey: string; timestamp: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auto-clear message after 3.5 seconds
  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // Handler: Save Local Draft
  const handleLocalSave = () => {
    if (onSaveLocal) {
      onSaveLocal();
    }
    setStatusMsg({ type: 'success', text: '💾 Local Draft Saved on this iPad!' });
  };

  // Handler: Push / Update to Cloudflare KV
  const handleUpdateToCloud = async () => {
    setIsUpdating(true);
    setStatusMsg(null);
    try {
      const currentData = getData();
      const res = await fetch('/api/cloud-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: storageKey,
          data: currentData,
          device: 'iPad Safari'
        })
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Cloud sync failed');
      }

      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + now.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
      setLastSyncTime(formattedTime);
      try {
        localStorage.setItem(`dios_sync_ts_${storageKey}`, formattedTime);
      } catch (e) {}

      setStatusMsg({ type: 'success', text: `✅ Cloud Updated Successfully at ${formattedTime}!` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `❌ Cloud Error: ${err.message || String(err)}` });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler: Pull Fresh from Cloudflare KV
  const handlePullFromCloud = async () => {
    setIsPulling(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/cloud-storage?key=${encodeURIComponent(storageKey)}&t=${Date.now()}`);
      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Failed to pull from cloud');
      }

      if (resData.data === null || resData.data === undefined) {
        setStatusMsg({ type: 'error', text: 'ℹ️ No cloud data found yet. Click "Update to Cloud" to push first version!' });
        return;
      }

      onLoadData(resData.data);

      if (resData.updatedAt) {
        const dt = new Date(resData.updatedAt);
        const formattedTime = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + dt.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
        setLastSyncTime(formattedTime);
      }

      setStatusMsg({ type: 'success', text: '📥 Fresh data loaded from Cloudflare Cloud!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `❌ Pull Error: ${err.message || String(err)}` });
    } finally {
      setIsPulling(false);
    }
  };

  // Handler: Fetch History Snapshots
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/cloud-storage?action=history&key=${encodeURIComponent(storageKey)}`);
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.history)) {
        setHistoryList(resData.history);
      } else {
        setHistoryList([]);
      }
    } catch (e) {
      setHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handler: Restore a specific snapshot
  const handleRestoreSnapshot = async (snapshotKey: string) => {
    if (!window.confirm("Kya aap is backup snapshot ko screen par restore karna chahte hain?")) {
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/cloud-storage?key=${encodeURIComponent(snapshotKey)}`);
      const resData = await res.json();
      if (resData.success && resData.data) {
        onLoadData(resData.data);
        setShowHistoryModal(false);
        setStatusMsg({ type: 'success', text: '🔄 Backup snapshot restored onto screen!' });
      }
    } catch (e: any) {
      alert("Restore failed: " + e.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950/90 rounded-xl border border-cyan-500/30 text-xs shadow-md">
        
        {/* Left: Indicator & Status */}
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/30">
            <Cloud size={15} />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-xs">{sheetTitle}</span>
              <span className="text-[10px] text-slate-500 font-mono">({storageKey})</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {lastSyncTime ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={11} /> Cloud Synced: {lastSyncTime}
                </span>
              ) : (
                <span className="text-slate-500">Not synced to cloud yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Buttons Group */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 1. Local Draft */}
          <button
            type="button"
            onClick={handleLocalSave}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-semibold transition cursor-pointer text-xs active:scale-95"
            title="Save draft locally on this iPad"
          >
            <Save size={13} /> Draft
          </button>

          {/* 2. Update to Cloud */}
          <button
            type="button"
            onClick={handleUpdateToCloud}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-cyan-600/20 transition cursor-pointer text-xs"
            title="Push to Cloudflare KV"
          >
            {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <CloudUpload size={13} />}
            {isUpdating ? 'Uploading...' : '☁️ Update to Cloud'}
          </button>

          {/* 3. Pull from Cloud */}
          <button
            type="button"
            onClick={handlePullFromCloud}
            disabled={isPulling}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/40 rounded-xl font-semibold transition cursor-pointer text-xs active:scale-95"
            title="Pull fresh data from Cloudflare KV"
          >
            {isPulling ? <Loader2 size={13} className="animate-spin" /> : <CloudDownload size={13} />}
            {isPulling ? 'Loading...' : '📥 Pull Cloud'}
          </button>

          {/* 4. History / Restore */}
          <button
            type="button"
            onClick={handleOpenHistory}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
            title="Time Machine / Restore Backup"
          >
            <History size={14} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div className={`p-2 px-3 rounded-xl text-xs flex items-center justify-between border ${
          statusMsg.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="p-0.5 hover:text-white"><X size={13} /></button>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History size={16} className="text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Version History (Time Machine)</h4>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <p className="text-xs text-slate-400">Select any previous backup snapshot to restore on screen:</p>

            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {loadingHistory ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-cyan-400" /> Loading snapshots...
                </div>
              ) : historyList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-xl">
                  No backup snapshots found yet. Click "Update to Cloud" to create first snapshot.
                </div>
              ) : (
                historyList.map((item, idx) => {
                  const dateFormatted = new Date(item.timestamp).toLocaleString();
                  return (
                    <div key={item.snapshotKey} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div>
                        <div className="font-bold text-white">Snapshot #{historyList.length - idx}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{dateFormatted}</div>
                      </div>
                      <button
                        onClick={() => handleRestoreSnapshot(item.snapshotKey)}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={11} /> Restore
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
