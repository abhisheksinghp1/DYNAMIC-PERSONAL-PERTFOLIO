// Loading Screen
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.querySelector('.loading-screen');
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
    }, 2000);
});

// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    // Save theme preference
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
    
    // Add animation effect
    themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
    }, 200);
});

// Add smooth transition for theme switching
const style = document.createElement('style');
style.textContent = `
    * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease !important;
    }
`;
document.head.appendChild(style);

// Real-time clock functionality
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Update clock every second
setInterval(updateClock, 1000);
updateClock(); // Initial call

// Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth Scrolling with offset
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetSection.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Animate on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.section-title, .service-card-3d, .portfolio-item, .stat-item, .skill-item-3d');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
});

// Skills Section Animations
const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const skillItems = entry.target.querySelectorAll('.skill-item-3d');
            skillItems.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                    
                    // Animate skill level bars
                    const levelBar = item.querySelector('.level-bar');
                    const level = levelBar.getAttribute('data-level');
                    setTimeout(() => {
                        levelBar.style.width = level + '%';
                    }, 300);
                }, index * 100);
            });
            skillsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

// Observe skill categories
document.addEventListener('DOMContentLoaded', () => {
    const skillCategories = document.querySelectorAll('.skills-grid');
    skillCategories.forEach(category => {
        skillsObserver.observe(category);
    });
});

// Initialize skill items with hidden state
document.querySelectorAll('.skill-item-3d').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    item.style.transition = 'all 0.6s ease';
});

// 3D Mouse Tracking for Skill Cards
document.querySelectorAll('.skill-item-3d').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
});

// Skill Icon Click Animation
document.querySelectorAll('.skill-icon-3d').forEach(icon => {
    icon.addEventListener('click', () => {
        icon.style.animation = 'none';
        setTimeout(() => {
            icon.style.animation = 'iconBounce 0.6s ease';
        }, 10);
    });
});

// Add icon bounce animation
const iconBounceStyle = document.createElement('style');
iconBounceStyle.textContent = `
    @keyframes iconBounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0) rotateZ(0) scale(1); }
        40% { transform: translateY(-20px) rotateZ(180deg) scale(1.2); }
        60% { transform: translateY(-10px) rotateZ(270deg) scale(1.1); }
    }
`;
document.head.appendChild(iconBounceStyle);

// Portfolio Filtering
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        portfolioItems.forEach(item => {
            if (filter === 'all' || item.getAttribute('data-category') === filter) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, 100);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'translateY(30px)';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
    });
});

// Initialize portfolio items with hidden state
portfolioItems.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    item.style.transition = 'all 0.3s ease';
});

// 3D Card Hover Effects
document.querySelectorAll('.portfolio-card-3d').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'rotateY(180deg) scale(1.05)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateY(0) scale(1)';
    });
});

// Service Cards 3D Effect
document.querySelectorAll('.service-card-3d').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
});

// Stats Counter Animation
const animateCounter = (element, target) => {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + '+';
    }, 20);
};

// Observe stats for counter animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            const target = parseInt(statNumber.textContent);
            animateCounter(statNumber, target);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
    statsObserver.observe(stat);
});

// Parallax Effect for Hero Section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-cube, .particle');
    
    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
});

// Cartoon Character Interactions
const cartoonCharacter = document.querySelector('.cartoon-character');
const miniCharacter = document.querySelector('.mini-character');

if (cartoonCharacter) {
    // Make character wave on hover
    cartoonCharacter.addEventListener('mouseenter', () => {
        const leftArm = cartoonCharacter.querySelector('.left-arm');
        leftArm.style.animation = 'leftArmWave 0.5s ease-in-out 3';
        
        // Make character smile bigger
        const mouthShape = cartoonCharacter.querySelector('.mouth-shape');
        mouthShape.style.transform = 'scaleY(1.5)';
        
        // Make eyes sparkle
        const pupils = cartoonCharacter.querySelectorAll('.pupil');
        pupils.forEach(pupil => {
            pupil.style.background = 'radial-gradient(circle, #ff6b6b 0%, #333 70%)';
        });
    });
    
    cartoonCharacter.addEventListener('mouseleave', () => {
        const leftArm = cartoonCharacter.querySelector('.left-arm');
        leftArm.style.animation = 'leftArmWave 2s ease-in-out infinite';
        
        const mouthShape = cartoonCharacter.querySelector('.mouth-shape');
        mouthShape.style.transform = 'scaleY(1)';
        
        const pupils = cartoonCharacter.querySelectorAll('.pupil');
        pupils.forEach(pupil => {
            pupil.style.background = '#333';
        });
    });
    
    // Click interaction - character jumps
    cartoonCharacter.addEventListener('click', () => {
        cartoonCharacter.style.animation = 'characterJump 0.8s ease-in-out';
        
        setTimeout(() => {
            cartoonCharacter.style.animation = 'characterFloat 4s ease-in-out infinite';
        }, 800);
    });
}

if (miniCharacter) {
    // Mini character follows mouse in form
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('mousemove', (e) => {
            const rect = contactForm.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const moveX = (x - centerX) / 20;
            const moveY = (y - centerY) / 20;
            
            miniCharacter.style.transform = `translate(${moveX}px, ${moveY}px) rotateZ(${moveX}deg)`;
        });
        
        contactForm.addEventListener('mouseleave', () => {
            miniCharacter.style.transform = 'translate(0, 0) rotateZ(0)';
        });
    }
}

// Add character jump animation
const characterJumpStyle = document.createElement('style');
characterJumpStyle.textContent = `
    @keyframes characterJump {
        0%, 100% { transform: translateY(0) rotateZ(0) scale(1); }
        25% { transform: translateY(-30px) rotateZ(-10deg) scale(1.1); }
        50% { transform: translateY(-50px) rotateZ(0) scale(1.2); }
        75% { transform: translateY(-30px) rotateZ(10deg) scale(1.1); }
    }
`;
document.head.appendChild(characterJumpStyle);

// Enhanced Contact Form
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    // Add floating labels effect
    const formInputs = contactForm.querySelectorAll('input, textarea');
    
    formInputs.forEach(input => {
        // Add focus effects
        input.addEventListener('focus', () => {
            // Make mini character excited
            if (miniCharacter) {
                const miniEyes = miniCharacter.querySelectorAll('.mini-eye');
                miniEyes.forEach(eye => {
                    eye.style.transform = 'scaleY(1.2)';
                });
                
                const miniMouth = miniCharacter.querySelector('.mini-mouth');
                miniMouth.style.transform = 'scaleY(1.5)';
            }
            
            // Add sparkle effect to input
            const inputDecoration = input.parentElement.querySelector('.input-decoration');
            if (inputDecoration) {
                inputDecoration.style.background = 'linear-gradient(135deg, transparent 0%, rgba(255, 107, 107, 0.2) 100%)';
            }
        });
        
        input.addEventListener('blur', () => {
            // Reset mini character
            if (miniCharacter) {
                const miniEyes = miniCharacter.querySelectorAll('.mini-eye');
                miniEyes.forEach(eye => {
                    eye.style.transform = 'scaleY(1)';
                });
                
                const miniMouth = miniCharacter.querySelector('.mini-mouth');
                miniMouth.style.transform = 'scaleY(1)';
            }
        });
        
        // Add typing animation
        input.addEventListener('input', () => {
            if (miniCharacter) {
                miniCharacter.style.animation = 'miniCharacterBounce 0.3s ease-in-out';
                
                setTimeout(() => {
                    miniCharacter.style.animation = 'miniCharacterFloat 3s ease-in-out infinite';
                }, 300);
            }
        });
    });
    
    // Add mini character bounce animation
    const miniCharacterBounceStyle = document.createElement('style');
    miniCharacterBounceStyle.textContent = `
        @keyframes miniCharacterBounce {
            0%, 100% { transform: translateY(0) rotateZ(0); }
            50% { transform: translateY(-5px) rotateZ(5deg); }
        }
    `;
    document.head.appendChild(miniCharacterBounceStyle);
    
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const subject = contactForm.querySelector('input[placeholder="Subject"]').value;
        const message = contactForm.querySelector('textarea').value;
        
        // Simple validation
        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all fields', 'error');
            
            // Make character look sad
            if (cartoonCharacter) {
                const mouthShape = cartoonCharacter.querySelector('.mouth-shape');
                mouthShape.style.borderRadius = '20px 20px 0 0';
                mouthShape.style.background = '#666';
                
                setTimeout(() => {
                    mouthShape.style.borderRadius = '0 0 20px 20px';
                    mouthShape.style.background = '#ff6b6b';
                }, 2000);
            }
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Make character happy on successful submission
        if (cartoonCharacter) {
            // Character celebrates
            cartoonCharacter.style.animation = 'characterCelebrate 1s ease-in-out';
            
            const mouthShape = cartoonCharacter.querySelector('.mouth-shape');
            mouthShape.style.transform = 'scaleY(2)';
            mouthShape.style.background = '#4ecdc4';
            
            // Make arms wave wildly
            const rightArm = cartoonCharacter.querySelector('.right-arm');
            rightArm.style.animation = 'rightArmCelebrate 0.5s ease-in-out 3';
            
            setTimeout(() => {
                cartoonCharacter.style.animation = 'characterFloat 4s ease-in-out infinite';
                mouthShape.style.transform = 'scaleY(1)';
                mouthShape.style.background = '#ff6b6b';
                rightArm.style.animation = 'none';
                rightArm.style.transform = 'rotateZ(20deg)';
            }, 1000);
        }
        
        // Show success message
        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
        contactForm.reset();
    });
}

// Add character celebrate animations
const characterCelebrateStyle = document.createElement('style');
characterCelebrateStyle.textContent = `
    @keyframes characterCelebrate {
        0%, 100% { transform: translateY(0) rotateZ(0) scale(1); }
        25% { transform: translateY(-20px) rotateZ(-15deg) scale(1.1); }
        50% { transform: translateY(-40px) rotateZ(15deg) scale(1.2); }
        75% { transform: translateY(-20px) rotateZ(-5deg) scale(1.1); }
    }
    
    @keyframes rightArmCelebrate {
        0%, 100% { transform: rotateZ(20deg); }
        50% { transform: rotateZ(-30deg); }
    }
`;
document.head.appendChild(characterCelebrateStyle);

// Social link interactions
const socialLinks = document.querySelectorAll('.social-link');

socialLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
        // Make character point to social link
        if (cartoonCharacter) {
            const rightArm = cartoonCharacter.querySelector('.right-arm');
            rightArm.style.transform = 'rotateZ(-45deg)';
            rightArm.style.transition = 'transform 0.3s ease';
            
            // Character looks excited
            const eyes = cartoonCharacter.querySelectorAll('.eye');
            eyes.forEach(eye => {
                eye.style.transform = 'scale(1.2)';
            });
        }
    });
    
    link.addEventListener('mouseleave', () => {
        if (cartoonCharacter) {
            const rightArm = cartoonCharacter.querySelector('.right-arm');
            rightArm.style.transform = 'rotateZ(20deg)';
            
            const eyes = cartoonCharacter.querySelectorAll('.eye');
            eyes.forEach(eye => {
                eye.style.transform = 'scale(1)';
            });
        }
    });
    
    link.addEventListener('click', () => {
        // Character waves goodbye
        if (cartoonCharacter) {
            const leftArm = cartoonCharacter.querySelector('.left-arm');
            leftArm.style.animation = 'leftArmWave 0.3s ease-in-out 3';
            
            // Character winks
            const leftEye = cartoonCharacter.querySelector('.left-eye');
            leftEye.style.transform = 'scaleY(0.1)';
            
            setTimeout(() => {
                leftEye.style.transform = 'scaleY(1)';
            }, 300);
        }
    });
});

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #4ecdc4, #45b7d1)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Smooth reveal animation for sections
const revealSections = () => {
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const scrolled = window.pageYOffset;
        
        if (scrolled > sectionTop - window.innerHeight + 200) {
            section.classList.add('revealed');
        }
    });
};

window.addEventListener('scroll', revealSections);
window.addEventListener('load', revealSections);

// Add CSS for animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
        transition: all 0.6s ease;
    }
    
    section {
        opacity: 0;
        transform: translateY(50px);
        transition: all 0.8s ease;
    }
    
    section.revealed {
        opacity: 1;
        transform: translateY(0);
    }
    
    .portfolio-item {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.4s ease;
    }
    
    .service-card-3d {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .stat-item {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.5s ease;
    }
    
    .section-title {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
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
`;

document.head.appendChild(animationStyles);

// Mouse move parallax for hero section
document.addEventListener('mousemove', (e) => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    const floatingElements = document.querySelectorAll('.floating-cube');
    
    floatingElements.forEach((element, index) => {
        const speed = 1 + (index * 0.2);
        const x = (mouseX - 0.5) * speed * 50;
        const y = (mouseY - 0.5) * speed * 50;
        
        element.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// Add hover sound effect (visual feedback)
document.querySelectorAll('.btn-3d, .social-link, .nav-link').forEach(element => {
    element.addEventListener('mouseenter', () => {
        element.style.transition = 'all 0.2s ease';
        element.style.transform = element.style.transform + ' scale(1.05)';
    });
    
    element.addEventListener('mouseleave', () => {
        element.style.transform = element.style.transform.replace(' scale(1.05)', '');
    });
});

// Initialize page animations
document.addEventListener('DOMContentLoaded', () => {
    // Add staggered animation to service cards
    const serviceCards = document.querySelectorAll('.service-card-3d');
    serviceCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.animation = 'fadeInUp 0.6s ease forwards';
    });
    
    // Add staggered animation to portfolio items
    const portfolioCards = document.querySelectorAll('.portfolio-item');
    portfolioCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.animation = 'fadeInUp 0.6s ease forwards';
    });
});

// Performance optimization - Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
window.addEventListener('scroll', debounce(() => {
    revealSections();
}, 10));

// Add loading animation for images
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', () => {
        img.style.animation = 'fadeIn 0.5s ease';
    });
});

// Add fade in animation for images
const imageStyles = document.createElement('style');
imageStyles.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    img {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
`;

document.head.appendChild(imageStyles);

// Console Easter egg
console.log('%c🎬 Visual Alchemi - Cinematic Portfolio', 'font-size: 20px; font-weight: bold; background: linear-gradient(135deg, #ff6b6b, #4ecdc4); color: white; padding: 10px 20px; border-radius: 5px;');
console.log('%cCrafted with passion and creativity ✨', 'font-size: 14px; color: #666;');
