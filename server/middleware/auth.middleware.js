// server\middleware\auth.middleware.js
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.',
                tokenExpired: true
            });
        }

        // Verify token validity
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
            return res.status(401).json({ 
                message: 'Token expired',
                tokenExpired: true
            });
        }
        
        req.user = payload;
        next();
    } catch (error) {
        // Distinguish between expired tokens and other errors
        if (error.message.includes('Token expired')) {
            return res.status(401).json({ 
                message: 'Token expired',
                tokenExpired: true
            });
        }
        
        res.status(401).json({ 
            message: 'Invalid token',
            tokenExpired: true
        });
    }
};

export default auth;