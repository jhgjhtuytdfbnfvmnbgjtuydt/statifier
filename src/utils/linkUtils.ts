import * as cheerio from 'cheerio';
import * as path from 'path';
import { HashMap } from "./hashmap";
import * as urlUtils from './urlUtils';

export interface ExtractFromHtmlOptions{
    readonly tagsSelector:string;
    readonly assetUrlExtractor: (tag:Cheerio) => string;
    readonly validDomains?:HashMap<string>;
    readonly srcDomain:string;
}

export function extractFromHtml(html:string, options:ExtractFromHtmlOptions):HashMap<URL>{
    const $ = cheerio.load(html),
        aTags = $(options.tagsSelector),
        urls = new HashMap<URL>(),
        useDomains = (options.validDomains && options.validDomains.count());

    $(aTags).each((i, link) =>{
        const linkUrl = (options.assetUrlExtractor($(link)) || '').trim();
        if(!linkUrl.trim().length || '#' === linkUrl || linkUrl.startsWith('#') || linkUrl.startsWith('javascript:'))
            return;

        const useSrcDomain = !linkUrl.startsWith('http'),
             url = new URL(useSrcDomain ? path.join(options.srcDomain, linkUrl) : linkUrl);
        
        if(!useDomains || options.validDomains.contains(url.host)){
            urls.add(url);
        }
    });

    return urls;
}

export function replaceDomain(text:string, srcDomain:string, destDomain:URL):string{
    const srcDomainURL = urlUtils.toURL(srcDomain),
        reg = new RegExp(srcDomainURL.origin, "gm"),
        reg2 = new RegExp(`//${srcDomainURL.host}`, "gm"),
        reg3 = new RegExp(`${srcDomainURL.host}`, "gm");;

    return text.replace(reg, destDomain.origin)
               .replace(reg2, `//${destDomain.host}`)
               .replace(reg3, destDomain.host);  
}

