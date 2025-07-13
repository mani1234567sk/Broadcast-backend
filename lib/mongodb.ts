import mongoose from 'mongoose';

// MongoDB connection utility
interface MongoConfig {
  connectionString: string;
  dbName: string;
}

const config: MongoConfig = {
  connectionString: process.env.MONGODB_URI || 'mongodb+srv://dreamarena2025:bugsbunny@cluster0.62buxhp.mongodb.net/dreamlive',
  dbName: 'dreamlive'
};

let isConnected = false;

export async function connectToDatabase(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(config.connectionString, {
      dbName: config.dbName,
    });
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

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
    team1: [String],
    team2: [String]
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

// Models
export const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);
export const League = mongoose.models.League || mongoose.model('League', leagueSchema);
export const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);
export const Highlight = mongoose.models.Highlight || mongoose.model('Highlight', highlightSchema);
export const FeaturedContent = mongoose.models.FeaturedContent || mongoose.model('FeaturedContent', featuredContentSchema);

// Export interfaces for TypeScript
export interface MatchDocument {
  _id: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  status: 'live' | 'upcoming' | 'completed';
  venue?: string;
  imageUrl?: string;
  league: string;
  team1Logo?: string;
  team2Logo?: string;
  players: {
    team1: string[];
    team2: string[];
  };
  teamStats?: {
    team1: { wins: number; losses: number; draws: number; };
    team2: { wins: number; losses: number; draws: number; };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LeagueDocument {
  _id: string;
  name: string;
  season: string;
  logoUrl?: string;
  matchCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoDocument {
  _id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
  thumbnailUrl: string;
  duration?: string;
  category: 'Sport' | 'Podcast' | 'TV Show' | 'Other';
  views: number;
  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface HighlightDocument {
  _id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
  thumbnailUrl: string;
  duration?: string;
  category: string;
  sport: string;
  featured: boolean;
  views: number;
  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeaturedContentDocument {
  _id: string;
  type: 'video' | 'match';
  videoId?: string;
  title: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}