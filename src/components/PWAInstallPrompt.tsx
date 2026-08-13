import React, { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle, X, ExternalLink, ShieldCheck, Sparkles, Share2 } from 'lucide-react';

interface PWAInstallPromptProps {
  variant?: 'banner' | 'modal' | 'button' | 'pill';
  onDismiss?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ variant = 'banner' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PWA] UXtrade App installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    } else {
      // Show instruction modal if deferred prompt isn't directly available
      setShowModal(true);
    }
  };

  if (isInstalled) {
    if (variant === 'button') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>App Installed</span>
        </div>
      );
    }
    return null;
  }

  // Variant: Button for header / sidebar
  if (variant === 'button') {
    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 transition-all transform active:scale-95 cursor-pointer"
        title="Install UXtrade to your Android or Mobile device"
      >
        <Smartphone className="w-4 h-4 text-sky-200" />
        <span className="hidden sm:inline">Install Mobile App</span>
        <span className="sm:hidden">Install App</span>
      </button>
    );
  }

  // Variant: Floating Pill
  if (variant === 'pill') {
    if (dismissed) return null;
    return (
      <div className="fixed bottom-20 right-4 z-40 animate-bounce">
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-sky-500/30 text-sky-400 rounded-full text-xs font-bold shadow-xl backdrop-blur-md cursor-pointer hover:bg-slate-800"
        >
          <img src="/icon.svg" alt="UXtrade Icon" className="w-5 h-5 rounded-md" />
          <span>Install Android App</span>
          <Download className="w-3.5 h-3.5 text-sky-400" />
        </button>
      </div>
    );
  }

  // Variant: Top Banner
  if (variant === 'banner' && !dismissed) {
    return (
      <>
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-sky-500/20 text-white px-4 py-2.5 text-xs font-medium relative shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/icon.svg" alt="UXtrade App Icon" className="w-8 h-8 rounded-lg shadow-md border border-sky-400/30" />
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>UXtrade Android & Mobile App</span>
                  <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded text-[10px] uppercase tracking-wider font-mono">PWA Native</span>
                </p>
                <p className="text-slate-400 text-[11px] hidden sm:block">Install UXtrade directly on your home screen for faster trading & push alerts.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Instruction Modal if clicked without direct native prompt */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-slate-100 animate-fade-in">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img src="/icon.svg" alt="UXtrade App Icon" className="w-12 h-12 rounded-xl shadow-lg border border-sky-400/30" />
                <div>
                  <h3 className="font-extrabold text-lg text-white">Install UXtrade App</h3>
                  <p className="text-xs text-sky-400 font-semibold">Native Android & Mobile Web Experience</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-300 my-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                {isIOS ? (
                  <div className="space-y-2">
                    <p className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-sky-400" />
                      <span>iOS Safari Installation:</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
                      <li>Tap the <strong className="text-white">Share</strong> icon at the bottom of Safari.</li>
                      <li>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</li>
                      <li>Tap <strong className="text-sky-400">Add</strong> to complete installation.</li>
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-sky-400" />
                      <span>Android / Chrome Installation:</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
                      <li>Tap the Chrome menu <strong className="text-white">(⋮ top right)</strong>.</li>
                      <li>Select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</li>
                      <li>Confirm installation to add the official UXtrade trading icon to your app drawer.</li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default PWAInstallPrompt;
