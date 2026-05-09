const EXTENSION_FEATURES = [
    {
        id: 'diplo-os',
        label: 'Diplomacy Tactical OS',
        color: '#00d4ff',
        onToggle: (isActive) => {
            window.postMessage({ type: ExtensionEvents.DIPLO_TOGGLE, active: isActive }, '*');
        }
    },
    {
        id: 'organize-company',
        label: 'Organize Company',
        color: '#00d4ff',
        onToggle: (isActive) => {
            window.postMessage({ type: ExtensionEvents.ORGANIZE_COMPANY_TOGGLE, active: isActive }, '*');
        }
    },
    {
        id: 'light-mode',
        label: 'Light Mode',
        color: '#00d4ff',
        onToggle: (isActive) => {
            LightModeController.toggle(isActive);
        }
    }
];