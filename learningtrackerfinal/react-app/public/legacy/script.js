// script.js
const STORAGE_KEY = 'trackWiseCourses';
let courseData = [];
const AUTH_KEY = 'trackWiseAuthUser';
const API_BASE = 'http://localhost:3000/api';
const DEADLINE_NOTIFICATION_WINDOW_DAYS = 3;
const DEADLINE_NOTIFY_KEY = 'trackWiseDeadlineNotifications';

/* --- COURSE LINKING (courses.html to tracker.html) --- */
const COURSE_RESOURCE_TEMPLATES = {
  'javascript essentials': [
    { title: 'Page 1: JavaScript Basics', content: 'Learn JavaScript syntax, variables, and basic control flow to build your first programs.' },
    { title: 'Page 2: Functions and Scope', content: 'Explore function declarations, arrow functions, and how JavaScript scope works.' },
    { title: 'Page 3: Objects and Arrays', content: 'Understand objects, arrays, and how to manipulate collections of data.' },
    { title: 'Page 4: Asynchronous JavaScript', content: 'Work with callbacks, promises, and async/await for non-blocking code.' },
    { title: 'Page 5: Practical Exercises', content: 'Practice your new skills with short exercises and code examples.' }
  ],
  'data structures and algorithms': [
    { title: 'Page 1: Arrays and Linked Lists', content: 'Learn about arrays and linked lists, including how to store, traverse, and manipulate them.' },
    { title: 'Page 2: Stacks and Queues', content: 'Study stack and queue operations and their common real-world use cases.' },
    { title: 'Page 3: Trees and Graphs', content: 'Explore tree traversal and the basics of graphs and graph search.' },
    { title: 'Page 4: Sorting and Searching', content: 'Compare sorting algorithms like merge sort and quick sort, plus efficient search techniques.' },
    { title: 'Page 5: Problem Solving', content: 'Practice algorithmic thinking with sample problems and strategy tips.' }
  ],
  'react basics': [
    { title: 'Page 1: React Components', content: 'Learn how to build components using JSX, props, and composition.' },
    { title: 'Page 2: State and Events', content: 'Manage state in functional components and respond to user interactions.' },
    { title: 'Page 3: Effects and Lifecycle', content: 'Use useEffect and understand when component updates happen.' },
    { title: 'Page 4: Routing and Navigation', content: 'Build multi-page experiences using React routing and navigation patterns.' },
    { title: 'Page 5: Project Practice', content: 'Assemble a small React app using the concepts learned so far.' }
  ],
  'database management system': [
    { title: 'Page 1: Database Fundamentals', content: 'Understand relational databases, tables, and how data is structured.' },
    { title: 'Page 2: SQL Basics', content: 'Learn SELECT, INSERT, UPDATE, and DELETE with simple SQL examples.' },
    { title: 'Page 3: Normalization', content: 'Explore normalization rules and how to design clean database schemas.' },
    { title: 'Page 4: Indexing and Performance', content: 'Learn how indexes speed up queries and when to use them.' },
    { title: 'Page 5: Backup and Security', content: 'Discover practical strategies for database backup and access control.' }
  ],
  'certification prep': [
    { title: 'Page 1: Exam Overview', content: 'Get familiar with the certificate objectives and exam format.' },
    { title: 'Page 2: Core Concepts', content: 'Review the essential concepts that appear most often on the exam.' },
    { title: 'Page 3: Practice Questions', content: 'Work through sample questions and learn how to read them effectively.' },
    { title: 'Page 4: Troubleshooting Skills', content: 'Study common problem-solving techniques and exam tips.' },
    { title: 'Page 5: Final Review', content: 'Use this checklist to prep and build confidence before exam day.' }
  ],
  'review': [
    { title: 'Page 1: Summary of Concepts', content: 'Review the main topics you have learned so far and refresh your memory.' },
    { title: 'Page 2: Key Exercises', content: 'Practice the most important exercises again to reinforce learning.' },
    { title: 'Page 3: Common Mistakes', content: 'Learn the common mistakes students make and how to avoid them.' },
    { title: 'Page 4: Improvement Plan', content: 'Create a simple plan for what to study next based on your progress.' },
    { title: 'Page 5: Final Reflection', content: 'Reflect on your learning journey and set goals for the next step.' }
  ]
};

const normalizeCourseName = (name) => String(name || '').trim().toLowerCase();

const COURSE_NAME_ALIASES = {
  'dbms': 'database management system',
  'database management': 'database management system',
  'react': 'react basics',
  'reactjs': 'react basics',
  'ds and algorithms': 'data structures and algorithms',
  'data structures & algorithms': 'data structures and algorithms'
};

const resolveCourseTemplateKey = (name) => {
  const normalized = normalizeCourseName(name);
  if (COURSE_RESOURCE_TEMPLATES[normalized]) return normalized;
  if (COURSE_NAME_ALIASES[normalized]) return COURSE_NAME_ALIASES[normalized];
  const cleaned = normalized.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (COURSE_RESOURCE_TEMPLATES[cleaned]) return cleaned;
  return normalized;
};

const getCourseTemplateResources = (name) => {
  const key = resolveCourseTemplateKey(name);
  return COURSE_RESOURCE_TEMPLATES[key] || [];
};

function addCourseFromCourses(courseName) {
  startCourseFromCourses(courseName);
}

function startCourseFromCourses(courseName) {
  if (!isAuthenticated()) {
    alert('Please login to start this course.');
    requireAuth('/courses');
    return;
  }

  const confirmed = confirm(`Do you want to start "${courseName}" and add it to your tracker?`);
  if (!confirmed) return;

  sessionStorage.setItem('selectedCourse', courseName);
  sessionStorage.setItem('autoOpenResources', 'true');
  window.location.href = '/tracker';
}

async function startOrOpenCourseInTracker(courseName) {
  const normalized = normalizeCourseName(courseName);
  let course = courseData.find(c => normalizeCourseName(c.name) === normalized);

  const templateResources = getCourseTemplateResources(courseName).map((resource, index) => ({
    ...resource,
    id: index + 1,
    completed: false
  }));

  if (!course) {
    const newCourse = {
      name: courseName,
      progress: templateResources.length ? 0 : 0,
      isCompleted: false,
      category: 'General',
      difficulty: 'medium',
      hoursLogged: 0,
      streak: 0,
      lastStudied: new Date().toISOString(),
      deadline: null,
      notes: [],
      timerActive: false,
      timerSeconds: 0,
      owner: getAuthUser().email,
      resources: templateResources,
      currentResourceIndex: 0
    };

    try {
      const created = await apiCreateItem(newCourse);
      courseData.push(created);
      course = created;
    } catch (e) {
      courseData.push(newCourse);
      course = newCourse;
    }

    saveTracker();
    renderTracker();
  } else {
    if ((!course.resources || course.resources.length === 0) && templateResources.length > 0) {
      course.resources = templateResources;
      course.progress = 0;
      course.isCompleted = false;
      course.currentResourceIndex = 0;
      saveTracker();
      (async () => {
        try { await apiUpdateItem(course.id, course); } catch (e) { /* ignore */ }
      })();
      renderTracker();
    }
  }

  if (course) {
    document.querySelector('#courseName').value = course.name;
    renderTracker();
    viewResources(course.id);
  }
}

async function handleAutoOpenResources() {
  const selectedCourse = sessionStorage.getItem('selectedCourse');
  const shouldOpen = sessionStorage.getItem('autoOpenResources') === 'true';
  if (!selectedCourse || !shouldOpen) return;

  sessionStorage.removeItem('selectedCourse');
  sessionStorage.removeItem('autoOpenResources');
  await startOrOpenCourseInTracker(selectedCourse);
}

// On tracker page load, check for selectedCourse and pre-fill the form
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

async function apiGetUsers() {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Could not fetch users');
    return res.json();
}

async function apiCreateUser(userPayload) {
    const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload)
    });
    if (!res.ok) {
        const err = new Error('Could not create user');
        err.status = res.status;
        throw err;
    }
    return res.json();
}

async function apiListItems() {
    const user = getAuthUser();
    if (!user || !user.email) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/items?user=${encodeURIComponent(user.email)}`);
    if (!res.ok) throw new Error('Could not fetch items');
    return res.json();
}

async function apiCreateItem(itemPayload) {
    const user = getAuthUser();
    if (!user || !user.email) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemPayload, owner: user.email })
    });
    if (!res.ok) throw new Error('Could not create item');
    return res.json();
}

async function apiUpdateItem(id, itemPayload) {
    const user = getAuthUser();
    if (!user || !user.email) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemPayload, owner: user.email })
    });
    if (!res.ok) throw new Error('Could not update item');
    return res.json();
}

async function apiDeleteItem(id) {
    const user = getAuthUser();
    if (!user || !user.email) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/items/${id}?user=${encodeURIComponent(user.email)}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Could not delete item');
    return res.json();
}

function getDeadlineNotifyState() {
    try {
        return JSON.parse(localStorage.getItem(DEADLINE_NOTIFY_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

function saveDeadlineNotifyState(state) {
    localStorage.setItem(DEADLINE_NOTIFY_KEY, JSON.stringify(state));
}

function toDateOnly(dateInput) {
    if (!dateInput) return null;
    const value = String(dateInput).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntilDate(deadlineInput) {
    const deadlineDate = toDateOnly(deadlineInput);
    if (!deadlineDate) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

async function sendDeadlineNotification(title, body) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
            return true;
        }
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, { body });
            } else {
                alert(`${title}\n${body}`);
            }
            return true;
        }
    }
    alert(`${title}\n${body}`);
    return true;
}

async function checkDeadlineNotifications() {
    if (!Array.isArray(courseData) || courseData.length === 0) return;

    const state = getDeadlineNotifyState();
    const todayKey = new Date().toISOString().slice(0, 10);
    let changed = false;

    for (const course of courseData) {
        if (!course || !course.name || !course.deadline) continue;
        if (course.isCompleted) continue;

        const daysLeft = daysUntilDate(course.deadline);
        if (daysLeft === null) continue;

        const courseKey = String(course.id || course.name);
        const eventType = daysLeft < 0 ? 'overdue' : 'near';
        if (daysLeft > DEADLINE_NOTIFICATION_WINDOW_DAYS) continue;

        const notifyKey = `${courseKey}:${eventType}:${String(course.deadline)}:${todayKey}`;
        if (state[notifyKey]) continue;

        const title = daysLeft < 0 ? 'Deadline overdue' : 'Deadline reminder';
        const body = daysLeft < 0
            ? `"${course.name}" was due ${Math.abs(daysLeft)} day(s) ago.`
            : `"${course.name}" is due in ${daysLeft} day(s).`;

        const shown = await sendDeadlineNotification(title, body);
        if (shown) {
            state[notifyKey] = true;
            changed = true;
        }
    }

    if (changed) saveDeadlineNotifyState(state);
}

// When an action requires authentication, redirect to login with a next URL
function requireAuth(nextUrl) {
    if (isAuthenticated()) {
        // Already authenticated — go to next
        window.location.href = nextUrl;
        return;
    }
    alert('Login is required to continue.');
    // encode nextUrl so it survives in the query string
    window.location.href = `/login?next=${encodeURIComponent(nextUrl)}`;
}

// Login form submit handler (used by login.html)
async function loginSubmit(event) {
    event.preventDefault();
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    const email = form.elements['email'].value.trim().toLowerCase();
    const password = form.elements['password'].value;

    if (!email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    const localUsers = getUsers();
    let user = localUsers.find(u => u.email.toLowerCase() === email && u.password === password);
    if (!user) {
        try {
            const remoteUsers = await apiGetUsers();
            user = (Array.isArray(remoteUsers) ? remoteUsers : []).find(
                (u) => String(u.email || '').toLowerCase() === email && u.password === password
            );
            // Keep local cache synced for smoother offline/refresh experience.
            if (user && !localUsers.find((u) => String(u.email || '').toLowerCase() === email)) {
                saveUsers([...localUsers, user]);
            }
        } catch (e) {
            // Backend may be down; continue using local-only auth fallback.
        }
    }
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
        window.location.href = '/';
    }
}

// Signup submit handler (used by signup.html)
async function signupSubmit(event) {
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
        window.location.href = '/login';
        return;
    }

    const newUser = { name, email, phone, password };

    try {
        await apiCreateUser(newUser);
    } catch (e) {
        if (e && e.status === 409) {
            alert('An account with this email already exists. Please login instead.');
            window.location.href = '/login';
            return;
        }
        // If backend is unavailable, continue with local signup.
    }

    users.push(newUser);
    saveUsers(users);
    setAuthUser(newUser);
    
    // Show success message
    alert(`Welcome ${name}! Account created successfully. You are now logged in.`);
    
    // Redirect to next if present, otherwise home
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next) {
        window.location.href = decodeURIComponent(next);
    } else {
        window.location.href = '/';
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

function getCurrentResourceIndex(course, requestedIndex) {
    if (!course || !course.resources || course.resources.length === 0) return -1;
    const maxIndex = course.resources.length - 1;
    if (typeof requestedIndex === 'number') {
        return Math.max(0, Math.min(requestedIndex, maxIndex));
    }
    const nextPending = course.resources.findIndex(r => !r.completed);
    return nextPending !== -1 ? nextPending : 0;
}

function persistCourse(course) {
    if (!course) return;
    if (course.id) {
        (async () => {
            try { await apiUpdateItem(course.id, course); } catch (e) { /* ignore */ }
        })();
    }
    saveTracker();
    renderTracker();
}

function ensureCourseResources(course) {
    if (!course) return course;
    if (course.resources && course.resources.length > 0) return course;

    const templateResources = getCourseTemplateResources(course.name).map((resource, index) => ({
        ...resource,
        id: index + 1,
        completed: false
    }));

    if (templateResources.length === 0) return course;

    course.resources = templateResources;
    course.progress = 0;
    course.isCompleted = false;
    course.currentResourceIndex = 0;
    persistCourse(course);
    return course;
}

function viewResources(courseId, requestedIndex) {
    let course = courseData.find(c => c.id == courseId);
    if (!course) {
        alert('No course found.');
        return;
    }

    course = ensureCourseResources(course);
    if (!course.resources || course.resources.length === 0) {
        alert('No resources available for this course.');
        return;
    }

    const index = getCurrentResourceIndex(course, requestedIndex);
    const resource = course.resources[index];
    if (!resource) return;
    course.currentResourceIndex = index;

    const completedCount = course.resources.filter(r => r.completed).length;
    const totalCount = course.resources.length;
    const progress = Math.round((completedCount / totalCount) * 100);
    course.progress = progress;
    course.isCompleted = progress === 100;

    let content = `<h3>${course.name}</h3>`;
    content += `<div style="font-size:13px;color:var(--muted);margin-bottom:10px">Page ${index + 1} of ${totalCount}</div>`;
    content += `
        <div style="margin-bottom:20px;padding:14px;border:1px solid var(--border);border-radius:10px;background:var(--panel);">
            <h4 style="margin:0 0 8px">${resource.title}</h4>
            <p style="margin:0 0 14px;line-height:1.6">${resource.content}</p>
            <p style="margin:0;font-size:13px;color:var(--muted)"><strong>Status:</strong> ${resource.completed ? '✅ Completed' : '⏳ In progress'}</p>
        </div>
    `;
    content += `<div style="display:flex;flex-wrap:wrap;gap:8px">`;
    if (index > 0) {
        content += `<button class="btn" onclick="changeResourcePage(${course.id}, -1)">Previous Page</button>`;
    }
    if (index < totalCount - 1) {
        content += `<button class="btn" onclick="changeResourcePage(${course.id}, 1)">Next Page</button>`;
    }
    if (!resource.completed) {
        content += `<button class="btn brand" onclick="markResourceCompleted(${course.id}, ${resource.id})">Mark Page Complete</button>`;
    }
    content += `<button class="btn" onclick="closeModal()">Close</button>`;
    content += '</div>';

    showModal(content);
}

function changeResourcePage(courseId, step) {
    const course = courseData.find(c => c.id == courseId);
    if (!course || !course.resources) return;
    const currentIndex = getCurrentResourceIndex(course, course.currentResourceIndex);
    const nextIndex = currentIndex + step;
    if (nextIndex < 0 || nextIndex >= course.resources.length) return;
    viewResources(courseId, nextIndex);
}

function markResourceCompleted(courseId, resourceId) {
    const course = courseData.find(c => c.id == courseId);
    if (!course || !course.resources) return;
    const resource = course.resources.find(r => r.id == resourceId);
    if (!resource) return;

    resource.completed = true;
    course.currentResourceIndex = getCurrentResourceIndex(course, course.currentResourceIndex + 1);
    const completedCount = course.resources.filter(r => r.completed).length;
    course.progress = Math.round((completedCount / course.resources.length) * 100);
    course.isCompleted = course.progress === 100;

    persistCourse(course);
    viewResources(courseId, course.currentResourceIndex);
}

/* --- TRACKER & LOCAL STORAGE --- */

const saveTracker = () => {
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
    try {
        const items = await apiListItems();
        courseData = Array.isArray(items) ? items : [];
    } catch (e) {
        courseData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }
    saveTracker();
    renderTracker();
    checkDeadlineNotifications();
}

async function initializeTrackerPage() {
    autoPopulateCourseFromSelection();
    await loadTracker();
    await handleAutoOpenResources();
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

    const templateResources = getCourseTemplateResources(name).map((resource, index) => ({
        ...resource,
        id: index + 1,
        completed: false
    }));

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
        timerSeconds: 0,
        owner: (getAuthUser() && getAuthUser().email) || null,
        resources: templateResources.length > 0 ? templateResources : undefined,
        currentResourceIndex: templateResources.length > 0 ? 0 : undefined
    };
    try {
        const created = await apiCreateItem(newCourse);
        courseData.push(created);
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

async function removeCourseRow(buttonElement) {
    const row = buttonElement.closest('tr');
    const name = row.dataset.courseName; 
    
    const course = courseData.find(c => c.name === name);
    if (!course) return;
    if (course.id) {
        try { await apiDeleteItem(course.id); } catch (e) { /* fallback to local remove */ }
    }
    courseData = courseData.filter((c) => c.name !== name);
    
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
    
    saveTracker();
    renderTracker();
}

async function logStudyTime(buttonElement) {
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
    
    if (course.id) {
        try { await apiUpdateItem(course.id, course); } catch (e) { /* fallback local */ }
    }
    saveTracker();
    renderTracker();
}

async function editCourse(buttonElement) {
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
    
    if (course.id) {
        try { await apiUpdateItem(course.id, course); } catch (e) { /* fallback local */ }
    }
    saveTracker();
    renderTracker();
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
    const target = `/payment?plan=${encodeURIComponent(planName)}`;
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

function initRouteFeatures() {
    if (document.querySelector('#track-rows')) {
        loadTracker();
    } else {
        // Still check reminders on non-tracker pages using cached data.
        loadCourseData();
        checkDeadlineNotifications();
    }

    setupScrollAnimations();
    try { initStatsAnimation(); } catch (e) { /* ignore */ }

    // Intercept tracker CTA links and guard with auth.
    document.querySelectorAll('a.btn.brand').forEach(a => {
        try {
            const href = a.getAttribute('href');
            if (!href || !href.includes('/tracker')) return;
            if (a.dataset.authBound === 'true') return;
            a.dataset.authBound = 'true';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                requireAuth(href);
            });
        } catch (e) {
            // ignore
        }
    });
}

// Logout handler
function logoutUser() {
    clearAuthUser();
    alert('You have been logged out.');
    window.location.href = '/';
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
        { text: 'Home', href: '/' },
        { text: 'Courses', href: '/courses' },
        { text: 'Contact', href: '/contact' },
        { text: 'Payment', href: '/payment' },
        { text: '─────────────', href: '#' },
        { text: '📊 Tracker', href: '/tracker' },
        { text: '📈 Analytics', href: '/analytics' },
        { text: '📅 Schedule', href: '/schedule' },
        { text: '🏆 Leaderboard', href: '/leaderboard' },
        { text: '✍️ Quizzes', href: '/quizzes' },
        { text: '📚 Resources', href: '/resources' },
        { text: '🏆 Achievements', href: '/achievements' },
        { text: '💬 Forums', href: '/forums' },
        { text: '👤 Profile', href: '/profile' }
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
            const protectedPages = ['/tracker', '/analytics', '/schedule', '/leaderboard', '/quizzes', '/achievements', '/forums', '/profile'];
            if (href && protectedPages.some(p => href.startsWith(p)) && !isAuthenticated()) {
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
        authArea.innerHTML = `<a class="btn" href="/login">Login</a><a class="btn brand" href="/signup">Sign up</a>`;
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
    try { initRouteFeatures(); } catch (e) { /* ignore */ }
    try { updateAuthArea(); } catch (e) { /* ignore */ }
    try { populateNavMenu(); } catch (e) { /* ignore */ }

    const navToggle = document.getElementById('nav-menu-toggle');
    if (navToggle && navToggle.dataset.bound !== 'true') {
        navToggle.dataset.bound = 'true';
        navToggle.addEventListener('click', (ev) => { ev.stopPropagation(); toggleNavMenu(); });
    }

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