const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    age: Number,
    gender: {
      type: String,
      enum: ['male', 'female', 'nonbinary', 'prefer_not_to_say', 'other'],
      default: 'prefer_not_to_say'
    },
    country: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    preferredGender: {
      type: String,
      enum: ['male', 'female', 'both'],
      default: 'both'
    },
    diaspora: {
      type: Boolean,
      default: false
    },
    bio: {
      type: String,
      maxlength: 600
    },
    interests: {
      type: [String],
      default: []
    },
    profileImage: String,
    coverPhoto: String,
    gallery: {
      type: [String],
      default: []
    },
    onboardingComplete: {
      type: Boolean,
      default: false
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    communities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    notificationPreferences: {
      friendRequests: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      communityActivity: { type: Boolean, default: true },
      emailUpdates: { type: Boolean, default: true }
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['everyone', 'matches', 'private'],
        default: 'matches'
      },
      friendRequests: {
        type: String,
        enum: ['everyone', 'friends_of_friends', 'no_one'],
        default: 'everyone'
      },
      messages: {
        type: String,
        enum: ['everyone', 'matches', 'friends_only'],
        default: 'matches'
      }
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
