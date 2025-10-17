import lemonade from "lemonadejs";
import '@lemonadejs/router';
import '@lemonadejs/data-grid';
import "@jsuites/css/dist/style.css";
import "@lemonadejs/data-grid/dist/style.css";
import "./style.css";

import App from './App.js';
import Header from './utils/Header';
import Menu from './utils/Menu';

lemonade.setComponents({ Header, Menu });

lemonade.render(App, document.getElementById('root'));
