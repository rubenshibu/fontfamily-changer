import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from '/home/ruben/react_t/my_app/src/App.js';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.unregister();
