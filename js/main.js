// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.id;

    // --- General Site-Wide Logic ---
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        const navMenu = document.querySelector('.nav-menu');
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // --- Core Blog Functions ---
    const getPosts = async () => {
        let posts = JSON.parse(localStorage.getItem('blogPosts'));
        if (!posts) {
            try {
                const response = await fetch('blogs.json');
                posts = await response.json();
                localStorage.setItem('blogPosts', JSON.stringify(posts));
            } catch (error) {
                console.error("Could not fetch initial posts:", error);
                posts = [];
            }
        }
        return posts;
    };
    
    const savePosts = (posts) => {
        localStorage.setItem('blogPosts', JSON.stringify(posts));
    };

    // --- Admin Login Page Logic ---
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('login-error');
            
            // IMPORTANT: This is a highly insecure, client-side-only password check.
            // For a real application, authentication should be handled by a secure backend server.
            if (password === 'admin123') {
                sessionStorage.setItem('isAdminAuthenticated', 'true');
                window.location.href = 'admin.html';
            } else {
                errorEl.textContent = 'Incorrect password.';
            }
        });
    }
    
    // --- Admin Dashboard Page Logic ---
    const adminPage = document.querySelector('body[action="admin"]');
    if (document.getElementById('blogForm')) {
        // Security check
        if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
            window.location.href = 'admin-login.html';
            return;
        }

        // Set default date
        document.getElementById('date').valueAsDate = new Date();

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.removeItem('isAdminAuthenticated');
            window.location.href = 'admin-login.html';
        });

        // Form submission
        document.getElementById('blogForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusEl = document.getElementById('form-status');
            
            const newPost = {
                id: Date.now(), // Unique ID based on timestamp
                title: document.getElementById('title').value,
                author: document.getElementById('author').value,
                date: document.getElementById('date').value,
                thumbnail: document.getElementById('thumbnail').value,
                tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()),
                content: document.getElementById('content').value
            };

            const posts = await getPosts();
            posts.unshift(newPost); // Add new post to the beginning
            savePosts(posts);

            statusEl.textContent = 'Post published successfully!';
            statusEl.style.color = 'green';
            e.target.reset(); // Clear the form
            document.getElementById('date').valueAsDate = new Date(); // Reset date
            
            setTimeout(() => statusEl.textContent = '', 3000);
        });
    }

    // --- Dynamic Blog Page Logic ---
    if (document.getElementById('blog-grid-container')) {
        const renderPosts = async () => {
            const posts = await getPosts();
            const container = document.getElementById('blog-grid-container');
            container.innerHTML = ''; // Clear existing content

            if (posts.length === 0) {
                container.innerHTML = '<p>No blog posts found.</p>';
                return;
            }

            posts.forEach(post => {
                const postCard = document.createElement('div');
                postCard.className = 'blog-post-card';
                
                // Create a short excerpt from the content
                const excerpt = post.content.substring(0, 100) + '...';

                postCard.innerHTML = `
                    <img src="${post.thumbnail}" alt="${post.title}">
                    <div class="blog-post-content">
                        <h3>${post.title}</h3>
                        <p>${excerpt}</p>
                        <a href="post.html?id=${post.id}" class="btn">Read More</a>
                    </div>
                `;
                container.appendChild(postCard);
            });
        };

        renderPosts();
    }
    
    // --- Single Blog Post Page Logic ---
    if (document.getElementById('post-container')) {
        const renderPost = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = parseInt(urlParams.get('id'));
            const container = document.getElementById('post-container');
            
            const posts = await getPosts();
            const post = posts.find(p => p.id === postId);

            if (post) {
                document.title = `${post.title} - InsightEdge`;
                container.innerHTML = `
                    <header class="post-header">
                        <h1>${post.title}</h1>
                        <div class="post-meta">
                            <span>By ${post.author}</span> | <span>${new Date(post.date).toLocaleDateString()}</span>
                        </div>
                    </header>
                    <div class="post-content">
                        <img src="${post.thumbnail}" alt="${post.title}" style="margin: 20px 0; border-radius: 8px; width: 100%;">
                        ${post.content.split('\n').map(p => `<p>${p}</p>`).join('')}
                    </div>
                `;
            } else {
                container.innerHTML = '<h1>Post not found</h1><p>The requested blog post could not be found.</p>';
            }
        };

        renderPost();
    }
});