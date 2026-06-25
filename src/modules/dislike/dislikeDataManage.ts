import { SPLIT_CHAR } from '@/constants'
import { type SnapshotDataManage } from './snapshotDataManage'
import { filterRules } from './utils'

const filterRulesToString = (rules: string) => {
  return Array.from(filterRules(rules)).join('\n')
}

export class DislikeDataManage {
  snapshotDataManage: SnapshotDataManage
  dislikeRules = ''

  constructor(snapshotDataManage: SnapshotDataManage, preloadedDislikeRules: LX.Dislike.DislikeRules) {
    this.snapshotDataManage = snapshotDataManage
    this.dislikeRules = preloadedDislikeRules
  }

  getDislikeRules = async(): Promise<LX.Dislike.DislikeRules> => {
    return this.dislikeRules
  }

  addDislikeInfo = async(infos: LX.Dislike.DislikeMusicInfo[]) => {
    this.dislikeRules = filterRulesToString(this.dislikeRules + '\n' + infos.map(info => `${info.name ?? ''}${SPLIT_CHAR.DISLIKE_NAME}${info.singer ?? ''}`).join('\n'))
    return this.dislikeRules
  }

  overwriteDislikeInfo = async(rules: string) => {
    this.dislikeRules = filterRulesToString(rules)
    return this.dislikeRules
  }
}
