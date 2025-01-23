// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('nav ul');

    menuToggle.addEventListener('click', function() {
        navList.classList.toggle('active');
    });

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop - 80,
                behavior: 'smooth'
            });

            // Close mobile menu after clicking
            if (navList.classList.contains('active')) {
                navList.classList.remove('active');
            }
        });
    });

    // Animation on Scroll
    function revealOnScroll() {
        const elements = document.querySelectorAll('.gallery-item, .about-content > div');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }

    // Initial styles for animation
    document.querySelectorAll('.gallery-item, .about-content > div').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.6s ease-out';
    });

    // Add scroll event listener
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check
});