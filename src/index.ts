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
    maxRequestsCount: 5,
    srcDomains: new HashMap([new URL('https://i2.wp.com'), 
                            new URL('https://i1.wp.com'),
                            new URL('https://i0.wp.com')])
}).then(() =>{
    console.log(`site ${startUrl} processed!`);
});