const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Make io globally available for real-time updates
global.io = io;

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dreamlive';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// MongoDB Schemas
const matchSchema = new mongoose.Schema({
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['live', 'upcoming', 'completed'], default: 'upcoming' },
  venue: String,
  imageUrl: String,
  league: { type: String, required: true },
  team1Logo: String,
  team2Logo: String,
  players: {
    team1: { type: [String], default: [] },
    team2: { type: [String], default: [] }
  },
  teamStats: {
    team1: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 }
    },
    team2: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 }
    }
  }
}, { timestamps: true });

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  season: { type: String, required: true },
  logoUrl: String,
  matchCount: { type: Number, default: 0 }
}, { timestamps: true });

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  videoId: { type: String, required: true },
  thumbnailUrl: String,
  duration: String,
  category: { type: String, enum: ['Sport', 'Podcast', 'TV Show', 'Other'], default: 'Other' },
  views: { type: Number, default: 0 },
  uploadDate: { type: Date, default: Date.now }
}, { timestamps: true });

const highlightSchema = new mongoose.Schema({
  title: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  videoId: { type: String, required: true },
  thumbnailUrl: String,
  duration: String,
  category: { type: String, default: 'Sports' },
  sport: { type: String, required: true },
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  uploadDate: { type: Date, default: Date.now }
}, { timestamps: true });

const featuredContentSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'match'], default: 'video' },
  videoId: String,
  title: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

const featuredImageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  dateLabel: { type: String, required: true },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

// Categories schema (used by frontend for content categorization)
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#522e8e' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Admin schema for authentication
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  firstName: String,
  lastName: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Models
const Match = mongoose.model('Match', matchSchema);
const League = mongoose.model('League', leagueSchema);
const Video = mongoose.model('Video', videoSchema);
const Highlight = mongoose.model('Highlight', highlightSchema);
const FeaturedContent = mongoose.model('FeaturedContent', featuredContentSchema);
const FeaturedImage = mongoose.model('FeaturedImage', featuredImageSchema);
const Category = mongoose.model('Category', categorySchema);
const Admin = mongoose.model('Admin', adminSchema);
const { PointsTable } = require('./lib/mongodb');

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Broadcast function for real-time updates
const broadcastUpdate = (type, action, data) => {
  io.emit('dreamlive-update', {
    type,
    action,
    data,
    timestamp: Date.now()
  });
  console.log(`📡 Broadcasting ${type} ${action} update`);
};

// Health check endpoint (first route)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    server: 'Dream Live API Server',
    platform: 'Node.js',
    version: '1.0.0'
  });
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Admin role middleware
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Admin Authentication Routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase(), active: true });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: admin.role 
      },
      process.env.JWT_SECRET || 'your-fallback-secret',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Admin login successful:', admin.email);
    
    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName
      }
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/admin/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'admin' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({ error: 'Admin account already exists' });
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create new admin
    const admin = new Admin({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: ['admin', 'superadmin'].includes(role) ? role : 'admin'
    });
    
    await admin.save();
    
    console.log('✅ Admin registered:', admin.email);
    
    res.status(201).json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName
      }
    });
  } catch (error) {
    console.error('❌ Admin registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/admin/me', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-passwordHash');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json({
      id: admin._id,
      email: admin.email,
      role: admin.role,
      firstName: admin.firstName,
      lastName: admin.lastName
    });
  } catch (error) {
    console.error('❌ Error fetching admin profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  // Since we're using stateless JWT, logout is handled client-side
  console.log('✅ Admin logout requested');
  res.json({ success: true, message: 'Logged out successfully' });
});

// API Routes

// Matches API
app.get('/api/matches', async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 });
    console.log(`📊 Fetched ${matches.length} matches`);
    res.json(matches);
  } catch (error) {
    console.error('❌ Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.get('/api/matches/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    console.error('❌ Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

app.post('/api/matches', async (req, res) => {
  try {
    const match = new Match(req.body);
    await match.save();
    
    // Update league match count
    if (match.league) {
      await League.updateOne(
        { name: match.league },
        { $inc: { matchCount: 1 } },
        { upsert: true }
      );
    }
    
    broadcastUpdate('match', 'create', match);
    console.log('✅ Match created:', match.team1, 'vs', match.team2);
    res.status(201).json(match);
  } catch (error) {
    console.error('❌ Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

app.put('/api/matches/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    broadcastUpdate('match', 'update', match);
    console.log('✅ Match updated:', match.team1, 'vs', match.team2);
    res.json(match);
  } catch (error) {
    console.error('❌ Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

app.delete('/api/matches/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Update league match count
    if (match.league) {
      await League.updateOne(
        { name: match.league },
        { $inc: { matchCount: -1 } }
      );
    }
    
    broadcastUpdate('match', 'delete', { id: req.params.id });
    console.log('✅ Match deleted:', match.team1, 'vs', match.team2);
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Leagues API
app.get('/api/leagues', async (req, res) => {
  try {
    const leagues = await League.find().sort({ createdAt: -1 });
    console.log(`📊 Fetched ${leagues.length} leagues`);
    res.json(leagues);
  } catch (error) {
    console.error('❌ Error fetching leagues:', error);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

app.get('/api/leagues/:id', async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    res.json(league);
  } catch (error) {
    console.error('❌ Error fetching league:', error);
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

app.get('/api/leagues/:id/matches', async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    
    const matches = await Match.find({ league: league.name }).sort({ date: 1, time: 1 });
    
    res.json({
      leagueName: league.name,
      matches
    });
  } catch (error) {
    console.error('❌ Error fetching league matches:', error);
    res.status(500).json({ error: 'Failed to fetch league matches' });
  }
});

app.post('/api/leagues', async (req, res) => {
  try {
    const league = new League(req.body);
    await league.save();
    
    broadcastUpdate('league', 'create', league);
    console.log('✅ League created:', league.name);
    res.status(201).json(league);
  } catch (error) {
    console.error('❌ Error creating league:', error);
    res.status(500).json({ error: 'Failed to create league' });
  }
});

app.put('/api/leagues/:id', async (req, res) => {
  try {
    const league = await League.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    
    broadcastUpdate('league', 'update', league);
    console.log('✅ League updated:', league.name);
    res.json(league);
  } catch (error) {
    console.error('❌ Error updating league:', error);
    res.status(500).json({ error: 'Failed to update league' });
  }
});

app.delete('/api/leagues/:id', async (req, res) => {
  try {
    console.log('🗑️ Attempting to delete league:', req.params.id);
    const league = await League.findByIdAndDelete(req.params.id);
    
    if (!league) {
      console.log('❌ League not found:', req.params.id);
      return res.status(404).json({ error: 'League not found' });
    }
    
    broadcastUpdate('league', 'delete', { id: req.params.id });
    console.log('✅ League deleted:', league.name);
    res.json({ message: 'League deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting league:', error);
    res.status(500).json({ error: 'Failed to delete league' });
  }
});

// Videos API
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    console.log(`📊 Fetched ${videos.length} videos`);
    res.json(videos);
  } catch (error) {
    console.error('❌ Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Increment view count
    video.views = (video.views || 0) + 1;
    await video.save();
    
    res.json(video);
  } catch (error) {
    console.error('❌ Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const videoData = {
      ...req.body,
      thumbnailUrl: req.body.thumbnailUrl || `https://img.youtube.com/vi/${req.body.videoId}/maxresdefault.jpg`
    };
    
    const video = new Video(videoData);
    await video.save();
    
    broadcastUpdate('video', 'create', video);
    console.log('✅ Video created:', video.title);
    res.status(201).json(video);
  } catch (error) {
    console.error('❌ Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

app.put('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    broadcastUpdate('video', 'update', video);
    console.log('✅ Video updated:', video.title);
    res.json(video);
  } catch (error) {
    console.error('❌ Error updating video:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    console.log('🗑️ Attempting to delete video:', req.params.id);
    const video = await Video.findByIdAndDelete(req.params.id);
    
    if (!video) {
      console.log('❌ Video not found:', req.params.id);
      return res.status(404).json({ error: 'Video not found' });
    }
    
    broadcastUpdate('video', 'delete', { id: req.params.id });
    console.log('✅ Video deleted:', video.title);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Highlights API
app.get('/api/highlights', async (req, res) => {
  try {
    const highlights = await Highlight.find().sort({ featured: -1, createdAt: -1 });
    console.log(`📊 Fetched ${highlights.length} highlights`);
    res.json(highlights);
  } catch (error) {
    console.error('❌ Error fetching highlights:', error);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

app.get('/api/highlights/:id', async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }
    
    // Increment view count
    highlight.views = (highlight.views || 0) + 1;
    await highlight.save();
    
    res.json(highlight);
  } catch (error) {
    console.error('❌ Error fetching highlight:', error);
    res.status(500).json({ error: 'Failed to fetch highlight' });
  }
});

app.post('/api/highlights', async (req, res) => {
  try {
    const highlightData = {
      ...req.body,
      thumbnailUrl: req.body.thumbnailUrl || `https://img.youtube.com/vi/${req.body.videoId}/maxresdefault.jpg`
    };
    
    const highlight = new Highlight(highlightData);
    await highlight.save();
    
    broadcastUpdate('highlight', 'create', highlight);
    console.log('✅ Highlight created:', highlight.title);
    res.status(201).json(highlight);
  } catch (error) {
    console.error('❌ Error creating highlight:', error);
    res.status(500).json({ error: 'Failed to create highlight' });
  }
});

app.put('/api/highlights/:id', async (req, res) => {
  try {
    const highlight = await Highlight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }
    
    broadcastUpdate('highlight', 'update', highlight);
    console.log('✅ Highlight updated:', highlight.title);
    res.json(highlight);
  } catch (error) {
    console.error('❌ Error updating highlight:', error);
    res.status(500).json({ error: 'Failed to update highlight' });
  }
});

app.delete('/api/highlights/:id', async (req, res) => {
  try {
    console.log('🗑️ Attempting to delete highlight:', req.params.id);
    const highlight = await Highlight.findByIdAndDelete(req.params.id);
    
    if (!highlight) {
      console.log('❌ Highlight not found:', req.params.id);
      return res.status(404).json({ error: 'Highlight not found' });
    }
    
    broadcastUpdate('highlight', 'delete', { id: req.params.id });
    console.log('✅ Highlight deleted:', highlight.title);
    res.json({ message: 'Highlight deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting highlight:', error);
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

// Featured Content API
app.get('/api/featured-video', async (req, res) => {
  try {
    let featured = await FeaturedContent.findOne({ active: true }).sort({ createdAt: -1 });
    
    if (!featured) {
      // Create default featured content
      featured = new FeaturedContent({
        videoId: 'dQw4w9WgXcQ',
        title: 'Featured Match Highlights',
        active: true
      });
      await featured.save();
    }
    
    res.json(featured);
  } catch (error) {
    console.error('❌ Error fetching featured content:', error);
    res.status(500).json({ error: 'Failed to fetch featured content' });
  }
});

app.post('/api/featured-video', async (req, res) => {
  try {
    // Deactivate all previous featured content
    await FeaturedContent.updateMany({}, { active: false });
    
    // Create new featured content
    const featured = new FeaturedContent({
      ...req.body,
      active: true
    });
    await featured.save();
    
    broadcastUpdate('featured', 'update', featured);
    console.log('✅ Featured content updated:', featured.title);
    res.json(featured);
  } catch (error) {
    console.error('❌ Error updating featured content:', error);
    res.status(500).json({ error: 'Failed to update featured content' });
  }
});

// Featured Images API
app.get('/api/featured-images', async (req, res) => {
  try {
    const images = await FeaturedImage.find({ active: true }).sort({ order: 1, createdAt: -1 });
    console.log(`📊 Fetched ${images.length} featured images`);
    res.json(images);
  } catch (error) {
    console.error('❌ Error fetching featured images:', error);
    res.status(500).json({ error: 'Failed to fetch featured images' });
  }
});

app.post('/api/featured-images', async (req, res) => {
  try {
    const image = new FeaturedImage({
      ...req.body,
      active: true,
      order: req.body.order || 0
    });
    await image.save();
    
    broadcastUpdate('featured', 'create', image);
    console.log('✅ Featured image created:', image.title);
    res.status(201).json(image);
  } catch (error) {
    console.error('❌ Error creating featured image:', error);
    res.status(500).json({ error: 'Failed to create featured image' });
  }
});

app.put('/api/featured-images/:id', async (req, res) => {
  try {
    const image = await FeaturedImage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!image) {
      return res.status(404).json({ error: 'Featured image not found' });
    }
    
    broadcastUpdate('featured', 'update', image);
    console.log('✅ Featured image updated:', image.title);
    res.json(image);
  } catch (error) {
    console.error('❌ Error updating featured image:', error);
    res.status(500).json({ error: 'Failed to update featured image' });
  }
});

app.delete('/api/featured-images/:id', async (req, res) => {
  try {
    const image = await FeaturedImage.findByIdAndDelete(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Featured image not found' });
    }
    
    broadcastUpdate('featured', 'delete', { id: req.params.id });
    console.log('✅ Featured image deleted:', image.title);
    res.json({ message: 'Featured image deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting featured image:', error);
    res.status(500).json({ error: 'Failed to delete featured image' });
  }
});

// Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    console.log(`📊 Fetched ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const category = new Category({
      ...req.body,
    });
    await category.save();
    console.log('✅ Category created:', category.name);
    res.status(201).json(category);
  } catch (error) {
    console.error('❌ Error creating category:', error);
    // Handle duplicate key error gracefully
    if (error && error.code === 11000) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.log('✅ Category updated:', category.name);
    res.json(category);
  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.log('✅ Category deleted:', category.name);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Admin Stats API
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalMatches, liveMatches, upcomingMatches, completedMatches, totalLeagues, totalVideos, totalHighlights] = await Promise.all([
      Match.countDocuments(),
      Match.countDocuments({ status: 'live' }),
      Match.countDocuments({ status: 'upcoming' }),
      Match.countDocuments({ status: 'completed' }),
      League.countDocuments(),
      Video.countDocuments(),
      Highlight.countDocuments()
    ]);
    
    const stats = {
      totalMatches,
      liveMatches,
      upcomingMatches,
      completedMatches,
      totalLeagues,
      totalVideos,
      totalHighlights
    };
    
    console.log('📊 Admin stats fetched:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ Route not found:', req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const PORT = process.env.PORT || 3001;

// Create default admin user if none exists
const createDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('👤 Creating default admin user...');
      const defaultAdmin = new Admin({
        email: 'admin@dreamlive.com',
        passwordHash: await bcrypt.hash('admin123', 12),
        firstName: 'Dream',
        lastName: 'Admin',
        role: 'superadmin'
      });
      await defaultAdmin.save();
      console.log('✅ Default admin created: admin@dreamlive.com / admin123');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    
    // Create default admin user
    await createDefaultAdmin();
    
    // Listen on all interfaces (0.0.0.0) to allow mobile device connections
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Dream Live Server running on port ${PORT}`);
      console.log(`📊 Admin API available at http://localhost:${PORT}/api`);
      console.log(`🔄 Real-time updates enabled via Socket.IO`);
      console.log(`🌐 Server accessible at http://0.0.0.0:${PORT}`);
      console.log(`📱 Android Emulator: http://10.0.2.2:${PORT}/api`);
      console.log(`📱 iOS Simulator: http://localhost:${PORT}/api`);
      console.log(`📱 Physical Device: http://10.235.174.194:${PORT}/api`);
      console.log(`💡 To find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)`);
      console.log(`🔐 Default Admin: admin@dreamlive.com / admin123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

// Points Tables API endpoints

// GET /api/leagues/:id/points - Fetch points table for a league (optionally filtered by season)
app.get('/api/leagues/:id/points', async (req, res) => {
  try {
    const { season } = req.query;
    const leagueId = req.params.id;

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    const query = { leagueId };
    if (season) {
      query.season = season;
    } else {
      // If no season specified, get the latest season
      const latestTable = await PointsTable.findOne({ leagueId }).sort({ createdAt: -1 });
      if (latestTable) {
        query.season = latestTable.season;
      }
    }

    let pointsTable = await PointsTable.findOne(query);

    if (!pointsTable) {
      // Create default empty points table
      const currentSeason = season || new Date().getFullYear().toString();
      pointsTable = new PointsTable({ 
        leagueId, 
        season: currentSeason,
        points: [] 
      });
      await pointsTable.save();
    }

    // Sort points by position before returning
    const sortedPoints = [...pointsTable.points].sort((a, b) => a.position - b.position);

    res.json({
      league: { id: league._id, name: league.name, season: pointsTable.season },
      points: sortedPoints
    });
  } catch (error) {
    console.error('❌ Error fetching points table:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch points table' });
  }
});

// PUT /api/leagues/:id/points - Update points table for a league and season
app.put('/api/leagues/:id/points', async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    const { season, points } = req.body;
    const currentSeason = season || new Date().getFullYear().toString();

    // Validate points data
    if (!Array.isArray(points)) {
      return res.status(400).json({ error: 'Points data must be an array' });
    }

    // Normalize and validate points data
    let normalized = points.map((row, index) => {
      const team = String(row.team || '').trim();
      if (!team) {
        throw new Error(`Team name is required for entry at position ${index + 1}`);
      }

      const position = Number(row.position) || index + 1;
      const played = Number(row.played) || 0;
      const won = Number(row.won) || 0;
      const drawn = Number(row.drawn) || 0;
      const lost = Number(row.lost) || 0;
      const goalsFor = Number(row.goalsFor) || 0;
      const goalsAgainst = Number(row.goalsAgainst) || 0;
      const goalDifference = goalsFor - goalsAgainst;
      const points = Number(row.points) || (won * 3 + drawn);

      return {
        team,
        position,
        played: played || (won + drawn + lost),
        won, drawn, lost,
        goalsFor, goalsAgainst, goalDifference, points,
        lastUpdated: new Date()
      };
    });

    // Sort by Points desc, GD desc, GF desc, Team asc
    normalized.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.localeCompare(b.team);
    });

    // Recalculate positions
    normalized = normalized.map((entry, index) => ({
      ...entry,
      position: index + 1
    }));

    // Update or create points table
    const update = {
      season: currentSeason,
      points: normalized,
      lastUpdated: new Date()
    };

    const pointsTable = await PointsTable.findOneAndUpdate(
      { leagueId, season: currentSeason },
      update,
      { new: true, upsert: true }
    );

    // Broadcast update via WebSocket
    broadcastUpdate('pointsTable', 'update', {
      leagueId,
      season: currentSeason,
      points: normalized
    });

    res.json({
      message: 'Points table updated successfully',
      league: { id: league._id, name: league.name, season: currentSeason },
      points: normalized
    });
  } catch (error) {
    console.error('❌ Error updating points table:', error);
    res.status(500).json({ error: error.message || 'Failed to update points table' });
  }
});

// DELETE /api/leagues/:id/points - Delete points table for a league and season
app.delete('/api/leagues/:id/points', async (req, res) => {
  try {
    const { season } = req.query;
    const leagueId = req.params.id;

    if (!season) {
      return res.status(400).json({ error: 'Season parameter is required' });
    }

    const result = await PointsTable.findOneAndDelete({ leagueId, season });

    if (!result) {
      return res.status(404).json({ error: 'Points table not found' });
    }

    // Broadcast deletion via WebSocket
    broadcastUpdate('pointsTable', 'delete', {
      leagueId,
      season
    });

    res.json({
      message: 'Points table deleted successfully',
      leagueId,
      season
    });
  } catch (error) {
    console.error('❌ Error deleting points table:', error);
    res.status(500).json({ error: error.message || 'Failed to delete points table' });
  }
});

startServer();

module.exports = { app, server, io };