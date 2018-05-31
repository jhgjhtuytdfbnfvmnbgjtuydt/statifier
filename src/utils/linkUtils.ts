import * as cheerio from 'cheerio';
import * as path from 'path';
import { URL } from 'url';
import { HashMap } from "./hashmap";

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
    const reg = new RegExp(srcDomain, "gm"),
        reg2 = srcDomain.replace("/", `\\\/\\`),
        destDomain2 = destDomain.origin.replace("/", `\\\/\\`),
        srcDomainUrl = new URL(srcDomain),
        reg3 = new RegExp(`//${srcDomainUrl.host}`, "gm"),
        result:string = text.replace(reg, destDomain.origin)
                            .replace(reg2, destDomain2)
                            .replace(reg3, `//${destDomain.host}`);

    return result;
}

export function getRelativeUrl(absoluteUrl:string, domain:string):string{
    const domainUrl = new URL(domain),
         result = absoluteUrl.substring(absoluteUrl.lastIndexOf(domainUrl.host) + domainUrl.host.length);
    return result;
}