import { describe, expect, it } from 'vitest';
import type { Task } from './types';
import {
    buildBulkTaskTokenUpdates,
    collectBulkTaskTokens,
    normalizeBulkTaskTokenInput,
} from './bulk-task-tokens';

const createTask = (id: string, overrides: Partial<Task> = {}): Task => ({
    id,
    title: `Task ${id}`,
    status: 'next',
    tags: [],
    contexts: [],
    createdAt: '2026-03-21T12:00:00.000Z',
    updatedAt: '2026-03-21T12:00:00.000Z',
    ...overrides,
});

describe('bulk-task-tokens', () => {
    it('normalizes bulk token input with the correct prefix', () => {
        expect(normalizeBulkTaskTokenInput(' urgent ', 'tags')).toBe('#urgent');
        expect(normalizeBulkTaskTokenInput('#urgent', 'tags')).toBe('#urgent');
        expect(normalizeBulkTaskTokenInput('@home', 'contexts')).toBe('@home');
        expect(normalizeBulkTaskTokenInput('@@', 'contexts')).toBe('');
    });

    it('collects unique tokens across the selected tasks', () => {
        const tasksById = new Map<string, Task>([
            ['a', createTask('a', { tags: ['#urgent', '#ops'], contexts: ['@desk'] })],
            ['b', createTask('b', { tags: ['#urgent'], contexts: ['@home', '@desk'] })],
        ]);

        expect(collectBulkTaskTokens(['a', 'b'], tasksById, 'tags')).toEqual(['#ops', '#urgent']);
        expect(collectBulkTaskTokens(['a', 'b'], tasksById, 'contexts')).toEqual(['@desk', '@home']);
    });

    it('builds deduplicated add updates for selected tasks', () => {
        const tasksById = new Map<string, Task>([
            ['a', createTask('a', { tags: ['#urgent'] })],
            ['b', createTask('b', { tags: [] })],
        ]);

        expect(buildBulkTaskTokenUpdates(['a', 'b'], tasksById, 'tags', 'ops', 'add')).toEqual([
            { id: 'a', updates: { tags: ['#ops', '#urgent'] } },
            { id: 'b', updates: { tags: ['#ops'] } },
        ]);
    });

    it('only updates selected tasks that actually contain a removed token', () => {
        const tasksById = new Map<string, Task>([
            ['a', createTask('a', { contexts: ['@desk', '@home'] })],
            ['b', createTask('b', { contexts: ['@home'] })],
            ['c', createTask('c', { contexts: [] })],
        ]);

        expect(buildBulkTaskTokenUpdates(['a', 'b', 'c'], tasksById, 'contexts', '@home', 'remove')).toEqual([
            { id: 'a', updates: { contexts: ['@desk'] } },
            { id: 'b', updates: { contexts: [] } },
        ]);
    });
});
