import * as rp from 'request-promise';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { URL, Url } from 'url';
import * as del from 'del';
import { url } from 'inspector';
import { HashMap } from './utils/hashmap';
import * as pathUtils from './utils/pathUtils';
import * as httpUtils from './utils/httpUtils';

const startUrl = new URL("https://www.davideguida.com"),
    domainToReplace = "https://www.davideguida.com",
    destDomain = "https://testdg.azurewebsites.net",
    basePath = path.join(__dirname, "/data/");

const processSite = (startUrl:URL) =>{
    const rootPath = path.join(basePath, startUrl.hostname),
        processedUrls = new HashMap();

    const extractLinks = (html:string):HashMap =>{
        const $ = cheerio.load(html),
        aTags = $('a'),
        urls = new HashMap();

        $(aTags).each(function(i, link){
            const linkUrl = $(link).attr('href');
            if(linkUrl && linkUrl.trim().length && linkUrl.indexOf(domainToReplace) > -1){
                urls.add(linkUrl);
            }
        });

        return urls;
    },
    
    replaceDomain = (html:string) =>{
        const reg = new RegExp(domainToReplace, "gm"),
            reg2 = domainToReplace.replace("/", `\\\/\\`),
            destDomain2 = destDomain.replace("/", `\\\/\\`),
            result:string = html.replace(reg, destDomain)
                                .replace(reg2, destDomain2);

        return result;
    },

    processInternalLinks = (html:string): Promise<boolean[]>=>{
        const linkUrls = extractLinks(html),
            promises = new Array<Promise<boolean>>();
        linkUrls.foreach(linkUrl =>{
            promises.push(processUrl(new URL(linkUrl)));
        });

        return Promise.all(promises);
    },

    processCss = (html:string): Promise<boolean> => {
        const $ = cheerio.load(html),
            tags = $('link[type="text/css"]'),
            urls = new HashMap(),
            processed = new HashMap(),
            promises = new Array<Promise<boolean>>();

        $(tags).each(function(i, link){
            const linkUrl = $(link).attr('href');
            if(linkUrl && linkUrl.trim().length && linkUrl.indexOf(domainToReplace) > -1){
                urls.add(linkUrl);
            }
        });

        urls.foreach(u => {
            if(processed.contains(u))
                return;
            const srcUrl = new URL(u),
                srcFilePath = path.dirname(srcUrl.pathname),
                destFileFolder = path.join(rootPath, srcFilePath),
                filename = path.basename(srcUrl.pathname),
                destFilePath = path.join(destFileFolder, filename);

            pathUtils.ensurePath(destFileFolder);
            return httpUtils.downloadFile(u, destFilePath)
                            .then(destPath =>{
                                processed.add(u);
                                return true;
                            });
        });

        return Promise.all(promises).then(p =>{
            return true;
        });
    },

    processUrl = (url:Url):Promise<boolean> => {
        if(processedUrls.contains(url.pathname.toLowerCase() ) ){
            console.log(`url ${url} already processed!`);
            return;
        }

        processedUrls.add(url.pathname.toLowerCase());
        
        console.log(`requesting data from url: ${url} ...`);

        const options = {
            uri: url
        };

        return rp(options).then( (html:string) =>{
            if(!html){
                throw new Error(`unable to load data from url: ${url}`);
            }

            const result = replaceDomain(html),
                folderPath = path.join(rootPath, url.pathname),
                filename = url.pathname.endsWith("/") ? "index.html" :
                             path.basename(url.pathname)
                               .trim()
                               .replace(".html", "")
                               .replace(".htm", ""),
                filePath = (!filename.length) ? path.join(folderPath, "index.html") : path.join(folderPath, filename);
                
            pathUtils.ensurePath(folderPath);
            
            if(fs.existsSync(filePath)){
                fs.unlinkSync(filePath);
            }
            fs.writeFileSync(filePath, result);

            processCss(html);

            return processInternalLinks(html).then(() =>{
                return true;
            });
        }).catch(err =>{
            console.error(err);
            return false;
        });
    };

    if(fs.existsSync(rootPath)){
        del.sync(rootPath, {
            nosort: true,
        });
    }

    fs.mkdirSync(rootPath);

    processUrl(startUrl);
};

processSite(startUrl);