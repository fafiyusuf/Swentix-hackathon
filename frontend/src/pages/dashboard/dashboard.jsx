import React, { Component } from "react";

class Dashboard extends Component {
  state = {
    userEmail: localStorage.getItem('userEmail') || 'User',
    loginTime: localStorage.getItem('loginTime') || new Date().toISOString(),
    showLogoutConfirm: false
  };

  componentDidMount() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      window.location.href = '/';
    }
  }

  handleLogout = () => {
    // Clear login data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('loginMethod');
    
    // Redirect to login page
    window.location.href = '/';
  };

  formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  render() {
    const { userEmail, loginTime, showLogoutConfirm } = this.state;

    return (
      <div style={styles.dashboardContainer}>
        {/* Animated Background */}
        <div style={styles.dashboardBg}></div>
        
        {/* Main Content */}
        <div style={styles.dashboardContent}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.welcomeTitle}>
              Welcome back, {userEmail.split('@')[0]}! 👋
            </h1>
            <p style={styles.loginTime}>Logged in since: {this.formatDate(loginTime)}</p>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statInfo}>
                <h3 style={styles.statValue}>12</h3>
                <p style={styles.statLabel}>Projects</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>📝</div>
              <div style={styles.statInfo}>
                <h3 style={styles.statValue}>5</h3>
                <p style={styles.statLabel}>CVs Submitted</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statInfo}>
                <h3 style={styles.statValue}>3</h3>
                <p style={styles.statLabel}>Applications</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>⭐</div>
              <div style={styles.statInfo}>
                <h3 style={styles.statValue}>87%</h3>
                <p style={styles.statLabel}>Profile Strength</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.activitySection}>
            <h2 style={styles.sectionTitle}>Recent Activity</h2>
            <div style={styles.activityList}>
              <div style={styles.activityItem}>
                <span style={styles.activityIcon}>📎</span>
                <div style={styles.activityDetails}>
                  <p style={styles.activityText}>CV uploaded successfully</p>
                  <span style={styles.activityTime}>2 minutes ago</span>
                </div>
              </div>
              
              <div style={styles.activityItem}>
                <span style={styles.activityIcon}>📧</span>
                <div style={styles.activityDetails}>
                  <p style={styles.activityText}>Profile information updated</p>
                  <span style={styles.activityTime}>1 hour ago</span>
                </div>
              </div>
              
              <div style={styles.activityItem}>
                <span style={styles.activityIcon}>🔐</span>
                <div style={styles.activityDetails}>
                  <p style={styles.activityText}>Logged in from new device</p>
                  <span style={styles.activityTime}>Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.actionsSection}>
            <h2 style={styles.sectionTitle}>Quick Actions</h2>
            <div style={styles.actionButtons}>
              <button 
                style={styles.actionButton}
                onClick={() => alert('Navigating to CV form...')}
              >
                <span style={styles.actionIcon}>📄</span>
                Upload New CV
              </button>
              
              <button 
                style={styles.actionButton}
                onClick={() => alert('Editing profile...')}
              >
                <span style={styles.actionIcon}>👤</span>
                Edit Profile
              </button>
              
              <button 
                style={styles.actionButton}
                onClick={() => alert('Viewing applications...')}
              >
                <span style={styles.actionIcon}>📋</span>
                View Applications
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div style={styles.logoutSection}>
            {!showLogoutConfirm ? (
              <button 
                style={styles.logoutButton}
                onClick={() => this.setState({ showLogoutConfirm: true })}
              >
                <span style={styles.logoutIcon}>🚪</span>
                Logout
              </button>
            ) : (
              <div style={styles.confirmDialog}>
                <p style={styles.confirmText}>Are you sure you want to logout?</p>
                <div style={styles.confirmButtons}>
                  <button 
                    style={styles.confirmYes}
                    onClick={this.handleLogout}
                  >
                    Yes, Logout
                  </button>
                  <button 
                    style={styles.confirmNo}
                    onClick={() => this.setState({ showLogoutConfirm: false })}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  dashboardContainer: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px"
  },
  dashboardBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)",
    animation: "pulse 4s ease-in-out infinite"
  },
  dashboardContent: {
    position: "relative",
    zIndex: 10,
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px"
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
    animation: "fadeInUp 0.6s ease-out"
  },
  welcomeTitle: {
    color: "white",
    fontSize: "36px",
    margin: "0 0 10px 0",
    textShadow: "0 2px 10px rgba(0,0,0,0.2)"
  },
  loginTime: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "14px",
    margin: 0
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "40px"
  },
  statCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "16px",
    padding: "25px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    animation: "fadeInUp 0.6s ease-out",
    transition: "transform 0.3s ease"
  },
  statIcon: {
    fontSize: "40px"
  },
  statInfo: {
    flex: 1
  },
  statValue: {
    fontSize: "28px",
    margin: "0 0 5px 0",
    color: "#333"
  },
  statLabel: {
    fontSize: "14px",
    margin: 0,
    color: "#666"
  },
  activitySection: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "16px",
    padding: "30px",
    marginBottom: "40px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
  },
  sectionTitle: {
    fontSize: "20px",
    color: "#333",
    margin: "0 0 20px 0"
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "10px",
    borderRadius: "8px",
    transition: "background 0.3s ease"
  },
  activityIcon: {
    fontSize: "20px"
  },
  activityDetails: {
    flex: 1
  },
  activityText: {
    margin: "0 0 5px 0",
    color: "#333"
  },
  activityTime: {
    fontSize: "12px",
    color: "#999"
  },
  actionsSection: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "16px",
    padding: "30px",
    marginBottom: "40px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
  },
  actionButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px"
  },
  actionButton: {
    padding: "15px",
    background: "linear-gradient(45deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "transform 0.3s ease"
  },
  actionIcon: {
    fontSize: "18px"
  },
  logoutSection: {
    display: "flex",
    justifyContent: "center"
  },
  logoutButton: {
    padding: "12px 40px",
    background: "rgba(255,255,255,0.2)",
    color: "white",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease"
  },
  logoutIcon: {
    fontSize: "18px"
  },
  confirmDialog: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center"
  },
  confirmText: {
    color: "#333",
    margin: "0 0 15px 0"
  },
  confirmButtons: {
    display: "flex",
    gap: "10px",
    justifyContent: "center"
  },
  confirmYes: {
    padding: "8px 20px",
    background: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },
  confirmNo: {
    padding: "8px 20px",
    background: "#e0e0e0",
    color: "#333",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  }
};

export default Dashboard;