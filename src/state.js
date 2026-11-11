export const state = {
  user: null,
  profile: null,
  activeModuleId: null,
  modules: [],
  troubleshooting: [],
  analogies: [],
  checklist: [],
  evalLogs: [],
  members: [],
  allowedEmails: []
};

export function resetContentState() {
  state.activeModuleId = null;
  state.modules = [];
  state.troubleshooting = [];
  state.analogies = [];
  state.checklist = [];
  state.evalLogs = [];
  state.members = [];
  state.allowedEmails = [];
}

export function getActiveModule() {
  return state.modules.find((m) => m.id === state.activeModuleId) || null;
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}
