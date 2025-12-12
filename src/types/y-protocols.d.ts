declare module 'y-protocols/awareness' {
    import * as Y from 'yjs';
    export class Awareness {
        constructor(doc: Y.Doc);
        doc: Y.Doc;
        clientID: number;
        states: Map<number, any>;
        on(event: 'update', handler: (args: { added: number[], updated: number[], removed: number[] }, origin: any) => void): void;
        off(event: 'update', handler: any): void;
        setLocalState(state: any): void;
        setLocalStateField(field: string, value: any): void;
        getStates(): Map<number, any>;
    }
    export function encodeAwarenessUpdate(awareness: Awareness, clients: number[]): Uint8Array;
    export function applyAwarenessUpdate(awareness: Awareness, update: Uint8Array, origin: any): void;
}

declare module 'y-protocols/sync' {
    import * as Y from 'yjs';
    export const messageYjsSyncStep1: number;
    export const messageYjsSyncStep2: number;
    export const messageYjsUpdate: number;
    export const messageAwareness: number;

    export function createEncoder(): any;
    export function createDecoder(uint8Array: Uint8Array): any;
    export function readVarUint(decoder: any): number;
    export function readVarUint8Array(decoder: any): Uint8Array;
    export function writeVarUint(encoder: any, value: number): void;
    export function writeVarUint8Array(encoder: any, value: Uint8Array): void;
    // export function toUint8Array(encoder: any): Uint8Array; // Moved to lib0
    export function length(encoder: any): number;

    export function createSyncStep1(doc: Y.Doc): Uint8Array;
    export function readSyncStep1(decoder: any, encoder: any, doc: Y.Doc): void;
    export function readSyncStep2(decoder: any, doc: Y.Doc): void;
    export function readUpdate(decoder: any, doc: Y.Doc): void;
}
