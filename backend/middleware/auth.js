const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin with project ID for token verification
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'get-it-done-3174a';
  initializeApp({
    projectId: projectId,
  });
}

const auth = getAuth();

/**
 * Express middleware to verify Firebase ID token and attach user data
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token missing or invalid',
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email ? decodedToken.email.toLowerCase().trim() : '';
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token',
      details: error.message,
    });
  }
}

module.exports = {
  auth,
  requireAuth,
};
