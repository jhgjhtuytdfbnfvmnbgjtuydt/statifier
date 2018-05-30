import * as Promise from 'bluebird';
import * as path from 'path';
import * as fileUtils from '../utils/fileUtils';
import * as linkUtils from '../utils/linkUtils';
import * as httpUtils from '../utils/httpUtils';
import { HashMap } from '../utils/hashmap';

export interface CssProcessorOptions{
    readonly srcDomain:string;
    readonly destDomain:URL;
    readonly rootPath:string;
}

export class CssProcessor {
    private readonly _reg:RegExp;

    constructor(private readonly options:CssProcessorOptions){
        this._reg = new RegExp(/url(?:\(['"]?)(.*?)(?:['"]?\))/, "gmi");
    }

    private extractImageUrls(css:string){
        const results = new HashMap(),
            srcDomainUrl = new URL(this.options.srcDomain);

        let m:RegExpExecArray;
        do {
            m = this._reg.exec(css);
            if (m && m.length > 1) {
                const match = m[1],
                    url = match.replace("\"", "")
                               .replace("'", "");

                if(url.includes(srcDomainUrl.host) || url.startsWith('./') || url.startsWith('//'))                            
                    results.add(url);
            }
        } while (m);

        return results;
    }

    public run(cssPath:string){
        return fileUtils.readAsync(cssPath)
            .then(data =>{
                if(!data || !data.trim().length)
                    return Promise.resolve(true);

                const srcDomainUrl = new URL(this.options.srcDomain),
                    cssRelativeFullPath = linkUtils.getRelativeUrl(cssPath, this.options.srcDomain),
                    cssRelativeFolder = path.dirname(cssRelativeFullPath) + '/';

                const imageUrls = this.extractImageUrls(data),
                    promises = imageUrls.map(iu =>{
                        if(!iu || !iu.length)
                            return Promise.resolve(true);

                        let imageUrl = iu;
                        if(!imageUrl.startsWith('http')){
                            if(imageUrl.startsWith('//')){
                                imageUrl = srcDomainUrl.protocol + imageUrl;
                            }else if(imageUrl.startsWith('./')){
                                imageUrl = path.join(this.options.srcDomain, cssRelativeFolder, imageUrl);
                            }else{
                                imageUrl = path.join(this.options.srcDomain, imageUrl);
                            }
                        }

                        return httpUtils.mirrorDownload(imageUrl, this.options.rootPath)
                                        .then(p => true)
                                        .catch(err =>{
                                            console.error(`an error has occurred while downloading img from ${imageUrl} to ${this.options.rootPath} : ${JSON.stringify(err)}`);
                                            return false;
                                        });
                    });

                data = linkUtils.replaceDomain(data, this.options.srcDomain, this.options.destDomain);
                const replacePromise = fileUtils.writeAsync(cssPath, data);
                
                return Promise.all([replacePromise, ...promises]).then(p => true);
            });
    }
}