import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

import type { TasksWidgetPayload } from '../lib/widget-data';
vi.mock('react-native-android-widget', () => ({
    FlexWidget: 'FlexWidget',
    TextWidget: 'TextWidget',
}));

import { buildTasksWidgetTree } from './TasksWidget';

const basePayload: TasksWidgetPayload = {
    headerTitle: 'Today',
    subtitle: 'Inbox: 1',
    inboxLabel: 'Inbox',
    inboxCount: 1,
    items: [
        {
            id: 'task-1',
            title: 'Review waiting item',
            statusLabel: 'Next',
        },
    ],
    emptyMessage: 'No tasks',
    captureLabel: 'Quick capture',
    focusUri: 'mindwtr:///focus',
    quickCaptureUri: 'mindwtr:///capture-quick?mode=text',
    palette: {
        background: '#F8FAFC',
        card: '#FFFFFF',
        border: '#CBD5E1',
        text: '#0F172A',
        mutedText: '#475569',
        accent: '#2563EB',
        onAccent: '#FFFFFF',
    },
};

describe('TasksWidget', () => {
    it('uses the larger task title font size in widget rows', () => {
        const tree = buildTasksWidgetTree(basePayload);
        const content = (tree.props.children as ReactElement[])[0] as ReactElement<{ children: ReactElement[] }>;
        const contentChildren = content.props.children;
        const taskItem = contentChildren.find(
            (child) => (child as ReactElement<{ text?: string }>).props.text === '• Review waiting item'
        ) as ReactElement<{ style: { fontSize: number } }> | undefined;

        expect(taskItem).toBeDefined();
        expect(taskItem?.props.style.fontSize).toBe(13);
    });
});
