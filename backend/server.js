require('dotenv').config();

const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const { clean: xssClean } = require('xss-clean/lib/xss');
const hpp = require('hpp');
const csurf = require('csurf');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matchRoutes');
const messageRoutes = require('./routes/messageRoutes');
const friendRoutes = require('./routes/friendRoutes');
const faceRoutes = require('./routes/faceRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const eventRoutes = require('./routes/eventRoutes');
const communityRoutes = require('./routes/communityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorHandler');
const Message = require('./models/Message');
const Match = require('./models/Match');

const app = express();
app.set('trust proxy', 1);
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const mutateObject = (target, source) => {
  if (!target || !source || typeof source !== 'object') {
    return source;
  }

  Object.keys(target).forEach((key) => {
    if (!(key in source)) {
      delete target[key];
    }
  });

  Object.assign(target, source);
  return target;
};

// Express 5 exposes req.query as a getter, so sanitize every payload in place instead of reassigning.
const sanitizeRequestPayload = (req, _res, next) => {
  ['body', 'params', 'query'].forEach((key) => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key]);
      const cleaned = xssClean(req[key]);
      if (typeof cleaned === 'object' && cleaned !== null) {
        mutateObject(req[key], cleaned);
      } else {
        req[key] = cleaned;
      }
    }
  });
  next();
};

app.use(sanitizeRequestPayload);
app.use(hpp());
app.use(passport.initialize());

const csrfProtection = csurf({
  cookie: {
    key: 'csrfSecret',
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction
  }
});

app.use(csrfProtection);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'AfroMatchmaker API is running' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, _res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length === 0 ? '*' : allowedOrigins,
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Socket client connected', socket.id);

  socket.on('joinConversation', ({ conversationId }) => {
    if (conversationId) {
      socket.join(conversationId);
    }
  });

  socket.on('sendMessage', async ({ conversationId, senderId, recipientId, body }) => {
    if (!conversationId || !senderId || !recipientId || !body) {
      return;
    }

    try {
      const match = await Match.findOne({ conversationId, participants: senderId });
      if (!match) {
        return socket.emit('messageError', { message: 'Conversation not found.' });
      }

      const message = await Message.create({
        conversationId,
        sender: senderId,
        recipient: recipientId,
        body
      });

      match.lastMessageAt = message.createdAt;
      await match.save();

      io.to(conversationId).emit('messageCreated', message);
    } catch (error) {
      console.error('Socket sendMessage error:', error);
      socket.emit('messageError', { message: 'Unable to send message.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected', socket.id);
  });
});

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server start failure:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
