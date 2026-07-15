import { useAuthStore } from '../store/auth'
export default function TitleBar() {
  const { user } = useAuthStore()
  return (
    <div className="win-titlebar">
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded bg-[#0078D4] flex items-center justify-center">
          <span className="text-[9px] font-bold text-white leading-none">K</span>
        </div>
        <span className="text-[12px] font-semibold text-[#616161]">KSP Simpan Pinjam</span>
        {user && <span className="text-[11px] text-[#9e9e9e] ml-0.5">• {user.role === 'admin' ? 'Administrator' : user.role === 'teller' ? 'Teller' : 'Anggota'}</span>}
      </div>
      <div className="flex h-full">
        <button onClick={() => window.api.window.minimize()} className="win-titlebar-btn">
          <svg width="10" height="1"><rect width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button onClick={() => window.api.window.maximize()} className="win-titlebar-btn">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="9" height="9"/></svg>
        </button>
        <button onClick={() => window.api.window.close()} className="win-titlebar-btn close">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 1l8 8M9 1l-8 8"/></svg>
        </button>
      </div>
    </div>
  )
}
