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

});