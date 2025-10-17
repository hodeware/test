import lemonade from "lemonadejs";
import '@lemonadejs/router';
import "jsuites/dist/jsuites.css";
import "./style.css";

import App from './App.js';
import Top from './utils/Top';
import Menu from './utils/Menu';

lemonade.setComponents({ Top, Menu });

lemonade.render(App, document.getElementById('root'));
