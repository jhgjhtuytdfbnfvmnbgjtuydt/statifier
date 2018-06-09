import {expect} from 'chai';
import * as pathUtils from '../../src/utils/pathUtils';
describe('pathUtils', () =>{
    describe('extractFolders()', () =>{
        it('should return empty array if input empty', () =>{
            const result = pathUtils.extractFolders('');
            expect(result).not.to.be.null;
            expect(result).to.be.empty;
        });

        it('should return input string if no subfolders found', () =>{
            const result = pathUtils.extractFolders('lorem');
            expect(result).not.to.be.null;
            expect(result.length).to.be.eq(1);
            expect(result[0]).to.be.eql('lorem');
        });

        it('should return subfolders', () =>{
            const result = pathUtils.extractFolders('/lorem/ipsum/dolor/amet/');

            expect(result).not.to.be.null;
            expect(result.length).to.be.eq(4);
            expect(result[0]).to.be.eql('/lorem');
            expect(result[1]).to.be.eql('/lorem/ipsum');
            expect(result[2]).to.be.eql('/lorem/ipsum/dolor');
            expect(result[3]).to.be.eql('/lorem/ipsum/dolor/amet');
        });
    });
});