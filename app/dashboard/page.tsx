'use client';

import { Sidebar } from "./Sidebar"
import { Dashboard } from "./Dashboard"

const DashboardMain = () => {
  return (
    <div>
      <Sidebar />
      <div className="ml-48">
        <Dashboard />
      </div>
    </div>
  )
}

export default DashboardMain
