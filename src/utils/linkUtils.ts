import * as cheerio from 'cheerio';
import * as path from 'path';
import { HashMap } from "./hashmap";
import * as urlUtils from './urlUtils';

export interface ExtractFromHtmlOptions{
    readonly tagsSelector:string;
    readonly assetUrlExtractor: (tag:Cheerio) => string;
    readonly validDomains:HashMap<URL>;
    readonly primaryDomain:URL;
}

export function formatUrl(url:string, sourceDomain?:URL):URL{
    if(url.startsWith('http'))
        return new URL(url);

    const newUrl = sourceDomain ? path.join(sourceDomain.origin, url) : url,
        result = new URL(newUrl);
    return result;
};

export function extractFromHtml(html:string, options:ExtractFromHtmlOptions):HashMap<URL>{
    const $ = cheerio.load(html),
        aTags = $(options.tagsSelector),
        resultUrls = new HashMap<URL>(),
        validHosts = options.validDomains.map((d,i)=> d.host),
        validHostsMap = new HashMap<string>(validHosts);

    $(aTags).each((i, link) =>{
        const linkUrl = (options.assetUrlExtractor($(link)) || '').trim();
        if(!linkUrl.length || linkUrl.startsWith('javascript:'))
            return;

        const formattedUrl = formatUrl(linkUrl, options.primaryDomain);
        
        if(validHostsMap.contains(formattedUrl.host)){
            resultUrls.add(formattedUrl);
        }
    });

    return resultUrls;
}

export function replaceDomain(text:string, srcDomain:URL, destDomain:URL):string{
    let srcDomainStr = srcDomain.toString();
    if(srcDomainStr.endsWith('/')){
        srcDomainStr = srcDomainStr.substr(0, srcDomainStr.length-1);
    }

    const reg = new RegExp(srcDomainStr, "gm"),
        reg2 = new RegExp(`//${srcDomain.host}`, "gm"),
        reg3 = new RegExp(`${srcDomain.host}`, "gm");

    return text.replace(reg, destDomain.origin)
               .replace(reg2, `//${destDomain.host}`)
               .replace(reg3, destDomain.host);  
}

