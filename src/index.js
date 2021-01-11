import React from 'react';
import ReactDOM from 'react-dom';
import './web/index.css';
import queryString from 'query-string';
import App from './web/App';
import * as serviceWorker from './serviceWorker';
import ImageViewer from './web/ImageViewer';

const params = queryString.parse(window.location.search);

ReactDOM.render(
  <React.StrictMode>
    {params.type === 'imageViewer' ? (
      <ImageViewer />
    ) : (<App />)}
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
