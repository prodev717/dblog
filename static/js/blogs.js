const API_URL = "http://127.0.0.1:5000";
const currentUserId = localStorage.getItem("user_id");

if (!currentUserId) {
    document.getElementById("auth-warning").style.display = "block";
}

async function loadArchives() {
    const container = document.getElementById("blogs-container");
    try {
        const res = await fetch(`${API_URL}/blogs`);
        const blogs = await res.json();
        
        container.innerHTML = "";
        if (blogs.length === 0) {
            container.innerHTML = "<p>NO ARCHIVES FOUND IN DATABASE.</p>";
            return;
        }

        blogs.forEach(blog => {
            const div = document.createElement("div");
            div.className = "blog-post";
            
            const likeDisabled = !currentUserId;
            const likeAction = likeDisabled ? "alert('MUST BE AUTHENTICATED TO LIKE.')" : `likeBlog(${blog.id})`;
            
            div.innerHTML = `
                <button class="like-btn" onclick="${likeAction}">👍 ${blog.likes}</button>
                <h3>${blog.title}</h3>
                <div class="blog-content">${blog.para}</div>
                <div class="blog-meta">AUTHOR: ${blog.author} | TRANSMISSION ID: ${blog.id}</div>
            `;
            container.appendChild(div);
        });

    } catch (e) {
        container.innerHTML = "<p style='color:var(--danger-red)'>SIGNAL LOST. UNABLE TO LOAD ARCHIVES FROM SERVER.</p>";
    }
}

async function likeBlog(blogId) {
    if (!currentUserId) return;
    try {
        const res = await fetch(`${API_URL}/blogs/${blogId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': currentUserId
            }
        });
        if (res.ok) {
            loadArchives(); 
        } else {
            alert("COMMUNICATION ERROR.");
        }
    } catch (e) {
        alert("NETWORK DISCONNECTED.");
    }
}

// Initialize display
loadArchives();
