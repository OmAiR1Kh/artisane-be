const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot be more than 500 characters"],
    },
    location: {
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
    },
    specializations: [
      {
        type: String,
        trim: true,
      },
    ],
    equipment: [
      {
        type: String,
        trim: true,
      },
    ],
    pricing: {
      hourlyRate: {
        type: Number,
        min: 0,
      },
      packageInfo: {
        type: String,
        trim: true,
      },
    },
    experience: {
      years: {
        type: Number,
        min: 0,
      },
      description: {
        type: String,
        trim: true,
      },
    },
    contact: {
      phone: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
      socialMedia: {
        instagram: {
          type: String,
          trim: true,
        },
        facebook: {
          type: String,
          trim: true,
        },
        twitter: {
          type: String,
          trim: true,
        },
        linkedin: {
          type: String,
          trim: true,
        },
        youtube: {
          type: String,
          trim: true,
        },
        vimeo: {
          type: String,
          trim: true,
        },
      },
    },
    availability: {
      type: String,
      enum: ["available", "limited", "unavailable"],
      default: "available",
    },
    profileImage: {
      type: String,
      default: "default-profile.jpg",
    },
    coverImage: {
      type: String,
      default: "default-cover.jpg",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for geospatial queries
ProfileSchema.index({ "location.coordinates": "2dsphere" });

// Virtual for average rating
ProfileSchema.virtual("averageRating", {
  ref: "Review",
  localField: "user",
  foreignField: "recipient",
  justOne: false,
  options: { sort: { createdAt: -1 } },
  match: { isActive: true },
  count: false,
});

ProfileSchema.methods.calculateAverageRating = async function () {
  const reviews = await mongoose.model("Review").find({
    recipient: this.user,
    isActive: true,
  });

  if (reviews.length === 0) {
    return null;
  }

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
};

const Profile = mongoose.model("Profile", ProfileSchema);

module.exports = Profile;
