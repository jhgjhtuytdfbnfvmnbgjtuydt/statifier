import * as path from 'path';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import { HashMap } from "../utils/hashmap";
import * as pathUtils from '../utils/pathUtils';
import * as httpUtils from '../utils/httpUtils';

export interface HtmlAssetsDownloaderOptions{
    readonly tagsSelector:string;
    readonly assetUrlExtractor: (tag:Cheerio) => string;
}

export class HtmlAssetsDownloader{
    constructor(private readonly _domainToReplace:string, private readonly _rootPath:string){}

    public run(html:string, options:HtmlAssetsDownloaderOptions): Promise<string[]> {
        // const $ = cheerio.load(html),
        //     tags = $(options.tagsSelector),
        //     urls = new HashMap(),
        //     processed = new HashMap(),
        //     promises = new Array<Promise<string>>();

        // $(tags).each((i, tag) =>{
        //     const assetUrl = options.assetUrlExtractor($(tag));
        //     if(assetUrl && assetUrl.trim().length && assetUrl.indexOf(this._domainToReplace) > -1){
        //         urls.add(assetUrl);
        //     }
        // });

        // urls.foreach(u => {
        //     if(processed.contains(u))
        //         return;
        //     const p = httpUtils.mirrorDownload(u, this._rootPath)
        //         .then(destPath =>{
        //             processed.add(u);
        //             return destPath;
        //         });
        //     promises.push(p);
        // });

        // return Promise.all(promises).then(p =>{
        //     return p;
        // });
        return null;
    }
}