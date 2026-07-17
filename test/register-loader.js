import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./loader.js', import.meta.url);
