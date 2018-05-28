import * as Promise from 'bluebird';
import * as fileUtils from './fileUtils';
import * as linkUtils from './linkUtils';
import * as httpUtils from './httpUtils';
import { HashMap } from './hashmap';

export interface CssProcessorOptions{
    readonly srcDomain:string;
    readonly destDomain:string;
    readonly rootPath:string;
}

export class CssProcessor {
    private readonly _reg:RegExp;

    constructor(private readonly options:CssProcessorOptions){
        this._reg = new RegExp(/url(?:\(['"]?)(.*?)(?:['"]?\))/, "gmi");
    }

    private extractImageUrls(css:string){
        const results = new HashMap();

        let m:RegExpExecArray;
        do {
            m = this._reg.exec(css);
            if (m && m.length > 1) {
                const match = m[1],
                    url = match.replace("\"", "")
                               .replace("'", "");
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

                const imageUrls = this.extractImageUrls(data),
                    promises = imageUrls.map(iu =>{
                        //TODO: replace domain
                        //TODO: check if contains domain (might start with ./)
                        //TODO: check protocol
                        
                        return Promise.resolve(true);
                        // if(!iu || !iu.length)
                        //     return Promise.resolve(true);
                        // return httpUtils.mirrorDownload(iu, this.options.rootPath).then(p => true);
                    });

                data = linkUtils.replaceDomain(data, this.options.srcDomain, this.options.destDomain);
                const replacePromise = fileUtils.writeAsync(cssPath, data);
                
                return Promise.all([replacePromise, ...promises]).then(p => true);
            });
    }
}