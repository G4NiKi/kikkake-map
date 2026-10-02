export type Kind = 'action' | 'competitor';

export interface Action {
  id: string;
  name: string;
  kind: Kind;
  want: number; // やりたさ 1〜5
  ease: number; // やりやすさ 1〜5
  parentId?: string; // 小さく(大きく)する前の行動。マップの軌跡に使う
  archived?: boolean; // 置き換えられた古い行動。マップには薄く残す
  createdAt: string;
}

export interface Recipe {
  id: string;
  anchor: string;
  actionIds: string[]; // 1〜2個
  celebration: string;
  active: boolean;
  anchorHistory: { anchor: string; changedAt: string }[];
  // 縮小ループの判定はこの日付より後の記録だけで行う
  loopResetDate?: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  recipeId: string;
  date: string; // YYYY-MM-DD(端末のローカル日付)
  done: boolean;
  want?: number;
  ease?: number;
  youtube?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 検証のしかた(提案回数・縮小回数・マップ閲覧後の変更回数)を後で数えるための記録
export type EventType =
  | 'shrink_prompted'
  | 'shrunk'
  | 'anchor_changed'
  | 'kept'
  | 'grow_prompted'
  | 'grown'
  | 'map_viewed'
  | 'action_edited';

export interface AppEvent {
  type: EventType;
  at: string;
  recipeId?: string;
  actionId?: string;
  source?: 'loop' | 'manual';
}

export interface AppData {
  version: 1;
  goal: string;
  threshold: number;
  actions: Action[];
  recipes: Recipe[];
  logs: LogEntry[];
  events: AppEvent[];
}
