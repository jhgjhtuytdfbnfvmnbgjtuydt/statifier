import {expect} from 'chai';
import { HashMap } from '../../src/utils/hashmap';

describe('Hashmap', () =>{
    it('cTor should create instance', () =>{
        const sut = new HashMap();
        expect(sut).to.be.instanceof(HashMap);

        expect(sut.count()).to.be.eq(0);
    });

    it('contains() should return false if item not found', () =>{
        const sut = new HashMap<string>();
        expect(sut.contains('fasasdasdasdasdasd')).to.be.false;
    });

    it('add() should add item', () =>{
        const sut = new HashMap<string>(),
            item = 'lorem';

        sut.add(item);

        expect(sut.contains(item)).to.be.true;
        expect(sut.count()).to.be.eq(1);
    });

    it('remove() should remove item', () =>{
        const sut = new HashMap<string>(),
            item = 'lorem';

        sut.add(item);
        sut.remove(item);

        expect(sut.contains(item)).to.be.false;
        expect(sut.count()).to.be.eq(0);
    });
});