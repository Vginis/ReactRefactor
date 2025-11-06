
import { resolveJscodeshiftParser } from '../../lib/util.js';

describe("Loaded jscodeshift object is singleton", () => {


    test('Loaded parser for tsx file type is not singleton', () => {
        const j1 = resolveJscodeshiftParser('tsx')
        const j2 = resolveJscodeshiftParser('tsx')
        expect(j1).toBe(j1)
        expect(j1).not.toBe(j2)        
    })

    test('Loaded parser for other file type is singleton', () => {
        const j1 = resolveJscodeshiftParser('js')
        const j2 = resolveJscodeshiftParser('js')
        expect(j1).toBe(j1)
        expect(j1).toBe(j2)        
    })
});