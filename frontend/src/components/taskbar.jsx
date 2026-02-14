import React from 'react'

const TaskBar = () => {
  return (
    <div style={styles.sidebar}>
      <div style={styles.title}>
        <h1 style={{ margin: 0 }}>HR</h1>
      </div>

      <ul style={styles.list}>
        <li style={styles.item}>Dashboard</li>
        <li style={styles.item}>Employees</li>
        <li style={styles.item}>Requests</li>
        <li style={styles.item}>Reports</li>
        <li style={styles.item}>Logout</li>
      </ul>
    </div>
  )
}

const styles = {
  sidebar: {
    background: '#074066',
    width: '15rem',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    color: 'white',
    padding: '20px',
  },
  title: {
    marginBottom: '30px',
    borderBottom: '1px solid rgba(255,255,255,0.3)',
    paddingBottom: '10px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  item: {
    padding: '12px 10px',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: '0.2s',
  },
}

export default TaskBar