import type { ReactElement } from 'react';
import type { AppData } from '@mindwtr/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockAsyncStorageGetItem,
    mockRequestWidgetUpdate,
} = vi.hoisted(() => ({
    mockAsyncStorageGetItem: vi.fn(),
    mockRequestWidgetUpdate: vi.fn(),
}));

vi.mock('react-native', () => ({
    Platform: {
        OS: 'android',
    },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
    default: {
        getItem: mockAsyncStorageGetItem,
    },
}));

vi.mock('react-native-android-widget', () => ({
    FlexWidget: 'FlexWidget',
    TextWidget: 'TextWidget',
    requestWidgetUpdate: mockRequestWidgetUpdate,
}));

import { updateMobileWidgetFromData } from './widget-service';

const buildData = (): AppData => {
    const now = new Date().toISOString();
    return {
        tasks: [
            { id: '1', title: 'Focused 1', status: 'next', isFocusedToday: true, tags: [], contexts: [], createdAt: now, updatedAt: now },
            { id: '2', title: 'Focused 2', status: 'next', isFocusedToday: true, tags: [], contexts: [], createdAt: now, updatedAt: now },
            { id: '3', title: 'Focused 3', status: 'next', isFocusedToday: true, tags: [], contexts: [], createdAt: now, updatedAt: now },
            { id: '4', title: 'Focused 4', status: 'next', isFocusedToday: true, tags: [], contexts: [], createdAt: now, updatedAt: now },
            { id: '5', title: 'Focused 5', status: 'next', isFocusedToday: true, tags: [], contexts: [], createdAt: now, updatedAt: now },
        ],
        projects: [],
        areas: [],
        sections: [],
        settings: {},
    };
};

const countRenderedTaskRows = (tree: ReactElement): number => {
    const [content] = tree.props.children as ReactElement[];
    const contentChildren = content.props.children as ReactElement[];
    return contentChildren.filter((child) => {
        const text = (child as ReactElement<{ text?: string }>).props.text;
        return typeof text === 'string' && text.startsWith('• ');
    }).length;
};

describe('widget-service', () => {
    beforeEach(() => {
        mockAsyncStorageGetItem.mockReset();
        mockAsyncStorageGetItem.mockResolvedValue(null);
        mockRequestWidgetUpdate.mockReset();
    });

    it('uses Android widget height to render more rows during app-driven updates', async () => {
        let renderedTree: ReactElement | null = null;
        mockRequestWidgetUpdate.mockImplementation(async ({ renderWidget }) => {
            renderedTree = await renderWidget({
                widgetName: 'TasksWidget',
                widgetId: 1,
                height: 320,
                width: 180,
                screenInfo: {
                    screenHeightDp: 800,
                    screenWidthDp: 400,
                    density: 2,
                    densityDpi: 320,
                },
            });
        });

        const didUpdate = await updateMobileWidgetFromData(buildData());

        expect(didUpdate).toBe(true);
        expect(mockRequestWidgetUpdate).toHaveBeenCalledTimes(1);
        expect(renderedTree).not.toBeNull();
        expect(countRenderedTaskRows(renderedTree as ReactElement)).toBe(5);
    });
});
