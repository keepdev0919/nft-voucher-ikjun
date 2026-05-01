import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Web3Provider } from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';
import { store, persistor } from './app/store';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './css/index.css';
import { PersistGate } from 'redux-persist/integration/react';

const container = document.getElementById('root')!;

const root = createRoot(container);

const getLibrary = (provider :any) => {
  return new Web3Provider(provider);
}


root.render(
  // <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Web3ReactProvider getLibrary={getLibrary}>
          <App />
        </Web3ReactProvider>
      </PersistGate>
    </Provider>
  // </React.StrictMode>
);

reportWebVitals();
