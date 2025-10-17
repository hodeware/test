import lemonade from "lemonadejs";
import '@lemonadejs/router';
import '@lemonadejs/data-grid';
import "@jsuites/css/dist/style.css";
import "@lemonadejs/data-grid/dist/style.css";
import "./style.css";

import App from './App.js';
import Top from './utils/Top';
import Menu from './utils/Menu';

lemonade.setComponents({ Top, Menu });

lemonade.render(App, document.getElementById('root'));
