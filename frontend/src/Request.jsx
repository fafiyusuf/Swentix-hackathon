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
    errors: {},
    showModal: false,
    modalType: null, // 'success' or 'error'
    modalMessage: '',
    modalDetails: null
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
    
    if (!formData.first_name) errors.first_name = 'First name is required';
    if (!formData.last_name) errors.last_name = 'Last name is required';
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.phone_number) errors.phone_number = 'Phone number is required';
    
    return errors;
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    
    // Get form values and map to API field names
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
      errors.cv_file = "Please upload your CV";
    } else {
      // Validate file size (max 5MB)
      if (cvFile.size > 5 * 1024 * 1024) {
        errors.cv_file = "File size must be less than 5MB";
      }
      
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(cvFile.type)) {
        errors.cv_file = "Please upload PDF or Word documents only";
      }
    }

    // If there are errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      
      // Show first error as modal
      const firstError = Object.values(errors)[0];
      this.showModal('error', 'Validation Error', firstError);
      return;
    }

    // Clear errors and set loading state
    this.setState({ errors: {}, isLoading: true, submitStatus: null });

    try {
      // Create FormData for multipart/form-data
      const apiFormData = new FormData();
      
      // Append all fields (using exact API field names)
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
      
      // Append the CV file with the correct field name 'cv_file'
      apiFormData.append('cv_file', cvFile);

      // Make API call to the correct endpoint
      const response = await fetch('http://127.0.0.1:8000/api/v1/cv/submit', {
        method: 'POST',
        body: apiFormData
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle validation errors (422)
        if (response.status === 422) {
          const validationErrors = responseData.detail || [];
          const errorMessages = validationErrors.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
          throw new Error(errorMessages || 'Validation failed');
        }
        throw new Error(responseData.message || 'Submission failed');
      }

      // Successful submission
      console.log('API Response:', responseData);
      
      // Show success modal
      this.showModal(
        'success', 
        'CV Submitted Successfully!', 
        responseData.message || 'Your CV has been submitted successfully.',
        responseData
      );
      
      this.setState({
        showConfetti: true,
        isLoading: false,
        submitStatus: 'success',
        submitMessage: typeof responseData === 'string' ? responseData : 'CV submitted successfully!',
        responseData: responseData
      });

      // Reset form
      form.reset();
      
      // Hide confetti after 5 seconds
      setTimeout(() => {
        this.setState({ showConfetti: false });
      }, 5000);

    } catch (error) {
      console.error('Submission error:', error);
      
      // Show error modal
      this.showModal(
        'error',
        'Submission Failed',
        error.message || 'Failed to submit CV. Please try again.'
      );
      
      this.setState({
        isLoading: false,
        submitStatus: 'error',
        submitMessage: error.message || 'Failed to submit CV. Please try again.'
      });
    }
  };

  showModal = (type, title, message, details = null) => {
    this.setState({
      showModal: true,
      modalType: type,
      modalTitle: title,
      modalMessage: message,
      modalDetails: details
    });

    // Auto close modal after 5 seconds for success, 8 seconds for error
    setTimeout(() => {
      this.setState({ showModal: false });
    }, type === 'success' ? 5000 : 8000);
  };

  closeModal = () => {
    this.setState({ showModal: false });
  };

  render() {
    const { 
      showConfetti, 
      windowWidth, 
      windowHeight,
      isLoading,
      errors,
      showModal,
      modalType,
      modalTitle,
      modalMessage,
      modalDetails
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
        
        {/* Modal Popup */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={this.closeModal}>
            <div 
              style={{
                ...styles.modalContent,
                borderTop: `5px solid ${modalType === 'success' ? '#52c41a' : '#ff4d4f'}`
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <span style={styles.modalIcon}>
                  {modalType === 'success' ? '✅' : '❌'}
                </span>
                <h3 style={styles.modalTitle}>{modalTitle}</h3>
                <button style={styles.modalClose} onClick={this.closeModal}>×</button>
              </div>
              
              <div style={styles.modalBody}>
                <p style={styles.modalMessage}>{modalMessage}</p>
                
                {modalDetails && (
                  <div style={styles.modalDetails}>
                    {modalDetails.submission_date && (
                      <div style={styles.detailItem}>
                        <strong>Date:</strong> {new Date(modalDetails.submission_date).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div style={styles.modalFooter}>
                <button 
                  style={styles.modalButton}
                  onClick={this.closeModal}
                >
                  {modalType === 'success' ? 'Great!' : 'Close'}
                </button>
              </div>
            </div>
          </div>
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
                    borderColor: errors.first_name ? '#f56565' : '#e0e0e0'
                  }}
                  disabled={isLoading}
                />
                {errors.first_name && (
                  <span style={styles.errorText}>{errors.first_name}</span>
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
                    borderColor: errors.last_name ? '#f56565' : '#e0e0e0'
                  }}
                  disabled={isLoading}
                />
                {errors.last_name && (
                  <span style={styles.errorText}>{errors.last_name}</span>
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
                    borderColor: errors.phone_number ? '#f56565' : '#e0e0e0'
                  }}
                  disabled={isLoading}
                />
                {errors.phone_number && (
                  <span style={styles.errorText}>{errors.phone_number}</span>
                )}
              </div>

              {/* National ID (Optional) */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>National ID</label>
                <input 
                  name="nationalId" 
                  placeholder="Enter your National ID (optional)" 
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>

              {/* Fan Number (Optional) */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Fan Number</label>
                <input 
                  name="fanNumber" 
                  placeholder="Enter your Fan number (optional)" 
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>

              {/* CV Upload - Using cv_file field name for API */}
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
                    borderColor: errors.cv_file ? '#f56565' : '#e0e0e0'
                  }}
                  disabled={isLoading}
                />
                <small style={styles.hint}>Supported: PDF, DOC, DOCX (Max 5MB) · Field: cv_file</small>
                {errors.cv_file && (
                  <span style={styles.errorText}>{errors.cv_file}</span>
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
    maxWidth: "500px",
  },
  form: {
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(10px)",
    padding: "35px",
    borderRadius: "20px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
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
    margin: "0 0 5px 0",
    color: "#666",
    fontSize: "14px",
    textAlign: "center"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#555",
    marginLeft: "5px"
  },
  required: {
    color: "#f56565",
    marginLeft: "2px"
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "2px solid #e0e0e0",
    fontSize: "14px",
    transition: "all 0.3s ease",
    outline: "none",
    backgroundColor: "white",
    fontFamily: "inherit"
  },
  fileInput: {
    padding: "8px",
    borderRadius: "8px",
    border: "2px dashed #e0e0e0",
    backgroundColor: "#f8f9fa",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "inherit"
  },
  hint: {
    fontSize: "11px",
    color: "#999",
    marginTop: "2px"
  },
  errorText: {
    color: "#f56565",
    fontSize: "11px",
    marginTop: "2px",
    marginLeft: "5px"
  },
  button: {
    padding: "12px",
    background: "linear-gradient(45deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    marginTop: "8px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  buttonLoading: {
    opacity: 0.7
  },
  buttonIcon: {
    fontSize: "16px"
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

  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    animation: "fadeIn 0.3s ease-out",
    backdropFilter: "blur(5px)"
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "450px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    animation: "slideUp 0.4s ease-out",
    overflow: "hidden"
  },
  modalHeader: {
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid #e0e0e0",
    position: "relative"
  },
  modalIcon: {
    fontSize: "28px"
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
    flex: 1
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "28px",
    cursor: "pointer",
    color: "#999",
    padding: "0",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "all 0.3s ease"
  },
  modalBody: {
    padding: "20px"
  },
  modalMessage: {
    margin: "0 0 15px 0",
    fontSize: "15px",
    color: "#555",
    lineHeight: "1.5"
  },
  modalDetails: {
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "10px"
  },
  detailItem: {
    fontSize: "13px",
    color: "#666",
    marginBottom: "5px"
  },
  modalFooter: {
    padding: "15px 20px",
    borderTop: "1px solid #e0e0e0",
    display: "flex",
    justifyContent: "flex-end"
  },
  modalButton: {
    padding: "8px 24px",
    background: "linear-gradient(45deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.3s ease"
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
      transform: translateY(20px);
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

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .modalClose:hover {
    background-color: #f0f0f0;
    color: #333;
  }

  .modalButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  .loaderDot:nth-child(1) { animation-delay: -0.32s; }
  .loaderDot:nth-child(2) { animation-delay: -0.16s; }
`;
document.head.appendChild(style);

export default Request;