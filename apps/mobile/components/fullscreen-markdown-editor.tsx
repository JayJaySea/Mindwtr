import React from 'react';
import {
    InteractionManager,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '@/contexts/language-context';
import { useThemeColors } from '@/hooks/use-theme-colors';

import { fullscreenMarkdownEditorStyles as styles } from './fullscreen-markdown-editor.styles';
import { MarkdownText } from './markdown-text';

type FullscreenMarkdownEditorProps = {
    visible: boolean;
    onClose: () => void;
    value: string;
    onChangeText: (text: string) => void;
    onCommit?: () => void;
    title: string;
    placeholder: string;
    initialMode?: 'edit' | 'preview';
    direction?: 'ltr' | 'rtl';
};

export function FullscreenMarkdownEditor({
    visible,
    onClose,
    value,
    onChangeText,
    onCommit,
    title,
    placeholder,
    initialMode = 'edit',
    direction,
}: FullscreenMarkdownEditorProps) {
    const { t } = useLanguage();
    const tc = useThemeColors();
    const inputRef = React.useRef<TextInput | null>(null);
    const [mode, setMode] = React.useState<'edit' | 'preview'>(initialMode);
    const directionStyle = direction
        ? {
            writingDirection: direction,
            textAlign: direction === 'rtl' ? 'right' : 'left',
        }
        : undefined;

    React.useEffect(() => {
        if (!visible) return;
        setMode(initialMode);
    }, [initialMode, visible]);

    React.useEffect(() => {
        if (!visible || mode !== 'edit') return;
        const interaction = InteractionManager.runAfterInteractions(() => {
            inputRef.current?.focus();
        });
        return () => {
            interaction.cancel();
        };
    }, [mode, visible]);

    const handleClose = React.useCallback(() => {
        onCommit?.();
        onClose();
    }, [onClose, onCommit]);

    const handleToggleMode = React.useCallback(() => {
        setMode((prev) => {
            const next = prev === 'edit' ? 'preview' : 'edit';
            if (next === 'preview') {
                Keyboard.dismiss();
            }
            return next;
        });
    }, []);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top', 'bottom']}>
                <View style={[styles.header, { borderBottomColor: tc.border }]}>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={styles.closeButton}
                        accessibilityRole="button"
                        accessibilityLabel={t('markdown.collapse')}
                    >
                        <Ionicons
                            name={Platform.OS === 'ios' ? 'chevron-down' : 'close'}
                            size={24}
                            color={tc.text}
                        />
                    </TouchableOpacity>

                    <Text style={[styles.title, { color: tc.text }]} numberOfLines={1}>
                        {title}
                    </Text>

                    <TouchableOpacity
                        onPress={handleToggleMode}
                        style={[styles.modeButton, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
                        accessibilityRole="button"
                        accessibilityLabel={mode === 'edit' ? t('markdown.preview') : t('markdown.edit')}
                    >
                        <Text style={[styles.modeButtonText, { color: tc.tint }]}>
                            {mode === 'edit' ? t('markdown.preview') : t('markdown.edit')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={0}
                    style={styles.body}
                >
                    {mode === 'edit' ? (
                        <View style={styles.content}>
                            <TextInput
                                ref={inputRef}
                                style={[
                                    styles.editorInput,
                                    directionStyle,
                                    { color: tc.text, backgroundColor: tc.inputBg, borderColor: tc.border },
                                ]}
                                value={value}
                                onChangeText={onChangeText}
                                placeholder={placeholder}
                                placeholderTextColor={tc.secondaryText}
                                multiline
                                accessibilityLabel={title}
                                accessibilityHint={placeholder}
                            />
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.previewScroll}
                            contentContainerStyle={styles.previewContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={[styles.previewSurface, { backgroundColor: tc.filterBg, borderColor: tc.border }]}>
                                <MarkdownText markdown={value} tc={tc} direction={direction} />
                            </View>
                        </ScrollView>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}
