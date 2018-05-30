import * as cheerio from 'cheerio';
import { HashMap } from "./hashmap";

export interface ExtractFromHtmlOptions{
    domain?:string;
}

export function extractFromHtml(html:string, options?:ExtractFromHtmlOptions):HashMap{
    const $ = cheerio.load(html),
        aTags = $('a'),
        urls = new HashMap(),
        useDomain = (options && options.domain);

    $(aTags).each(function(i, link){
        const linkUrl = $(link).attr('href');
        if(linkUrl && linkUrl.trim().length && (!useDomain || linkUrl.indexOf(options.domain) > -1)){
            urls.add(linkUrl);
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