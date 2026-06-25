import { throttle } from '@/utils/common'

interface SnapshotInfo {
  latest: string | null
  time: number
  list: string[]
  clients: Record<string, LX.Sync.Dislike.ListInfo>
}

export class SnapshotDataManage {
  private storage: DurableObjectStorage
  private prefix: 'list' | 'dislike'
  private userName: string
  private maxSnapshotNum: number
  snapshotInfo: SnapshotInfo
  clientSnapshotKeys: Set<string>
  private readonly saveSnapshotInfoThrottle: () => void

  isIncludesDevice = (key: string) => {
    return this.clientSnapshotKeys.has(key)
  }

  clearOldSnapshot = async() => {
    if (!this.snapshotInfo) return
    // 直接在原数组上操作：保留被设备引用的快照，删除多余的旧快照
    const referenced = this.clientSnapshotKeys
    const toRemove: string[] = []
    for (const key of this.snapshotInfo.list) {
      if (referenced.has(key)) continue
      toRemove.push(key)
    }
    const surplus = toRemove.length > this.maxSnapshotNum
      ? toRemove.slice(this.maxSnapshotNum)
      : []
    if (surplus.length === 0) return
    for (const name of surplus) {
      await this.removeSnapshot(name)
      const idx = this.snapshotInfo.list.indexOf(name)
      if (idx >= 0) this.snapshotInfo.list.splice(idx, 1)
    }
    if (surplus.length) this.saveSnapshotInfo(this.snapshotInfo)
  }

  updateDeviceSnapshotKey = async(clientId: string, key: string) => {
    let client = this.snapshotInfo.clients[clientId]
    if (!client) client = this.snapshotInfo.clients[clientId] = { snapshotKey: '', lastSyncDate: 0 }
    if (client.snapshotKey) this.clientSnapshotKeys.delete(client.snapshotKey)
    client.snapshotKey = key
    client.lastSyncDate = Date.now()
    this.clientSnapshotKeys.add(key)
    this.saveSnapshotInfoThrottle()
  }

  getDeviceCurrentSnapshotKey = async(clientId: string) => {
    const client = this.snapshotInfo.clients[clientId]
    return client?.snapshotKey
  }

  getSnapshotInfo = async(): Promise<SnapshotInfo> => {
    return this.snapshotInfo
  }

  saveSnapshotInfo = (info: SnapshotInfo) => {
    this.snapshotInfo = info
    this.saveSnapshotInfoThrottle()
  }

  removeSnapshotInfo = (clientId: string) => {
    const client = this.snapshotInfo.clients[clientId]
    if (!client) return
    if (client.snapshotKey) this.clientSnapshotKeys.delete(client.snapshotKey)
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.snapshotInfo.clients[clientId]
    this.saveSnapshotInfoThrottle()
  }

  getSnapshot = async(name: string): Promise<LX.Dislike.DislikeRules | null> => {
    try {
      const data = await this.storage.get<string>(`${this.prefix}:snap:${name}`)
      return data ?? null
    } catch (err) {
      console.warn(err)
      return null
    }
  }

  saveSnapshot = async(name: string, data: string) => {
    console.log('saveSnapshot', this.userName, name)
    await this.storage.put(`${this.prefix}:snap:${name}`, data)
  }

  removeSnapshot = async(name: string) => {
    console.log('removeSnapshot', this.userName, name)
    await this.storage.delete(`${this.prefix}:snap:${name}`)
  }

  flush = async(): Promise<void> => {
    await this.storage.put(`${this.prefix}:snapshotInfo`, this.snapshotInfo)
  }

  constructor(
    storage: DurableObjectStorage,
    prefix: 'list' | 'dislike',
    preloadedSnapshotInfo: SnapshotInfo,
    userName: string,
    maxSnapshotNum: number,
  ) {
    this.storage = storage
    this.prefix = prefix
    this.userName = userName
    this.maxSnapshotNum = maxSnapshotNum
    this.snapshotInfo = preloadedSnapshotInfo

    this.saveSnapshotInfoThrottle = throttle(() => {
      void this.storage.put(`${this.prefix}:snapshotInfo`, this.snapshotInfo).then(() => {
        return this.clearOldSnapshot()
      }).catch(err => console.error(err))
    })

    this.clientSnapshotKeys = new Set(Object.values(this.snapshotInfo.clients).map(device => device.snapshotKey).filter(k => k))
  }
}
