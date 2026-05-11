import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
}

export interface ModalState {
  kind: string;
  payload?: unknown;
}

interface UiState {
  toasts: ToastItem[];
  modal: ModalState | null;
  sidebarCollapsed: boolean;
}

const initialState: UiState = {
  toasts: [],
  modal: null,
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    pushToast: {
      reducer(state, action: PayloadAction<ToastItem>) {
        state.toasts.push(action.payload);
      },
      prepare(input: Omit<ToastItem, "id">) {
        return { payload: { id: nanoid(), ...input } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    openModal(state, action: PayloadAction<ModalState>) {
      state.modal = action.payload;
    },
    closeModal(state) {
      state.modal = null;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { pushToast, dismissToast, openModal, closeModal, setSidebarCollapsed } =
  uiSlice.actions;
export default uiSlice.reducer;
