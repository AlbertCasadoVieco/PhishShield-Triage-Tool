/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import AnalysisCanvas from './components/AnalysisCanvas';
import HistorySection from './components/HistorySection';
import StatusFooter from './components/StatusFooter';

export default function App() {
  return (
    <div className="flex min-h-screen overflow-hidden bg-surface text-slate-300">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopNav />
        
        <div className="flex-1 overflow-y-auto p-8">
          <AnalysisCanvas />
          <HistorySection />
        </div>
        
        <StatusFooter />
      </main>
    </div>
  );
}
