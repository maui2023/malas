import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WorkspaceChat from './components/WorkspaceChat';
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
    } catch (e) {
      console.warn('Could not clear messages:', e);
    }
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
      />

      {/* Main Layout: Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onSelectPrompt={(prompt) => setSelectedPrompt(prompt)}
          onNewChat={handleNewChat}
        />

        <WorkspaceChat
          key={sessionKey}
          externalPrompt={selectedPrompt}
          onClearExternalPrompt={() => setSelectedPrompt('')}
          onOpenConnector={() => setIsConnectorOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Slide-over / Centered Modals */}
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
      />

    </div>
  );
}
