import * as path from 'path';
import { URL } from 'url';
import { processSite } from './core/siteProcessor';
import { HashMap } from './utils/hashmap';

const startUrl = new URL("https://www.davideguida.com"),
    destDomain = new URL("https://testdg.azurewebsites.net"),
    basePath = path.join(__dirname, "/data/");

processSite(startUrl, {
    basePath: basePath,
    destDomain: destDomain,
    srcDomains: new HashMap(['https://i2.wp.com/www.davideguida.com'])
}).then(() =>{
    console.log(`site ${startUrl} processed!`);
});