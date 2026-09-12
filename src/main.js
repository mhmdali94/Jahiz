// Entry point. Access control (Step 6 — signed client links) isn't wired
// yet, so this currently mounts the wizard directly for anyone opening the
// page; that gate goes in front of mountApp() once auth.js exists.

import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import './styles/main.css';
import { mountApp } from './steps/wizard.js';

mountApp(document.getElementById('app'));
