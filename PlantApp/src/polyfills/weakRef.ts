type WeakRefValue<T extends object> = T;

class WeakRefShim<T extends object> {
  private value: WeakRefValue<T>;

  constructor(value: T) {
    this.value = value;
  }

  deref(): T {
    return this.value;
  }
}

class FinalizationRegistryShim<T> {
  constructor(_cleanupCallback: (heldValue: T) => void) {}

  register(_target: object, _heldValue: T): void {}

  unregister(_target: object): void {}
}

if (typeof globalThis.WeakRef === 'undefined') {
  (globalThis as any).WeakRef = WeakRefShim;
}

if (typeof globalThis.FinalizationRegistry === 'undefined') {
  (globalThis as any).FinalizationRegistry = FinalizationRegistryShim;
}

export {};