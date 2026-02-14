import React, { Component } from "react";

class Dashboard extends Component {
  state = {
    // User info
    userEmail: localStorage.getItem('userEmail') || 'admin@example.com',
    
    // Sidebar state
    sidebarCollapsed: false,
    activePage: 'dashboard',
    
    // Dashboard data
    stats: {
      total_candidates: 0,
      pending_reviews: 0,
      approved: 0,
      rejected: 0
    },
    candidates: [],
    graphData: null,
    selectedCandidate: null,
    
    // UI states
    isLoading: false,
    showProfileMenu: false,
    currentTime: new Date().toLocaleTimeString(),
    
    // Modal states
    showStatusModal: false,
    selectedCandidateId: null,
    selectedStatus: '',
    statusUpdateLoading: false
  };

  componentDidMount() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      window.location.href = '/';
    }

    // Update time every second
    this.timer = setInterval(() => {
      this.setState({ currentTime: new Date().toLocaleTimeString() });
    }, 1000);

    // Load initial data
    this.fetchDashboardStats();
    this.fetchCandidates();
    this.fetchGraphData();
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  // API Calls
  fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/dashboard/stats');
      const data = await response.json();
      this.setState({ stats: data });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  fetchCandidates = async () => {
    this.setState({ isLoading: true });
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/candidates');
      const data = await response.json();
      this.setState({ candidates: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching candidates:', error);
      this.setState({ isLoading: false });
    }
  };

  fetchGraphData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/dashboard/graph');
      const data = await response.json();
      this.setState({ graphData: data });
    } catch (error) {
      console.error('Error fetching graph data:', error);
    }
  };

  fetchCandidateDetails = async (candidateId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/candidates/${candidateId}`);
      const data = await response.json();
      this.setState({ selectedCandidate: data });
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    }
  };

  downloadCV = async (candidateId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/candidates/${candidateId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cv_${candidateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading CV:', error);
      alert('Failed to download CV');
    }
  };

  updateCandidateStatus = async () => {
    const { selectedCandidateId, selectedStatus } = this.state;
    
    this.setState({ statusUpdateLoading: true });
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/candidates/${selectedCandidateId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: selectedStatus })
      });

      if (response.ok) {
        // Refresh candidates list
        this.fetchCandidates();
        this.setState({ showStatusModal: false, statusUpdateLoading: false });
        alert('Status updated successfully!');
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
      this.setState({ statusUpdateLoading: false });
    }
  };

  // Handlers
  handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.href = '/';
  };

  toggleSidebar = () => {
    this.setState(prevState => ({
      sidebarCollapsed: !prevState.sidebarCollapsed
    }));
  };

  handlePageChange = (page) => {
    this.setState({ activePage: page });
  };

  openStatusModal = (candidateId, currentStatus) => {
    this.setState({
      showStatusModal: true,
      selectedCandidateId: candidateId,
      selectedStatus: currentStatus || 'pending'
    });
  };

  getStatusColor = (status) => {
    switch(status) {
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#999';
    }
  };

  renderSidebar = () => {
    const { sidebarCollapsed, activePage } = this.state;

    const menuItems = [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'candidates', icon: '👥', label: 'Candidates' },
      { id: 'analytics', icon: '📈', label: 'Analytics' },
      { id: 'settings', icon: '⚙️', label: 'Settings' }
    ];

    return (
      <div style={{
        ...styles.sidebar,
        width: sidebarCollapsed ? '80px' : '280px'
      }}>
        {/* Logo */}
        <div style={styles.sidebarLogo}>
          <span style={styles.logoIcon}>📄</span>
          {!sidebarCollapsed && <span style={styles.logoText}>Admin Portal</span>}
        </div>

        {/* Menu Items */}
        <div style={styles.sidebarMenu}>
          {menuItems.map(item => (
            <button
              key={item.id}
              style={{
                ...styles.menuItem,
                backgroundColor: activePage === item.id ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
              onClick={() => this.handlePageChange(item.id)}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              {!sidebarCollapsed && <span style={styles.menuLabel}>{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Bottom Menu */}
        <div style={styles.sidebarBottom}>
          <button style={styles.menuItem} onClick={this.toggleSidebar}>
            <span style={styles.menuIcon}>{sidebarCollapsed ? '→' : '←'}</span>
            {!sidebarCollapsed && <span style={styles.menuLabel}>Collapse</span>}
          </button>
          
          <button style={styles.menuItem} onClick={this.handleLogout}>
            <span style={styles.menuIcon}>🚪</span>
            {!sidebarCollapsed && <span style={styles.menuLabel}>Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  renderTopBar = () => {
    const { showProfileMenu, userEmail, currentTime } = this.state;

    return (
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <span style={styles.pageTitle}>
            {this.state.activePage.charAt(0).toUpperCase() + this.state.activePage.slice(1)}
          </span>
        </div>

        <div style={styles.topBarRight}>
          {/* Time Display */}
          <div style={styles.timeDisplay}>
            <span style={styles.timeIcon}>🕐</span>
            <span style={styles.timeText}>{currentTime}</span>
          </div>

          {/* Notifications */}
          <button style={styles.topBarIcon}>
            🔔
            <span style={styles.notificationBadge}>3</span>
          </button>

          {/* Profile Menu */}
          <div style={styles.profileContainer}>
            <button 
              style={styles.profileButton}
              onClick={() => this.setState({ showProfileMenu: !showProfileMenu })}
            >
              <div style={styles.profileAvatar}>
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span style={styles.profileName}>
                {userEmail.split('@')[0]}
              </span>
            </button>

            {showProfileMenu && (
              <div style={styles.profileDropdown}>
                <div style={styles.profileHeader}>
                  <div style={styles.profileHeaderAvatar}>
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.profileHeaderInfo}>
                    <p style={styles.profileHeaderName}>{userEmail.split('@')[0]}</p>
                    <p style={styles.profileHeaderEmail}>{userEmail}</p>
                  </div>
                </div>
                <div style={styles.profileMenuItems}>
                  <button style={styles.profileMenuItem}>
                    <span style={styles.menuIcon}>👤</span> My Profile
                  </button>
                  <button style={styles.profileMenuItem}>
                    <span style={styles.menuIcon}>⚙️</span> Settings
                  </button>
                  <div style={styles.menuDivider}></div>
                  <button style={{...styles.profileMenuItem, color: '#f44336'}} onClick={this.handleLogout}>
                    <span style={styles.menuIcon}>🚪</span> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  renderDashboard = () => {
    const { stats, graphData } = this.state;

    return (
      <div style={styles.dashboardContent}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{stats.total_candidates || 0}</h3>
              <p style={styles.statLabel}>Total Candidates</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{stats.pending_reviews || 0}</h3>
              <p style={styles.statLabel}>Pending Review</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{stats.approved || 0}</h3>
              <p style={styles.statLabel}>Approved</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>❌</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{stats.rejected || 0}</h3>
              <p style={styles.statLabel}>Rejected</p>
            </div>
          </div>
        </div>

        {/* Graph Placeholder */}
        <div style={styles.graphSection}>
          <h3 style={styles.sectionTitle}>Applications Overview</h3>
          <div style={styles.graphPlaceholder}>
            {graphData ? (
              <pre>{JSON.stringify(graphData, null, 2)}</pre>
            ) : (
              <p>Loading graph data...</p>
            )}
          </div>
        </div>

        {/* Recent Candidates */}
        <div style={styles.recentSection}>
          <h3 style={styles.sectionTitle}>Recent Candidates</h3>
          {this.renderCandidatesTable(true)}
        </div>
      </div>
    );
  };

  renderCandidates = () => {
    return (
      <div style={styles.candidatesContent}>
        <div style={styles.candidatesHeader}>
          <h3 style={styles.sectionTitle}>All Candidates</h3>
          <input 
            type="text" 
            placeholder="Search candidates..." 
            style={styles.searchInput}
          />
        </div>
        {this.renderCandidatesTable()}
      </div>
    );
  };

  renderCandidatesTable = (limited = false) => {
    const { candidates, isLoading } = this.state;
    const displayCandidates = limited ? candidates.slice(0, 5) : candidates;

    if (isLoading) {
      return <div style={styles.loading}>Loading candidates...</div>;
    }

    return (
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayCandidates.map(candidate => (
            <tr key={candidate.id} style={styles.tr}>
              <td style={styles.td}>{`${candidate.first_name} ${candidate.last_name}`}</td>
              <td style={styles.td}>{candidate.email}</td>
              <td style={styles.td}>{candidate.phone_number}</td>
              <td style={styles.td}>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: this.getStatusColor(candidate.status),
                  color: 'white'
                }}>
                  {candidate.status || 'pending'}
                </span>
              </td>
              <td style={styles.td}>
                <button 
                  style={styles.actionButton}
                  onClick={() => this.fetchCandidateDetails(candidate.id)}
                >
                  👁️
                </button>
                <button 
                  style={styles.actionButton}
                  onClick={() => this.downloadCV(candidate.id)}
                >
                  📥
                </button>
                <button 
                  style={styles.actionButton}
                  onClick={() => this.openStatusModal(candidate.id, candidate.status)}
                >
                  ✏️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  renderStatusModal = () => {
    const { showStatusModal, selectedStatus, statusUpdateLoading } = this.state;

    if (!showStatusModal) return null;

    return (
      <div style={styles.modalOverlay} onClick={() => this.setState({ showStatusModal: false })}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h3 style={styles.modalTitle}>Update Candidate Status</h3>
          
          <select 
            value={selectedStatus}
            onChange={(e) => this.setState({ selectedStatus: e.target.value })}
            style={styles.select}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <div style={styles.modalButtons}>
            <button 
              style={styles.cancelButton}
              onClick={() => this.setState({ showStatusModal: false })}
            >
              Cancel
            </button>
            <button 
              style={styles.confirmButton}
              onClick={this.updateCandidateStatus}
              disabled={statusUpdateLoading}
            >
              {statusUpdateLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { activePage, sidebarCollapsed, selectedCandidate } = this.state;

    return (
      <div style={styles.container}>
        {/* Sidebar */}
        {this.renderSidebar()}

        {/* Main Content */}
        <div style={{
          ...styles.mainContent,
          marginLeft: sidebarCollapsed ? '80px' : '280px'
        }}>
          {/* Top Bar */}
          {this.renderTopBar()}

          {/* Page Content */}
          <div style={styles.pageContent}>
            {activePage === 'dashboard' && this.renderDashboard()}
            {activePage === 'candidates' && this.renderCandidates()}
            {activePage === 'analytics' && (
              <div style={styles.comingSoon}>Analytics Page Coming Soon</div>
            )}
            {activePage === 'settings' && (
              <div style={styles.comingSoon}>Settings Page Coming Soon</div>
            )}
          </div>

          {/* Candidate Details Side Panel */}
          {selectedCandidate && (
            <div style={styles.detailsPanel}>
              <div style={styles.detailsHeader}>
                <h3>Candidate Details</h3>
                <button 
                  style={styles.closeButton}
                  onClick={() => this.setState({ selectedCandidate: null })}
                >×</button>
              </div>
              <div style={styles.detailsBody}>
                <p><strong>Name:</strong> {selectedCandidate.first_name} {selectedCandidate.last_name}</p>
                <p><strong>Email:</strong> {selectedCandidate.email}</p>
                <p><strong>Phone:</strong> {selectedCandidate.phone_number}</p>
                <p><strong>National ID:</strong> {selectedCandidate.national_id || 'N/A'}</p>
                <p><strong>Fan Number:</strong> {selectedCandidate.fan_number || 'N/A'}</p>
                <p><strong>Status:</strong> 
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: this.getStatusColor(selectedCandidate.status),
                    color: 'white',
                    marginLeft: '10px'
                  }}>
                    {selectedCandidate.status || 'pending'}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Update Modal */}
        {this.renderStatusModal()}
      </div>
    );
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: 'Arial, sans-serif'
  },

  // Sidebar Styles
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    transition: 'width 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
  },
  sidebarLogo: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.2)'
  },
  logoIcon: {
    fontSize: '28px'
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  sidebarMenu: {
    flex: 1,
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  menuItem: {
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    width: '100%',
    fontSize: '14px',
    transition: 'background 0.3s ease',
    textAlign: 'left'
  },
  menuIcon: {
    fontSize: '20px',
    minWidth: '24px'
  },
  menuLabel: {
    fontSize: '14px',
    whiteSpace: 'nowrap'
  },
  sidebarBottom: {
    padding: '20px 0',
    borderTop: '1px solid rgba(255,255,255,0.2)'
  },

  // Top Bar Styles
  topBar: {
    height: '70px',
    background: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 30px',
    position: 'sticky',
    top: 0,
    zIndex: 900
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333'
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  topBarIcon: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    position: 'relative',
    padding: '5px'
  },
  notificationBadge: {
    position: 'absolute',
    top: '0',
    right: '0',
    background: '#f44336',
    color: 'white',
    fontSize: '10px',
    padding: '2px 5px',
    borderRadius: '10px',
    minWidth: '18px'
  },
  timeDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: '#f5f5f5',
    padding: '8px 15px',
    borderRadius: '8px'
  },
  timeIcon: {
    fontSize: '14px'
  },
  timeText: {
    fontSize: '14px',
    color: '#333'
  },

  // Profile Menu
  profileContainer: {
    position: 'relative'
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '8px'
  },
  profileAvatar: {
    width: '35px',
    height: '35px',
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold'
  },
  profileName: {
    fontSize: '14px',
    color: '#333'
  },
  profileDropdown: {
    position: 'absolute',
    top: '50px',
    right: '0',
    width: '280px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    zIndex: 1000
  },
  profileHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    borderBottom: '1px solid #e0e0e0'
  },
  profileHeaderAvatar: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  profileHeaderInfo: {
    flex: 1
  },
  profileHeaderName: {
    margin: '0 0 5px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  profileHeaderEmail: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  profileMenuItems: {
    padding: '10px'
  },
  profileMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 15px',
    width: '100%',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
    textAlign: 'left'
  },
  menuDivider: {
    height: '1px',
    background: '#e0e0e0',
    margin: '10px 0'
  },

  // Main Content
  mainContent: {
    transition: 'margin-left 0.3s ease',
    minHeight: '100vh'
  },
  pageContent: {
    padding: '30px'
  },

  // Dashboard Content
  dashboardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px'
  },
  statCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  statIcon: {
    fontSize: '30px'
  },
  statInfo: {
    flex: 1
  },
  statValue: {
    fontSize: '24px',
    margin: '0 0 5px 0',
    color: '#333'
  },
  statLabel: {
    fontSize: '13px',
    margin: 0,
    color: '#666'
  },
  graphSection: {
    background: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 20px 0',
    color: '#333'
  },
  graphPlaceholder: {
    height: '300px',
    background: '#f8f9fa',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999'
  },
  recentSection: {
    background: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },

  // Candidates Page
  candidatesContent: {
    background: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  candidatesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  searchInput: {
    padding: '10px 15px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    width: '300px',
    fontSize: '14px'
  },

  // Table Styles
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e0e0e0',
    color: '#666',
    fontSize: '13px',
    fontWeight: '600'
  },
  tr: {
    borderBottom: '1px solid #e0e0e0'
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#333'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  actionButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    margin: '0 5px',
    padding: '5px'
  },

  // Details Panel
  detailsPanel: {
    position: 'fixed',
    top: '70px',
    right: '20px',
    width: '350px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    zIndex: 800,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto'
  },
  detailsHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999'
  },
  detailsBody: {
    padding: '20px'
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  modalContent: {
    background: 'white',
    padding: '30px',
    borderRadius: '10px',
    width: '400px',
    maxWidth: '90%'
  },
  modalTitle: {
    margin: '0 0 20px 0',
    color: '#333'
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e0e0e0',
    borderRadius: '5px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '8px 20px',
    background: '#e0e0e0',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  confirmButton: {
    padding: '8px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },

  // Loading
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#999'
  },
  comingSoon: {
    textAlign: 'center',
    padding: '100px',
    color: '#999',
    fontSize: '18px'
  }
};

export default Dashboard;