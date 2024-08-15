
import { describe, it, expect } from 'vitest';
import * as main from '../../lib/main';

describe('main', () => {
    it('should have a name', () => {
        expect(main.name).toBe('webgpu_volume');
    });
    it('should get a context', () => {
        // mock gpu adapter
        global.navigator = {};
        expect(global.navigator).toBeDefined();
        expect(navigator).toBeDefined();
        global.navigator.gpu = {};
        expect(navigator.gpu).toBeDefined();
        global.navigator.gpu.requestAdapter = async () => { return {}; };
        expect(navigator.gpu.requestAdapter).toBeDefined();
        const context = main.context();
        expect(context).toBeDefined();
    });
    it('should error if no adapter', () => {
        global.navigator = {};
        expect(global.navigator).toBeDefined();
        expect(navigator).toBeDefined();
        global.navigator.gpu = undefined
        expect(() => { main.context(); }).toThrow();
    });
});
