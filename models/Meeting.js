const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema(
  {
    // Contact details
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },

    // Meeting info
    meetingDate: { type: String, required: true },
    meetingTime: { type: String, required: true },

    // Pet details
    petName: { type: String, required: true },
    petBreed: { type: String, required: true },
    petImage: { type: String, required: true },

    // Meeting metadata
    meetingType: {
      type: String,
      enum: ["adoption", "release"],
      required: true,
    },
    petType: {
      type: String,
      enum: ["cat", "dog"],
      required: true,
    },

    // Release-only field
    isVaccinated: {
      type: Boolean,
      default: undefined,
      validate: {
        validator: function (value) {
          // If meeting type is release → MUST include isVaccinated
          if (this.meetingType === "release") {
            return value === true || value === false;
          }

          // If meeting type is adoption → MUST NOT include isVaccinated
          if (this.meetingType === "adoption") {
            return value === undefined;
          }

          return true;
        },
        message:
          "Vaccination status is required only for release meetings and must NOT be included for adoption meetings.",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", MeetingSchema);
