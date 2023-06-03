import "the-new-css-reset/css/reset.css"
import './styles.css'

/* @refresh reload */
import { render } from 'solid-js/web';

import App from './App';

render(() => <App />, document.getElementById('root') as HTMLElement);
