import { describe, expect, it } from 'vitest';
import {
    computeProjectAreaDragResult,
    getProjectAreaContainerId,
    getProjectAreaIdFromContainer,
} from './project-area-dnd';

describe('project-area-dnd', () => {
    it('parses area container ids', () => {
        const id = getProjectAreaContainerId('area-1');
        expect(id).toBe('project-area:area-1');
        expect(getProjectAreaIdFromContainer(id)).toBe('area-1');
        expect(getProjectAreaIdFromContainer('other')).toBeNull();
    });

    it('reorders projects within the same area', () => {
        const result = computeProjectAreaDragResult({
            activeId: 'p3',
            overId: 'p1',
            projectIdsByArea: new Map([
                ['a1', ['p1', 'p2', 'p3']],
                ['a2', ['p4']],
            ]),
            projectAreaById: new Map([
                ['p1', 'a1'],
                ['p2', 'a1'],
                ['p3', 'a1'],
                ['p4', 'a2'],
            ]),
        });

        expect(result).toEqual({
            sourceAreaId: 'a1',
            destinationAreaId: 'a1',
            nextSourceIds: ['p3', 'p1', 'p2'],
            nextDestinationIds: ['p3', 'p1', 'p2'],
            movedProjectId: 'p3',
            movedAcrossAreas: false,
        });
    });

    it('moves a project into another area before the hovered project', () => {
        const result = computeProjectAreaDragResult({
            activeId: 'p1',
            overId: 'p4',
            projectIdsByArea: new Map([
                ['a1', ['p1', 'p2']],
                ['a2', ['p3', 'p4']],
            ]),
            projectAreaById: new Map([
                ['p1', 'a1'],
                ['p2', 'a1'],
                ['p3', 'a2'],
                ['p4', 'a2'],
            ]),
        });

        expect(result).toEqual({
            sourceAreaId: 'a1',
            destinationAreaId: 'a2',
            nextSourceIds: ['p2'],
            nextDestinationIds: ['p3', 'p1', 'p4'],
            movedProjectId: 'p1',
            movedAcrossAreas: true,
        });
    });

    it('appends a project when dropped on an area container', () => {
        const result = computeProjectAreaDragResult({
            activeId: 'p1',
            overId: getProjectAreaContainerId('a2'),
            projectIdsByArea: new Map([
                ['a1', ['p1', 'p2']],
                ['a2', ['p3']],
            ]),
            projectAreaById: new Map([
                ['p1', 'a1'],
                ['p2', 'a1'],
                ['p3', 'a2'],
            ]),
        });

        expect(result).toEqual({
            sourceAreaId: 'a1',
            destinationAreaId: 'a2',
            nextSourceIds: ['p2'],
            nextDestinationIds: ['p3', 'p1'],
            movedProjectId: 'p1',
            movedAcrossAreas: true,
        });
    });
});
