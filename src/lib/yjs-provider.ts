import * as Y from 'yjs';
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

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
                // console.log('[Yjs] Received broadcast payload:', payload);
                // Payload from Supabase is technically 'any' but usually matches what we sent (number[])
                // We cast to Uint8Array.
                if (payload) {
                    this.handleMessage(new Uint8Array(payload as number[]));
                }
            })
            .subscribe((status) => {
                console.log(`[Yjs] Channel status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    this._synced = true;
                    // Sync step 1: Send SyncStep1 to announce we are here
                    const encoder = encoding.createEncoder();
                    // @ts-ignore: writeSyncStep1 exists at runtime but is missing in type definitions
                    syncProtocol.writeSyncStep1(encoder, this.doc);
                    this.sendMessage(encoding.toUint8Array(encoder));
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
            case syncProtocol.messageAwareness:
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
        encoding.writeVarUint(encoder, syncProtocol.messageAwareness);
        encoding.writeVarUint8Array(
            encoder,
            awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
        );
        this.sendMessage(encoding.toUint8Array(encoder));
    }

    private sendMessage(message: Uint8Array) {
        if (this._synced && this.channel) {
            // console.log('[Yjs] Sending Broadcast Message, length:', message.length);
            // Supabase Broadcast accepts JSON object, so we convert Uint8Array to Array
            // Actually, we can assume payload can be handled or send as number[]
            this.channel.send({
                type: 'broadcast',
                event: 'message',
                payload: Array.from(message),
            }).catch(err => console.error('[Yjs] Send Error:', err));
        } else {
            console.warn('[Yjs] Cannot send, not synced yet or channel missing');
        }
    }

    destroy() {
        this.doc.off('update', this.handleDocUpdate);
        this.awareness.off('update', this.handleAwarenessUpdate);
        if (this.channel) this.supabase.removeChannel(this.channel);
    }
}
