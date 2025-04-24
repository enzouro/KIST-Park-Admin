
import Subscriber from "../mongodb/models/subscribers.js";

const getAllSubscribers = async (req, res) => {
  try {
    // Changed to sort by sequence number in descending order
    const subscribers = await Subscriber.find({}).sort({ seq: -1 });
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscribers" });
  }
};

const createSubscriber = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Basic email validation on server side
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if subscriber already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: "Subscriber already exists" });
    }

    // Get the last sequence number
    const lastSubscriber = await Subscriber.findOne({}, {}, { sort: { seq: -1 } });
    const nextSeq = lastSubscriber ? lastSubscriber.seq + 1 : 1;

    // Create new subscriber with sequence number
    const newSubscriber = await Subscriber.create({
      email,
      seq: nextSeq,
      createdAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: "Successfully subscribed",
      data: newSubscriber
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Failed to create subscriber",
      error: error.message 
    });
  }
};


const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle comma-separated IDs for multiple deletions
    const ids = id.split(',');
    
    for (const singleId of ids) {
      const subscriberToDelete = await Subscriber.findById(singleId);
      
      if (!subscriberToDelete) {
        continue; // Skip to next ID if this one isn't found
      }

      // Delete the subscriber from MongoDB
      await Subscriber.findByIdAndDelete(singleId);
    }

    res.status(200).json({ 
      message: `Successfully deleted ${ids.length} ${ids.length === 1 ? 'subscriber' : 'subscribers'}` 
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      message: 'Failed to delete one or more subscribers' 
    });
  }
};

export {
  getAllSubscribers, 
  createSubscriber,
  deleteSubscriber
};