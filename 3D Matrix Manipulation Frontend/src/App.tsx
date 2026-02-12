import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { ThreeJSViewport } from './components/ThreeJSViewport';
import { TransformationControls } from './components/TransformationControls';
import { ObjectHierarchy } from './components/ObjectHierarchy';
import { MatrixPanel } from './components/MatrixPanel';
import { ViewportControls } from './components/ViewportControls';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { Badge } from './components/ui/badge';
import { Calculator } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { state } = useAppContext();

  useEffect(() => {
    // Apply initial theme
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  return (
    <div className="h-screen w-full bg-background text-foreground">
      {/* Header */}
      <div className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold">3D Matrix Manipulation Library</h1>
          <Badge variant="secondary">Interactive</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{state.objects.length} objects</span>
          <Separator orientation="vertical" className="h-4" />
          <span>{state.viewportSettings.projection}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>{state.theme} theme</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-3.5rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full p-4 bg-card/50">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <ObjectHierarchy />
                  <TransformationControls />
                  <ViewportControls />
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Viewport */}
          <ResizablePanel defaultSize={50} minSize={40}>
            <div className="h-full p-4">
              <div className="h-full border border-border rounded-lg overflow-hidden bg-muted">
                <ThreeJSViewport />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full p-4 bg-card/50">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <MatrixPanel />
                  
                  {/* Help Section */}
                  <div className="mt-8 p-4 border border-border rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-3">Quick Start</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>1. Add objects using the buttons in the left panel</p>
                      <p>2. Click on objects in the 3D viewport to select them</p>
                      <p>3. Use transformation controls to modify position, rotation, and scale</p>
                      <p>4. View and manipulate transformation matrices in the right panel</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}