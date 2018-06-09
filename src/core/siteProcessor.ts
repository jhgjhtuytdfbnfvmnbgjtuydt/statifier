import * as rp from 'request-promise';
import * as Promise from 'bluebird';
import * as fs from 'fs';
import * as path from 'path';
import * as del from 'del';
import { HashMap } from '../utils/hashmap';
import * as pathUtils from '../utils/pathUtils';
import * as httpUtils from '../utils/httpUtils';
import * as fileUtils from '../utils/fileUtils';
import * as linkUtils from '../utils/linkUtils';
import * as cssProcessor from './cssProcessor';
import { Queue } from '../utils/queue';
import { ExtractFromHtmlOptions } from '../utils/linkUtils';

export interface SiteProcessorOptions{
    basePath:string;
    destDomain:URL;
    srcDomains:HashMap<string>;
};

interface ProcessItem{
    url:URL;
    callback: (url:URL)=>Promise<boolean>;
}

export async function processSite(startUrl:URL, options:SiteProcessorOptions) {
    const rootPath = path.join(options.basePath, startUrl.hostname),
        srcDomainUrl = new URL(startUrl.origin),
        srcDomains = new HashMap([startUrl.host, ...options.srcDomains.toArray()]),
        processedUrls = new HashMap(),
        urlsToProcess = new Queue<ProcessItem>(),
        linksExtractorOpts = {
            'css': {
                tagsSelector: 'link[type="text/css"]',
                validDomains: srcDomains,
                assetUrlExtractor: t => t.attr('href'),
                srcDomain: startUrl.origin
            } as ExtractFromHtmlOptions,
            'image': {
                tagsSelector: 'img',
                validDomains: srcDomains,
                assetUrlExtractor: t => t.attr('src'),
                srcDomain: startUrl.origin
            } as ExtractFromHtmlOptions,
            'javascript': {
                tagsSelector: 'script[type="text/javascript"]',
                validDomains: srcDomains,
                assetUrlExtractor: t => t.attr('src'),
                srcDomain: startUrl.origin
            } as ExtractFromHtmlOptions,
            'internalLink': {
                tagsSelector: 'a',
                validDomains: srcDomains,
                assetUrlExtractor: t => t.attr('href'),
                srcDomain: startUrl.origin
            } as ExtractFromHtmlOptions
        };

    const extractAssets = (pageUrl:URL, html:string, linksExtractorOpts:ExtractFromHtmlOptions, downloadCallback: (u:URL)=>Promise<boolean>):void => {
        const assetsLinks = linkUtils.extractFromHtml(html, linksExtractorOpts);
        assetsLinks.foreach(linkUrl =>{
            urlsToProcess.enqueue({
                url: linkUrl,
                callback: downloadCallback
            });
        });
    },

    downloadCss = (url:URL):Promise<boolean> =>{
        console.log(`downloading css: ${url} ...`);

        return httpUtils.mirrorDownload(url, rootPath)
        .then(cssFullPath =>{
            return fileUtils.readAsync(cssFullPath)
                .then(css =>{
                    const imageUrls = cssProcessor.extractImageUrls(css, srcDomainUrl);
                    if(imageUrls.count()){
                        imageUrls.foreach(imageUrl =>{
                            urlsToProcess.enqueue({
                                url: imageUrl,
                                callback: downloadImage
                            });
                        });

                        css = linkUtils.replaceDomain(css, startUrl.origin, options.destDomain);
                    }
                    return fileUtils.writeAsync(cssFullPath, css);
                });
        });
    },

    downloadImage = (url:URL):Promise<boolean> =>{
        console.log(`downloading image: ${url} ...`);

        return httpUtils.mirrorDownload(url, rootPath)
            .then(r => {
                return true;
            }).catch(err =>{
                return false;
            });
    },

    downloadJs = (url:URL):Promise<boolean> =>{
        console.log(`downloading javascript: ${url} ...`);

        return httpUtils.mirrorDownload(url, rootPath)
            .then(r => {
                return true;
            }).catch(err =>{
                return false;
            });
    },

    savePage = (html:string, url:URL) =>{
        const result = linkUtils.replaceDomain(html, startUrl.origin, options.destDomain),
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

    processPage = (url:URL):Promise<boolean> => {
        if(!url)
            return Promise.reject("invalid url");
        
        const urlValue = url.toString();

        console.log(`requesting data from url: ${urlValue} ...`);

        return rp({
            uri: urlValue
        }).then( (html:string) => {
            if(!html){
                throw new Error(`unable to load data from url: ${urlValue}`);
            }

            extractAssets(url, html, linksExtractorOpts.css, downloadCss);
            extractAssets(url, html, linksExtractorOpts.javascript, downloadJs);
            extractAssets(url, html, linksExtractorOpts.image, downloadImage);
            extractAssets(url, html, linksExtractorOpts.internalLink, processPage);

            savePage(html, url);

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
        callback: u => processPage(u)
    });

    while(urlsToProcess.count()){
        const item = urlsToProcess.dequeue();
        if(!item)
            continue;

        if(processedUrls.contains(item.url.pathname.toLowerCase() ) )
            continue;

        const result = await item.callback(item.url);
        if(true !== result){
            console.log(`an error has occurred while processing url '${item.url}' : ${result}`);
        }else{
            processedUrls.add(item.url.pathname.toLowerCase());
        }
    }

    return true;
};