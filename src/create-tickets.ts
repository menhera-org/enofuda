
import 'dotenv/config';

import { DataStore } from './lib.js';

const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:3000';
const DATA_DIR = process.env.DATA_DIR || './data';
const store = new DataStore(DATA_DIR);

const assemblyUuid = process.argv[2];
const ticketCount = parseInt(process.argv[3] || '1', 10);
if (isNaN(ticketCount) || ticketCount < 1) {
    console.error('Invalid ticket count');
    process.exit(1);
}

(async () => {
    const assembly = await store.getAssembly(assemblyUuid);
    for (let i = 0; i < ticketCount; i++) {
        const ticket = await store.createTicket(assembly.uuid);
        const url = `${SERVER_URL}/ticket/${assembly.uuid}/${ticket.uuid}/${ticket.token}`;
        console.log('Ticket URL:', url);
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
