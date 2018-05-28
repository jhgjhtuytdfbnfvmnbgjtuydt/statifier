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
import * as fileUtils from './utils/fileUtils';
import { HtmlAssetsDownloader } from './utils/htmlAssetsDownloader';
import * as linkUtils from './utils/linkUtils';
import { CssProcessor } from './utils/cssProcessor';

const startUrl = new URL("https://www.davideguida.com"),
    srcDomain = "https://www.davideguida.com",
    destDomain = "https://testdg.azurewebsites.net",
    basePath = path.join(__dirname, "/data/");

const processSite = (startUrl:URL):Promise<boolean> => {
    const rootPath = path.join(basePath, startUrl.hostname),
        processedUrls = new HashMap();

    const processInternalLinks = (html:string): Promise<boolean[]>=>{
        const linkUrls = linkUtils.extractFromHtml(html, {domain: srcDomain}),
            promises = new Array<Promise<boolean>>();
        linkUrls.foreach(linkUrl =>{
            promises.push(processUrl(new URL(linkUrl)));
        });

        return Promise.all(promises);
    },

    downloadAssets = (html:string): Promise<boolean> => {
        const downloader = new HtmlAssetsDownloader(srcDomain, rootPath),
            css = downloader.run(html, {
                tagsSelector: 'link[type="text/css"]',
                assetUrlExtractor: t => t.attr('href')
            }).then(cssPaths =>{
                if(!cssPaths || !cssPaths.length)
                    return true;
                const cssProcessor = new CssProcessor({
                            srcDomain: srcDomain,
                            destDomain: destDomain,
                            rootPath: basePath
                }),
                promises = cssPaths.map(cssPath =>{
                    return cssProcessor.run(cssPath);
                });
                return Promise.all(promises).then(r => true);
            }),
            img = downloader.run(html, {
                tagsSelector: 'img',
                assetUrlExtractor: t => t.attr('src')
            }),
            js = downloader.run(html, {
                tagsSelector: 'script[type="text/javascript"]',
                assetUrlExtractor: t => t.attr('src')
            });

        return Promise.all([css, js, img]).then(() => true);
    },

    processUrl = (url:Url):Promise<boolean> => {
        if(processedUrls.contains(url.pathname.toLowerCase() ) ){
            return Promise.resolve(true);
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

            const result = linkUtils.replaceDomain(html, srcDomain, destDomain),
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

            downloadAssets(html);

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

    return processUrl(startUrl);
};

processSite(startUrl).then(() =>{
    console.log(`site ${startUrl} processed!`);
});