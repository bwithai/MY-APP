// main.jsx
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import theme from "./theme"



const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);