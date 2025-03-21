import mongoose from 'mongoose'

const SDGSchema = new mongoose.Schema ({
  sdg: {
    type: String,
    required: true,
  },
})

const SDG = mongoose.model('SDG', SDGSchema);

export default SDG;