import { useState } from 'react'
import TopBar from '../../components/common/TopBar'
import BottomNav from '../../components/common/BottomNav'
import BuildingsScreen from './BuildingsScreen'
import BuildingDetail from './BuildingDetail'
import ResidentsScreen from './ResidentsScreen'
import FinancialsScreen from './FinancialsScreen'
import DocumentsScreen from './DocumentsScreen'
import NoticesScreen from './NoticesScreen'
import { useApp } from '../../context/AppContext'
import AIChat from '../../components/common/AIChat'

const TITLES = {
  dashboard: 'Buildings',
  residents: 'Residents',
  financials: 'Financials',
  documents: 'Documents & Notices',
}

export default function AdminDashboard() {
  const { currentUser } = useApp()
  const [tab, setTab] = useState('dashboard')
  const [buildingId, setBuildingId] = useState(null)
  const [docSubTab, setDocSubTab] = useState('docs')

  const handleTabChange = (t) => { setTab(t); setBuildingId(null) }

  return (
    <div>
      <TopBar
        title={buildingId ? 'Building Detail' : TITLES[tab]}
        subtitle={buildingId ? undefined : `Admin · ${currentUser.name}`}
        back={!!buildingId}
        onBack={() => setBuildingId(null)}
      />

      {tab === 'dashboard' && !buildingId && (
        <BuildingsScreen onSelectBuilding={setBuildingId} />
      )}
      {tab === 'dashboard' && buildingId && (
        <BuildingDetail buildingId={buildingId} />
      )}
      {tab === 'residents' && <ResidentsScreen />}
      {tab === 'financials' && <FinancialsScreen />}
      {tab === 'documents' && (
        <>
          {/* Sub-tab strip sits right below the fixed TopBar */}
          <div className="fixed top-14 left-0 right-0 z-30 bg-niwas-bg border-b border-niwas-border">
            <div className="flex max-w-lg mx-auto px-4 gap-1 py-2">
              {[['docs', 'Documents'], ['notices', 'Notices']].map(([v, l]) => (
                <button key={v} onClick={() => setDocSubTab(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer
                    ${docSubTab === v ? 'tab-active' : 'tab-inactive'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {/* Extra top padding for TopBar (56px) + sub-tab strip (49px) */}
          <div style={{ paddingTop: '105px' }}>
            {docSubTab === 'docs'
              ? <DocumentsScreen noPadTop />
              : <NoticesScreen noPadTop />
            }
          </div>
        </>
      )}

      <BottomNav role="admin" active={tab} onNavigate={handleTabChange} />
      <AIChat />
    </div>
  )
}
