import {expect} from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import * as linkUtils from '../../src/utils/linkUtils';
import * as fileUtils from '../../src/utils/fileUtils';

describe('linkUtils', () =>{
    describe('replaceDomain()', () => {
        it('should return input string if no source domain found', () =>{
            const text = 'lorem ipsum dolor',
                destDomain = new URL("https://127.0.0.1"),
                result = linkUtils.replaceDomain(text, 'localhost', destDomain);

            expect(result).to.be.eq(text);
        });

        it('should replace all occurencies of source domain', () =>{
            const text = "lorem https://www.davideguida.com ipsum //www.davideguida.com dolor www.davideguida.com amet https:\\\/\\\/www.davideguida.com\\\/ sit",
                srcDomain = 'https://www.davideguida.com',
                destDomain = new URL("https://127.0.0.1"),
                result = linkUtils.replaceDomain(text, srcDomain, destDomain),
                expected = 'lorem https://127.0.0.1 ipsum //127.0.0.1 dolor 127.0.0.1 amet https:\\\/\\\/127.0.0.1\\\/ sit';

            expect(result).to.be.eq(expected);
        });

        it('should replace all occurencies of source domain', async () =>{
            const dataFullpath = path.join(__dirname, "../data/index.html"),
                text = await fileUtils.readAsync(dataFullpath),
                srcDomain = 'https://www.davideguida.com',
                destDomain = new URL("https://127.0.0.1"),
                result = linkUtils.replaceDomain(text, srcDomain, destDomain);

            expect(result.includes("www.davideguida.com")).to.be.false;
            expect(result.includes("127.0.0.1")).to.be.true;
        });
    });
});