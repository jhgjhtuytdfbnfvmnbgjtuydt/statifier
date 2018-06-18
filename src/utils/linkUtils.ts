import * as cheerio from 'cheerio';
import { HashMap } from "./hashmap";
import * as urlUtils from './urlUtils';

export interface ExtractFromHtmlOptions{
    readonly tagsSelector:string;
    readonly assetUrlExtractor: (tag:Cheerio) => string;
    readonly validDomains:HashMap<URL>;
    readonly primaryDomain:URL;
}

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

        const formattedUrl = urlUtils.formatUrl(linkUrl, options.primaryDomain);
        
        if(validHostsMap.contains(formattedUrl.host)){
            resultUrls.add(formattedUrl);
        }
    });

    return resultUrls;
}

export function replaceDomains(text:string, srcDomain:URL, destDomain:URL):string{
    let srcDomainStr = srcDomain.toString();
    if(srcDomainStr.endsWith('/')){
        srcDomainStr = srcDomainStr.substr(0, srcDomainStr.length-1);
    }

    const mod = 'gmi',
        reg = new RegExp(srcDomainStr, mod),
        reg2 = new RegExp(`(?<=(\\s+|\\/\\/|\\\\/\\\\/))${srcDomain.host}`, mod),
        reg3 = new RegExp(`(?<=(\'|\"))${srcDomain.host}(?=(\'|\"))`, mod);

    return text.replace(reg, destDomain.origin)
               .replace(reg2, destDomain.host)
               .replace(reg3, destDomain.host);  
}

