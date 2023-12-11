
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';

import { DataStore, Proposal, Assembly } from './lib.js';

const DATA_DIR = process.env.DATA_DIR || './data';
const store = new DataStore(DATA_DIR);

const stubProposal: Proposal = {
    uuid: uuidv4(),
    title: 'Stub Proposal',
    text: 'This is a stub proposal',
};

const stubAssembly: Assembly = {
    uuid: uuidv4(),
    name: 'Stub Assembly',
    proposals: [stubProposal],
};

store.setAssembly(stubAssembly).catch((e) => console.error(e));

console.log('Assembly UUID:', stubAssembly.uuid);
console.log('Please edit:', `${DATA_DIR}/assembly_${stubAssembly.uuid}.json`);
