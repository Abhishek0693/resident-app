import { useState } from 'react'
import TopBar from '../../components/common/TopBar'
import BottomNav from '../../components/common/BottomNav'
import HomeScreen from './HomeScreen'
import PaymentsScreen from './PaymentsScreen'
import MaintenanceScreen from './MaintenanceScreen'
import ResidentNoticesScreen from './NoticesScreen'
import { useApp } from '../../context/AppContext'

const SCREEN_TITLES = {
  home: 'My Home',
  payments: 'Payments',
  maintenance: 'Maintenance',
  notices: 'Notice Board',
}

export default function ResidentDashboard() {
  const { currentUser } = useApp()
  const [tab, setTab] = useState('home')

  return (
    <div>
      <TopBar
        title={SCREEN_TITLES[tab] || 'NIWAS'}
        subtitle={`Resident · ${currentUser.name}`}
      />

      {tab === 'home' && <HomeScreen />}
      {tab === 'payments' && <PaymentsScreen />}
      {tab === 'maintenance' && <MaintenanceScreen />}
      {tab === 'notices' && <ResidentNoticesScreen />}

      <BottomNav role="resident" active={tab} onNavigate={setTab} />
    </div>
  )
}
