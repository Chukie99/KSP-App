import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
  auth: {
    login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    changePassword: (userId: number, oldPassword: string, newPassword: string) => ipcRenderer.invoke('auth:change-password', userId, oldPassword, newPassword),
  },
  users: {
    list: () => ipcRenderer.invoke('users:list'),
    create: (data: any) => ipcRenderer.invoke('users:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('users:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('users:delete', id),
  },
  anggota: {
    list: () => ipcRenderer.invoke('anggota:list'),
    get: (id: number) => ipcRenderer.invoke('anggota:get', id),
    create: (data: any) => ipcRenderer.invoke('anggota:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('anggota:update', id, data),
    toggleStatus: (id: number) => ipcRenderer.invoke('anggota:toggle-status', id),
    delete: (id: number) => ipcRenderer.invoke('anggota:delete', id),
  },
  simpanan: {
    list: (anggotaId?: number) => ipcRenderer.invoke('simpanan:list', anggotaId),
    create: (data: any) => ipcRenderer.invoke('simpanan:create', data),
    summary: (anggotaId: number) => ipcRenderer.invoke('simpanan:summary', anggotaId),
  },
  pinjaman: {
    list: () => ipcRenderer.invoke('pinjaman:list'),
    create: (data: any) => ipcRenderer.invoke('pinjaman:create', data),
    detail: (id: number) => ipcRenderer.invoke('pinjaman:detail', id),
  },
  pembayaran: {
    list: () => ipcRenderer.invoke('pembayaran:list'),
    create: (data: any) => ipcRenderer.invoke('pembayaran:create', data),
  },
  pengaturan: {
    get: () => ipcRenderer.invoke('pengaturan:get'),
    update: (key: string, value: string) => ipcRenderer.invoke('pengaturan:update', key, value),
  },
  dashboard: {
    stats: () => ipcRenderer.invoke('dashboard:stats'),
  },
  laporan: {
    transaksi: (from: string, to: string) => ipcRenderer.invoke('laporan:transaksi', from, to),
    perAnggota: (anggotaId: number) => ipcRenderer.invoke('laporan:per-anggota', anggotaId),
  },
  backup: {
    database: () => ipcRenderer.invoke('backup:database'),
    restore: () => ipcRenderer.invoke('restore:database'),
  },
  export: {
    save: (content: string, name: string) => ipcRenderer.invoke('export:save', content, name),
  },
})
