import { UserDataManage, type DevicesInfo } from './data'
import { ListManage } from '@/modules/list/manage'
import { DislikeManage } from '@/modules/dislike/manage'

export interface UserSpace {
  dataManage: UserDataManage
  listManage: ListManage
  dislikeManage: DislikeManage
  getDevices: () => Promise<LX.Sync.KeyInfo[]>
  removeDevice: (clientId: string) => Promise<void>
  flush: () => Promise<void>
}

// 模块级别单例，由 UserSyncDO 在 blockConcurrencyWhile 中初始化
// 注意：同一 isolate 中的多个 DO 实例可能共享此变量，DO fetch 串行化保证大多数情况下正确，
// 但 await 期间可能被其他 DO 覆盖。getUserSpace 会校验 userName 防止静默数据损坏。
let _userSpace: UserSpace | null = null
let _currentUserName = ''

export const setUserSpace = (userSpace: UserSpace) => {
  _userSpace = userSpace
}

export const setCurrentUserName = (name: string) => {
  _currentUserName = name
}

export const getUserSpace = (name?: string): UserSpace => {
  if (!_userSpace) throw new Error('UserSpace not initialized')
  // 校验：若请求的 userName 与当前单例的 userName 不一致，说明 DO 上下文已切换
  if (name && _currentUserName && name !== _currentUserName) {
    throw new Error(`UserSpace context mismatch: requested ${name}, current ${_currentUserName}`)
  }
  return _userSpace
}

export const createUserSpace = (
  devicesInfo: DevicesInfo,
  storage: DurableObjectStorage,
  listSnapshotInfo: any,
  listData: LX.Sync.List.ListData,
  dislikeSnapshotInfo: any,
  dislikeRules: LX.Dislike.DislikeRules,
  userName: string,
  maxSnapshotNum: number,
): UserSpace => {
  const dataManage = new UserDataManage(devicesInfo, storage)
  const listManage = new ListManage(storage, listSnapshotInfo, listData, userName, maxSnapshotNum)
  const dislikeManage = new DislikeManage(storage, dislikeSnapshotInfo, dislikeRules, userName, maxSnapshotNum)

  const userSpace: UserSpace = {
    dataManage,
    listManage,
    dislikeManage,
    async getDevices() {
      return this.dataManage.getAllClientKeyInfo()
    },
    async removeDevice(clientId) {
      await listManage.removeDevice(clientId)
      await dislikeManage.removeDevice(clientId)
      await dataManage.removeClientKeyInfo(clientId)
    },
    async flush() {
      await Promise.all([listManage.flush(), dislikeManage.flush()])
    },
  }
  return userSpace
}

export * from './data'
