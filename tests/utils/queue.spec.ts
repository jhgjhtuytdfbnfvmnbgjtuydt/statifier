import {expect} from 'chai';
import {Queue} from '../../src/utils/queue';
describe('Queue', () =>{

    it('cTor should create instance', () =>{
        const sut = new Queue<number>();
        expect(sut).to.be.instanceof(Queue);
    });

    describe('count()', () =>{
        it('should return 0 when new instance', ()=>{
            const sut = new Queue<number>();
            expect(sut.count()).to.be.eql(0);
        });

        it('should return 1 when one item enqueued', ()=>{
            const sut = new Queue<number>(),
                item = 42;;
            sut.enqueue(item);
            expect(sut.count()).to.be.eql(1);
        });

        it('should return decreased count when item dequeued', () =>{
            const sut = new Queue<number>(),
            item = 42;
            sut.enqueue(item);
            sut.dequeue();
            expect(sut.count()).to.be.eql(0);
        });
    });

    describe('enqueue()', () =>{
        it('should enqueue item', () =>{
            const sut = new Queue<number>(),
                item = 42;;
            sut.enqueue(item);
            expect(sut.peek()).to.be.eql(item);
        });
    });

    describe('dequeue()', () =>{
        it('should return undefined when queue empty', () =>{
            const sut = new Queue<number>();
            expect(sut.dequeue()).to.be.undefined;
        });

        it('should dequeue last element added', () =>{
            const sut = new Queue<number>(),
            item = 42;
            sut.enqueue(item);
            expect(sut.count()).to.be.eql(1);

            expect(sut.dequeue()).to.be.eql(item);
        });
    });

    describe('peek()', () =>{
        it('should return undefined when no item added', () =>{
            const sut = new Queue<number>();
            expect(sut.peek()).to.be.undefined;
        });

        it('should return last item added', () =>{
            const sut = new Queue<number>(),
                item = 42;;

            sut.enqueue(item);
            expect(sut.peek()).to.be.eql(item);
        });
    });
});