import { describe, it, expect, beforeEach } from 'vitest';
import { useModal, useModalRegistry } from '../useModal';

describe('useModal', () => {
  describe('Basic functionality', () => {
    it('should initialize with closed state by default', () => {
      const { isOpen } = useModal();
      expect(isOpen.value).toBe(false);
    });

    it('should initialize with custom initial state', () => {
      const { isOpen } = useModal(true);
      expect(isOpen.value).toBe(true);
    });

    it('should open modal', () => {
      const { isOpen, open } = useModal();
      open();
      expect(isOpen.value).toBe(true);
    });

    it('should close modal', () => {
      const { isOpen, close } = useModal(true);
      close();
      expect(isOpen.value).toBe(false);
    });

    it('should toggle modal from closed to open', () => {
      const { isOpen, toggle } = useModal();
      toggle();
      expect(isOpen.value).toBe(true);
    });

    it('should toggle modal from open to closed', () => {
      const { isOpen, toggle } = useModal(true);
      toggle();
      expect(isOpen.value).toBe(false);
    });

    it('should toggle modal multiple times', () => {
      const { isOpen, toggle } = useModal();

      toggle();
      expect(isOpen.value).toBe(true);

      toggle();
      expect(isOpen.value).toBe(false);

      toggle();
      expect(isOpen.value).toBe(true);
    });
  });

  describe('Return value interface', () => {
    it('should return all required methods', () => {
      const modal = useModal();

      expect(modal).toHaveProperty('isOpen');
      expect(modal).toHaveProperty('open');
      expect(modal).toHaveProperty('close');
      expect(modal).toHaveProperty('toggle');
      expect(typeof modal.open).toBe('function');
      expect(typeof modal.close).toBe('function');
      expect(typeof modal.toggle).toBe('function');
    });
  });
});

describe('useModalRegistry', () => {
  beforeEach(() => {
    const { closeAllModals } = useModalRegistry();
    closeAllModals();
  });

  describe('Basic functionality', () => {
    it('should open a modal by ID', () => {
      const { openModal, isModalOpen } = useModalRegistry();
      openModal('testModal');
      expect(isModalOpen('testModal')).toBe(true);
    });

    it('should close a modal by ID', () => {
      const { openModal, closeModal, isModalOpen } = useModalRegistry();
      openModal('testModal');
      closeModal('testModal');
      expect(isModalOpen('testModal')).toBe(false);
    });

    it('should toggle a modal by ID', () => {
      const { toggleModal, isModalOpen } = useModalRegistry();

      toggleModal('testModal');
      expect(isModalOpen('testModal')).toBe(true);

      toggleModal('testModal');
      expect(isModalOpen('testModal')).toBe(false);
    });

    it('should return false for non-existent modal', () => {
      const { isModalOpen } = useModalRegistry();
      expect(isModalOpen('nonExistent')).toBe(false);
    });

    it('should close all modals', () => {
      const { openModal, closeAllModals, isModalOpen } = useModalRegistry();

      openModal('modal1');
      openModal('modal2');
      openModal('modal3');

      closeAllModals();

      expect(isModalOpen('modal1')).toBe(false);
      expect(isModalOpen('modal2')).toBe(false);
      expect(isModalOpen('modal3')).toBe(false);
    });
  });

  describe('Modal data', () => {
    it('should store modal data when opening', () => {
      const { openModal, getModalData } = useModalRegistry();
      const testData = { userId: 123, action: 'delete' };

      openModal('testModal', testData);

      expect(getModalData('testModal')).toEqual(testData);
    });

    it('should return typed modal data', () => {
      const { openModal, getModalData } = useModalRegistry();
      interface TestData {
        userId: number;
        action: string;
      }
      const testData: TestData = { userId: 123, action: 'delete' };

      openModal('testModal', testData);

      const data = getModalData<TestData>('testModal');
      expect(data?.userId).toBe(123);
      expect(data?.action).toBe('delete');
    });

    it('should return undefined for non-existent modal data', () => {
      const { getModalData } = useModalRegistry();
      expect(getModalData('nonExistent')).toBeUndefined();
    });

    it('should clear modal data when closing', () => {
      const { openModal, closeModal, getModalData } = useModalRegistry();
      const testData = { userId: 123 };

      openModal('testModal', testData);
      closeModal('testModal');

      expect(getModalData('testModal')).toBeUndefined();
    });

    it('should clear all modal data when closing all modals', () => {
      const { openModal, closeAllModals, getModalData } = useModalRegistry();

      openModal('modal1', { data: 1 });
      openModal('modal2', { data: 2 });

      closeAllModals();

      expect(getModalData('modal1')).toBeUndefined();
      expect(getModalData('modal2')).toBeUndefined();
    });
  });

  describe('Multiple modals', () => {
    it('should manage multiple modals independently', () => {
      const { openModal, isModalOpen } = useModalRegistry();

      openModal('modal1');
      openModal('modal2');
      openModal('modal3');

      expect(isModalOpen('modal1')).toBe(true);
      expect(isModalOpen('modal2')).toBe(true);
      expect(isModalOpen('modal3')).toBe(true);
    });

    it('should close individual modal without affecting others', () => {
      const { openModal, closeModal, isModalOpen } = useModalRegistry();

      openModal('modal1');
      openModal('modal2');
      openModal('modal3');

      closeModal('modal2');

      expect(isModalOpen('modal1')).toBe(true);
      expect(isModalOpen('modal2')).toBe(false);
      expect(isModalOpen('modal3')).toBe(true);
    });
  });

  describe('Return value interface', () => {
    it('should return all required methods', () => {
      const registry = useModalRegistry();

      expect(registry).toHaveProperty('openModal');
      expect(registry).toHaveProperty('closeModal');
      expect(registry).toHaveProperty('toggleModal');
      expect(registry).toHaveProperty('isModalOpen');
      expect(registry).toHaveProperty('getModalData');
      expect(registry).toHaveProperty('closeAllModals');
      expect(typeof registry.openModal).toBe('function');
      expect(typeof registry.closeModal).toBe('function');
      expect(typeof registry.toggleModal).toBe('function');
      expect(typeof registry.isModalOpen).toBe('function');
      expect(typeof registry.getModalData).toBe('function');
      expect(typeof registry.closeAllModals).toBe('function');
    });
  });
});
