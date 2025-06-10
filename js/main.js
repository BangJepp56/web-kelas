// Main JavaScript file for GSI 68A Website
import { supabase } from './supabase.js';

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const uploadForm = document.getElementById('upload-form');
const commentForm = document.getElementById('comment-form');
const galleryGrid = document.getElementById('gallery-grid');
const commentsList = document.getElementById('comments-list');

// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 100
});

// Loading Screen
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1000);
});

// Mobile Menu Toggle
menuToggle?.addEventListener('click', () => {
    nav.classList.toggle('active');
    
    // Animate hamburger menu
    const spans = menuToggle.querySelectorAll('span');
    spans.forEach((span, index) => {
        if (nav.classList.contains('active')) {
            if (index === 0) span.style.transform = 'rotate(45deg) translate(5px, 5px)';
            if (index === 1) span.style.opacity = '0';
            if (index === 2) span.style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            span.style.transform = 'none';
            span.style.opacity = '1';
        }
    });
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = targetSection.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Close mobile menu
            nav.classList.remove('active');
            const spans = menuToggle.querySelectorAll('span');
            spans.forEach(span => {
                span.style.transform = 'none';
                span.style.opacity = '1';
            });
        }
    });
});

// Header Scroll Effect
let lastScrollY = window.scrollY;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
    }
    
    // Hide/show header on scroll
    if (currentScrollY > lastScrollY && currentScrollY > 200) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
    
    lastScrollY = currentScrollY;
});

// Image Upload Functionality
uploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('image-upload');
    const captionInput = document.getElementById('image-caption');
    const file = fileInput.files[0];
    const caption = captionInput.value.trim();
    
    if (!file || !caption) {
        showNotification('Please select an image and add a caption', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    submitBtn.disabled = true;
    
    try {
        // Upload image to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('gallery-images')
            .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(fileName);
        
        // Save to database
        const { data, error } = await supabase
            .from('gallery_images')
            .insert([
                {
                    image_url: publicUrl,
                    caption: caption,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Add to gallery
        addImageToGallery(publicUrl, caption);
        
        // Reset form
        uploadForm.reset();
        showNotification('Image uploaded successfully!', 'success');
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Failed to upload image. Please try again.', 'error');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Comment Form Functionality
commentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('comment-name');
    const emailInput = document.getElementById('comment-email');
    const messageInput = document.getElementById('comment-message');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!name || !message) {
        showNotification('Please fill in name and message fields', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = commentForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([
                {
                    name: name,
                    email: email || null,
                    message: message,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Add comment to list
        addCommentToList(data[0]);
        
        // Reset form
        commentForm.reset();
        showNotification('Comment posted successfully!', 'success');
        
    } catch (error) {
        console.error('Comment error:', error);
        showNotification('Failed to post comment. Please try again.', 'error');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Add image to gallery
function addImageToGallery(imageUrl, caption) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item fade-in-up';
    galleryItem.innerHTML = `
        <img src="${imageUrl}" alt="${caption}">
        <div class="gallery-overlay">
            <div class="gallery-content">
                <h4>${caption}</h4>
                <p>Recently uploaded</p>
            </div>
        </div>
    `;
    
    galleryGrid.insertBefore(galleryItem, galleryGrid.firstChild);
}

// Add comment to list
function addCommentToList(comment) {
    const commentItem = document.createElement('div');
    commentItem.className = 'comment-item fade-in-up';
    
    const date = new Date(comment.created_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const initials = comment.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    commentItem.innerHTML = `
        <div class="comment-header">
            <div class="comment-avatar">${initials}</div>
            <div class="comment-info">
                <h4>${comment.name}</h4>
                <span class="comment-date">${date}</span>
            </div>
        </div>
        <p class="comment-text">${comment.message}</p>
    `;
    
    commentsList.insertBefore(commentItem, commentsList.firstChild);
}

// Load existing comments
async function loadComments() {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        data.forEach(comment => addCommentToList(comment));
        
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Load existing gallery images
async function loadGalleryImages() {
    try {
        const { data, error } = await supabase
            .from('gallery_images')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        data.forEach(image => {
            addImageToGallery(image.image_url, image.caption);
        });
        
    } catch (error) {
        console.error('Error loading gallery images:', error);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroParticles = document.querySelector('.hero-particles');
    
    if (heroParticles) {
        heroParticles.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load data if Supabase is configured
    if (supabase) {
        loadComments();
        loadGalleryImages();
    }
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.gallery-item, .profile-card, .activity-item').forEach(el => {
        observer.observe(el);
    });
});

// Handle file input change
document.getElementById('image-upload')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const label = e.target.closest('.upload-label');
    
    if (file) {
        const fileName = file.name;
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        label.querySelector('span').textContent = `${fileName} (${fileSize} MB)`;
        label.style.borderColor = 'var(--primary-blue)';
        label.style.background = 'var(--very-light-blue)';
    }
});

// Export functions for potential external use
window.GSI68A = {
    showNotification,
    addImageToGallery,
    addCommentToList
};