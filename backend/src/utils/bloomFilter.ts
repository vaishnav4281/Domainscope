import crypto from 'crypto';

export class BloomFilter {
    private size: number;
    private hashCount: number;
    private bitArray: Uint8Array;

    constructor(size: number = 1024, hashCount: number = 3) {
        this.size = size;
        this.hashCount = hashCount;
        this.bitArray = new Uint8Array(Math.ceil(size / 8));
    }

    add(item: string): void {
        for (let i = 0; i < this.hashCount; i++) {
            const index = this.getHash(item, i) % this.size;
            const byteIndex = Math.floor(index / 8);
            const bitIndex = index % 8;
            this.bitArray[byteIndex]! |= (1 << bitIndex);
        }
    }

    contains(item: string): boolean {
        for (let i = 0; i < this.hashCount; i++) {
            const index = this.getHash(item, i) % this.size;
            const byteIndex = Math.floor(index / 8);
            const bitIndex = index % 8;
            if (!(this.bitArray[byteIndex]! & (1 << bitIndex))) {
                return false;
            }
        }
        return true;
    }

    private getHash(item: string, seed: number): number {
        const hash = crypto.createHash('md5').update(`${item}:${seed}`).digest('hex');
        return parseInt(hash.substring(0, 8), 16);
    }
}
