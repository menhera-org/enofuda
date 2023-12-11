
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';

import { DataStore, Vote, VoteOption } from './lib.js';

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.set('trust proxy', true);
app.use(bodyParser.json());
app.use(cors());

const LISTEN_PORT = parseInt(process.env.LISTEN_PORT || '3000', 10);
const DATA_DIR = process.env.DATA_DIR || './data';
const store = new DataStore(DATA_DIR);

app.use('/assets', express.static('assets'));

app.get('/ticket/:assembly_uuid/:ticket_uuid/:token', async (req, res, next) => {
    try {
        const { assembly_uuid, ticket_uuid, token } = req.params;
        if (await store.voteExists(assembly_uuid, ticket_uuid)) {
            res.status(403).send('Forbidden');
            return;
        }
        const ticket = await store.getTicket(assembly_uuid, ticket_uuid);
        if (ticket.token === token) {
            const assembly = await store.getAssembly(assembly_uuid);
            res.render('ticket', { assembly, ticket });
        } else {
            res.status(403).send('Forbidden');
        }
    } catch (e) {
        next(e);
    }
});

// POST application/json
app.post('/vote', async (req, res, next) => {
    try {
        const vote = req.body as Vote;
        const { assembly_uuid, ticket_uuid, token } = vote;
        const ticket = await store.getTicket(assembly_uuid, ticket_uuid);
        const assembly = await store.getAssembly(assembly_uuid);
        if (ticket.token === token) {
            const proposals: Record<string, VoteOption> = {};
            for (const proposal of assembly.proposals) {
                if (proposal.uuid in vote.proposals) {
                    const voteOption = vote.proposals[proposal.uuid];
                    if (VoteOption.verify(voteOption)) {
                        proposals[proposal.uuid] = voteOption;
                    } else {
                        const response = {
                            error: 'Invalid Vote Option',
                        };
                        res.status(400).json(response);
                        return;
                    }
                } else {
                    const response = {
                        error: 'Missing Vote Option',
                    };
                    res.status(400).json(response);
                    return;
                }
            }
            const newVote: Vote = {
                assembly_uuid,
                ticket_uuid,
                token,
                proposals,
            };
            await store.setVote(newVote);
            const response = {
                error: null,
            };
            res.status(200).json(response);
        } else {
            const response = {
                error: 'Forbidden',
            };
            res.status(403).json(response);
        }
    } catch (e) {
        next(e);
    }
});

app.get('*', (_req, res) => {
    const response = {
        error: 'Not Found',
    };
    res.status(404).json(response);
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    const response = {
        error: 'Internal Server Error',
    };
    res.status(500).json(response);
});

app.listen(LISTEN_PORT, '127.0.0.1', () => {
    console.log(`Listening on 127.0.0.1:${LISTEN_PORT}`);
});
