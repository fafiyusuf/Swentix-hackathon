import React, { Component } from "react";
import Confetti from 'react-confetti';

class Login extends Component {
  state = {
    showConfetti: false,
    showPassword: false,
    isLoading: false,
    errors: {},
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    rememberMe: false
  };

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    
    // Check if user was previously remembered
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.setState({ rememberMe: true });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
  };

  togglePasswordVisibility = () => {
    this.setState(prevState => ({
      showPassword: !prevState.showPassword
    }));
  };

  toggleRememberMe = () => {
    this.setState(prevState => ({
      rememberMe: !prevState.rememberMe
    }));
  };

  validateForm = (email, password) => {
    const errors = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  handleSubmit = (e) => {
    e.preventDefault();
    
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const { rememberMe } = this.state;

    // Validate form
    const errors = this.validateForm(email, password);
    
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    // Clear errors
    this.setState({ errors: {}, isLoading: true });

    // Simulate API call
    setTimeout(() => {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Simulate successful login
      this.setState({ 
        isLoading: false,
        showConfetti: true 
      });
      
      console.log('Login attempt:', { email, password, rememberMe });
      
      // Hide confetti after 5 seconds
      setTimeout(() => {
        this.setState({ showConfetti: false });
      }, 5000);

      // Show success message
      alert('🎉 Login successful! Welcome back!');
      
      // You would typically redirect here
      // window.location.href = '/dashboard';
      
    }, 1500); // Simulate network delay
  };

  handleSocialLogin = (provider) => {
    this.setState({ isLoading: true });
    
    // Simulate social login
    setTimeout(() => {
      this.setState({ isLoading: false });
      console.log(`Login with ${provider}`);
      alert(`Login with ${provider} - This would connect to ${provider} OAuth`);
    }, 1000);
  };

  render() {
    const { 
      showConfetti, 
      showPassword, 
      isLoading, 
      errors,
      windowWidth,
      windowHeight,
      rememberMe
    } = this.state;

    return (
      <>
        {showConfetti && (
          <Confetti
            width={windowWidth}
            height={windowHeight}
            numberOfPieces={300}
            recycle={false}
            colors={['#667eea', '#764ba2', '#f6ad55', '#48bb78', '#f56565']}
          />
        )}
        
        <div style={styles.animatedBackground}>
          {/* Animated background elements */}
          <div style={styles.gradientBg}></div>
          <div style={styles.particles}>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.particle,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${10 + Math.random() * 20}s`,
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                  opacity: 0.1 + Math.random() * 0.3
                }}
              />
            ))}
          </div>
          
          {/* Floating shapes */}
          <div style={styles.floatingShape1}></div>
          <div style={styles.floatingShape2}></div>
          <div style={styles.floatingShape3}></div>
          
          <div style={styles.container}>
            <div style={styles.formCard}>
              {/* Logo/Icon */}
              <div style={styles.logoContainer}>
                <div style={styles.logo}>
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="url(#gradient)"/>
                    <defs>
                      <linearGradient id="gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#667eea"/>
                        <stop offset="1" stopColor="#764ba2"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <h2 style={styles.title}>Welcome Back</h2>
              <p style={styles.subtitle}>Sign in to continue to your account</p>

              <form onSubmit={this.handleSubmit} style={styles.form}>
                {/* Email Field */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>📧</span>
                    <input 
                      name="email" 
                      type="email" 
                      placeholder="your@email.com" 
                      defaultValue={localStorage.getItem('rememberedEmail') || ''}
                      style={{
                        ...styles.input,
                        borderColor: errors.email ? '#f56565' : '#e0e0e0'
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <span style={styles.errorText}>{errors.email}</span>
                  )}
                </div>

                {/* Password Field */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔒</span>
                    <input 
                      name="password" 
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password" 
                      style={{
                        ...styles.input,
                        borderColor: errors.password ? '#f56565' : '#e0e0e0'
                      }}
                      disabled={isLoading}
                    />
                    <button 
                      type="button"
                      onClick={this.togglePasswordVisibility}
                      style={styles.eyeButton}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.password && (
                    <span style={styles.errorText}>{errors.password}</span>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div style={styles.row}>
                  <label style={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={this.toggleRememberMe}
                      style={styles.checkbox}
                      disabled={isLoading}
                    />
                    <span style={styles.checkboxText}>Remember me</span>
                  </label>
                  
                  <button 
                    type="button" 
                    style={styles.forgotLink}
                    onClick={() => alert('Password reset link would be sent')}
                    disabled={isLoading}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  style={{
                    ...styles.button,
                    ...(isLoading && styles.buttonLoading)
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span style={styles.loader}>
                      <span style={styles.loaderDot}></span>
                      <span style={styles.loaderDot}></span>
                      <span style={styles.loaderDot}></span>
                    </span>
                  ) : (
                    <>
                      <span style={styles.buttonIcon}>🔓</span>
                      Sign In
                    </>
                  )}
                </button>

                {/* Social Login Divider */}
                <div style={styles.divider}>
                  <span style={styles.dividerLine}></span>
                  <span style={styles.dividerText}>or continue with</span>
                  <span style={styles.dividerLine}></span>
                </div>

                {/* Social Login Buttons */}
                <div style={styles.socialContainer}>
                  <button 
                    type="button"
                    style={styles.socialButton}
                    onClick={() => this.handleSocialLogin('Google')}
                    disabled={isLoading}
                  >
                    <span style={styles.socialIcon}>G</span>
                    Google
                  </button>
                  
                  <button 
                    type="button"
                    style={styles.socialButton}
                    onClick={() => this.handleSocialLogin('GitHub')}
                    disabled={isLoading}
                  >
                    <span style={styles.socialIcon}>GH</span>
                    GitHub
                  </button>
                </div>

                {/* Sign Up Link */}
                <p style={styles.signupText}>
                  Don't have an account?{' '}
                  <button 
                    type="button"
                    style={styles.signupLink}
                    onClick={() => alert('Navigate to signup page')}
                    disabled={isLoading}
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }
}

const styles = {
  animatedBackground: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(125deg, #667eea 0%, #764ba2 50%, #9f7aea 100%)",
    backgroundSize: "400% 400%",
    animation: "gradientBG 15s ease infinite",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)",
    animation: "pulse 4s ease-in-out infinite"
  },
  particles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden"
  },
  particle: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: "50%",
    animation: "float linear infinite"
  },
  floatingShape1: {
    position: "absolute",
    top: "10%",
    left: "5%",
    width: "250px",
    height: "250px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
    animation: "morphing 18s ease-in-out infinite"
  },
  floatingShape2: {
    position: "absolute",
    bottom: "10%",
    right: "5%",
    width: "350px",
    height: "350px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
    animation: "morphing 22s ease-in-out infinite reverse"
  },
  floatingShape3: {
    position: "absolute",
    top: "50%",
    right: "15%",
    width: "180px",
    height: "180px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
    animation: "morphing 14s ease-in-out infinite"
  },
  container: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    maxWidth: "420px",
  },
  formCard: {
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(10px)",
    padding: "40px",
    borderRadius: "24px",
    width: "100%",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2)",
    animation: "fadeInUp 0.6s ease-out"
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px"
  },
  logo: {
    width: "70px",
    height: "70px",
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    animation: "pulse 2s ease-in-out infinite"
  },
  title: {
    margin: "0 0 8px 0",
    color: "#333",
    fontSize: "32px",
    fontWeight: "700",
    textAlign: "center",
    background: "linear-gradient(45deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subtitle: {
    margin: "0 0 30px 0",
    color: "#666",
    fontSize: "15px",
    textAlign: "center"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#555",
    marginLeft: "5px"
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    fontSize: "16px",
    color: "#999"
  },
  input: {
    width: "100%",
    padding: "14px 14px 14px 40px",
    borderRadius: "12px",
    border: "2px solid #e0e0e0",
    fontSize: "15px",
    transition: "all 0.3s ease",
    outline: "none",
    backgroundColor: "white",
    fontFamily: "inherit"
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#999",
    padding: "5px"
  },
  errorText: {
    color: "#f56565",
    fontSize: "12px",
    marginTop: "4px",
    marginLeft: "5px"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer"
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "#667eea"
  },
  checkboxText: {
    fontSize: "14px",
    color: "#666"
  },
  forgotLink: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "500",
    textDecoration: "none",
    ":hover": {
      textDecoration: "underline"
    }
  },
  button: {
    padding: "14px",
    background: "linear-gradient(45deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    position: "relative",
    overflow: "hidden"
  },
  buttonLoading: {
    opacity: 0.7,
    cursor: "not-allowed"
  },
  buttonIcon: {
    fontSize: "18px"
  },
  loader: {
    display: "flex",
    gap: "4px"
  },
  loaderDot: {
    width: "6px",
    height: "6px",
    backgroundColor: "white",
    borderRadius: "50%",
    animation: "bounce 1.4s infinite ease-in-out both",
    ":nth-child(1)": {
      animationDelay: "-0.32s"
    },
    ":nth-child(2)": {
      animationDelay: "-0.16s"
    }
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "10px 0"
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e0e0e0"
  },
  dividerText: {
    fontSize: "13px",
    color: "#999",
    textTransform: "uppercase"
  },
  socialContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  socialButton: {
    padding: "12px",
    background: "white",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    ":hover": {
      borderColor: "#667eea",
      backgroundColor: "#f8f9ff"
    }
  },
  socialIcon: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#667eea"
  },
  signupText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#666",
    marginTop: "10px"
  },
  signupLink: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "none",
    ":hover": {
      textDecoration: "underline"
    }
  }
};

// Add keyframe animations
const style = document.createElement('style');
style.textContent = `
  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes float {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 0.8; }
    90% { opacity: 0.8; }
    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
  }

  @keyframes morphing {
    0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(0deg); }
    25% { border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%; }
    50% { border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%; transform: rotate(180deg); }
    75% { border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%; }
    100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(360deg); }
  }

  @keyframes pulse {
    0% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
    100% { opacity: 0.5; transform: scale(1); }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  .loaderDot:nth-child(1) { animation-delay: -0.32s; }
  .loaderDot:nth-child(2) { animation-delay: -0.16s; }
`;
document.head.appendChild(style);

export default Login;