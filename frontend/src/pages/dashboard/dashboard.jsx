import React, { Component } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

class Dashboard extends Component {
  state = {
    // User info
    userEmail: localStorage.getItem('userEmail') ||
      localStorage.getItem('username') ||
      'Admin User',

    // Sidebar state
    sidebarCollapsed: false,
    activePage: 'dashboard',

    // Dashboard data - using correct field names from API
    stats: {
      total_requests: 0,
      approved: 0,
      rejected: 0,
      pending: 0
    },
    candidates: [],
    graphData: [],
    selectedCandidate: null,

    // Filter state for candidates
    statusFilter: null, // 'approved', 'rejected', 'pending', or null for all

    // UI states
    isLoading: false,
    showProfileMenu: false,
    currentTime: new Date().toLocaleTimeString(),

    // Modal states
    showStatusModal: false,
    selectedCandidateId: null,
    selectedStatus: '',
    statusUpdateLoading: false,

    // API loading states
    statsLoading: true,
    candidatesLoading: true,
    graphLoading: true,

    // Pagination
    limit: 50,
    skip: 0,
    hasMore: true,

    // Chart type
    chartType: 'bar' // 'bar' or 'line'
  };

  componentDidMount() {
    // Check if user is logged in using token
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Update time every second
    this.timer = setInterval(() => {
      this.setState({ currentTime: new Date().toLocaleTimeString() });
    }, 1000);

    // Load initial data with token
    this.fetchDashboardStats();
    this.fetchCandidates();
    this.fetchGraphData();

    // Set up auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchDashboardStats();
      this.fetchGraphData();
    }, 30000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    clearInterval(this.refreshInterval);
  }

  // Helper to get auth headers
  getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // API Calls with authentication
  fetchDashboardStats = async () => {
    this.setState({ statsLoading: true });
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/dashboard/stats', {
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      const data = await response.json();
      console.log('Stats data:', data);
      this.setState({ stats: data, statsLoading: false });
    } catch (error) {
      console.error('Error fetching stats:', error);
      this.setState({ statsLoading: false });
    }
  };

  fetchCandidates = async (reset = true) => {
    const { statusFilter, limit, skip } = this.state;

    if (reset) {
      this.setState({ candidatesLoading: true, skip: 0, candidates: [] });
    } else {
      this.setState({ candidatesLoading: true });
    }

    try {
      // Build URL with query parameters
      let url = 'http://127.0.0.1:8000/api/v1/candidates?';
      const params = [];

      if (statusFilter) {
        params.push(`status=${statusFilter}`);
      }

      params.push(`limit=${limit}`);
      params.push(`skip=${reset ? 0 : skip}`);

      url += params.join('&');

      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      const data = await response.json();
      console.log('Candidates data:', data);

      // Check if data is an array
      let candidatesData = [];
      if (Array.isArray(data)) {
        candidatesData = data;
      } else if (typeof data === 'string') {
        try {
          candidatesData = JSON.parse(data);
        } catch {
          candidatesData = [];
        }
      }

      this.setState(prevState => ({
        candidates: reset ? candidatesData : [...prevState.candidates, ...candidatesData],
        candidatesLoading: false,
        hasMore: candidatesData.length === limit,
        skip: reset ? limit : prevState.skip + limit
      }));
    } catch (error) {
      console.error('Error fetching candidates:', error);
      this.setState({ candidatesLoading: false });
    }
  };

  fetchGraphData = async () => {
    this.setState({ graphLoading: true });
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/dashboard/graph', {
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      const data = await response.json();
      console.log('Graph data:', data);

      // Format data for Recharts
      const formattedData = Array.isArray(data) ? data.map(item => ({
        date: this.formatDate(item.date),
        submissions: item.total || 0,
        approved: item.approved || 0,
        pending: item.pending || 0,
        rejected: item.rejected || 0
      })) : [];

      this.setState({ graphData: formattedData, graphLoading: false });
    } catch (error) {
      console.error('Error fetching graph data:', error);
      this.setState({ graphLoading: false });
    }
  };

  formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  fetchCandidateDetails = async (candidateId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/candidates/${candidateId}`, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      const data = await response.json();
      console.log('Candidate details:', data);
      this.setState({ selectedCandidate: data });
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    }
  };

  downloadCV = async (candidateId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/candidates/${candidateId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cv_${candidateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status: selectedStatus })
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      if (response.ok) {
        // Refresh data
        await this.fetchDashboardStats();
        await this.fetchCandidates(true);
        await this.fetchGraphData();

        // Clear selected candidate if it was the one updated
        if (this.state.selectedCandidate?.id === selectedCandidateId) {
          this.setState({ selectedCandidate: null });
        }

        this.setState({ showStatusModal: false, statusUpdateLoading: false });
        this.showNotification('Status updated successfully!', 'success');
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      this.showNotification('Failed to update status', 'error');
      this.setState({ statusUpdateLoading: false });
    }
  };

  // Filter handlers
  handleStatusFilter = (status) => {
    this.setState({ statusFilter: status }, () => {
      this.fetchCandidates(true);
    });
  };

  loadMore = () => {
    if (this.state.hasMore && !this.state.candidatesLoading) {
      this.fetchCandidates(false);
    }
  };

  // Show notification
  showNotification = (message, type = 'success') => {
    alert(`${type === 'success' ? '✅' : '❌'} ${message}`);
  };

  // Handlers
  handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberedUsername');
    window.location.href = '/login';
  };

  toggleSidebar = () => {
    this.setState(prevState => ({
      sidebarCollapsed: !prevState.sidebarCollapsed
    }));
  };

  handlePageChange = (page) => {
    this.setState({ activePage: page });
  };

  toggleChartType = () => {
    this.setState(prevState => ({
      chartType: prevState.chartType === 'bar' ? 'line' : 'bar'
    }));
  };

  openStatusModal = (candidateId, currentStatus) => {
    this.setState({
      showStatusModal: true,
      selectedCandidateId: candidateId,
      selectedStatus: currentStatus || 'pending'
    });
  };

  getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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
        <div style={styles.sidebarLogo}>
          <span style={styles.logoIcon}>📄</span>
          {!sidebarCollapsed && <span style={styles.logoText}>Admin Portal</span>}
        </div>

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
          <div style={styles.timeDisplay}>
            <span style={styles.timeIcon}>🕐</span>
            <span style={styles.timeText}>{currentTime}</span>
          </div>

          <button style={styles.topBarIcon}>
            🔔
            <span style={styles.notificationBadge}>3</span>
          </button>

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
                  <button style={styles.profileMenuItem} onClick={() => this.handlePageChange('settings')}>
                    <span style={styles.menuIcon}>👤</span> My Profile
                  </button>
                  <button style={styles.profileMenuItem} onClick={() => this.handlePageChange('settings')}>
                    <span style={styles.menuIcon}>⚙️</span> Settings
                  </button>
                  <div style={styles.menuDivider}></div>
                  <button style={{ ...styles.profileMenuItem, color: '#f44336' }} onClick={this.handleLogout}>
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
    const { stats, graphData, statsLoading, graphLoading, chartType, item } = this.state;

    return (
      <div style={styles.dashboardContent}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📋</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{statsLoading ? '...' : (stats.total_requests || 0)}</h3>
              <p style={styles.statLabel}>Total Requests</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{statsLoading ? '...' : (stats.pending || 0)}</h3>
              <p style={styles.statLabel}>Pending</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{statsLoading ? '...' : (stats.approved || 0)}</h3>
              <p style={styles.statLabel}>Approved</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>❌</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statValue}>{statsLoading ? '...' : (stats.rejected || 0)}</h3>
              <p style={styles.statLabel}>Rejected</p>
            </div>
          </div>
        </div>

        {/* Graph Section with Chart */}
        <div style={styles.graphSection}>
          <div style={styles.graphHeader}>
            <h3 style={styles.sectionTitle}>Submissions Over Time</h3>
            <div style={styles.chartControls}>
              <button
                style={{
                  ...styles.chartToggleButton,
                  backgroundColor: chartType === 'bar' ? '#667eea' : '#e0e0e0',
                  color: chartType === 'bar' ? 'white' : '#333'
                }}
                onClick={this.toggleChartType}
              >
                {chartType === 'bar' ? 'Switch to Line' : 'Switch to Bar'}
              </button>
              <button
                style={styles.refreshButton}
                onClick={() => {
                  this.fetchGraphData();
                  this.fetchDashboardStats();
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <div style={styles.graphContainer}>
            {graphLoading ? (
              <div style={styles.graphPlaceholder}>
                <div style={styles.loader}></div>
                <p>Loading chart data...</p>
              </div>
            ) : graphData && graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'bar' ? (
                  <BarChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="submissions" fill="#8884d8" name="Total Submissions" />
                    <Bar dataKey="approved" fill="#4caf50" name="Approved" />
                    <Bar dataKey="pending" fill="#ff9800" name="Pending" />
                    <Bar dataKey="rejected" fill="#f44336" name="Rejected" />
                  </BarChart>
                ) : (
                  <LineChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="submissions" stroke="#8884d8" name="Total Submissions" />
                    <Line type="monotone" dataKey="approved" stroke="#4caf50" name="Approved" />
                    <Line type="monotone" dataKey="pending" stroke="#ff9800" name="Pending" />
                    <Line type="monotone" dataKey="rejected" stroke="#f44336" name="Rejected" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div style={styles.graphPlaceholder}>
                <p>No graph data available</p>
              </div>
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
    const { statusFilter, candidatesLoading, hasMore } = this.state;

    return (
      <div style={styles.candidatesContent}>
        <div style={styles.candidatesHeader}>
          <h3 style={styles.sectionTitle}>All Candidates</h3>
          <div style={styles.filterContainer}>
            <select
              style={styles.filterSelect}
              value={statusFilter || ''}
              onChange={(e) => this.handleStatusFilter(e.target.value || null)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <input
              type="text"
              placeholder="Search candidates..."
              style={styles.searchInput}
              onChange={(e) => {
                // Implement search functionality
                console.log('Search:', e.target.value);
              }}
            />
          </div>
        </div>

        {this.renderCandidatesTable()}

        {hasMore && !candidatesLoading && (
          <button
            style={styles.loadMoreButton}
            onClick={this.loadMore}
          >
            Load More
          </button>
        )}
      </div>
    );
  };

  renderCandidatesTable = (limited = false) => {
    const { candidates, candidatesLoading } = this.state;
    const displayCandidates = limited ? candidates.slice(0, 5) : candidates;

    if (candidatesLoading && displayCandidates.length === 0) {
      return <div style={styles.loading}>Loading candidates...</div>;
    }

    if (!displayCandidates || displayCandidates.length === 0) {
      return <div style={styles.loading}>No candidates found</div>;
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
          {displayCandidates.map(item => {
            const candidate = item.candidate || {};
            const status = item.status || 'pending';
            const id = item.id;

            return (
              <tr key={id} style={styles.tr}>
                <td style={styles.td}>
                  {`${candidate.first_name || ''} ${candidate.last_name || ''}`}
                </td>
                <td style={styles.td}>{candidate.email || 'N/A'}</td>
                <td style={styles.td}>{candidate.phone_number || 'N/A'}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: this.getStatusColor(status),
                    color: 'white'
                  }}>
                    {status}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.actionButton}
                    onClick={() => this.fetchCandidateDetails(id)}
                    title="View Details"
                  >
                    👁️
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={() => this.downloadCV(id)}
                    title="Download CV"
                  >
                    📥
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={() => this.openStatusModal(id, status)}
                    title="Update Status"
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            );
          })}
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
              <div style={styles.comingSoon}>📈 Analytics Page Coming Soon</div>
            )}
            {activePage === 'settings' && (
              <div style={styles.comingSoon}>⚙️ Settings Page Coming Soon</div>
            )}
          </div>

          {/* Candidate Details Side Panel */}
          {selectedCandidate && (
            <div style={styles.detailsPanel}>
              <div style={styles.detailsHeader}>
                <h3 style={{ margin: 0 }}>Candidate Details</h3>
                <button
                  style={styles.closeButton}
                  onClick={() => this.setState({ selectedCandidate: null })}
                >×</button>
              </div>
              <div style={styles.detailsBody}>
                {(() => {
                  const candidate = selectedCandidate.candidate || selectedCandidate;
                  const status = selectedCandidate.status || candidate.status || 'pending';

                  return (
                    <>
                      <p><strong>Name:</strong> {candidate.first_name} {candidate.last_name}</p>
                      <p><strong>Email:</strong> {candidate.email}</p>
                      <p><strong>Phone:</strong> {candidate.phone_number}</p>
                      <p><strong>National ID:</strong> {candidate.national_id || 'N/A'}</p>
                      <p><strong>Fan Number:</strong> {candidate.fan_number || 'N/A'}</p>
                      <p><strong>Status:</strong>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: this.getStatusColor(status),
                          color: 'white',
                          marginLeft: '10px'
                        }}>
                          {status}
                        </span>
                      </p>
                      <button
                        style={{
                          ...styles.confirmButton,
                          width: '100%',
                          marginTop: '20px'
                        }}
                        onClick={() => this.downloadCV(selectedCandidate.id || candidate.id)}
                      >
                        📥 Download CV
                      </button>
                    </>
                  );
                })()}
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
  graphHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    margin: 0,
    color: '#333'
  },
  chartControls: {
    display: 'flex',
    gap: '10px'
  },
  chartToggleButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  refreshButton: {
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  graphContainer: {
    height: '400px',
    width: '100%'
  },
  graphPlaceholder: {
    height: '400px',
    background: '#f8f9fa',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999'
  },
  loader: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px'
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
  filterContainer: {
    display: 'flex',
    gap: '10px'
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '150px'
  },
  searchInput: {
    padding: '10px 15px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    width: '300px',
    fontSize: '14px'
  },
  loadMoreButton: {
    width: '100%',
    padding: '12px',
    marginTop: '20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
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
    fontWeight: '500',
    display: 'inline-block'
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

// Add keyframe animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default Dashboard;