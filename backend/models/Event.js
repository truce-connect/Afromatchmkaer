const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 600
    },
    location: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      trim: true
    },
    isVirtual: {
      type: Boolean,
      default: false
    },
    startsAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date
    },
    coverImage: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    capacity: Number,
    attendeeCount: {
      type: Number,
      default: 0
    },
    rsvpCount: {
      type: Number,
      default: 0
    },
    popularityScore: {
      type: Number,
      default: 0
    },
    shareUrl: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      trim: true
    },
    hostType: {
      type: String,
      enum: ['community', 'user', 'partner'],
      default: 'user'
    },
    organizer: {
      name: {
        type: String,
        trim: true
      },
      title: {
        type: String,
        trim: true
      },
      avatar: {
        type: String,
        trim: true
      },
      community: {
        type: String,
        trim: true
      },
      profileImage: {
        type: String,
        trim: true
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    }
  },
  { timestamps: true }
);

eventSchema.index({ startsAt: 1, status: 1 });
eventSchema.index({ hostType: 1, status: 1 });
eventSchema.index({ tags: 1 });

eventSchema.pre('save', function trimTags(next) {
  if (Array.isArray(this.tags)) {
    this.tags = this.tags
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter(Boolean)
      .slice(0, 12);
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
