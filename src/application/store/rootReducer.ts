import { combineReducers } from "@reduxjs/toolkit";
import uiReducer from "@/application/slices/uiSlice";
import sessionReducer from "@/application/slices/sessionSlice";

const rootReducer = combineReducers({
  ui: uiReducer,
  session: sessionReducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
export default rootReducer;
