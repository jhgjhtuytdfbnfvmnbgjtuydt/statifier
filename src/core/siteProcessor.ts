import * as rp from 'request-promise';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { URL, Url } from 'url';
import * as del from 'del';
import { url } from 'inspector';
import { HashMap } from '../utils/hashmap';
import * as pathUtils from '../utils/pathUtils';
import * as httpUtils from '../utils/httpUtils';
import * as fileUtils from '../utils/fileUtils';
import { HtmlAssetsDownloader } from './htmlAssetsDownloader';
import * as linkUtils from '../utils/linkUtils';
import { CssProcessor } from './cssProcessor';
import { Queue } from '../utils/queue';

export interface SiteProcessorOptions{
    basePath:string;
    destDomain:URL;
};

export async function processSite(startUrl:URL, options:SiteProcessorOptions) {
    const rootPath = path.join(options.basePath, startUrl.hostname),
        srcDomain = startUrl.origin,
        processedUrls = new HashMap(),
        urlsToProcess = new Queue<URL>();

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
                            destDomain: options.destDomain,
                            rootPath: options.basePath
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

    savePage = (html:string, url:Url) =>{
        const result = linkUtils.replaceDomain(html, srcDomain, options.destDomain),
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
    },

    processUrl = (url:Url):Promise<boolean> => {
        if(!url)
            return Promise.reject("invalid url");
        
        if(processedUrls.contains(url.pathname.toLowerCase() ) )
            return Promise.resolve(true);
        
        processedUrls.add(url.pathname.toLowerCase());
        
        console.log(`requesting data from url: ${url} ...`);

        return rp({
            uri: url
        }).then( (html:string) => {
            if(!html){
                throw new Error(`unable to load data from url: ${url}`);
            }

            savePage(html, url);
            
            // downloadAssets(html);

            const internalLinks = linkUtils.extractFromHtml(html, {domain: srcDomain});
            internalLinks.foreach(linkUrl =>{
                urlsToProcess.enqueue(new URL(linkUrl));
            });
            return true;
        }).catch(err => {
            return err;
        });
    };

    if(!fs.existsSync(options.basePath))
        fs.mkdirSync(options.basePath);
        
    if(fs.existsSync(rootPath)){
        del.sync(rootPath, {
            nosort: true,
        });
    }

    fs.mkdirSync(rootPath);

    urlsToProcess.enqueue(startUrl);

    while(urlsToProcess.count()){
        const currUrl = urlsToProcess.dequeue(),
            result = await processUrl(currUrl);
        if(true !== result){
            console.log(`an error has occurred while processing url '${currUrl}' : ${result}`);
        }
    }

    return true;
};