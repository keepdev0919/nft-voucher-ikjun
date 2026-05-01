import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';
import {userSlice} from './redux-modules/userSlice';
import storage from 'redux-persist/lib/storage';
import {persistReducer} from 'redux-persist';
import persistStore from 'redux-persist/es/persistStore';

const reducers = combineReducers({
  user : userSlice.reducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user']
}

const persistedReducer = persistReducer(persistConfig, reducers);

//redux persist Config
export const store = configureStore({
  reducer: {
    persistedReducer,
  },
});

//persistor 객체 전송
export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
