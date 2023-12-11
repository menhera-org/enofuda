
import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { glob } from 'glob';

export type VoteOption = 'yes' | 'no' | 'abstain';
export namespace VoteOption {
    export const YES: VoteOption = 'yes';
    export const NO: VoteOption = 'no';
    export const ABSTAIN: VoteOption = 'abstain';

    export function verify(value: unknown): value is VoteOption {
        return value === YES || value === NO || value === ABSTAIN;
    }
}

export interface Proposal {
    uuid: string;
    title: string;
    text: string;
}

export interface Assembly {
    uuid: string;
    name: string;
    proposals: Proposal[];
}

export interface Ticket {
    uuid: string;
    assembly_uuid: string;
    token: string;
}

export interface Vote {
    assembly_uuid: string;
    ticket_uuid: string;
    token: string;
    proposals: Record<string, VoteOption>; // uuid -> VoteOption
}

export class DataStore {
    readonly #dir: string;
    public constructor(dir: string) {
        this.#dir = dir;
    }

    #generateUuid(): string {
        return uuidv4();
    }

    #generateToken(): string {
        const buffer = Buffer.alloc(24);
        crypto.randomFillSync(buffer);
        return buffer.toString('base64url');
    }

    async #createDir(): Promise<void> {
        await fs.mkdir(this.#dir, { recursive: true });
    }

    public async getAssembly(uuid: string): Promise<Assembly> {
        const path = `${this.#dir}/assembly_${uuid}.json`;
        const json = await fs.readFile(path, 'utf-8');
        return JSON.parse(json);
    }

    public async setAssembly(assembly: Assembly): Promise<void> {
        this.#createDir();
        const { uuid } = assembly;
        const path = `${this.#dir}/assembly_${uuid}.json`;
        const json = JSON.stringify(assembly, null, 4);
        await fs.writeFile(path, json);
    }

    public async createTicket(assembly_uuid: string): Promise<Ticket> {
        this.#createDir();
        const uuid = this.#generateUuid();
        const token = this.#generateToken();
        const ticket = {
            uuid,
            assembly_uuid,
            token,
        };
        const path = `${this.#dir}/ticket_${assembly_uuid}_${uuid}.json`;
        const json = JSON.stringify(ticket);
        await fs.writeFile(path, json);
        return ticket;
    }

    public async getTicket(assembly_uuid: string, uuid: string): Promise<Ticket> {
        const path = `${this.#dir}/ticket_${assembly_uuid}_${uuid}.json`;
        const json = await fs.readFile(path, 'utf-8');
        return JSON.parse(json);
    }

    public async getVote(assembly_uuid: string, ticket_uuid: string): Promise<Vote> {
        const path = `${this.#dir}/vote_${assembly_uuid}_${ticket_uuid}.json`;
        const json = await fs.readFile(path, 'utf-8');
        return JSON.parse(json);
    }

    public async setVote(vote: Vote): Promise<void> {
        this.#createDir();
        const { assembly_uuid, ticket_uuid } = vote;
        const path = `${this.#dir}/vote_${assembly_uuid}_${ticket_uuid}.json`;
        if (await fs.stat(path).catch((e) => null)) {
            throw new Error('Vote already exists');
        }
        const json = JSON.stringify(vote);
        await fs.writeFile(path, json);
    }

    public async voteExists(assembly_uuid: string, ticket_uuid: string): Promise<boolean> {
        const path = `${this.#dir}/vote_${assembly_uuid}_${ticket_uuid}.json`;
        return await fs.stat(path).catch((e) => null) !== null;
    }

    public async countTickets(assembly_uuid: string): Promise<number> {
        const pattern = `${this.#dir}/ticket_${assembly_uuid}_*.json`;
        const paths = await glob(pattern);
        return paths.length;
    }

    public async collectVotes(assembly_uuid: string): Promise<Vote[]> {
        const pattern = `${this.#dir}/vote_${assembly_uuid}_*.json`;
        const paths = await glob(pattern);
        const votes = await Promise.all(paths.map(async (path) => {
            const json = await fs.readFile(path, 'utf-8');
            return JSON.parse(json);
        }));
        return votes;
    }
}
