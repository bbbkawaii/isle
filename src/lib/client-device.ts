'use client'

// 设备令牌：localStorage 持久化，用于找回自己的游戏局与登记身份
export function getDeviceToken(): string {
  if (typeof window === 'undefined') return ''
  let token = localStorage.getItem('island_device_token')
  if (!token) {
    token = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    localStorage.setItem('island_device_token', token)
  }
  return token
}

export function setMyUserId(id: string) {
  localStorage.setItem('island_user_id', id)
}

export function getMyUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('island_user_id')
}

// 登岛证过期（数据库重置后 userId 失效）：清掉本地身份，引导重新登岛
export function clearIdentity() {
  localStorage.removeItem('island_user_id')
  localStorage.removeItem('island_session_id')
}
