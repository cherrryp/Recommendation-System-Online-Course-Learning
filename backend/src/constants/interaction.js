// Score added per user action (used by popularity and user-interest scoring)
export const INTERACTION_WEIGHT = { click: 1, bookmark: 3, search: 1 }

export const weightOf = (action) => INTERACTION_WEIGHT[action] || 1
