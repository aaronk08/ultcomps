// modal-functions.js - Put this in a separate file
document.addEventListener('DOMContentLoaded', function() {
    // Prevent automatic hash scrolling
    if (window.location.hash) {
        window.history.replaceState(null, null, window.location.pathname);
    }

    // Logo click handler for smooth scroll to top
    const logoLink = document.getElementById('logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Hero section Enter Now button
    const heroEnterNowBtn = document.querySelector('.hero-section .btn-primary');
    if (heroEnterNowBtn) {
        heroEnterNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const currentSection = document.getElementById('current');
            if (currentSection) {
                const navHeight = document.querySelector('nav').offsetHeight;
                const marqueeHeight = document.querySelector('.marquee-container').offsetHeight;
                const offset = navHeight + marqueeHeight - 37; // Reduced by 2 more pixels
                const targetPosition = currentSection.offsetTop - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Enter Now buttons functionality
    const enterNowButtons = document.querySelectorAll('.enter-now-btn');
    enterNowButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // Check if user is logged in using localStorage
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (isLoggedIn) {
                // If logged in, show success message
                alert('You are logged in!');
            } else {
                // If not logged in, show login modal
                showModal('login-modal');
            }
        });
    });

    // Add smooth scrolling for navigation links
    document.querySelectorAll('nav a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                const navHeight = document.querySelector('nav').offsetHeight;
                const marqueeHeight = document.querySelector('.marquee-container').offsetHeight;
                const offset = navHeight + marqueeHeight - 37; // Reduced by 2 more pixels
                const targetPosition = targetSection.offsetTop - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple modal show/hide functions
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    // Close buttons for all modals
    const closeButtons = {
        'close-login-modal': 'login-modal',
        'close-signup-modal': 'signup-modal',
        'close-forgot-modal': 'forgot-modal'
    };

    Object.entries(closeButtons).forEach(([buttonId, modalId]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function() {
                hideModal(modalId);
            });
        }
    });

    // Login button click
    document.querySelectorAll('[data-action="login"]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal('forgot-modal');
            showModal('login-modal');
        });
    });

    // Forgot password link
    const forgotPasswordLink = document.getElementById('show-forgot-modal');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal('login-modal');
            showModal('forgot-modal');
        });
    }

    // Signup link
    const signupLink = document.getElementById('show-signup-modal');
    if (signupLink) {
        signupLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal('login-modal');
            showModal('signup-modal');
        });
    }

    // Login from signup link
    const loginFromSignupLink = document.getElementById('show-login-from-signup');
    if (loginFromSignupLink) {
        loginFromSignupLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal('signup-modal');
            showModal('login-modal');
        });
    }

    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const loginIdentifier = document.getElementById('login-identifier').value;
            const password = document.getElementById('password').value;
            
            // Basic validation
            if (!loginIdentifier || !password) {
                alert('Please enter both username and password');
                return;
            }

            // Check if user exists in localStorage
            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const userExists = existingUsers.some(user => 
                user.username === loginIdentifier || user.email === loginIdentifier
            );

            if (!userExists) {
                // If user doesn't exist, show signup modal
                hideModal('login-modal');
                showModal('signup-modal');
                // Pre-fill the signup form with the attempted login
                document.getElementById('signup-username').value = loginIdentifier;
                if (loginIdentifier.includes('@')) {
                    document.getElementById('signup-email').value = loginIdentifier;
                }
                alert('Account not found. Please sign up to create an account.');
                return;
            }

            // Set login state in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', loginIdentifier);
            
            // Update all login buttons to show username
            document.querySelectorAll('[data-action="login"]').forEach(button => {
                button.innerHTML = loginIdentifier;
                button.classList.remove('btn-primary', 'btn-accent');
                button.classList.add('text-white');
                button.style.backgroundColor = 'transparent';
                button.style.border = 'none';
                button.style.padding = '0';
                button.style.fontSize = '1rem';
                button.style.fontWeight = 'normal';
                button.style.cursor = 'default';
                button.style.textTransform = 'none';
            });
            
            // Hide the modal
            hideModal('login-modal');
            
            // Check for post-login action
            const postLoginAction = localStorage.getItem('postLoginAction');
            if (postLoginAction === 'showWheel') {
                // Clear the stored action
                localStorage.removeItem('postLoginAction');
                // Show the wheel modal
                document.getElementById('wheel-modal').classList.remove('hidden');
                // Redraw the wheel
                if (typeof drawWheel === 'function') {
                    drawWheel();
                }
            }
            
            // Show success message
            alert('Login successful!');
        });
    }

    // Forgot password form submission
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('forgot-email').value;
            
            // Basic validation
            if (!email) {
                alert('Please enter your email address');
                return;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Store email in localStorage for demo purposes
            localStorage.setItem('resetEmail', email);
            
            // Show success message
            alert('If this email exists, a reset link has been sent.');
            hideModal('forgot-modal');
        });
    }

    // Signup form submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-password2').value;
            
            // Basic validation
            if (!username || !email || !password || !confirmPassword) {
                alert('Please fill in all fields');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Store user data in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('email', email);
            
            // Update all login buttons to show username
            document.querySelectorAll('[data-action="login"]').forEach(button => {
                button.innerHTML = username;
                button.classList.remove('btn-primary', 'btn-accent');
                button.classList.add('text-white');
                button.style.backgroundColor = 'transparent';
                button.style.border = 'none';
                button.style.padding = '0';
                button.style.fontSize = '1rem';
                button.style.fontWeight = 'normal';
                button.style.cursor = 'default';
                button.style.textTransform = 'none';
            });
            
            // Hide signup modal and show success message
            hideModal('signup-modal');
            alert('Registration successful! You are now logged in.');
            
            // Check for post-login action
            const postLoginAction = localStorage.getItem('postLoginAction');
            if (postLoginAction === 'showWheel') {
                localStorage.removeItem('postLoginAction');
                document.getElementById('wheel-modal').classList.remove('hidden');
                if (typeof drawWheel === 'function') {
                    drawWheel();
                }
            }
        });
    }

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal(this.id);
            }
        });
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                hideModal(modal.id);
            });
        }
    });

    // Subscribe button functionality
    const subscribeBtn = document.querySelector('.subscribe-btn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const email = document.querySelector('.subscribe-input').value;
            if (!email) {
                alert('Please enter your email address');
                return;
            }
            // For now, just show a success message
            alert('Thank you for subscribing! We\'ll keep you updated with the latest competitions.');
            document.querySelector('.subscribe-input').value = '';
        });
    }

    // Add functionality to the "Learn More" buttons
    const learnMoreButtons = document.querySelectorAll('.learn-more-btn');
    learnMoreButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Add wheel modal event listener
    document.getElementById('open-wheel-modal').addEventListener('click', (e) => {
        e.preventDefault();
        
        // Simple if/else for login check
        if (localStorage.getItem('isLoggedIn') === 'true') {
            // User is logged in - show wheel
            document.getElementById('wheel-modal').classList.remove('hidden');
            document.getElementById('dropdown-menu').classList.add('hidden');
            if (typeof drawWheel === 'function') {
                drawWheel();
            }
        } else {
            // User is not logged in - show login modal
            alert('Please login first to access the wheel spins!');
            localStorage.setItem('postLoginAction', 'showWheel');
            document.getElementById('login-modal').classList.remove('hidden');
            document.getElementById('dropdown-menu').classList.add('hidden');
        }
    });

    // Add wheel modal close button event listener
    document.getElementById('close-wheel-modal').addEventListener('click', () => {
        document.getElementById('wheel-modal').classList.add('hidden');
    });

    // Add wheel modal click outside to close
    document.getElementById('wheel-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('wheel-modal')) {
            document.getElementById('wheel-modal').classList.add('hidden');
        }
    });

    // Add spin button event listener
    document.getElementById('spin-button').addEventListener('click', () => {
        // Check if user is logged in before allowing spin
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            alert('Please login first to spin the wheel!');
            document.getElementById('wheel-modal').classList.add('hidden');
            document.getElementById('login-modal').classList.remove('hidden');
            return;
        }
        if (typeof spinWheel === 'function') {
            spinWheel();
        }
    });
});