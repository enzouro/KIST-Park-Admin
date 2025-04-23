import mongoose from "mongoose";

const SubscriberSchema = new mongoose.Schema({
  seq: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true }); 

SubscriberSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastSubscriber = await this.constructor.findOne({}, {}, { sort: { seq: -1 } });
    this.seq = lastSubscriber ? lastSubscriber.seq + 1 : 1;
  }
  next();
});

const Subscriber = mongoose.model("Subscriber", SubscriberSchema);

export default Subscriber;