import * as path from 'path';
import { URL } from 'url';
import { processSite } from './core/siteProcessor';
import { HashMap } from './utils/hashmap';
import { ILogger, LoggerOptions, LoggerFactory } from './utils/logger';

const startUrl = new URL("https://www.davideguida.com"),
    destDomain = new URL("https://testdg.azurewebsites.net"),
    loggerFactory = new LoggerFactory();

processSite(startUrl, {
    basePath: __dirname,
    destDomain: destDomain,
    maxRequestsCount: 5,
    srcDomains: new HashMap()
}, loggerFactory).then(() =>{
    console.log('done');
});