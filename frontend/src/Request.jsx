import React, { Component } from "react";
import Confetti from 'react-confetti';

class Request extends Component {
  state = {
    showConfetti: false,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    isLoading: false,
    submitStatus: null,
    submitMessage: '',
    responseData: null,
    errors: {}
  };

  componentDidMount() {
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

  validateForm = (formData, cvFile) => {
    const errors = {};
    
    // if (!formData.firstName) errors.firstName = 'First name is required';
    // if (!formData.lastName) errors.lastName = 'Last name is required';
    // if (!formData.email) {
    //   errors.email = 'Email is required';
    // } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    //   errors.email = 'Email is invalid';
    // }
    // if (!formData.phone) errors.phone = 'Phone number is required';
    
    return errors;
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    
    // Get form values
    const formData = {
      first_name: form.firstName.value,
      middle_name: form.middleName.value || '', // Optional
      last_name: form.lastName.value,
      email: form.email.value,
      phone_number: form.phone.value,
      national_id: form.nationalId.value || '', // Optional
      fan_number: form.fanNumber?.value || '' // Optional
    };

    // Validate file
    const cvFile = form.cv.files[0];
    
    // Validate form
    const errors = this.validateForm(formData, cvFile);
    
    if (!cvFile) {
      errors.cv = "Please upload your CV";
    } else {
      // Validate file size (max 5MB)
      if (cvFile.size > 5 * 1024 * 1024) {
        errors.cv = "File size must be less than 5MB";
      }
      
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(cvFile.type)) {
        errors.cv = "Please upload PDF or Word documents only";
      }
    }

    // If there are errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      
      // Show first error as alert
      const firstError = Object.values(errors)[0];
      alert(firstError);
      return;
    }

    // Clear errors and set loading state
    this.setState({ errors: {}, isLoading: true, submitStatus: null });

    try {
      // Create FormData for multipart/form-data
      const apiFormData = new FormData();
      
      // Append all fields
      apiFormData.append('first_name', formData.first_name);
      apiFormData.append('middle_name', formData.middle_name);
      apiFormData.append('last_name', formData.last_name);
      apiFormData.append('email', formData.email);
      apiFormData.append('phone_number', formData.phone_number);
      
      if (formData.national_id) {
        apiFormData.append('national_id', formData.national_id);
      }
      
      if (formData.fan_number) {
        apiFormData.append('fan_number', formData.fan_number);
      }
      
      // Append the CV file
      apiFormData.append('cv', cvFile);

      // Make API call
      const response = await fetch('http://127.0.0.1:8000/cv/submit', {
        method: 'POST',
        body: apiFormData
        // Don't set Content-Type header - browser will set it with boundary
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Submission failed');
      }

      // Successful submission
      console.log('API Response:', responseData);
      
      this.setState({
        showConfetti: true,
        isLoading: false,
        submitStatus: 'success',
        submitMessage: responseData.message || 'CV submitted successfully!',
        responseData: responseData
      });

      // Reset form
      form.reset();
      
      // Hide confetti after 5 seconds
      setTimeout(() => {
        this.setState({ showConfetti: false });
      }, 5000);

      // Show success message
      alert(`✅ ${responseData.message || 'CV submitted successfully!'}`);

    } catch (error) {
      console.error('Submission error:', error);
      
      this.setState({
        isLoading: false,
        submitStatus: 'error',
        submitMessage: error.message || 'Failed to submit CV. Please try again.'
      });

      alert(`❌ ${error.message || 'Failed to submit CV. Please try again.'}`);
    }
  };

  render() {
    const { 
      showConfetti, 
      windowWidth, 
      windowHeight,
      isLoading,
      submitStatus,
      submitMessage,
      errors
    } = this.state;

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
            {/* Status Message */}
            {submitStatus && (
              <div style={{
                ...styles.statusMessage,
                backgroundColor: submitStatus === 'success' ? '#d4edda' : '#f8d7da',
                color: submitStatus === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${submitStatus === 'success' ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {submitMessage}
                {this.state.responseData && this.state.responseData.id && (
                  <div style={styles.responseId}>
                    Reference ID: {this.state.responseData.id}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={this.handleSubmit} style={styles.form}>
              <h2 style={styles.title}>📄 CV Submission</h2>
              <p style={styles.subtitle}>Fill in your details and upload your CV</p>

              {/* First Name */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  First Name <span style={styles.required}>*</span>
                </label>
                <input 
                  name="firstName" 
                  placeholder="Enter your first name" 
                  required 
                  style={{
                    ...styles.input,
                    borderColor: errors.firstName ? '#f56565' : '#e0e0e0'
                  }}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <span style={styles.errorText}>{errors.firstName}</span>
                )}
              </div>

              {/* Middle Name (Optional) */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Middle Name</label>
                <input 
                  name="middleName" 
                  placeholder="Enter your middle name (optional)" 
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>

              {/* Last Name */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Last Name <span style={styles.required}>*</span>
                </label>
                <input 
                  name="lastName" 
                  placeholder="Enter your last name" 
                  required 
                  style={{
                    ...styles.input,
                    borderColor: errors.lastName ? '#f56565' : '#e0e0e0'
                  }}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <span style={styles.errorText}>{errors.lastName}</span>
                )}
              </div>

              {/* Email */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Email <span style={styles.required}>*</span>
                </label>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  required 
                  style={{
                    ...styles.input,
                    borderColor: errors.email ? '#f56565' : '#e0e0e0'
                  }}
                  disabled={isLoading}
                />
                {errors.email && (
                  <span style={styles.errorText}>{errors.email}</span>
                )}
              </div>

              {/* Phone Number */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Phone Number <span style={styles.required}>*</span>
                </label>
                <input 
                  name="phone" 
                  placeholder="+250 788 123 456" 
                  required 
                  style={{
                    ...styles.input,
                    borderColor: errors.phone ? '#f56565' : '#e0e0e0'
                  }}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <span style={styles.errorText}>{errors.phone}</span>
                )}
              </div>

              {/* National ID (Optional) */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>National ID (Optional)</label>
                <input 
                  name="nationalId" 
                  placeholder="Enter your National ID" 
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>

              {/* Fan Number (Optional) */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Fan Number (Optional)</label>
                <input 
                  name="fanNumber" 
                  placeholder="Enter your Fan number" 
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>

              {/* CV Upload */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Upload CV <span style={styles.required}>*</span>
                </label>
                <input 
                  name="cv" 
                  type="file" 
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  required 
                  style={{
                    ...styles.fileInput,
                    borderColor: errors.cv ? '#f56565' : '#e0e0e0'
                  }}
                  disabled={isLoading}
                />
                <small style={styles.hint}>Supported: PDF, DOC, DOCX (Max 5MB)</small>
                {errors.cv && (
                  <span style={styles.errorText}>{errors.cv}</span>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                style={{
                  ...styles.button,
                  ...(isLoading && styles.buttonLoading),
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
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
                    <span style={styles.buttonIcon}>📤</span>
                    Submit Application
                  </>
                )}
              </button>

              {/* API Endpoint Info (for testing) */}
              <small style={styles.apiInfo}>
                POST to /cv/submit · Returns {'{ id, message }'}
              </small>
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
  required: {
    color: "#f56565",
    marginLeft: "2px"
  },
  input: {
    padding: "12px 15px",
    borderRadius: "10px",
    border: "2px solid #e0e0e0",
    fontSize: "14px",
    transition: "all 0.3s ease",
    outline: "none",
    backgroundColor: "white",
    fontFamily: "inherit"
  },
  fileInput: {
    padding: "10px",
    borderRadius: "10px",
    border: "2px dashed #e0e0e0",
    backgroundColor: "#f8f9fa",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "inherit"
  },
  hint: {
    fontSize: "12px",
    color: "#999",
    marginTop: "5px"
  },
  errorText: {
    color: "#f56565",
    fontSize: "12px",
    marginTop: "4px",
    marginLeft: "5px"
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
    animation: "bounce 1.4s infinite ease-in-out both"
  },
  statusMessage: {
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "14px",
    textAlign: "center",
    animation: "fadeInUp 0.3s ease-out"
  },
  responseId: {
    marginTop: "8px",
    fontSize: "12px",
    fontWeight: "bold"
  },
  apiInfo: {
    display: "block",
    textAlign: "center",
    fontSize: "11px",
    color: "#999",
    marginTop: "10px"
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

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }

  input[type="file"]:hover {
    border-color: #667eea !important;
    background-color: #f0f3ff !important;
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

export default Request;