import * as Y from 'yjs';
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

const messageAwareness = 3;

export class SupabaseProvider {
    doc: Y.Doc;
    supabase: SupabaseClient;
    channel: RealtimeChannel | undefined;
    awareness: awarenessProtocol.Awareness;
    channelName: string;

    private _synced: boolean = false;

    constructor(doc: Y.Doc, supabase: SupabaseClient, channelName: string) {
        this.doc = doc;
        this.supabase = supabase;
        this.channelName = channelName;
        this.awareness = new awarenessProtocol.Awareness(doc);

        // Channel creation moved to connect()
        this.doc.on('update', this.handleDocUpdate.bind(this));

        // Setup Awareness (Cursors)
        this.awareness.on('update', this.handleAwarenessUpdate.bind(this));

        this.connect();
    }

    async connect() {
        console.log(`[Yjs] Connecting to channel: ${this.channelName}`);

        // Explicitly enabling broadcast mode
        this.channel = this.supabase.channel(this.channelName, {
            config: {
                broadcast: { self: false },
                presence: { key: this.channelName },
            }
        });

        this.channel
            .on('broadcast', { event: 'message' }, ({ payload }) => {
                if (payload) {
                    this.handleMessage(new Uint8Array(payload as number[]));
                }
            })
            .on('broadcast', { event: 'chunk' }, ({ payload }) => {
                // Reassemble chunks
                if (payload && payload.id && payload.data) {
                    const { id, total, index, data } = payload;
                    // console.log(`[Yjs] Received chunk ${index + 1}/${total} for ${id}`);

                    let entry = this.incomingChunks.get(id);
                    if (!entry) {
                        entry = { total, chunks: new Array(total), received: 0 };
                        this.incomingChunks.set(id, entry);
                    }

                    if (!entry.chunks[index]) {
                        entry.chunks[index] = new Uint8Array(data);
                        entry.received++;
                    }

                    if (entry.received === total) {
                        // All chunks received
                        console.log(`[Yjs] Reassembled message ${id}, size: ${entry.chunks.reduce((acc, c) => acc + c.length, 0)}`);
                        // Merge chunks
                        const fullMessage = new Uint8Array(entry.chunks.reduce((acc, c) => acc + c.length, 0));
                        let offset = 0;
                        for (const chunk of entry.chunks) {
                            fullMessage.set(chunk, offset);
                            offset += chunk.length;
                        }
                        this.incomingChunks.delete(id);
                        this.handleMessage(fullMessage);
                    }
                }
            })
            .subscribe((status) => {
                console.log(`[Yjs] Channel status: ${status}`);

                if (status === 'SUBSCRIBED') {
                    this._synced = true;
                    // Sync step 1: Send SyncStep1 to announce we are here
                    const encoder = encoding.createEncoder();
                    // @ts-ignore: Access via bracket notation to prevent minification issues and handle type missing
                    const writeSyncStep1 = syncProtocol['writeSyncStep1'] || (syncProtocol as any).writeSyncStep1;

                    if (typeof writeSyncStep1 === 'function') {
                        writeSyncStep1(encoder, this.doc);
                        this.sendMessage(encoding.toUint8Array(encoder));
                    } else {
                        console.error('[Yjs] Critical Error: writeSyncStep1 function not found in syncProtocol', syncProtocol);
                    }

                    // Flush buffer
                    this.flushBuffer();
                } else {
                    // Start buffering if connection lost (CLOSED, CHANNEL_ERROR, TIMED_OUT)
                    if (this._synced) {
                        console.warn(`[Yjs] Channel connection lost (${status}), buffering messages...`);
                    }
                    this._synced = false;
                }
            });
    }

    private handleMessage(message: Uint8Array) {
        // console.log('[Yjs] Handling message, length:', message.length);
        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
            case syncProtocol.messageYjsSyncStep1:
                // console.log('[Yjs] Handling SyncStep1');
                syncProtocol.readSyncStep1(decoder, encoder, this.doc);
                if (encoding.length(encoder) > 0) {
                    this.sendMessage(encoding.toUint8Array(encoder));
                }
                break;
            case syncProtocol.messageYjsSyncStep2:
                // console.log('[Yjs] Handling SyncStep2');
                syncProtocol.readSyncStep2(decoder, this.doc);
                break;
            case syncProtocol.messageYjsUpdate:
                // console.log('[Yjs] Handling Update');
                syncProtocol.readUpdate(decoder, this.doc);
                break;
            case messageAwareness:
                // console.log('[Yjs] Handling Awareness');
                awarenessProtocol.applyAwarenessUpdate(this.awareness, decoding.readVarUint8Array(decoder), this);
                break;
        }
    }

    private handleDocUpdate(update: Uint8Array, origin: any) {
        if (origin === this) return; // Ignore updates applied by this provider (from remote)
        // console.log('[Yjs] Local Doc Update Detected, broadcasting...');

        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, syncProtocol.messageYjsUpdate);
        encoding.writeVarUint8Array(encoder, update);
        this.sendMessage(encoding.toUint8Array(encoder));
    }

    private handleAwarenessUpdate({ added, updated, removed }: any, origin: any) {
        if (origin === this) return;

        const changedClients = added.concat(updated).concat(removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
            encoder,
            awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
        );
        this.sendMessage(encoding.toUint8Array(encoder));
    }

    private messageBuffer: Uint8Array[] = [];
    private incomingChunks: Map<string, { total: number, chunks: Uint8Array[], received: number }> = new Map();

    private sendMessage(message: Uint8Array) {
        if (this._synced && this.channel) {
            const CHUNK_SIZE = 20000; // 20KB limit to be safe
            if (message.length <= CHUNK_SIZE) {
                this.channel.send({
                    type: 'broadcast',
                    event: 'message',
                    payload: Array.from(message),
                }).catch(err => console.error('[Yjs] Send Error:', err));
            } else {
                // Split into chunks
                const total = Math.ceil(message.length / CHUNK_SIZE);
                const chunkId = Math.random().toString(36).substring(7);
                console.log(`[Yjs] Splitting message of size ${message.length} into ${total} chunks (ID: ${chunkId})`);

                for (let i = 0; i < total; i++) {
                    const chunk = message.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                    this.channel.send({
                        type: 'broadcast',
                        event: 'chunk',
                        payload: {
                            id: chunkId,
                            total,
                            index: i,
                            data: Array.from(chunk)
                        }
                    }).catch(err => console.error('[Yjs] Chunk Send Error:', err));
                }
            }
        } else {
            if (this.messageBuffer.length < 50) {
                this.messageBuffer.push(message);
            }
        }
    }

    private flushBuffer() {
        if (this.messageBuffer.length > 0) {
            console.log(`[Yjs] Flushing ${this.messageBuffer.length} buffered messages`);
            this.messageBuffer.forEach(msg => this.sendMessage(msg));
            this.messageBuffer = [];
        }
    }

    destroy() {
        this.doc.off('update', this.handleDocUpdate);
        this.awareness.off('update', this.handleAwarenessUpdate);
        if (this.channel) this.supabase.removeChannel(this.channel);
    }
}
