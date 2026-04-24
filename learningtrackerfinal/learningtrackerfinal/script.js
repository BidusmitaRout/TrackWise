// script.js
const STORAGE_KEY = 'trackWiseCourses';
let courseData = [];
const AUTH_KEY = 'trackWiseAuthUser';

// Backend API base (local dev)
const API_BASE = 'http://localhost:3000/api';

// API helpers (throw on network errors so callers can fallback to localStorage)
async function apiListItems() {
    const user = getAuthUser();
    if (!user) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/items?user=${encodeURIComponent(user.email)}`);
    if (!res.ok) throw new Error('API list failed');
    return res.json();
}

async function apiCreateItem(item) {
    const user = getAuthUser();
    if (!user) throw new Error('Not authenticated');
    const payload = Object.assign({}, item, { owner: user.email });
    const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('API create failed');
    return res.json();
}

async function apiUpdateItem(id, item) {
    const user = getAuthUser();
    if (!user) throw new Error('Not authenticated');
    const payload = Object.assign({}, item, { owner: user.email });
    const res = await fetch(`${API_BASE}/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('API update failed');
    return res.json();
}

async function apiDeleteItem(id) {
    const user = getAuthUser();
    if (!user) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/items/${id}?user=${encodeURIComponent(user.email)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API delete failed');
    return res.json();
}

/* --- COURSE LINKING (courses.html to tracker.html) --- */
function addCourseFromCourses(courseName) {
  // Store the course name in sessionStorage
  sessionStorage.setItem('selectedCourse', courseName);
  // Navigate to tracker
  window.location.href = 'tracker.html';
}

// On tracker.html load, check for selectedCourse and pre-fill the form
function autoPopulateCourseFromSelection() {
  const selectedCourse = sessionStorage.getItem('selectedCourse');
  if (selectedCourse) {
    const courseNameInput = document.getElementById('courseName');
    if (courseNameInput) {
      courseNameInput.value = selectedCourse;
      courseNameInput.focus();
    }
    // Clear after reading so it doesn't persist
    sessionStorage.removeItem('selectedCourse');
  }
}

/* --- AUTH HELPERS --- */
const getUsers = () => JSON.parse(localStorage.getItem('trackwise_users') || '[]');
const saveUsers = (u) => localStorage.setItem('trackwise_users', JSON.stringify(u));
const getAuthUser = () => JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
const setAuthUser = (user) => localStorage.setItem(AUTH_KEY, JSON.stringify(user));
const clearAuthUser = () => localStorage.removeItem(AUTH_KEY);
const isAuthenticated = () => !!getAuthUser();

// When an action requires authentication, redirect to login with a next URL
function requireAuth(nextUrl) {
    if (isAuthenticated()) {
        // Already authenticated — go to next
        window.location.href = nextUrl;
        return;
    }
    alert('Login is required to continue.');
    // encode nextUrl so it survives in the query string
    window.location.href = `login.html?next=${encodeURIComponent(nextUrl)}`;
}

// Login form submit handler (used by login.html)
function loginSubmit(event) {
    event.preventDefault();
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    const email = form.elements['email'].value.trim().toLowerCase();
    const password = form.elements['password'].value;

    if (!email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
    if (!user) {
        alert('Invalid credentials. If you are new, please sign up.');
        return;
    }
    setAuthUser({ email: user.email, name: user.name, phone: user.phone, password: user.password });
    
    // Show success message
    alert(`Welcome back ${user.name}! You are now logged in.`);
    
    // Redirect to `next` if present
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next) {
        window.location.href = decodeURIComponent(next);
    } else {
        window.location.href = 'index.html';
    }
}

// Signup submit handler (used by signup.html)
function signupSubmit(event) {
    event.preventDefault();
    const form = document.getElementById('signupForm');
    if (!form) return;
    
    const name = form.elements['fullName'].value.trim();
    const email = form.elements['email'].value.trim().toLowerCase();
    const phone = form.elements['phone'].value.trim();
    const password = form.elements['password'].value;

    if (!name || !email || !phone || !password) {
        alert('Please complete all fields.');
        return;
    }

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
        alert('An account with this email already exists. Please login instead.');
        window.location.href = 'login.html';
        return;
    }

    users.push({ name, email, phone, password });
    saveUsers(users);
    setAuthUser({ email, name, phone, password });
    
    // Show success message
    alert(`Welcome ${name}! Account created successfully. You are now logged in.`);
    
    // Redirect to next if present, otherwise home
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next) {
        window.location.href = decodeURIComponent(next);
    } else {
        window.location.href = 'index.html';
    }
}

/* --- UTILITIES: Modal --- */

function showModal(content) {
    const modal = document.getElementById('mainModal');
    const modalContent = document.querySelector('#mainModal .modal-content');
    
    modalContent.innerHTML = content;
    modal.classList.add('show-modal');
}

function closeModal() {
    document.getElementById('mainModal').classList.remove('show-modal');
}

/* --- TRACKER & LOCAL STORAGE --- */

const saveTracker = () => {
    // Always keep a local cache; primary persistence is via API per-action
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courseData));
};

const updateKpi = () => {
    const kpiElement = document.querySelector('#activeCoursesVal');
    if (kpiElement) {
        kpiElement.textContent = courseData.length;
    }
    updateWeeklyInsights();
};

const getDifficultyColor = (difficulty) => {
    if (difficulty === 'easy') return '#10b981';
    if (difficulty === 'medium') return '#f59e0b';
    if (difficulty === 'hard') return '#ef4444';
    return '#6b7280';
};

const getDaysSinceStudy = (lastStudied) => {
    if (!lastStudied) return 'Never';
    const lastDate = new Date(lastStudied);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
};

const getStudyStreak = (course) => {
    if (!course.lastStudied) return 0;
    const lastDate = new Date(course.lastStudied);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? (course.streak || 0) + 1 : 1;
};

const createRowHTML = (name, progress, isCompleted, course) => {
    const statusClass = isCompleted ? 'ok' : 'muted';
    const difficulty = course.difficulty || 'medium';
    const diffColor = getDifficultyColor(difficulty);
    const hoursLogged = (course.hoursLogged || 0).toFixed(1);
    const lastStudied = getDaysSinceStudy(course.lastStudied);
    const streak = course.streak || 0;
    const category = course.category || 'General';
    const deadline = course.deadline ? new Date(course.deadline).toLocaleDateString() : 'No deadline';
    const notes = course.notes || '';
    
    return `
        <tr data-course-name="${name}" style="border-bottom:1px solid var(--border)">
            <td style="padding:10px">
                <div style="display:flex;gap:8px;align-items:center">
                    <div style="width:4px;height:30px;border-radius:2px;background:${diffColor}"></div>
                    <div>
                        <strong>${name}</strong>
                        <div style="font-size:11px;color:var(--muted);margin-top:3px">
                            ${category} • ${difficulty.toUpperCase()}
                        </div>
                    </div>
                </div>
            </td>
            <td style="padding:10px;text-align:center;min-width:100px">
                <div style="margin-bottom:6px">
                    <progress value="${progress}" max="100" style="width:100%;height:6px;border-radius:3px"></progress>
                </div>
                <span style="font-size:12px;color:var(--${isCompleted ? 'ok' : 'muted'})">${progress}%</span>
            </td>
            <td style="padding:10px;text-align:center;font-size:12px;color:var(--muted)">
                <div>${hoursLogged}h</div>
                <div style="margin-top:3px">studied</div>
            </td>
            <td style="padding:10px;text-align:center;font-size:12px">
                <div style="color:${streak > 0 ? '#f59e0b' : 'var(--muted)'}">🔥 ${streak}</div>
                <div style="margin-top:3px;color:var(--muted)">${lastStudied}</div>
            </td>
            <td style="padding:10px;text-align:center;font-size:11px;color:var(--muted)">
                <div>${deadline}</div>
            </td>
            <td style="padding:10px">
                <button class="btn" style="font-size:11px;padding:4px 8px" onclick="editCourse(this)">Edit</button>
                <button class="btn" style="font-size:11px;padding:4px 8px" onclick="logStudyTime(this)">Log Time</button>
                <button class="btn" style="font-size:11px;padding:4px 8px" onclick="viewResources(${course.id})">Resources</button>
                <button class="btn" style="font-size:11px;padding:4px 8px" onclick="removeCourseRow(this)">Remove</button>
            </td>
        </tr>
    `;
};

const renderTracker = (dataToRender = courseData) => {
    const tbody = document.querySelector('#track-rows');
    if (!tbody) return;

    tbody.innerHTML = '';
    dataToRender.forEach(course => {
        tbody.innerHTML += createRowHTML(course.name, course.progress, course.isCompleted, course);
    });
    updateKpi();
};

async function loadTracker() {
    // Try backend first, fall back to localStorage
    try {
        const items = await apiListItems();
        // items from backend may include id — keep as-is
        courseData = Array.isArray(items) ? items : [];
        saveTracker(); // cache locally
        renderTracker();
        return;
    } catch (e) {
        // Backend not available — use local cache
        courseData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        renderTracker();
    }
}

// Lightweight loader used by pages (like analytics.html) that only need the data
// but do not want to render the full tracker table. Keeps backwards compatibility
// with older pages that call `loadCourseData()`.
function loadCourseData() {
    courseData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

async function addCourseRow() {
    const name = document.querySelector('#courseName').value.trim();
    const progress = parseInt(document.querySelector('#courseProgress').value, 10);
    const category = document.querySelector('#courseCategory').value || 'General';
    const difficulty = document.querySelector('#courseDifficulty').value || 'medium';

    if (!name || isNaN(progress) || progress < 0 || progress > 100) {
        alert('Please enter a valid course name and progress (0-100).');
        return;
    }

    if (courseData.find(c => c.name === name)) {
        alert('Course already exists!');
        return;
    }

    const newCourse = { 
        name, 
        progress, 
        isCompleted: progress === 100,
        category,
        difficulty,
        hoursLogged: 0,
        streak: 0,
        lastStudied: new Date().toISOString(),
        deadline: null,
        notes: [],
        timerActive: false,
        timerSeconds: 0
    };
    // Try to persist to backend; fall back to local-only
    try {
        const created = await apiCreateItem(newCourse);
        if (created && created.id) {
            // Use server copy (includes id)
            courseData.push(created);
        } else {
            courseData.push(newCourse);
        }
    } catch (e) {
        courseData.push(newCourse);
    }

    saveTracker();
    renderTracker();
    
    document.querySelector('#courseName').value = '';
    document.querySelector('#courseProgress').value = 0;
    document.querySelector('#courseCategory').value = 'General';
    document.querySelector('#courseDifficulty').value = 'medium';
}

function removeCourseRow(buttonElement) {
    const row = buttonElement.closest('tr');
    const name = row.dataset.courseName; 
    const course = courseData.find(c => c.name === name);
    if (!course) return;

    // If this item exists on server (has id) try deleting there
    if (course.id) {
        (async () => {
            try {
                await apiDeleteItem(course.id);
            } catch (e) {
                // ignore and still remove locally
            }
        })();
    }

    courseData = courseData.filter(c => c.name !== name);
    saveTracker();
    renderTracker();
}

function toggleComplete(buttonElement) {
    const row = buttonElement.closest('tr');
    const name = row.dataset.courseName;
    
    const course = courseData.find(c => c.name === name);
    if (course) {
        course.isCompleted = !course.isCompleted;
        course.progress = course.isCompleted ? 100 : 0;
    }
    // Persist update to backend if possible
    if (course && course.id) {
        (async () => {
            try { await apiUpdateItem(course.id, course); } catch (e) { /* ignore */ }
        })();
    }

    saveTracker();
    renderTracker();
}

function logStudyTime(buttonElement) {
    const row = buttonElement.closest('tr');
    const courseName = row.dataset.courseName;
    const course = courseData.find(c => c.name === courseName);
    
    if (!course) return;
    
    const hours = prompt(`Log study hours for "${courseName}":\n(Current: ${(course.hoursLogged || 0).toFixed(1)}h)`, '1');
    if (hours === null) return;
    
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum < 0) {
        alert('Please enter a valid number of hours.');
        return;
    }
    
    course.hoursLogged = (course.hoursLogged || 0) + hoursNum;
    course.lastStudied = new Date().toISOString();
    
    // Update streak
    const lastDate = new Date(course.lastStudied);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
        course.streak = (course.streak || 0) + 1;
    }
    // Persist update to backend if possible
    if (course.id) {
        (async () => {
            try { await apiUpdateItem(course.id, course); } catch (e) { /* ignore */ }
        })();
    }

    saveTracker();
    renderTracker();
}

function editCourse(buttonElement) {
    const row = buttonElement.closest('tr');
    const courseName = row.dataset.courseName;
    const course = courseData.find(c => c.name === courseName);
    
    if (!course) return;
    
    const newProgress = prompt(`Update progress for "${courseName}" (0-100):`, course.progress);
    if (newProgress === null) return;
    
    const progressNum = parseInt(newProgress, 10);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
        alert('Please enter a valid progress (0-100).');
        return;
    }
    
    course.progress = progressNum;
    course.isCompleted = progressNum === 100;
    
    const newDeadline = prompt(`Set deadline for "${courseName}" (YYYY-MM-DD or leave blank):`, course.deadline || '');
    if (newDeadline !== null) {
        if (newDeadline === '') {
            course.deadline = null;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(newDeadline)) {
            course.deadline = newDeadline;
        } else {
            alert('Please use format YYYY-MM-DD');
        }
    }
    
    const newNote = prompt(`Add a milestone/note for "${courseName}":`, '');
    if (newNote !== null && newNote.trim()) {
        course.notes = course.notes || [];
        course.notes.push({ text: newNote, date: new Date().toLocaleDateString() });
    }
    // Persist update to backend if possible
    if (course.id) {
        (async () => {
            try { await apiUpdateItem(course.id, course); } catch (e) { /* ignore */ }
        })();
    }

    saveTracker();
    renderTracker();
}

function viewResources(courseId) {
    const course = courseData.find(c => c.id == courseId);
    if (!course || !course.resources || course.resources.length === 0) {
        alert('No resources available for this course.');
        return;
    }

    let content = `<h3>Resources for ${course.name}</h3>`;
    course.resources.forEach(resource => {
        const status = resource.completed ? '✅ Completed' : '⏳ Pending';
        content += `
            <div style="margin-bottom: 20px; padding: 10px; border: 1px solid var(--border); border-radius: 8px;">
                <h4>${resource.title}</h4>
                <p>${resource.content}</p>
                <p><strong>Status:</strong> ${status}</p>
                ${!resource.completed ? `<button class="btn brand" onclick="markResourceCompleted(${course.id}, ${resource.id})">Mark as Completed</button>` : ''}
            </div>
        `;
    });
    content += '<button class="btn" onclick="closeModal()">Close</button>';

    showModal(content);
}

function markResourceCompleted(courseId, resourceId) {
    const course = courseData.find(c => c.id == courseId);
    if (!course || !course.resources) return;

    const resource = course.resources.find(r => r.id == resourceId);
    if (resource) {
        resource.completed = true;
        
        // Recalculate progress
        const completedCount = course.resources.filter(r => r.completed).length;
        course.progress = Math.round((completedCount / course.resources.length) * 100);
        course.isCompleted = course.progress === 100;
        
        // Update backend
        if (course.id) {
            (async () => {
                try { await apiUpdateItem(course.id, course); } catch (e) { /* ignore */ }
            })();
        }
        
        saveTracker();
        renderTracker();
        closeModal();
        viewResources(courseId); // Reopen modal to show updated status
    }
}

function filterCourses(searchTerm) {
    const filteredData = courseData.filter(course => 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    renderTracker(filteredData);
}

function updateWeeklyInsights() {
    const totalHours = courseData.reduce((sum, c) => sum + (c.hoursLogged || 0), 0);
    const completedCourses = courseData.filter(c => c.isCompleted).length;
    const totalCourses = courseData.length;
    const maxStreakCourse = courseData.reduce((max, c) => (c.streak || 0) > (max.streak || 0) ? c : max, {});
    
    const hoursElement = document.querySelector('#weeklyHours');
    const completedElement = document.querySelector('#completedCourses');
    const streakElement = document.querySelector('#longestStreak');
    const categoryBreakdown = document.querySelector('#categoryBreakdown');
    
    if (hoursElement) hoursElement.textContent = totalHours.toFixed(1);
    if (completedElement) completedElement.textContent = completedCourses;
    if (streakElement) streakElement.textContent = (maxStreakCourse.streak || 0) + ' days';
    
    // Category breakdown
    if (categoryBreakdown) {
        const categories = {};
        courseData.forEach(c => {
            const cat = c.category || 'General';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        categoryBreakdown.innerHTML = Object.entries(categories)
            .map(([cat, count]) => `<div style="padding:6px;background:var(--panel-2);border-radius:4px;margin:4px 0;font-size:12px">${cat}: ${count} course${count > 1 ? 's' : ''}</div>`)
            .join('');
    }
}

/* --- VALIDATION & FORMS --- */

function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validateContactForm(event) {
    event.preventDefault(); // Stop default form submit
    const name = document.querySelector('#contactForm input[placeholder="Name"]').value.trim();
    const email = document.querySelector('#contactForm input[type="email"]').value.trim();
    const message = document.querySelector('textarea[placeholder="Message"]').value.trim();
    
    if (name === '' || email === '' || message === '' || !isValidEmail(email)) {
        alert('Please fill out all fields correctly.');
        return false;
    }
    
    alert('Thank you for your message! (Simulated submission)');
    document.getElementById('contactForm').reset();
    return false; // Prevent navigation
}

// In script.js

function validateLoginSignup(event, formType) {
    event.preventDefault();
    const email = document.querySelector(`#${formType}Form input[type="email"]`).value.trim();
    
    // ... (Existing email/password checks, if applicable) ...

    if (formType === 'checkout') {
        const mmYy = document.querySelector(`#${formType}Form input[placeholder="MM/YY"]`).value.trim();
        const cvc = document.querySelector(`#${formType}Form input[placeholder="CVC"]`).value.trim();
        const cardNumber = document.querySelector(`#${formType}Form input[placeholder="Card number 4242 4242 4242 4242"]`).value.trim();

        if (cardNumber.length < 16) {
             alert('Please enter a full card number.');
             return;
        }
        if (mmYy.length < 3 || cvc.length < 3) {
            alert('Please enter valid month/year and CVC.');
            return;
        }
        
        // Note: The HTML change to type="number" handles the alphabet restriction.
    }
    
    // ... (Existing success alert) ...
    document.getElementById(`${formType}Form`).reset();

    if (formType === 'checkout') {
        // After a successful (simulated) payment, show subscribed confirmation
        try {
            const params = new URLSearchParams(window.location.search);
            const plan = params.get('plan') || 'Selected';

            // Show a blocking alert to confirm subscription
            alert(`Payment complete — you are subscribed to the ${plan} plan.`);

            // Add a non-blocking banner to the top of the first container
            const mainContainer = document.querySelector('.container');
            if (mainContainer) {
                const banner = document.createElement('div');
                banner.className = 'subscribe-banner';
                banner.textContent = `Subscribed to ${plan} plan — Thank you!`;
                mainContainer.prepend(banner);
            }

            // Optionally remove the plan query param from the URL to keep it clean
            if (window.history && window.history.replaceState) {
                params.delete('plan');
                const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
                window.history.replaceState({}, '', newUrl);
            }
        } catch (e) {
            console.warn('Could not show subscription confirmation', e);
        }
    } else {
        alert(`Successfully simulated ${formType} submission.`);
    }
}


function handleBuyNow(planName) {
    // Redirect to payment page but require login first
    const target = `payment.html?plan=${encodeURIComponent(planName)}`;
    requireAuth(target);
}

/* --- SCROLL ANIMATIONS --- */

const setupScrollAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
                observer.unobserve(entry.target); // Stop observing once visible
            }
        });
    }, { threshold: 0.1 }); 

    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });
};


    // Load tracker data on the tracker page
    if (document.querySelector('#track-rows')) {
        loadTracker();
    }
    
    setupScrollAnimations();

    // Animated counters for .stat elements
    function animateCount(el, to, suffix) {
        const duration = 900;
        const start = performance.now();
        function step(now) {
            const p = Math.min(1, (now - start) / duration);
            const val = Math.round(p * to);
            el.textContent = suffix ? `${val}${suffix}` : String(val);
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function initStatsAnimation() {
        const stats = document.querySelectorAll('.stat');
        stats.forEach(s => {
            const to = parseFloat(s.dataset.to) || 0;
            const suffix = s.dataset.suffix || '';
            const obs = new IntersectionObserver((entries, o) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        animateCount(s, to, suffix);
                        o.disconnect();
                    }
                });
            }, { threshold: 0.4 });
            obs.observe(s);
        });
    }

    // Kick off stat animations (safe to call multiple times)
    try { initStatsAnimation(); } catch (e) { /* ignore */ }

    // Intercept 'Add to Tracker' and 'Start Tracking' links to require login
    document.querySelectorAll('a.btn.brand').forEach(a => {
        try {
            const href = a.getAttribute('href');
            if (!href) return;
            // If the link points to tracker (adding courses) require login first
            if (href.includes('tracker.html')) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    requireAuth(href);
                });
            }
        } catch (e) {
            // ignore
        }
    });

    // NOTE: subscription confirmation is shown after successful checkout submission

// Logout handler
function logoutUser() {
    clearAuthUser();
    alert('You have been logged out.');
    window.location.href = 'index.html';
}

// In script.js

// NEW: Master list of courses for search suggestions
const MASTER_COURSE_LIST = [
    { id: 'C01', name: '01. Course 1: Foundations' },
    { id: 'C02', name: '02. Course 2: Advanced Topics' },
    { id: 'C03', name: '03. Course 3: Project Work' },
    { id: 'C04', name: '04. Course 4: Specialized Skills' },
    { id: 'C05', name: '05. Course 5: Certification Prep' },
    { id: 'C06', name: '06. Course 6: Review' },
    // Add other course names from your course cards here
];

// --- NAV: populate hamburger menu and greeting ---
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function populateNavMenu() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;

    const items = [
        { text: 'Home', href: 'index.html' },
        { text: 'Courses', href: 'courses.html' },
        { text: 'Contact', href: 'contact.html' },
        { text: 'Payment', href: 'payment.html' },
        { text: '─────────────', href: '#' },
        { text: '📊 Tracker', href: 'tracker.html' },
        { text: '📈 Analytics', href: 'analytics.html' },
        { text: '📅 Schedule', href: 'schedule.html' },
        { text: '🏆 Leaderboard', href: 'leaderboard.html' },
        { text: '✍️ Quizzes', href: 'quizzes.html' },
        { text: '📚 Resources', href: 'resources.html' },
        { text: '🏆 Achievements', href: 'achievements.html' },
        { text: '💬 Forums', href: 'forums.html' },
        { text: '👤 Profile', href: 'profile.html' }
    ];

    const authUser = getAuthUser();

    let html = items.map(i => {
      if (i.href === '#') return `<div style="padding:10px 14px;color:var(--muted);font-size:12px">${i.text}</div>`;
      return `<a class="nav-link" href="${i.href}">${i.text}</a>`;
    }).join('');

    if (authUser) {
        html += `<hr style="margin:6px 0;border:none;border-top:1px solid var(--muted);">`;
        html += `<a href="#" id="menu-logout">🚪 Logout</a>`;
    }

    navMenu.innerHTML = html;

    // Attach handlers to links
    navMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (ev) => {
            const href = a.getAttribute('href');
            // Logout handler
            if (a.id === 'menu-logout') {
                ev.preventDefault();
                navMenu.style.display = 'none';
                const navToggle = document.getElementById('nav-menu-toggle');
                if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
                logoutUser();
                return;
            }

            // If the link points to tracker/analytics/schedule/leaderboard/quizzes/achievements/forums/profile, require auth
            const protectedPages = ['tracker.html', 'analytics.html', 'schedule.html', 'leaderboard.html', 'quizzes.html', 'achievements.html', 'forums.html', 'profile.html'];
            if (href && protectedPages.some(p => href.includes(p)) && !isAuthenticated()) {
                ev.preventDefault();
                navMenu.style.display = 'none';
                requireAuth(href);
                return;
            }

            // Allow normal navigation but close menu
            navMenu.style.display = 'none';
            const navToggle = document.getElementById('nav-menu-toggle');
            if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

function updateAuthArea() {
    const authArea = document.getElementById('auth-area') || document.getElementById('auth-section-guest');
    if (!authArea) return;

    const user = getAuthUser();
    if (user) {
        authArea.innerHTML = `<span id="user-greeting">Hi, ${escapeHtml(user.name || 'User')}</span>`;
    } else {
        authArea.innerHTML = `<a class="btn" href="login.html">Login</a><a class="btn brand" href="signup.html">Sign up</a>`;
    }
}

// Click-away handler: close nav menu when clicking outside
document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-menu-toggle');
    if (!navMenu || !navToggle) return;
    if (!navMenu.contains(e.target) && e.target !== navToggle) {
        navMenu.style.display = 'none';
        navToggle.setAttribute('aria-expanded', 'false');
    }
});

// Initialize menu and auth area on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try { updateAuthArea(); } catch (e) { /* ignore */ }
    try { populateNavMenu(); } catch (e) { /* ignore */ }

    const navToggle = document.getElementById('nav-menu-toggle');
    if (navToggle) navToggle.addEventListener('click', (ev) => { ev.stopPropagation(); toggleNavMenu(); });

});


// NEW: Function to suggest courses based on input
function suggestCourses(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const courseCards = document.querySelectorAll('.grid.courses .card');

    if (term.length === 0) {
        // Show all courses if search is empty
        courseCards.forEach(card => card.style.display = 'block');
        return;
    }

    // Filter course cards by matching h3 text or data attributes
    courseCards.forEach(card => {
        const courseTitle = card.querySelector('h3').textContent.toLowerCase();
        const courseDescription = card.querySelector('p').textContent.toLowerCase();
        const matches = courseTitle.includes(term) || courseDescription.includes(term);
        card.style.display = matches ? 'block' : 'none';
    });
}

// script.js

// Function to toggle the mobile navigation menu
function toggleMobileNav() {
    const navLinks = document.getElementById('mobile-nav-links');
    // Toggle the class that makes the links visible
    navLinks.classList.toggle('show-mobile-nav');
}

// ... rest of your script.js logic ...

// Persistent nav menu toggle (hamburger)
function toggleNavMenu() {
    const navMenu = document.getElementById('nav-menu');
    const navToggleBtn = document.getElementById('nav-menu-toggle');
    if (!navMenu || !navToggleBtn) return;
    const isOpen = navMenu.style.display === 'block';
    navMenu.style.display = isOpen ? 'none' : 'block';
    navToggleBtn.setAttribute('aria-expanded', String(!isOpen));
}

// (Nav click-away and DOM ready handlers consolidated earlier)