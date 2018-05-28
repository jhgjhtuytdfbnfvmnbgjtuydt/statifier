import * as path from 'path';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import { HashMap } from "./hashmap";
import * as pathUtils from './pathUtils';
import * as httpUtils from './httpUtils';

export interface AssetsDownloaderOptions{
    tagsSelector:string;
    assetUrlExtractor: (tag:Cheerio) => string;
}

export class AssetsDownloader{
    constructor(private readonly _domainToReplace:string, private readonly _rootPath:string){}

    public run(html:string, options:AssetsDownloaderOptions): Promise<string[]> {
        const $ = cheerio.load(html),
            tags = $(options.tagsSelector),
            urls = new HashMap(),
            processed = new HashMap(),
            promises = new Array<Promise<string>>();

        $(tags).each((i, tag) =>{
            const assetUrl = options.assetUrlExtractor($(tag));
            if(assetUrl && assetUrl.trim().length && assetUrl.indexOf(this._domainToReplace) > -1){
                urls.add(assetUrl);
            }
        });

        urls.foreach(u => {
            if(processed.contains(u))
                return;

            const srcUrl = new URL(u),
                srcFilePath = path.dirname(srcUrl.pathname),
                destFileFolder = path.join(this._rootPath, srcFilePath),
                filename = path.basename(srcUrl.pathname),
                destFilePath = path.join(destFileFolder, filename);

            pathUtils.ensurePath(destFileFolder);
            const p = httpUtils.downloadFile(u, destFilePath)
                            .then(destPath =>{
                                processed.add(u);
                                return destPath;
                            });
            promises.push(p);
        });

        return Promise.all(promises).then(p =>{
            return p;
        });
    }
}