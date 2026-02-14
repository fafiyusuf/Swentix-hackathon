import React, { Component } from "react";
import Confetti from 'react-confetti';

class Request extends Component {
  state = {
    showConfetti: false,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight
  };

  componentDidMount() {
    // Update window dimensions on resize
    window.addEventListener('resize', this.handleResize);
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

  handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;

    // Validate file
    const cvFile = form.cv.files[0];
    if (!cvFile) {
      alert("Please upload your CV");
      return;
    }

    // Validate file size (max 5MB)
    if (cvFile.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(cvFile.type)) {
      alert("Please upload PDF or Word documents only");
      return;
    }

    const data = {
      firstName: form.firstName.value,
      middleName: form.middleName.value,
      lastName: form.lastName.value,
      email: form.email.value,
      phone: form.phone.value,
      nationalId: form.nationalId.value,
      cv: cvFile,
    };

    console.log("Form Data:", {
      ...data,
      cv: data.cv.name
    });

    // Show confetti
    this.setState({ showConfetti: true });
    
    // Hide confetti after 5 seconds
    setTimeout(() => {
      this.setState({ showConfetti: false });
    }, 5000);

    alert("🎉 CV submitted successfully!");
    form.reset();
  };

  render() {
    const { showConfetti, windowWidth, windowHeight } = this.state;

    return (
      <>
        {showConfetti && (
          <Confetti
            width={windowWidth}
            height={windowHeight}
            numberOfPieces={200}
            recycle={false}
            colors={['#1677ff', '#ff4d4f', '#52c41a', '#faad14', '#722ed1']}
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
            <form onSubmit={this.handleSubmit} style={styles.form}>
              <h2 style={styles.title}>📄 CV Submission</h2>
              <p style={styles.subtitle}>Fill in your details and upload your CV</p>

              <div style={styles.inputGroup}>
                <label style={styles.label}>First Name *</label>
                <input 
                  name="firstName" 
                  placeholder="Enter your first name" 
                  required 
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Middle Name</label>
                <input 
                  name="middleName" 
                  placeholder="Enter your middle name" 
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Name *</label>
                <input 
                  name="lastName" 
                  placeholder="Enter your last name" 
                  required 
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email *</label>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  required 
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number *</label>
                <input 
                  name="phone" 
                  placeholder="+250 788 123 456" 
                  required 
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>National ID / FAN Number *</label>
                <input 
                  name="nationalId" 
                  placeholder="Enter your National ID or FAN number" 
                  required 
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Upload CV *</label>
                <input 
                  name="cv" 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  required 
                  style={styles.fileInput}
                />
                <small style={styles.hint}>Supported: PDF, DOC, DOCX (Max 5MB)</small>
              </div>

              <button type="submit" style={styles.button}>
                <span style={styles.buttonIcon}>📤</span>
                Submit Application
              </button>
            </form>
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
    background: "linear-gradient(125deg, #667eea 0%, #764ba2 50%, #6b8cff 100%)",
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
    background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
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
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: "50%",
    animation: "float linear infinite"
  },
  floatingShape1: {
    position: "absolute",
    top: "10%",
    left: "10%",
    width: "200px",
    height: "200px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
    animation: "morphing 15s ease-in-out infinite"
  },
  floatingShape2: {
    position: "absolute",
    bottom: "10%",
    right: "10%",
    width: "300px",
    height: "300px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
    animation: "morphing 20s ease-in-out infinite reverse"
  },
  floatingShape3: {
    position: "absolute",
    top: "50%",
    right: "20%",
    width: "150px",
    height: "150px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
    animation: "morphing 12s ease-in-out infinite"
  },
  container: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    maxWidth: "450px",
  },
  form: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    padding: "40px",
    borderRadius: "20px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    transform: "translateY(0)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    animation: "fadeInUp 0.6s ease-out"
  },
  title: {
    margin: "0 0 5px 0",
    color: "#333",
    fontSize: "28px",
    fontWeight: "700",
    textAlign: "center",
    background: "linear-gradient(45deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subtitle: {
    margin: "0 0 10px 0",
    color: "#666",
    fontSize: "14px",
    textAlign: "center"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#555",
    marginLeft: "5px"
  },
  input: {
    padding: "12px 15px",
    borderRadius: "10px",
    border: "2px solid #e0e0e0",
    fontSize: "14px",
    transition: "all 0.3s ease",
    outline: "none",
    backgroundColor: "white",
    ":focus": {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
      transform: "scale(1.02)"
    }
  },
  fileInput: {
    padding: "10px",
    borderRadius: "10px",
    border: "2px dashed #e0e0e0",
    backgroundColor: "#f8f9fa",
    cursor: "pointer",
    transition: "all 0.3s ease",
    ":hover": {
      borderColor: "#667eea",
      backgroundColor: "#f0f3ff"
    }
  },
  hint: {
    fontSize: "12px",
    color: "#999",
    marginTop: "5px"
  },
  button: {
    padding: "14px",
    background: "linear-gradient(45deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
    marginTop: "10px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    position: "relative",
    overflow: "hidden",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 25px rgba(102, 126, 234, 0.4)"
    },
    ":active": {
      transform: "translateY(0)"
    }
  },
  buttonIcon: {
    fontSize: "18px"
  }
};

// Add keyframe animations to document
const style = document.createElement('style');
style.textContent = `
  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes float {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 0.5; }
    90% { opacity: 0.5; }
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
    50% { opacity: 0.8; transform: scale(1.2); }
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

  input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
    transform: scale(1.02);
  }

  input[type="file"]:hover {
    border-color: #667eea !important;
    background-color: #f0f3ff !important;
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
  }

  button:active {
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

export default Request;