import React from 'react';

const createHostComponent = (name: string) => (props: any) =>
  React.createElement(name, props, props.children);

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T) => styles,
};

export const View = createHostComponent('View');
export const Text = createHostComponent('Text');
export const ScrollView = createHostComponent('ScrollView');
export const FlatList = createHostComponent('FlatList');
export const Modal = createHostComponent('Modal');
export const TouchableOpacity = createHostComponent('TouchableOpacity');
export const Pressable = createHostComponent('Pressable');
export const KeyboardAvoidingView = createHostComponent('KeyboardAvoidingView');
export const Image = createHostComponent('Image');
export const ActivityIndicator = createHostComponent('ActivityIndicator');

export const TextInput = (props: any) =>
  React.createElement('TextInput', props, props.children);

export const Share = {
  share: async () => ({ action: 'dismissedAction' }),
};

export const Alert = {
  alert: () => {},
};

export const Animated = {
  View: createHostComponent('Animated.View'),
  ScrollView: createHostComponent('Animated.ScrollView'),
  Value: class {
    _value: number;
    constructor(value: number) {
      this._value = value;
    }
  },
  event: () => () => {},
  timing: () => ({ start: (cb?: () => void) => cb?.() }),
};

export const Platform = { OS: 'web', select: (options: any) => options?.web ?? options?.default };

export const Dimensions = {
  get: () => ({ width: 390, height: 844 }),
};

export const Keyboard = {
  addListener: () => ({ remove: () => {} }),
  dismiss: () => {},
};

export const TurboModuleRegistry = {
  get: () => null,
};
