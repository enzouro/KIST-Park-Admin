import mongoose from 'mongoose';

const PressReleaseSchema = new mongoose.Schema({
    seq: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    publisher: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    image: {
        type: [String],
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: Date.now
    },
});

const PressRelease = mongoose.model('PressRelease', PressReleaseSchema);

export default PressRelease;
