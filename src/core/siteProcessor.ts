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
import { ILogger, LoggerOptions, ILoggerFactory } from '../utils/logger';
import * as uuid from 'uuid';

export interface SiteProcessorOptions{
    basePath:string;
    destDomain:URL;
    srcDomains:HashMap<URL>;
    maxRequestsCount:number;
};

interface ProcessItem{
    url:URL;
    callback: (url:URL)=>Promise<boolean>;
}

export async function processSite(startUrl:URL, options:SiteProcessorOptions, loggerFactory:ILoggerFactory<LoggerOptions>) {
    const id = uuid.v4(),
        dataPath = path.join(options.basePath, "data"),
        rootPath = path.join(dataPath, id, startUrl.hostname),
        srcDomainUrl = new URL(startUrl.origin),
        srcDomains = new HashMap([...options.srcDomains.toArray(), startUrl]),
        processedUrls = new HashMap(),
        urlsToProcess = new Queue<ProcessItem>(),
        loggerOptions:LoggerOptions = {
            basePath: path.join(options.basePath, "logs"),
            filename: id
        },
        logger = loggerFactory.build(loggerOptions),
        linksExtractorOpts = {
            'css': {
                tagsSelector: 'link[type="text/css"]',
                validDomains: srcDomains,
                assetUrlExtractor: t => t.attr('href'),
                primaryDomain: srcDomainUrl
            } as ExtractFromHtmlOptions,
            'image': {
                tagsSelector: 'img',
                validDomains: srcDomains,
                assetUrlExtractor: t => t.attr('src'),
                primaryDomain: srcDomainUrl
            } as ExtractFromHtmlOptions,
            'javascript': {
                tagsSelector: 'script[type="text/javascript"]',
                validDomains: srcDomains,
                assetUrlExtractor: t => t.attr('src'),
                primaryDomain: srcDomainUrl
            } as ExtractFromHtmlOptions,
            'internalLink': {
                tagsSelector: 'a',
                validDomains: srcDomains,
                assetUrlExtractor: t => t.attr('href'),
                primaryDomain: srcDomainUrl
            } as ExtractFromHtmlOptions
        };

    const extractAssets = (html:string, linksExtractorOpts:ExtractFromHtmlOptions, downloadCallback: (u:URL)=>Promise<boolean>):void => {
        const assetsLinks = linkUtils.extractFromHtml(html, linksExtractorOpts);
        assetsLinks.foreach(linkUrl =>{
            urlsToProcess.enqueue({
                url: linkUrl,
                callback: downloadCallback
            });
        });
    },

    downloadCss = (url:URL):Promise<boolean> =>{
        logger.info(`downloading css: ${url} ...`);

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

                        srcDomains.foreach(d =>{
                            css = linkUtils.replaceDomains(css, d, options.destDomain);
                        });
                    }

                    return fileUtils.writeAsync(cssFullPath, css);
                });
        }).catch(err =>{
            logger.error(`an error occurred while downloading css from ${url}`, err);
            return false;
        });
    },

    downloadImage = (url:URL):Promise<boolean> =>{
        logger.info(`downloading image: ${url} ...`);

        return httpUtils.mirrorDownload(url, rootPath)
            .then(r => {
                return true;
            }).catch(err =>{
                logger.error(`an error occurred while downloading image from ${url}`, err);
                return false;
            });
    },

    downloadJs = (url:URL):Promise<boolean> =>{
        logger.info(`downloading javascript: ${url} ...`);

        return httpUtils.mirrorDownload(url, rootPath)
            .then(r => {
                return true;
            }).catch(err =>{
                logger.error(`an error occurred while downloading js from ${url}`, err);
                return false;
            });
    },

    savePage = (html:string, url:URL) =>{
        const folderPath = path.join(rootPath, url.pathname),
            filename = url.pathname.endsWith("/") ? "index.html" :
                            path.basename(url.pathname)
                            .trim()
                            .replace(".html", "")
                            .replace(".htm", ""),
            filePath = (!filename.length) ? path.join(folderPath, "index.html") : path.join(folderPath, filename);
            
        let result = html;
        srcDomains.foreach(d =>{
            result = linkUtils.replaceDomains(result, d, options.destDomain);
        });

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

        logger.info(`requesting data from url: ${urlValue} ...`);

        return rp({
            uri: urlValue
        }).then( (html:string) => {
            if(!html){
                throw new Error(`unable to load data from url: ${urlValue}`);
            }

            extractAssets(html, linksExtractorOpts.css, downloadCss);
            extractAssets(html, linksExtractorOpts.javascript, downloadJs);
            extractAssets(html, linksExtractorOpts.image, downloadImage);
            extractAssets(html, linksExtractorOpts.internalLink, processPage);

            savePage(html, url);

            return true;
        }).catch(err => {
            return err;
        });
    },
    init = () =>{
        if(!fs.existsSync(options.basePath))
            fs.mkdirSync(options.basePath);
            
        if(fs.existsSync(rootPath)){
            del.sync(rootPath, {
                nosort: true,
            });
        }

        pathUtils.ensurePath(rootPath);
    },
    start = async () =>{
        urlsToProcess.enqueue({
            url: startUrl,
            callback: u => processPage(u)
        });

        let currPromises = new Array<Promise<void>>();

        while(urlsToProcess.count() || currPromises.length){
            while(urlsToProcess.count() && currPromises.length < options.maxRequestsCount){
                const item = urlsToProcess.dequeue();
                if(!item)
                    continue;

                if(processedUrls.contains(item.url.pathname.toLowerCase() ) )
                    continue;

                const p = item.callback(item.url)
                    .then(result =>{
                        if(true !== result){
                            logger.error(`an error has occurred while processing url '${item.url}'`, result);
                        }else{
                            processedUrls.add(item.url.pathname.toLowerCase());
                        }
                    });
                currPromises.push(p);
            }

            if(currPromises.length){
                await Promise.all(currPromises);
                currPromises = new Array<Promise<void>>();
            }
        }
    };

    init();
    await start();

    logger.info(`site ${startUrl} processed!`);
    
    return true;
};