import * as path from 'path';
import { URL } from 'url';
import { processSite } from './core/siteProcessor';

const startUrl = new URL("https://www.davideguida.com"),
    destDomain = new URL("https://testdg.azurewebsites.net"),
    basePath = path.join(__dirname, "/data/");

processSite(startUrl, {
    basePath: basePath,
    destDomain: destDomain
}).then(() =>{
    console.log(`site ${startUrl} processed!`);
});