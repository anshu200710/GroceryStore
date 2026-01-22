import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        firebaseUid: { 
            type: String, 
            unique: true, 
            required: true,
            index: true 
        },
        name: { type: String, trim: true, required: true },
        email: { type: String, unique: true, required: true, lowercase: true },
        password: { type: String, trim: true }, // Optional for OAuth users
        role: {
            type: String,
            trim: true,
            lowercase: true,
            enum: ["user", "seller"],
            default: "user",
        },
        refreshToken: { type: String },
        refreshTokenExpiry: { type: Date },
        cartItems: { type: Object, default: {} },
        lastLogin: { type: Date },
        loginAttempts: { type: Number, default: 0 },
        isLocked: { type: Boolean, default: false },
        lockedUntil: { type: Date },
    },
    { minimize: false, timestamps: true }
);

// Hash password before saving (only for users who set password)
userSchema.pre("save", async function (next) {
    if (this.password && this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
    }
    next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!this.password) return false; // OAuth users don't have passwords
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
