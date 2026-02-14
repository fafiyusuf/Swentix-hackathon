import React from 'react'
import NavigationBar from '../../components/navigation'
import TaskBar from '../../components/taskbar'

const Dashboard = () => {
  return (
    <div>
      <div>
        <TaskBar />
      </div>
      <div>
        <NavigationBar />

      </div>


      <h2>Dashboard</h2>
    </div>
  )
}

export default Dashboard