import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WorkspaceChat from './components/WorkspaceChat';
import BottomNav from './components/BottomNav';
import MobileWorkflows from './components/MobileWorkflows';
import MobileStorageView from './components/MobileStorageView';
import MobileSettingsView from './components/MobileSettingsView';
import ConnectorModal from './components/ConnectorModal';
import SettingsModal from './components/SettingsModal';
import ExportImportModal from './components/ExportImportModal';
import HeadlessView from './components/HeadlessView';
import { db } from './services/localDb';

export default function App() {
  const [isHeadless, setIsHeadless] = useState(false);
  const [isConnectorOpen, setIsConnectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [sessionKey, setSessionKey] = useState(Date.now());
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'workflows' | 'storage' | 'settings'
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('headless') === 'true') {
        setIsHeadless(true);
      }
    }
  }, []);

  const handleNewChat = async () => {
    try {
      await db.messages.clear();
      setSessionKey(Date.now());
      setMobileTab('chat');
    } catch (e) {
      console.warn('Could not clear messages:', e);
    }
  };

  const handleSelectWorkflowMobile = (prompt) => {
    setSelectedPrompt(prompt);
    setMobileTab('chat');
  };

  if (isHeadless) {
    return <HeadlessView />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      
      {/* Top Navbar */}
      <Header
        onOpenConnector={() => setIsConnectorOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onNewChat={handleNewChat}
        activeMobileTab={mobileTab}
      />

      {/* Main Layout Area:
          - On Desktop (md:): Sidebar + Chat side by side with pb-0.
          - On Mobile: Single view (Chat / Workflows / Storage / Settings) with pb-16 for BottomNav.
      */}
      <div className="flex flex-1 overflow-hidden relative pb-16 md:pb-0">
        
        {/* Desktop Sidebar (hidden md:flex) */}
        <Sidebar
          onSelectPrompt={(prompt) => setSelectedPrompt(prompt)}
          onNewChat={handleNewChat}
        />

        {/* Primary Workspace Chat:
            - Always visible on Desktop (md:flex)
            - Visible on Mobile only when mobileTab === 'chat'
            Keeping it mounted preserves running state & messages!
        */}
        <div className={`flex-1 h-full w-full ${mobileTab === 'chat' ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}>
          <WorkspaceChat
            key={sessionKey}
            externalPrompt={selectedPrompt}
            onClearExternalPrompt={() => setSelectedPrompt('')}
            onOpenConnector={() => setIsConnectorOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onRunningChange={setIsAgentRunning}
          />
        </div>

        {/* Mobile View: Workflows Tab */}
        <div className={`md:hidden flex-1 h-full w-full ${mobileTab === 'workflows' ? 'flex flex-col' : 'hidden'}`}>
          <MobileWorkflows
            onSelectPrompt={handleSelectWorkflowMobile}
            onNewChat={handleNewChat}
          />
        </div>

        {/* Mobile View: Storage Tab */}
        <div className={`md:hidden flex-1 h-full w-full ${mobileTab === 'storage' ? 'flex flex-col' : 'hidden'}`}>
          <MobileStorageView
            onOpenExportImport={() => setIsExportImportOpen(true)}
            onNewChat={handleNewChat}
          />
        </div>

        {/* Mobile View: Settings Tab */}
        <div className={`md:hidden flex-1 h-full w-full ${mobileTab === 'settings' ? 'flex flex-col' : 'hidden'}`}>
          <MobileSettingsView
            onOpenConnector={() => setIsConnectorOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenExportImport={() => setIsExportImportOpen(true)}
          />
        </div>

      </div>

      {/* App-like Bottom Navigation Menu (Mobile Only) */}
      <BottomNav
        activeTab={mobileTab}
        onTabChange={(tab) => setMobileTab(tab)}
        isRunning={isAgentRunning}
      />

      {/* Modals (Slide-over / Centered) */}
      <ConnectorModal
        isOpen={isConnectorOpen}
        onClose={() => setIsConnectorOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onResetComplete={handleNewChat}
      />

    </div>
  );
}
