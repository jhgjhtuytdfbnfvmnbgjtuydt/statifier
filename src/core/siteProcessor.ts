import * as rp from 'request-promise';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import * as del from 'del';
import { HashMap } from '../utils/hashmap';
import * as pathUtils from '../utils/pathUtils';
import * as httpUtils from '../utils/httpUtils';
import * as fileUtils from '../utils/fileUtils';
import { HtmlAssetsDownloader } from './htmlAssetsDownloader';
import * as linkUtils from '../utils/linkUtils';
import { CssProcessor } from './cssProcessor';
import { Queue } from '../utils/queue';
import { ExtractFromHtmlOptions } from '../utils/linkUtils';

export interface SiteProcessorOptions{
    basePath:string;
    destDomain:URL;
};

interface ProcessItem{
    url:URL;
    callback: (url:URL)=>Promise<boolean>;
}

export async function processSite(startUrl:URL, options:SiteProcessorOptions) {
    const rootPath = path.join(options.basePath, startUrl.hostname),
        srcDomain = startUrl.origin,
        validDomains = new HashMap([startUrl.host]),
        processedUrls = new HashMap(),
        urlsToProcess = new Queue<ProcessItem>();

    const downloadAssets = (html:string): Promise<boolean> => {
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

    savePage = (html:string, url:URL) =>{
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

    processUrl = (url:URL):Promise<boolean> => {
        if(!url)
            return Promise.reject("invalid url");
        
        if(processedUrls.contains(url.pathname.toLowerCase() ) )
            return Promise.resolve(true);
        
        const urlValue = url.toString();

        console.log(`requesting data from url: ${urlValue} ...`);

        return rp({
            uri: urlValue
        }).then( (html:string) => {
            if(!html){
                throw new Error(`unable to load data from url: ${urlValue}`);
            }

            savePage(html, url);
            
            // downloadAssets(html);

            const linksExtractorOpts:ExtractFromHtmlOptions = {
                tagsSelector: 'a',
                validDomains: validDomains,
                assetUrlExtractor: t => t.attr('href'),
                srcDomain: url.origin
            },
            internalLinks = linkUtils.extractFromHtml(html, linksExtractorOpts);
            internalLinks.foreach(linkUrl =>{
                urlsToProcess.enqueue({
                    url: linkUrl,
                    callback: u => processUrl(u)
                });
            });

            processedUrls.add(url.pathname.toLowerCase());

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

    urlsToProcess.enqueue({
        url: startUrl,
        callback: u => processUrl(u)
    });

    while(urlsToProcess.count()){
        const item = urlsToProcess.dequeue();
        if(!item)
            continue;
        const result = await item.callback(item.url);
        if(true !== result){
            console.log(`an error has occurred while processing url '${item.url}' : ${result}`);
        }
    }

    return true;
};