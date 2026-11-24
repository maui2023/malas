import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
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
import InstallModal from './components/InstallModal';
import { usePwaInstall } from './hooks/usePwaInstall';
import { db } from './services/localDb';

export default function App() {
  const [isHeadless, setIsHeadless] = useState(false);
  const [isConnectorOpen, setIsConnectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [sessionKey, setSessionKey] = useState(Date.now());
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'workflows' | 'storage' | 'settings'
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [isIphonePreview, setIsIphonePreview] = useState(false);

  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwaInstall();

  const handleOpenInstall = async () => {
    if (isInstallable) {
      const accepted = await promptInstall();
      if (!accepted) {
        setIsInstallOpen(true);
      }
    } else {
      setIsInstallOpen(true);
    }
  };

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
    <div className="flex flex-col h-screen h-[100dvh] w-screen overflow-hidden bg-slate-950 text-slate-100">
      
      {/* 
        ========================================================================
        DESKTOP IPHONE SIMULATOR / PREVIEW MODE
        When isIphonePreview is active on desktop (screen width >= md),
        renders a centered, authentic iPhone 16 Pro device chassis (393 × 852)
        with the 59px top safe area zone, Dynamic Island cutout, and navigation header.
        ========================================================================
      */}
      {isIphonePreview ? (
        <div className="hidden md:flex flex-col flex-1 overflow-hidden bg-slate-950">
          {/* Top Control Bar for Simulator */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-xs shrink-0 z-20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Smartphone className="w-4 h-4" />
                <span>iPhone Mobile Screen Layout</span>
              </div>
              <span className="text-slate-500">&bull;</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                iOS Safe Area: 59px Top Inset Clearance
              </span>
              <span className="text-slate-400 text-[11px] hidden lg:inline">
                iPhone Dynamic Island &amp; Camera Cutout Safe Zone Active
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsIphonePreview(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 border border-slate-700"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Exit iPhone View</span>
              </button>
            </div>
          </div>

          {/* Centered iPhone Device Chassis Container */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-6 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
            <div className="w-[393px] h-[844px] max-h-[calc(100vh-6rem)] bg-slate-950 rounded-[50px] border-[10px] border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_0_2px_rgba(255,255,255,0.08)] flex flex-col overflow-hidden relative shrink-0">
              
              {/* iPhone Navigation Header with 59px Safe Area Zone & Dynamic Island */}
              <Header
                onOpenConnector={() => setIsConnectorOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenExportImport={() => setIsExportImportOpen(true)}
                onOpenInstall={handleOpenInstall}
                onNewChat={handleNewChat}
                activeMobileTab={mobileTab}
                isInstalled={isInstalled}
                isInstallable={isInstallable}
                showSimulatedDynamicIsland={true}
                isSimulatedIphone={true}
              />

              {/* Main Scrollable Content inside iPhone */}
              <div className="flex-1 overflow-hidden relative pb-[4.5rem]">
                <div className={`h-full w-full ${mobileTab === 'chat' ? 'flex flex-col' : 'hidden'}`}>
                  <WorkspaceChat
                    key={`sim-${sessionKey}`}
                    externalPrompt={selectedPrompt}
                    onClearExternalPrompt={() => setSelectedPrompt('')}
                    onOpenConnector={() => setIsConnectorOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onRunningChange={setIsAgentRunning}
                  />
                </div>

                <div className={`h-full w-full ${mobileTab === 'workflows' ? 'flex flex-col' : 'hidden'}`}>
                  <MobileWorkflows
                    onSelectPrompt={handleSelectWorkflowMobile}
                    onNewChat={handleNewChat}
                  />
                </div>

                <div className={`h-full w-full ${mobileTab === 'storage' ? 'flex flex-col' : 'hidden'}`}>
                  <MobileStorageView
                    onOpenExportImport={() => setIsExportImportOpen(true)}
                    onNewChat={handleNewChat}
                  />
                </div>

                <div className={`h-full w-full ${mobileTab === 'settings' ? 'flex flex-col' : 'hidden'}`}>
                  <MobileSettingsView
                    onOpenConnector={() => setIsConnectorOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenExportImport={() => setIsExportImportOpen(true)}
                    onOpenInstall={handleOpenInstall}
                    isInstalled={isInstalled}
                    isInstallable={isInstallable}
                  />
                </div>
              </div>

              {/* Bottom Navigation for Simulated iPhone */}
              <BottomNav
                activeTab={mobileTab}
                onTabChange={(tab) => setMobileTab(tab)}
                isRunning={isAgentRunning}
                isSimulatedIphone={true}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Standard Desktop Layout */
        <div className="hidden md:flex flex-col flex-1 overflow-hidden">
          {/* Top Navbar */}
          <Header
            onOpenConnector={() => setIsConnectorOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenExportImport={() => setIsExportImportOpen(true)}
            onOpenInstall={handleOpenInstall}
            onNewChat={handleNewChat}
            activeMobileTab={mobileTab}
            isInstalled={isInstalled}
            isInstallable={isInstallable}
            isIphonePreview={isIphonePreview}
            onToggleIphonePreview={() => setIsIphonePreview(true)}
          />

          {/* Main Desktop Workspace Area */}
          <div className="flex flex-1 overflow-hidden relative">
            <Sidebar
              onSelectPrompt={(prompt) => setSelectedPrompt(prompt)}
              onNewChat={handleNewChat}
            />

            <div className="flex-1 h-full w-full flex flex-col">
              <WorkspaceChat
                key={sessionKey}
                externalPrompt={selectedPrompt}
                onClearExternalPrompt={() => setSelectedPrompt('')}
                onOpenConnector={() => setIsConnectorOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onRunningChange={setIsAgentRunning}
              />
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        NATIVE MOBILE / IPHONE LAYOUT (< md breakpoint)
        Strictly respects iOS Safe Area insets:
        1. Top Header leaves a clear 59px (or env(safe-area-inset-top)) status bar space
           at the very top for Dynamic Island / notch, time, and battery icons.
        2. App's main navigation header sits directly below this safe area zone.
        3. Bottom navigation bar includes safe-area-inset-bottom and home indicator.
        ========================================================================
      */}
      <div className="flex flex-col flex-1 overflow-hidden md:hidden">
        {/* Mobile Top Header with 59px Safe Area Inset Zone */}
        <Header
          onOpenConnector={() => setIsConnectorOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExportImport={() => setIsExportImportOpen(true)}
          onOpenInstall={handleOpenInstall}
          onNewChat={handleNewChat}
          activeMobileTab={mobileTab}
          isInstalled={isInstalled}
          isInstallable={isInstallable}
        />

        {/* Mobile Main Views Container (with safe area bottom padding for BottomNav) */}
        <div className="flex flex-1 overflow-hidden relative pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
          
          {/* Chat Tab View */}
          <div className={`flex-1 h-full w-full ${mobileTab === 'chat' ? 'flex flex-col' : 'hidden'}`}>
            <WorkspaceChat
              key={`mob-${sessionKey}`}
              externalPrompt={selectedPrompt}
              onClearExternalPrompt={() => setSelectedPrompt('')}
              onOpenConnector={() => setIsConnectorOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onRunningChange={setIsAgentRunning}
            />
          </div>

          {/* Workflows Tab View */}
          <div className={`flex-1 h-full w-full ${mobileTab === 'workflows' ? 'flex flex-col' : 'hidden'}`}>
            <MobileWorkflows
              onSelectPrompt={handleSelectWorkflowMobile}
              onNewChat={handleNewChat}
            />
          </div>

          {/* Storage Tab View */}
          <div className={`flex-1 h-full w-full ${mobileTab === 'storage' ? 'flex flex-col' : 'hidden'}`}>
            <MobileStorageView
              onOpenExportImport={() => setIsExportImportOpen(true)}
              onNewChat={handleNewChat}
            />
          </div>

          {/* Settings Tab View */}
          <div className={`flex-1 h-full w-full ${mobileTab === 'settings' ? 'flex flex-col' : 'hidden'}`}>
            <MobileSettingsView
              onOpenConnector={() => setIsConnectorOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenExportImport={() => setIsExportImportOpen(true)}
              onOpenInstall={handleOpenInstall}
              isInstalled={isInstalled}
              isInstallable={isInstallable}
            />
          </div>

        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          activeTab={mobileTab}
          onTabChange={(tab) => setMobileTab(tab)}
          isRunning={isAgentRunning}
        />
      </div>

      {/* Global Modals */}
      <ConnectorModal
        isOpen={isConnectorOpen}
        onClose={() => setIsConnectorOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenInstall={handleOpenInstall}
        isInstalled={isInstalled}
        isInstallable={isInstallable}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onResetComplete={handleNewChat}
      />

      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={async () => {
          await promptInstall();
        }}
      />

    </div>
  );
}
