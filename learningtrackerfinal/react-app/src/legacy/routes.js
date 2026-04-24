import achievementsHtml from './pages/achievements.html?raw';
import analyticsHtml from './pages/analytics.html?raw';
import contactHtml from './pages/contact.html?raw';
import coursesHtml from './pages/courses.html?raw';
import forumsHtml from './pages/forums.html?raw';
import indexHtml from './pages/index.html?raw';
import leaderboardHtml from './pages/leaderboard.html?raw';
import loginHtml from './pages/login.html?raw';
import paymentHtml from './pages/payment.html?raw';
import profileHtml from './pages/profile.html?raw';
import quizzesHtml from './pages/quizzes.html?raw';
import resourcesHtml from './pages/resources.html?raw';
import scheduleHtml from './pages/schedule.html?raw';
import signupHtml from './pages/signup.html?raw';
import trackerHtml from './pages/tracker.html?raw';

export const legacyRoutes = [
  { path: '/', html: indexHtml, title: 'TrackWise — Learn. Track. Grow.' },
  { path: '/achievements', html: achievementsHtml, title: 'Achievements — TrackWise' },
  { path: '/analytics', html: analyticsHtml, title: 'Analytics — TrackWise' },
  { path: '/contact', html: contactHtml, title: 'Contact — TrackWise' },
  { path: '/courses', html: coursesHtml, title: 'Courses — TrackWise' },
  { path: '/forums', html: forumsHtml, title: 'Forums — TrackWise' },
  { path: '/leaderboard', html: leaderboardHtml, title: 'Leaderboard — TrackWise' },
  { path: '/login', html: loginHtml, title: 'Login — TrackWise' },
  { path: '/payment', html: paymentHtml, title: 'Plans — TrackWise' },
  { path: '/profile', html: profileHtml, title: 'Profile — TrackWise' },
  { path: '/quizzes', html: quizzesHtml, title: 'Quizzes — TrackWise' },
  { path: '/resources', html: resourcesHtml, title: 'Resources — TrackWise' },
  { path: '/schedule', html: scheduleHtml, title: 'Schedule — TrackWise' },
  { path: '/signup', html: signupHtml, title: 'Sign up — TrackWise' },
  { path: '/tracker', html: trackerHtml, title: 'Tracker — TrackWise' },
];

