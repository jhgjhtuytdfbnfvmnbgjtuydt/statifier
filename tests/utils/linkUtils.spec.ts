import {expect} from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import * as linkUtils from '../../src/utils/linkUtils';
import * as fileUtils from '../../src/utils/fileUtils';
import { HashMap } from '../../src/utils/hashmap';

describe('linkUtils', () =>{
    describe('replaceDomains()', () => {
        it('should return input string if no source domain found', () =>{
            const text = 'lorem ipsum dolor',
                srcDomain = new URL('https://localhost'),
                destDomain = new URL("https://127.0.0.1"),
                result = linkUtils.replaceDomains(text, srcDomain, destDomain);

            expect(result).to.be.eq(text);
        });

        it('should replace all occurencies of source domain', () =>{
            const text = "lorem https://www.davideguida.com ipsum //www.davideguida.com dolor www.davideguida.com lorem.com/www.davideguida.com amet https:\\\/\\\/www.davideguida.com\\\/ sit 'www.davideguida.com' ut",
                srcDomain = new URL('https://www.davideguida.com'),
                destDomain = new URL("https://127.0.0.1"),
                result = linkUtils.replaceDomains(text, srcDomain, destDomain),
                expected = "lorem https://127.0.0.1 ipsum //127.0.0.1 dolor 127.0.0.1 lorem.com/www.davideguida.com amet https:\\\/\\\/127.0.0.1\\\/ sit '127.0.0.1' ut";

            expect(result).to.be.eq(expected);
        });

//         it('should replace all occurencies of source domain in text', async () =>{
//             const dataFullpath = path.join(__dirname, "../data/index.html"),
//                 text = await fileUtils.readAsync(dataFullpath),
//                 srcDomain = new URL('https://www.davideguida.com'),
//                 destDomain = new URL("https://127.0.0.1"),
//                 result = linkUtils.replaceDomains(text, srcDomain, destDomain);
// console.log(result);
//             expect(result.includes("www.davideguida.com")).to.be.false;
//             expect(result.includes("127.0.0.1")).to.be.true;
//         });

    });
    
    describe('extractFromHtml()', () =>{
        it('should return empty collection if input html empty', () =>{
            const srcDomain = new URL('https://www.davideguida.com'),
            options:linkUtils.ExtractFromHtmlOptions = {
                tagsSelector: 'img',
                validDomains: new HashMap([srcDomain]),
                assetUrlExtractor: t => t.attr('src'),
                primaryDomain: null
            }, results = linkUtils.extractFromHtml('', options);

            expect(results).to.be.not.null;
            expect(results.count()).to.be.eql(0);
        });

        it('should return empty collection if no valid link found', async () =>{
            const dataFullpath = path.join(__dirname, "../data/index.html"),
                html = await fileUtils.readAsync(dataFullpath),
                srcDomain = new URL('https://loremipsum.com'),
                options:linkUtils.ExtractFromHtmlOptions = {
                    tagsSelector: 'img',
                    validDomains: new HashMap([srcDomain]),
                    assetUrlExtractor: t => t.attr('src'),
                    primaryDomain: null
                }, 
                results = linkUtils.extractFromHtml(html, options);

            expect(results).to.be.not.null;
            expect(results.count()).to.be.eql(0);
        });

        it('should return valid collection if valid links found', async () =>{
            const dataFullpath = path.join(__dirname, "../data/index.html"),
                html = await fileUtils.readAsync(dataFullpath),
                srcDomain = new URL('https://i2.wp.com/www.davideguida.com'),
                options:linkUtils.ExtractFromHtmlOptions = {
                    tagsSelector: 'img',
                    validDomains: new HashMap([srcDomain]),
                    assetUrlExtractor: t => t.attr('src'),
                    primaryDomain: null
                }, 
                results = linkUtils.extractFromHtml(html, options);

            expect(results).to.be.not.null;
            expect(results.count()).to.be.eq(3);
        });
    });
});