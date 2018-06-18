import {expect} from 'chai';
import * as urlUtils from '../../src/utils/urlUtils';

describe('urlUtils', () =>{
    describe('toURL()', () =>{
        it('should throw if value not in valid format', () =>{
            expect( () => { urlUtils.toURL('as d sadasd '); } ).to.throw();
        });

        it('should return valid URL', () =>{
            const value = "http://localhost",
                expected = new URL(value),
                result = urlUtils.toURL(value);
            expect( result ).to.eqls(expected);
        });

        it('should add protocol if missing', () =>{
            const value = "localhost",
                expected = new URL(`http://${value}`),
                result = urlUtils.toURL(value);
            expect( result ).to.eqls(expected);
        });

        it('should add protocol if missing and starting by //', () =>{
            const value = "//localhost",
                expected = new URL(`http:${value}`),
                result = urlUtils.toURL(value);
            expect( result ).to.eqls(expected);
        });
    });

    describe('formatUrl()', () =>{
        it('should return input url if format valid', ()=>{
            const url = 'https://www.davideguida.com',
                result = urlUtils.formatUrl(url, null),
                expected = new URL('https://www.davideguida.com');
            expect(result).to.be.eql(expected);
        });

        it('should add source domain if not added', ()=>{
            const url = '/lorem/ipsum.jpg',
                sourceDomain = new URL('https://www.davideguida.com'),
                result = urlUtils.formatUrl(url, sourceDomain),
                expected = new URL('https://www.davideguida.com/lorem/ipsum.jpg');
            expect(result).to.be.eql(expected);
        });
    });

    describe('replaceDomain()', () =>{
        it('should return destination domain when source url contains host only', () =>{
            const srcUrl = new URL('https://localhost'),
                destDomain = new URL('https://127.0.0.1'),
                result = urlUtils.replaceDomain(srcUrl, destDomain);
            expect(result).to.be.eql(destDomain);
        });

        it('should return replace source domain', () =>{
            const srcUrl = new URL('https://localhost/lorem.jpg'),
                destDomain = new URL('https://127.0.0.1'),
                expected = new URL('https://127.0.0.1/lorem.jpg'),
                result = urlUtils.replaceDomain(srcUrl, destDomain);
            expect(result).to.be.eql(expected);
        });

        it('should return replace source domain using pattern', () =>{
            const srcUrl = new URL('https://localhost/lorem/ipsum.jpg'),
                destDomain = new URL('https://127.0.0.1'),
                options:urlUtils.ReplaceDomainOptions = {
                    pattern: new RegExp('https://localhost/lorem', 'gm')
                },
                expected = new URL('https://127.0.0.1/ipsum.jpg'),
                result = urlUtils.replaceDomain(srcUrl, destDomain, options);
            expect(result).to.be.eql(expected);
        });
    });

});