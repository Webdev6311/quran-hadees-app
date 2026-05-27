import mongoose from 'mongoose';

const ayahSchema = new mongoose.Schema({
    number: { 
        type: Number, 
        required: true 
    },
    surah: { 
        type: Number, 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    },
    numberInSurah: { 
        type: Number, 
        required: true 
    },
    juz: { 
        type: Number, 
        required: true 
    },
    manzil: { 
        type: Number, 
        required: true 
    },
    page: { 
        type: Number, 
        required: true 
    },
    ruku: { 
        type: Number, 
        required: true 
    },
    hizbQuarter: { 
        type: Number, 
        required: true 
    },
    sajda: { 
        type: Boolean, 
        default: false 
    }
}, {
    timestamps: true
});

// Create compound index for faster lookups
ayahSchema.index({ surah: 1, number: 1 }, { unique: true });

const Ayah = mongoose.model('Ayah', ayahSchema);

export default Ayah;
