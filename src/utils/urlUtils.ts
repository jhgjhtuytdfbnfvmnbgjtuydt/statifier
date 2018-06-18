import * as path from 'path';
import { HashMap } from './hashmap';

export function toURL(value:string):URL{
    try{
        return new URL(value);
    }catch(err){
        if(!value.startsWith('http')){
            if(value.startsWith('//'))
                return new URL('http:' + value);
            return new URL('http://' + value);
        }

        throw err;
    }
}

export function getRelativeUrl(absoluteUrl:string, domain:string):string{
    const domainUrl = toURL(domain),
         result = absoluteUrl.substring(absoluteUrl.lastIndexOf(domainUrl.host) + domainUrl.host.length);
    return result;
}

export function formatUrl(url:string, sourceDomain?:URL):URL{
    if(url.startsWith('http'))
        return new URL(url);

    const newUrl = sourceDomain ? path.join(sourceDomain.origin, url) : url,
        result = new URL(newUrl);
    return result;
};


export interface ReplaceDomainOptions{
    pattern?:RegExp;
};

export function replaceDomain(srcUrl:URL, destDomain:URL, options?:ReplaceDomainOptions):URL{
    if(options && options.pattern){
        const srcUrlStr = srcUrl.toString(),
            result = srcUrlStr.replace(options.pattern, destDomain.origin);
        return new URL(result);
    }

    const combined = path.join(destDomain.origin, srcUrl.pathname),
        result = new URL(combined);

    return result;
}